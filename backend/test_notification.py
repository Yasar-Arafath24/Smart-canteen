from app.db.database import SessionLocal
from app.crud.notification import create_notification


db = SessionLocal()

try:
    notification = create_notification(
        db=db,
        user_id=16,
        title="Test Notification",
        message="Your notification system is working.",
        notification_type="test",
    )

    print("Notification created!")
    print("ID:", notification.id)

finally:
    db.close()