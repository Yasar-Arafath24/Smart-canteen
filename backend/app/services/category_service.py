from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.menu import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.repositories.category_repository import CategoryRepository


class CategoryService:
    def __init__(self):
        self.repository = CategoryRepository()

    def get_all_categories(self, db: Session):
        return self.repository.get_all(db)

    def get_category(self, db: Session, category_id: int):
        category = self.repository.get_by_id(db, category_id)

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        return category

    def create_category(self, db: Session, category_data: CategoryCreate):

        existing = self.repository.get_by_name(db, category_data.name)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category already exists"
            )

        category = Category(
            name=category_data.name,
            description=category_data.description
        )

        return self.repository.create(db, category)

    def update_category(
        self,
        db: Session,
        category_id: int,
        category_data: CategoryUpdate
    ):

        category = self.repository.get_by_id(db, category_id)

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        if category_data.name is not None:
            category.name = category_data.name

        if category_data.description is not None:
            category.description = category_data.description

        return self.repository.update(db, category)

    def delete_category(self, db: Session, category_id: int):

        category = self.repository.get_by_id(db, category_id)

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        self.repository.delete(db, category)

        return {
            "message": "Category deleted successfully"
        }