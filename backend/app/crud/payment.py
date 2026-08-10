import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.notification import create_notification
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentCreate
from app.utils.time import utcnow
from app.services.email_service import send_payment_success_email


def create_payment(
    db: Session,
    user_id: int,
    payment_data: PaymentCreate,
):
    order = (
        db.query(Order)
        .filter(Order.id == payment_data.order_id)
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
            detail="Not authorized to pay for this order",
        )

    if order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending orders can be paid",
        )

    existing_payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id)
        .first()
    )

    if existing_payment:
        raise HTTPException(
            status_code=400,
            detail="Payment already exists for this order",
        )

    payment = Payment(
        order_id=order.id,
        user_id=user_id,
        amount=order.total,
        status="pending",
        payment_method=payment_data.payment_method,
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
        .filter(Payment.order_id == order_id)
        .first()
    )


async def process_payment(
    db: Session,
    payment_id: int,
    user_id: int,
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    user = (
        db.query(User)
        .filter(User.id == payment.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if payment.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to process this payment",
        )

    if payment.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Payment has already been processed",
        )

    if payment.order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending orders can be paid",
        )

    payment.status = "paid"
    payment.transaction_id = (
        f"SIM-{uuid.uuid4().hex[:12].upper()}"
    )
    payment.updated_at = utcnow()

    payment.order.status = "confirmed"
    payment.order.updated_at = utcnow()

    create_notification(
        db=db,
        user_id=payment.user_id,
        title="Payment successful",
        message=f"Payment for order #{payment.order_id} was successful.",
        notification_type="payment_success",
    )

    create_notification(
        db=db,
        user_id=payment.user_id,
        title="Order confirmed",
        message=f"Order #{payment.order_id} has been confirmed.",
        notification_type="order_confirmed",
    )

    # Save the payment/order/notifications FIRST.
    db.commit()
    db.refresh(payment)

    # Email comes AFTER the database transaction succeeds.
    try:
        await send_payment_success_email(
            recipient=user.email,
            order_id=payment.order_id,
            amount=payment.amount,
        )
    except Exception as e:
        # Email failure must not undo the successful payment.
        print(
            f"Failed to send payment email "
            f"for order #{payment.order_id}: {e}"
        )

    return payment