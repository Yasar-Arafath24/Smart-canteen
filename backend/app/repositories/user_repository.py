from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.schemas.user import UserCreate


class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        stmt = select(User).where(User.email == email.lower())
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def list_all(db: Session) -> list[User]:
        stmt = select(User).order_by(User.id)
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def create(db: Session, data: UserCreate, hashed_password: str) -> User:
        user = User(
            name=data.name.strip(),
            email=data.email.lower(),
            hashed_password=hashed_password,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, user: User, **fields) -> User:
        for key, value in fields.items():
            if value is not None:
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user
