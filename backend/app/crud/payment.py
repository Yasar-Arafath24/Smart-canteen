import razorpay

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.notification import create_notification
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentCreate
from app.services.email_service import (
    send_payment_success_email,
)
from app.services.notification_service import (
    create_and_send_notification,
)
from app.utils.time import utcnow


def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID:
        raise HTTPException(
            status_code=500,
            detail="Razorpay Key ID is not configured.",
        )

    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Razorpay Key Secret is not configured.",
        )

    return razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET,
        )
    )


def create_payment(
    db: Session,
    user_id: int,
    payment_data: PaymentCreate,
):
    order = (
        db.query(Order)
        .filter(
            Order.id == payment_data.order_id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if order.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail=(
                "Not authorized to pay "
                "for this order"
            ),
        )

    if order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending orders can be paid"
            ),
        )

    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.order_id == order.id
        )
        .first()
    )

    if existing_payment:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment already exists "
                "for this order"
            ),
        )

    amount = round(
        float(order.total),
        2,
    )

    if amount <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Order amount must be greater than zero."
            ),
        )

    client = get_razorpay_client()

    amount_paise = int(
        round(amount * 100)
    )

    try:
        razorpay_order = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": (
                    f"smartcanteen-order-{order.id}"
                ),
                "notes": {
                    "smartcanteen_order_id": str(
                        order.id
                    ),
                    "smartcanteen_user_id": str(
                        user_id
                    ),
                },
            }
        )
    except Exception as exc:
        print(
            "Razorpay order creation failed:",
            exc,
        )

        db.rollback()

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to create Razorpay payment order."
            ),
        ) from exc

    payment = Payment(
        order_id=order.id,
        user_id=user_id,
        amount=amount,
        status="pending",
        payment_method="razorpay",
        razorpay_order_id=(
            razorpay_order["id"]
        ),
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


def get_payment_by_order(
    db: Session,
    order_id: int,
):
    return (
        db.query(Payment)
        .filter(
            Payment.order_id == order_id
        )
        .first()
    )


async def verify_and_complete_payment(
    db: Session,
    payment_id: int,
    user_id: int,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    if payment.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail=(
                "Not authorized to verify "
                "this payment"
            ),
        )

    if payment.status == "paid":
        return payment

    if payment.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Payment is not pending.",
        )

    if not payment.razorpay_order_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Razorpay order ID is missing."
            ),
        )

    if (
        payment.razorpay_order_id
        != razorpay_order_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Razorpay order mismatch.",
        )

    if payment.order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending orders can "
                "complete payment."
            ),
        )

    client = get_razorpay_client()

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": (
                    payment.razorpay_order_id
                ),
                "razorpay_payment_id": (
                    razorpay_payment_id
                ),
                "razorpay_signature": (
                    razorpay_signature
                ),
            }
        )
    except Exception as exc:
        print(
            "Razorpay signature verification failed:",
            exc,
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Payment signature verification failed."
            ),
        ) from exc

    payment.status = "paid"

    payment.razorpay_payment_id = (
        razorpay_payment_id
    )

    payment.razorpay_signature = (
        razorpay_signature
    )

    payment.transaction_id = (
        razorpay_payment_id
    )

    payment.updated_at = utcnow()

    payment.order.status = "confirmed"
    payment.order.updated_at = utcnow()

    user = (
        db.query(User)
        .filter(
            User.id == payment.user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    await create_and_send_notification(
        db=db,
        user_id=payment.user_id,
        title="Payment successful",
        message=(
            f"Payment for order "
            f"#{payment.order_id} "
            f"was successful."
        ),
        notification_type="payment_success",
    )

    create_notification(
        db=db,
        user_id=payment.user_id,
        title="Order confirmed",
        message=(
            f"Your order #{payment.order_id} "
            f"has been confirmed."
        ),
        notification_type="order_confirmed",
    )

    db.commit()
    db.refresh(payment)

    if user.email:
        try:
            await send_payment_success_email(
                recipient=user.email,
                order_id=payment.order_id,
                amount=float(
                    payment.amount
                ),
            )
        except Exception as email_error:
            print(
                "Payment email failed:",
                email_error,
            )

    return payment