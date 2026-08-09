from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User

from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
)

from app.services.category_service import CategoryService


router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)

service = CategoryService()


# ============================================================
# GET ALL CATEGORIES
# Public endpoint
# ============================================================

@router.get(
    "/",
    response_model=list[CategoryResponse],
)
def get_categories(
    db: Session = Depends(get_db),
):
    return service.get_all_categories(db)


# ============================================================
# GET ONE CATEGORY
# Public endpoint
# ============================================================

@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    return service.get_category(
        db,
        category_id,
    )


# ============================================================
# CREATE CATEGORY
# ADMIN ONLY
# ============================================================

@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    category: CategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return service.create_category(
        db,
        category,
    )


# ============================================================
# UPDATE CATEGORY
# ADMIN ONLY
# ============================================================

@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: int,
    category: CategoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return service.update_category(
        db,
        category_id,
        category,
    )


# ============================================================
# DELETE CATEGORY
# ADMIN ONLY
# ============================================================

@router.delete(
    "/{category_id}",
)
def delete_category(
    category_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return service.delete_category(
        db,
        category_id,
    )