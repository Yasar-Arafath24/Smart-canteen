import hashlib
import hmac
import json

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)

from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.crud.payment import (
    create_payment,
    get_payment_by_order,
    verify_and_complete_payment,
)
from app.db.database import get_db
from app.models.payment import Payment
from app.models.razorpay_webhook import (
    RazorpayWebhookEvent,
)
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentQRResponse,
    PaymentResponse,
    PaymentVerify,
)
from app.services.razorpay_service import (
    RazorpayServiceError,
    create_upi_qr,
    fetch_qr,
)
from app.utils.time import utcnow


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


# ============================================================
# CREATE NORMAL RAZORPAY PAYMENT
# ============================================================

@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    payment_data: PaymentCreate,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
):
    payment = create_payment(
        db=db,
        user_id=current_user.id,
        payment_data=payment_data,
    )

    response = PaymentResponse.model_validate(
        payment,
    )

    response.razorpay_key_id = (
        settings.RAZORPAY_KEY_ID
    )

    return response


# ============================================================
# GET PAYMENT BY ORDER
# ============================================================

@router.get(
    "/order/{order_id}",
    response_model=PaymentResponse,
)
def get_order_payment(
    order_id: int,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
):
    payment = get_payment_by_order(
        db=db,
        order_id=order_id,
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    if (
        payment.user_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Not authorized to view "
                "this payment"
            ),
        )

    response = PaymentResponse.model_validate(
        payment,
    )

    response.razorpay_key_id = (
        settings.RAZORPAY_KEY_ID
    )

    return response


# ============================================================
# CREATE UPI QR PAYMENT
# ============================================================

@router.post(
    "/{payment_id}/qr",
    response_model=PaymentQRResponse,
)
async def create_payment_qr(
    payment_id: int,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    if payment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "Not authorized to create "
                "this payment QR code."
            ),
        )

    if payment.status == "paid":
        raise HTTPException(
            status_code=400,
            detail="Payment is already completed.",
        )

    # --------------------------------------------------------
    # Reuse existing active QR if available
    # --------------------------------------------------------

    if payment.razorpay_qr_id:
        try:
            qr = await fetch_qr(
                payment.razorpay_qr_id,
            )

            if qr.get("status") == "active":
                return PaymentQRResponse(
                    payment_id=payment.id,
                    order_id=payment.order_id,
                    amount=float(payment.amount),
                    status=payment.status,
                    payment_method="upi_qr",
                    qr_id=payment.razorpay_qr_id,
                    qr_content=(
                        payment.razorpay_qr_content
                    ),
                    qr_image_url=(
                        payment.razorpay_qr_image_url
                    ),
                    razorpay_key_id=(
                        settings.RAZORPAY_KEY_ID
                    ),
                )

        except RazorpayServiceError:
            # Create a fresh QR below.
            pass

    # --------------------------------------------------------
    # Create new Razorpay UPI QR
    # --------------------------------------------------------

    try:
        qr = await create_upi_qr(
            amount=float(payment.amount),
            reference_id=str(payment.id),
            description=(
                f"SmartCanteen "
                f"Order #{payment.order_id}"
            ),
        )

    except RazorpayServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    qr_id = qr.get("id")

    if not qr_id:
        raise HTTPException(
            status_code=502,
            detail=(
                "Razorpay did not return "
                "a QR ID."
            ),
        )

    payment.razorpay_qr_id = qr_id

    payment.razorpay_qr_content = (
        qr.get("image_content")
    )

    payment.razorpay_qr_image_url = (
        qr.get("image_url")
    )

    payment.payment_method = "upi_qr"
    payment.updated_at = utcnow()

    db.commit()
    db.refresh(payment)

    return PaymentQRResponse(
        payment_id=payment.id,
        order_id=payment.order_id,
        amount=float(payment.amount),
        status=payment.status,
        payment_method="upi_qr",
        qr_id=qr_id,
        qr_content=qr.get("image_content"),
        qr_image_url=qr.get("image_url"),
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
    )


# ============================================================
# FETCH CURRENT QR
# ============================================================

@router.get(
    "/{payment_id}/qr",
    response_model=PaymentQRResponse,
)
async def get_payment_qr(
    payment_id: int,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    if (
        payment.user_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized.",
        )

    if not payment.razorpay_qr_id:
        raise HTTPException(
            status_code=404,
            detail=(
                "QR payment has not been created yet."
            ),
        )

    try:
        qr = await fetch_qr(
            payment.razorpay_qr_id,
        )
    except RazorpayServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    return PaymentQRResponse(
        payment_id=payment.id,
        order_id=payment.order_id,
        amount=float(payment.amount),
        status=payment.status,
        payment_method=payment.payment_method,
        qr_id=payment.razorpay_qr_id,
        qr_content=payment.razorpay_qr_content,
        qr_image_url=payment.razorpay_qr_image_url,
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
    )


# ============================================================
# VERIFY NORMAL RAZORPAY CHECKOUT
# ============================================================

@router.post(
    "/{payment_id}/verify",
    response_model=PaymentResponse,
)
async def verify_payment(
    payment_id: int,
    payment_data: PaymentVerify,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
):
    payment = await verify_and_complete_payment(
        db=db,
        payment_id=payment_id,
        user_id=current_user.id,
        razorpay_payment_id=(
            payment_data.razorpay_payment_id
        ),
        razorpay_order_id=(
            payment_data.razorpay_order_id
        ),
        razorpay_signature=(
            payment_data.razorpay_signature
        ),
    )

    response = PaymentResponse.model_validate(
        payment,
    )

    response.razorpay_key_id = (
        settings.RAZORPAY_KEY_ID
    )

    return response


# ============================================================
# RAZORPAY WEBHOOK
# ============================================================

@router.post(
    "/webhook",
)
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # RAW BODY
    # --------------------------------------------------------

    raw_body = await request.body()

    # --------------------------------------------------------
    # SIGNATURE
    # --------------------------------------------------------

    signature = request.headers.get(
        "X-Razorpay-Signature",
    )

    if not signature:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing Razorpay webhook signature."
            ),
        )

    # --------------------------------------------------------
    # EVENT ID
    # --------------------------------------------------------

    event_id = request.headers.get(
        "x-razorpay-event-id",
    )

    if not event_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing Razorpay event ID."
            ),
        )

    # --------------------------------------------------------
    # WEBHOOK SECRET
    # --------------------------------------------------------

    webhook_secret = (
        settings.RAZORPAY_WEBHOOK_SECRET
    )

    if not webhook_secret:
        raise HTTPException(
            status_code=500,
            detail=(
                "Razorpay webhook secret "
                "is not configured."
            ),
        )

    # --------------------------------------------------------
    # VERIFY SIGNATURE
    # --------------------------------------------------------

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        signature,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid Razorpay webhook signature."
            ),
        )

    # --------------------------------------------------------
    # DUPLICATE EVENT
    # --------------------------------------------------------

    existing_event = (
        db.query(
            RazorpayWebhookEvent,
        )
        .filter(
            RazorpayWebhookEvent.event_id
            == event_id,
        )
        .first()
    )

    if existing_event:
        return {
            "status": "already_processed",
            "event_id": event_id,
        }

    # --------------------------------------------------------
    # PARSE JSON
    # --------------------------------------------------------

    try:
        payload = json.loads(
            raw_body.decode("utf-8"),
        )
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload.",
        ) from exc

    event_type = payload.get(
        "event",
    )

    # --------------------------------------------------------
    # RECORD EVENT
    # --------------------------------------------------------

    webhook_event = RazorpayWebhookEvent(
        event_id=event_id,
        event_type=event_type or "unknown",
    )

    db.add(webhook_event)

    # ========================================================
    # QR CODE CREDITED
    # ========================================================

    if event_type == "qr_code.credited":

        payment_entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        qr_entity = (
            payload
            .get("payload", {})
            .get("qr_code", {})
            .get("entity", {})
        )

        razorpay_payment_id = (
            payment_entity.get("id")
        )

        razorpay_qr_id = (
            qr_entity.get("id")
        )

        payment = None

        # ----------------------------------------------------
        # Find by QR ID
        # ----------------------------------------------------

        if razorpay_qr_id:
            payment = (
                db.query(Payment)
                .filter(
                    Payment.razorpay_qr_id
                    == razorpay_qr_id,
                )
                .first()
            )

        # ----------------------------------------------------
        # Fallback: SmartCanteen payment ID
        # ----------------------------------------------------

        if not payment:
            notes = (
                payment_entity.get("notes")
                or {}
            )

            smartcanteen_payment_id = (
                notes.get(
                    "smartcanteen_payment_id",
                )
            )

            if smartcanteen_payment_id:
                try:
                    smart_id = int(
                        smartcanteen_payment_id,
                    )

                    payment = (
                        db.query(Payment)
                        .filter(
                            Payment.id == smart_id,
                        )
                        .first()
                    )

                except (
                    TypeError,
                    ValueError,
                ):
                    payment = None

        # ----------------------------------------------------
        # Complete payment
        # ----------------------------------------------------

        if payment:

            webhook_amount = (
                payment_entity.get("amount")
            )

            expected_amount = int(
                round(
                    float(payment.amount)
                    * 100,
                )
            )

            if (
                webhook_amount
                != expected_amount
            ):
                db.rollback()

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "QR payment amount "
                        "does not match the "
                        "SmartCanteen payment."
                    ),
                )

            if payment.status != "paid":

                payment.status = "paid"

                payment.payment_method = (
                    "upi_qr"
                )

                payment.razorpay_payment_id = (
                    razorpay_payment_id
                )

                payment.transaction_id = (
                    razorpay_payment_id
                )

                payment.updated_at = utcnow()

                if (
                    payment.order
                    and payment.order.status
                    == "pending"
                ):
                    payment.order.status = (
                        "confirmed"
                    )

                    payment.order.updated_at = (
                        utcnow()
                    )

    # ========================================================
    # NORMAL PAYMENT CAPTURED
    # ========================================================

    elif event_type == "payment.captured":

        payment_entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        razorpay_payment_id = (
            payment_entity.get("id")
        )

        razorpay_order_id = (
            payment_entity.get("order_id")
        )

        if razorpay_order_id:

            payment = (
                db.query(Payment)
                .filter(
                    Payment.razorpay_order_id
                    == razorpay_order_id,
                )
                .first()
            )

            if payment:

                webhook_amount = (
                    payment_entity.get(
                        "amount",
                    )
                )

                expected_amount = int(
                    round(
                        float(payment.amount)
                        * 100,
                    )
                )

                if (
                    webhook_amount
                    != expected_amount
                ):
                    db.rollback()

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Payment amount "
                            "does not match "
                            "the order."
                        ),
                    )

                if payment.status != "paid":

                    payment.status = "paid"

                    payment.razorpay_payment_id = (
                        razorpay_payment_id
                    )

                    payment.transaction_id = (
                        razorpay_payment_id
                    )

                    payment.updated_at = utcnow()

                    if (
                        payment.order
                        and payment.order.status
                        == "pending"
                    ):
                        payment.order.status = (
                            "confirmed"
                        )

                        payment.order.updated_at = (
                            utcnow()
                        )

    # ========================================================
    # ORDER PAID
    # ========================================================

    elif event_type == "order.paid":

        order_entity = (
            payload
            .get("payload", {})
            .get("order", {})
            .get("entity", {})
        )

        razorpay_order_id = (
            order_entity.get("id")
        )

        if razorpay_order_id:

            payment = (
                db.query(Payment)
                .filter(
                    Payment.razorpay_order_id
                    == razorpay_order_id,
                )
                .first()
            )

            if payment:

                if payment.status != "paid":
                    payment.status = "paid"
                    payment.updated_at = (
                        utcnow()
                    )

                if (
                    payment.order
                    and payment.order.status
                    == "pending"
                ):
                    payment.order.status = (
                        "confirmed"
                    )

                    payment.order.updated_at = (
                        utcnow()
                    )

    # ========================================================
    # PAYMENT FAILED
    # ========================================================

    elif event_type == "payment.failed":

        payment_entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        razorpay_payment_id = (
            payment_entity.get("id")
        )

        razorpay_order_id = (
            payment_entity.get("order_id")
        )

        if razorpay_order_id:

            payment = (
                db.query(Payment)
                .filter(
                    Payment.razorpay_order_id
                    == razorpay_order_id,
                )
                .first()
            )

            if payment:

                # Do not downgrade successful payments.
                if payment.status != "paid":

                    payment.status = "failed"

                    payment.razorpay_payment_id = (
                        razorpay_payment_id
                    )

                    payment.updated_at = (
                        utcnow()
                    )

    # ========================================================
    # OTHER EVENTS
    # ========================================================

    else:
        pass

    # --------------------------------------------------------
    # COMMIT
    # --------------------------------------------------------

    db.commit()

    return {
        "status": "processed",
        "event_id": event_id,
        "event": event_type,
    }