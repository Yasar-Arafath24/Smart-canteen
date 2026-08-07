from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.database import get_db
from app.schemas.dashboard import DashboardStats
from app.crud.dashboard import get_dashboard_stats

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats", response_model=DashboardStats)
def stats(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return get_dashboard_stats(db)