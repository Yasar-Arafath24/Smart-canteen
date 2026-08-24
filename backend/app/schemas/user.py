from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from pydantic import BaseModel, EmailStr, Field


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8)
class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )


class StaffCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=1,
        max_length=128,
    )


class UserUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    is_active: bool | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
from pydantic import BaseModel, EmailStr, Field


class ChangePasswordRequest(
    BaseModel
):
    current_password: str = Field(
        min_length=1
    )

    new_password: str = Field(
        min_length=8
    )


class ForgotPasswordRequest(
    BaseModel
):
    email: EmailStr


class ResetPasswordRequest(
    BaseModel
):
    token: str = Field(
        min_length=1
    )

    new_password: str = Field(
        min_length=8
    )