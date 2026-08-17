from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    get_current_user,
    get_current_staff_or_admin,
)
from app.db.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
)
from app.crud.order import (
    create_order,
    get_orders,
    get_order,
    update_order_status,
    cancel_order,
    delete_order,
)
from app.services.notification_service import (
    notify_staff_new_order,
    notify_staff_order_status,
)
from app.crud.activity import create_activity


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


# ============================================================
# ALL ORDERS
# STAFF + ADMIN
# ============================================================

@router.get(
    "/",
    response_model=List[OrderResponse],
)
def list_all_orders(
    current_user: User = Depends(
        get_current_staff_or_admin
    ),
    db: Session = Depends(get_db),
):
    return (
        db.query(Order)
        .order_by(Order.id.desc())
        .options(
            selectinload(Order.items).selectinload(
                OrderItem.menu_item
            ),
        )
        .all()
    )


# ============================================================
# CREATE ORDER
# CUSTOMER
# ============================================================

@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    order: OrderCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    created_order = await create_order(
        db=db,
        user_id=current_user.id,
        order=order,
    )

    await notify_staff_new_order(
        db=db,
        order_id=created_order.id,
        total=float(created_order.total),
    )

    create_activity(
        db=db,
        actor=current_user,
        action="order_created",
        entity_type="order",
        entity_id=created_order.id,
        description=(
            f"Order #{created_order.id} "
            f"was created."
        ),
    )

    db.commit()

    return created_order


# ============================================================
# CUSTOMER'S ORDERS
# ============================================================

@router.get(
    "/me",
    response_model=List[OrderResponse],
)
def list_my_orders(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return get_orders(
        db=db,
        user_id=current_user.id,
    )


# ============================================================
# CANCEL MY ORDER
# ============================================================

@router.patch(
    "/{order_id}/cancel",
    response_model=OrderResponse,
)
async def cancel_my_order(
    order_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    order = await cancel_order(
        db=db,
        order_id=order_id,
        user_id=current_user.id,
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    create_activity(
        db=db,
        actor=current_user,
        action="order_cancelled",
        entity_type="order",
        entity_id=order.id,
        description=(
            f"Order #{order.id} "
            f"was cancelled."
        ),
    )

    db.commit()

    return order


# ============================================================
# GET ONE ORDER
# ============================================================

@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_one(
    order_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    order = get_order(
        db=db,
        order_id=order_id,
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    # Admin/staff can view any order
    if current_user.role in {
        "admin",
        "staff",
    }:
        return order

    # Customer can only view their own order
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this order",
        )

    return order


# ============================================================
# STAFF / ADMIN - UPDATE ORDER STATUS
# ============================================================

@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
)
async def change_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    current_user: User = Depends(
        get_current_staff_or_admin
    ),
    db: Session = Depends(get_db),
):
    order = get_order(
        db=db,
        order_id=order_id,
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    previous_status = order.status

    updated_order = await update_order_status(
        db=db,
        order_id=order_id,
        status=status_update.status,
    )

    await notify_staff_order_status(
        db=db,
        order_id=updated_order.id,
        new_status=updated_order.status,
    )

    create_activity(
        db=db,
        actor=current_user,
        action="order_status_changed",
        entity_type="order",
        entity_id=updated_order.id,
        description=(
            f"Order #{updated_order.id} "
            f"changed from "
            f"{previous_status} to "
            f"{updated_order.status}."
        ),
    )

    db.commit()

    return updated_order


# ============================================================
# DELETE ORDER
# ============================================================

@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_my_order(
    order_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    order = get_order(
        db=db,
        order_id=order_id,
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    # Admin can delete any order
    if current_user.role == "admin":
        deleted = delete_order(
            db=db,
            order_id=order_id,
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        create_activity(
            db=db,
            actor=current_user,
            action="order_deleted",
            entity_type="order",
            entity_id=order_id,
            description=(
                f"Order #{order_id} "
                f"was deleted."
            ),
        )

        db.commit()

        return Response(
            status_code=status.HTTP_204_NO_CONTENT
        )

    # Customer can only delete own order
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this order",
        )

    deleted = delete_order(
        db=db,
        order_id=order_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    create_activity(
        db=db,
        actor=current_user,
        action="order_deleted",
        entity_type="order",
        entity_id=order_id,
        description=(
            f"Order #{order_id} "
            f"was deleted by the customer."
        ),
    )

    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )