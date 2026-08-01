from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.repositories.user_repository import UserRepository
from app.schemas.token import Token
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository()

    def register(self, data: UserCreate) -> User:
        if self.repo.get_by_email(self.db, data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        return self.repo.create(
            self.db, data, hash_password(data.password)
        )

    def login(self, email: str, password: str) -> Token:
        user = self.repo.get_by_email(self.db, email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )
        token = create_access_token(subject=str(user.id), role=user.role)
        return Token(access_token=token, role=user.role)
