import asyncio
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.services.activity_ws import activity_manager


router = APIRouter(
    prefix="/activity",
    tags=["Activity WebSocket"],
)


def get_admin_from_token(
    token: str,
) -> User | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[
                settings.ALGORITHM
            ],
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        try:
            user_id = int(user_id)
        except (
            TypeError,
            ValueError,
        ):
            return None

        db: Session = SessionLocal()

        try:
            user = (
                db.query(User)
                .filter(
                    User.id == user_id
                )
                .first()
            )

            if not user:
                return None

            if not user.is_active:
                return None

            if user.role != "admin":
                return None

            return user

        finally:
            db.close()

    except JWTError:
        return None


@router.websocket(
    "/ws"
)
async def activity_websocket(
    websocket: WebSocket,
):
    token = websocket.query_params.get(
        "token"
    )

    if not token:
        await websocket.close(
            code=1008
        )
        return

    admin = get_admin_from_token(
        token
    )

    if not admin:
        await websocket.close(
            code=1008
        )
        return

    await activity_manager.connect(
        websocket
    )

    db: Session = SessionLocal()

    last_id = (
        db.query(ActivityLog.id)
        .order_by(ActivityLog.id.desc())
        .first()
    )

    last_seen_id = (
        last_id[0]
        if last_id
        else 0
    )

    db.close()

    try:
        while True:

            await asyncio.sleep(
                2
            )

            db = SessionLocal()

            try:
                activities = (
                    db.query(ActivityLog)
                    .filter(
                        ActivityLog.id
                        > last_seen_id
                    )
                    .order_by(
                        ActivityLog.id.asc()
                    )
                    .limit(50)
                    .all()
                )

                for activity in activities:

                    await websocket.send_json(
                        {
                            "id": activity.id,
                            "actor_id": (
                                activity.actor_id
                            ),
                            "actor_name": (
                                activity.actor_name
                            ),
                            "action": (
                                activity.action
                            ),
                            "entity_type": (
                                activity.entity_type
                            ),
                            "entity_id": (
                                activity.entity_id
                            ),
                            "description": (
                                activity.description
                            ),
                            "created_at": (
                                activity.created_at.isoformat()
                            ),
                        }
                    )

                    last_seen_id = (
                        activity.id
                    )

            finally:
                db.close()

    except WebSocketDisconnect:
        activity_manager.disconnect(
            websocket
        )

    except Exception:
        activity_manager.disconnect(
            websocket
        )