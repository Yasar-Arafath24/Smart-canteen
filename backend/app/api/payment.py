from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.payment import (
    create_payment,
    get_payment_by_order,
    process_payment,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_payment(
        db=db,
        user_id=current_user.id,
        payment_data=payment_data,
    )


@router.get(
    "/order/{order_id}",
    response_model=PaymentResponse,
)
def get_order_payment(
    order_id: int,
    current_user: User = Depends(get_current_user),
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
            detail="Not authorized to view this payment",
        )

    return payment


@router.post(
    "/{payment_id}/pay",
    response_model=PaymentResponse,
)
def pay(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return process_payment(
        db=db,
        payment_id=payment_id,
        user_id=current_user.id,
    )