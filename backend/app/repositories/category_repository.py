from sqlalchemy.orm import Session

from app.models.menu import Category


class CategoryRepository:

    def get_all(self, db: Session):
        return db.query(Category).all()

    def get_by_id(self, db: Session, category_id: int):
        return (
            db.query(Category)
            .filter(Category.id == category_id)
            .first()
        )

    def get_by_name(self, db: Session, name: str):
        return (
            db.query(Category)
            .filter(Category.name == name)
            .first()
        )

    def create(self, db: Session, category: Category):
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    def update(self, db: Session, category: Category):
        db.commit()
        db.refresh(category)
        return category

    def delete(self, db: Session, category: Category):
        db.delete(category)
        db.commit()