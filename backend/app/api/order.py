from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import (
    get_current_user,
    get_current_admin,
)
from app.models.user import User
from app.models.order import Order
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
)
from app.crud.order import (
    create_order,
    get_orders,
    get_order,
    update_order_status,
    cancel_order,
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    order: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_order(
        db=db,
        user_id=current_user.id,
        order=order,
    )


@router.get(
    "/me",
    response_model=List[OrderResponse],
)
def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_orders(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/",
    response_model=List[OrderResponse],
)
def list_all_orders(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(Order)
        .order_by(Order.id.desc())
        .all()
    )


@router.patch(
    "/{order_id}/cancel",
    response_model=OrderResponse,
)
def cancel_my_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = cancel_order(
        db=db,
        order_id=order_id,
        user_id=current_user.id,
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return order


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_one(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = get_order(db, order_id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if current_user.role == "admin":
        return order

    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this order",
        )

    return order


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
)
def change_order_status(
    order_id: int,
    status_update: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = get_order(db, order_id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return update_order_status(
        db=db,
        order_id=order_id,
        status=status_update,
    )