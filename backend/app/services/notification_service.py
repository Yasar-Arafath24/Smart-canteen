from app.crud.notification import create_notification
from app.services.notification_ws import notification_manager
from sqlalchemy.orm import Session


async def create_and_send_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
):
    # 1. Save notification to database
    notification = create_notification(
        db=db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )

    # 2. Make sure the notification has its ID/timestamp
    db.flush()

    # 3. Send real-time notification if the user is connected
    await notification_manager.send_to_user(
        user_id=user_id,
        message={
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat(),
        },
    )

    return notification