from fastapi_mail import (
    ConnectionConfig,
    FastMail,
    MessageSchema,
    MessageType,
)

from app.core.config import settings
from app.core.logging import log


# ============================================================
# MAIL CONFIGURATION
# ============================================================

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_HOST,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,

    # Brevo SMTP on port 587
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,

    # IMPORTANT:
    # SMTP authentication must be enabled.
    USE_CREDENTIALS=True,

    # Verify the SMTP server certificate.
    VALIDATE_CERTS=True,
)


# ============================================================
# GENERIC EMAIL
# ============================================================

async def send_email(
    recipient: str,
    subject: str,
    body: str,
) -> None:
    """
    Send an HTML email using the configured SMTP server.
    """

    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
        body=body,
        subtype=MessageType.html,
    )

    try:
        mailer = FastMail(
            mail_config
        )

        await mailer.send_message(
            message
        )

        log.info(
            "Email sent successfully to {recipient} with subject {subject}",
            recipient=recipient,
            subject=subject,
        )

    except Exception:
        log.exception(
            "Failed to send email to {recipient} with subject {subject}",
            recipient=recipient,
            subject=subject,
        )

        # Re-raise so the password-reset endpoint knows
        # that the email operation failed.
        raise


# ============================================================
# PASSWORD RESET
# ============================================================

async def send_password_reset_email(
    recipient: str,
    reset_url: str,
) -> None:
    await send_email(
        recipient=recipient,
        subject="Reset your SmartCanteen password",
        body=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>Password Reset</title>
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            font-family: Arial, Helvetica, sans-serif;
        ">

            <div style="
                max-width: 600px;
                margin: 40px auto;
                padding: 0 20px;
            ">

                <div style="
                    background-color: #ffffff;
                    border: 1px solid #eeeeee;
                    border-radius: 20px;
                    padding: 40px;
                ">

                    <h1 style="
                        margin: 0 0 8px 0;
                        color: #32145f;
                        font-size: 26px;
                    ">
                        SmartCanteen
                    </h1>

                    <h2 style="
                        margin: 25px 0 10px 0;
                        color: #24113f;
                        font-size: 22px;
                    ">
                        Reset your password
                    </h2>

                    <p style="
                        color: #555555;
                        font-size: 15px;
                        line-height: 1.7;
                    ">
                        We received a request to reset your
                        SmartCanteen password.
                    </p>

                    <p style="
                        color: #555555;
                        font-size: 15px;
                        line-height: 1.7;
                    ">
                        Click the button below to create a new
                        password.
                    </p>

                    <div style="
                        margin: 30px 0;
                        text-align: center;
                    ">

                        <a
                            href="{reset_url}"
                            style="
                                display: inline-block;
                                padding: 14px 28px;
                                background-color: #32145f;
                                color: #ffffff;
                                text-decoration: none;
                                border-radius: 10px;
                                font-size: 15px;
                                font-weight: bold;
                            "
                        >
                            Reset Password
                        </a>

                    </div>

                    <p style="
                        color: #666666;
                        font-size: 14px;
                        line-height: 1.6;
                    ">
                        This password reset link expires in
                        <strong>15 minutes</strong>.
                    </p>

                    <p style="
                        color: #666666;
                        font-size: 14px;
                        line-height: 1.6;
                    ">
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                    <hr style="
                        margin: 30px 0;
                        border: 0;
                        border-top: 1px solid #eeeeee;
                    ">

                    <p style="
                        margin: 0;
                        color: #999999;
                        font-size: 12px;
                    ">
                        SmartCanteen
                    </p>

                </div>

            </div>

        </body>
        </html>
        """,
    )


# ============================================================
# PAYMENT SUCCESS
# ============================================================

async def send_payment_success_email(
    recipient: str,
    order_id: int,
    amount: float,
) -> None:
    await send_email(
        recipient=recipient,
        subject=(
            f"Payment successful - "
            f"Order #{order_id}"
        ),
        body=f"""
        <!DOCTYPE html>
        <html>
        <body style="
            font-family: Arial, Helvetica, sans-serif;
            color: #24113f;
        ">

            <h2>
                Payment successful
            </h2>

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
                Thank you for using SmartCanteen.
            </p>

        </body>
        </html>
        """,
    )


# ============================================================
# ORDER COMPLETED
# ============================================================

async def send_order_completed_email(
    recipient: str,
    order_id: int,
    amount: float,
) -> None:
    await send_email(
        recipient=recipient,
        subject=(
            f"Order completed - "
            f"Order #{order_id}"
        ),
        body=f"""
        <!DOCTYPE html>
        <html>
        <body style="
            font-family: Arial, Helvetica, sans-serif;
            color: #24113f;
        ">

            <h2>
                Your order is completed
            </h2>

            <p>
                Order
                <strong>#{order_id}</strong>
                has been completed successfully.
            </p>

            <p>
                <strong>Total:</strong>
                ₹{amount:.2f}
            </p>

            <p>
                Thank you for using SmartCanteen.
            </p>

        </body>
        </html>
        """,
    )


# ============================================================
# ORDER CANCELLED
# ============================================================

async def send_order_cancelled_email(
    recipient: str,
    order_id: int,
    amount: float,
) -> None:
    await send_email(
        recipient=recipient,
        subject=(
            f"Order cancelled - "
            f"Order #{order_id}"
        ),
        body=f"""
        <!DOCTYPE html>
        <html>
        <body style="
            font-family: Arial, Helvetica, sans-serif;
            color: #24113f;
        ">

            <h2>
                Order cancelled
            </h2>

            <p>
                Your order
                <strong>#{order_id}</strong>
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

        </body>
        </html>
        """,
    )