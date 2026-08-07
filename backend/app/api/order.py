from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.crud.order import (
    create_order,
    get_order,
    get_orders,
    update_order_status,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse

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
    """
    Create a new order for the authenticated user.
    """
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
    """
    Return all orders belonging to the authenticated user.
    """
    return get_orders(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_one(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return a single order if it belongs to the authenticated user.
    """
    order = get_order(db, order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
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
    """
    Update an order's status.
    (Currently any authenticated user passes get_current_admin.
    Later this will check current_admin.role == "admin".)
    """
    order = update_order_status(
        db=db,
        order_id=order_id,
        status=status_update,
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order