from fastapi_mail import (
    ConnectionConfig,
    FastMail,
    MessageSchema,
    MessageType,
)

from app.core.config import settings


mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_HOST,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=False,
    VALIDATE_CERTS=False,
)


# ============================================================
# GENERIC EMAIL
# ============================================================

async def send_email(
    recipient: str,
    subject: str,
    body: str,
):
    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
        body=body,
        subtype=MessageType.html,
    )

    mailer = FastMail(
        mail_config
    )

    await mailer.send_message(
        message
    )


# ============================================================
# PASSWORD RESET
# ============================================================

async def send_password_reset_email(
    recipient: str,
    reset_url: str,
):
    await send_email(
        recipient=recipient,
        subject="Reset your SmartCanteen password",
        body=f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            color: #24113f;
        ">

            <h2>
                Reset your SmartCanteen password
            </h2>

            <p>
                We received a request to reset
                your SmartCanteen password.
            </p>

            <p>
                Click the button below to choose
                a new password:
            </p>

            <p style="margin: 30px 0;">
                <a
                    href="{reset_url}"
                    style="
                        display: inline-block;
                        padding: 14px 24px;
                        background: #32145f;
                        color: white;
                        text-decoration: none;
                        border-radius: 10px;
                        font-weight: 600;
                    "
                >
                    Reset Password
                </a>
            </p>

            <p>
                This link expires in
                <strong>15 minutes</strong>.
            </p>

            <p>
                If you did not request a password
                reset, you can safely ignore this email.
            </p>

            <p>
                SmartCanteen
            </p>

        </div>
        """,
    )


# ============================================================
# PAYMENT SUCCESS
# ============================================================

async def send_payment_success_email(
    recipient: str,
    order_id: int,
    amount: float,
):
    await send_email(
        recipient=recipient,
        subject=f"Payment successful - Order #{order_id}",
        body=f"""
        <h2>Payment successful</h2>

        <p>
            Your payment for order
            <strong>#{order_id}</strong>
            was successful.
        </p>

        <p>
            <strong>Amount:</strong>
            ₹{amount:.2f}
        </p>

        <p>
            Your order has been confirmed.
        </p>

        <p>
            Thank you for using Smart Canteen.
        </p>
        """,
    )


# ============================================================
# ORDER COMPLETED
# ============================================================

async def send_order_completed_email(
    recipient: str,
    order_id: int,
    amount: float,
):
    await send_email(
        recipient=recipient,
        subject=f"Order completed - Order #{order_id}",
        body=f"""
        <h2>Your order is completed</h2>

        <p>
            Order <strong>#{order_id}</strong>
            has been completed successfully.
        </p>

        <p>
            <strong>Total:</strong>
            ₹{amount:.2f}
        </p>

        <p>
            Thank you for using Smart Canteen.
        </p>
        """,
    )


# ============================================================
# ORDER CANCELLED
# ============================================================

async def send_order_cancelled_email(
    recipient: str,
    order_id: int,
    amount: float,
):
    await send_email(
        recipient=recipient,
        subject=f"Order cancelled - Order #{order_id}",
        body=f"""
        <h2>Order cancelled</h2>

        <p>
            Your order <strong>#{order_id}</strong>
            has been cancelled.
        </p>

        <p>
            <strong>Order total:</strong>
            ₹{amount:.2f}
        </p>

        <p>
            If you have any questions,
            please contact the canteen.
        </p>
        """,
    )