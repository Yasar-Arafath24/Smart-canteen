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
    PaymentResponse,
    PaymentVerify,
)
from app.utils.time import utcnow


# ============================================================
# TEMPORARY CONFIGURATION CHECK
# Remove this print after payment setup is complete.
# ============================================================

print(
    "Razorpay configured:",
    bool(settings.RAZORPAY_KEY_ID),
    bool(settings.RAZORPAY_KEY_SECRET),
)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


# ============================================================
# CREATE RAZORPAY PAYMENT
# ============================================================

@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    payment_data: PaymentCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    payment = create_payment(
        db=db,
        user_id=current_user.id,
        payment_data=payment_data,
    )

    response = PaymentResponse.model_validate(
        payment
    )

    # The Key ID is safe to send to the frontend.
    # The Key Secret is NEVER returned.
    response.razorpay_key_id = (
        settings.RAZORPAY_KEY_ID
    )

    return response


# ============================================================
# GET PAYMENT FOR ONE ORDER
# ============================================================

@router.get(
    "/order/{order_id}",
    response_model=PaymentResponse,
)
def get_order_payment(
    order_id: int,
    current_user: User = Depends(
        get_current_user
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

    return payment


# ============================================================
# VERIFY FRONTEND RAZORPAY PAYMENT
# ============================================================

@router.post(
    "/{payment_id}/verify",
    response_model=PaymentResponse,
)
async def verify_payment(
    payment_id: int,
    payment_data: PaymentVerify,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await verify_and_complete_payment(
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
    """
    Receives Razorpay webhook events.

    IMPORTANT:
    The signature is calculated from the RAW request body.
    Do not parse JSON before validating the signature.
    """

    # --------------------------------------------------------
    # 1. Read RAW request body
    # --------------------------------------------------------

    raw_body = await request.body()

    # --------------------------------------------------------
    # 2. Get Razorpay signature
    # --------------------------------------------------------

    signature = request.headers.get(
        "X-Razorpay-Signature"
    )

    if not signature:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing Razorpay webhook signature."
            ),
        )

    # --------------------------------------------------------
    # 3. Get unique event ID
    # --------------------------------------------------------

    event_id = request.headers.get(
        "x-razorpay-event-id"
    )

    if not event_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing Razorpay event ID."
            ),
        )

    # --------------------------------------------------------
    # 4. Make sure webhook secret exists
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
    # 5. Generate expected HMAC SHA256 signature
    # --------------------------------------------------------

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    # --------------------------------------------------------
    # 6. Compare signatures securely
    # --------------------------------------------------------

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
    # 7. Check for duplicate event
    # --------------------------------------------------------

    existing_event = (
        db.query(
            RazorpayWebhookEvent
        )
        .filter(
            RazorpayWebhookEvent.event_id
            == event_id
        )
        .first()
    )

    if existing_event:
        return {
            "status": "already_processed",
            "event_id": event_id,
        }

    # --------------------------------------------------------
    # 8. Parse JSON AFTER signature verification
    # --------------------------------------------------------

    try:
        payload = json.loads(
            raw_body.decode("utf-8")
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload.",
        )

    event_type = payload.get(
        "event"
    )

    # --------------------------------------------------------
    # 9. Record webhook event
    # --------------------------------------------------------

    webhook_event = (
        RazorpayWebhookEvent(
            event_id=event_id,
            event_type=(
                event_type or "unknown"
            ),
        )
    )

    db.add(webhook_event)

    # ========================================================
    # PAYMENT CAPTURED
    # ========================================================

    if event_type == "payment.captured":

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

        if not razorpay_order_id:
            db.rollback()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Webhook is missing "
                    "Razorpay order ID."
                ),
            )

        payment = (
            db.query(Payment)
            .filter(
                Payment.razorpay_order_id
                == razorpay_order_id
            )
            .first()
        )

        if payment:
            # Never downgrade a successful
            # payment back to another state.
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
                    payment.order.status
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
                    == razorpay_order_id
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
                    payment.order.status
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
                    == razorpay_order_id
                )
                .first()
            )

            if payment:

                # Never overwrite an already
                # successful payment.
                if payment.status != "paid":

                    payment.status = (
                        "failed"
                    )

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
        # We record the event but don't modify
        # SmartCanteen payment state.
        pass

    # --------------------------------------------------------
    # 10. Save everything
    # --------------------------------------------------------

    db.commit()

    return {
        "status": "processed",
        "event_id": event_id,
        "event": event_type,
    }