from fastapi import APIRouter

from app.services.email_service import send_email


router = APIRouter(
    prefix="/email-test",
    tags=["Email Test"],
)


@router.post("/")
async def test_email():
    await send_email(
        recipient="customer1@example.com",
        subject="Smart Canteen Email Test",
        body="""
        <h1>Email works!</h1>
        <p>This is a test email from the Smart Canteen backend.</p>
        """,
    )

    return {
        "message": "Test email sent successfully"
    }