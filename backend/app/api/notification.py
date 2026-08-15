from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.notification import (
    count_unread_notifications,
    delete_notification,
    get_notification,
    get_user_notifications,
    get_unread_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    UnreadCountResponse,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "/",
    response_model=list[NotificationResponse],
)
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_notifications(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/unread",
    response_model=list[NotificationResponse],
)
def list_unread_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_unread_notifications(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
)
def unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return UnreadCountResponse(
        unread_count=count_unread_notifications(
            db=db,
            user_id=current_user.id,
        )
    )


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def get_one_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = get_notification(
        db=db,
        notification_id=notification_id,
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this notification",
        )

    return notification


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mark_notification_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )


@router.patch(
    "/read-all",
    response_model=list[NotificationResponse],
)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mark_all_notifications_as_read(
        db=db,
        user_id=current_user.id,
    )


@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_one_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)