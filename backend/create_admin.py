from app.db.database import SessionLocal
from app.models.user import User


def create_admin():
    db = SessionLocal()

    try:
        email = "admin@test.com"

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:
            print("Admin user does not exist.")
            print("Register admin@test.com first.")
            return

        user.role = "admin"

        db.commit()
        db.refresh(user)

        print("Admin role updated successfully!")
        print(f"ID: {user.id}")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()