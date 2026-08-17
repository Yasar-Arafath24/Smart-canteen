from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.crud.activity import get_activities
from app.db.database import get_db
from app.models.user import User
from app.schemas.activity import ActivityResponse


router = APIRouter(
    prefix="/activity",
    tags=["Activity"],
)


@router.get(
    "/",
    response_model=list[ActivityResponse],
)
def list_activity(
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    action: str | None = None,
    entity_type: str | None = None,
    actor_id: int | None = None,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    return get_activities(
        db=db,
        limit=limit,
        offset=offset,
        action=action,
        entity_type=entity_type,
        actor_id=actor_id,
    )