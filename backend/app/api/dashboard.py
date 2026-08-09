from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User
from app.schemas.dashboard import DashboardStats
from app.crud.dashboard import get_dashboard_stats


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/",
    response_model=DashboardStats,
)
def get_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return get_dashboard_stats(db)