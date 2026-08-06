from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.order import (
    create_order,
    delete_order,
    get_order,
    get_orders,
    update_order_status,
)
from app.db.database import get_db
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


@router.post("/", response_model=OrderResponse, status_code=201)
def create(
    order: OrderCreate,
    db: Session = Depends(get_db),
):
    return create_order(
        db=db,
        user_id=1,
        order=order,
    )


@router.get("/", response_model=list[OrderResponse])
def get_all(db: Session = Depends(get_db)):
    return get_orders(db, 1)


@router.get("/{order_id}", response_model=OrderResponse)
def get_one(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = get_order(db, order_id)

    if not order:
        raise HTTPException(404, "Order not found")

    return order


@router.patch("/{order_id}/{status}")
def update_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    order = update_order_status(
        db,
        order_id,
        status,
    )

    if not order:
        raise HTTPException(404, "Order not found")

    return order


@router.delete("/{order_id}")
def delete(
    order_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_order(db, order_id)

    if not deleted:
        raise HTTPException(404, "Order not found")

    return {"message": "Order deleted successfully"}
