from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.user import User


def create_activity(
    db: Session,
    *,
    actor: User | None,
    action: str,
    description: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
):
    activity = ActivityLog(
        actor_id=actor.id if actor else None,
        actor_name=actor.name if actor else "System",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


def get_activities(
    db: Session,
    *,
    limit: int = 50,
    offset: int = 0,
    action: str | None = None,
    entity_type: str | None = None,
    actor_id: int | None = None,
):
    query = (
        db.query(ActivityLog)
        .order_by(
            ActivityLog.created_at.desc()
        )
    )

    if action:
        query = query.filter(
            ActivityLog.action == action
        )

    if entity_type:
        query = query.filter(
            ActivityLog.entity_type
            == entity_type
        )

    if actor_id:
        query = query.filter(
            ActivityLog.actor_id
            == actor_id
        )

    return (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )