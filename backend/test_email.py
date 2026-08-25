import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_test_email():
    print("=" * 70)
    print("SMART CANTEEN SMTP TEST")
    print("=" * 70)

    print("MAIL_HOST      :", settings.MAIL_HOST)
    print("MAIL_PORT      :", settings.MAIL_PORT)
    print("MAIL_USERNAME  :", settings.MAIL_USERNAME)
    print("MAIL_FROM      :", settings.MAIL_FROM)
    print("MAIL_FROM_NAME :", settings.MAIL_FROM_NAME)
    print("MAIL_STARTTLS  :", settings.MAIL_STARTTLS)
    print("MAIL_SSL_TLS   :", settings.MAIL_SSL_TLS)
    print("=" * 70)

    recipient = input(
        "Enter the email address that should receive the test: "
    ).strip()

    if not recipient:
        print("Recipient email is required.")
        return

    message = MIMEMultipart("alternative")

    message["Subject"] = "SmartCanteen SMTP Test"
    message["From"] = (
        f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    )
    message["To"] = recipient

    html = """
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2 style="color:#32145f;">
            SmartCanteen Email Test
        </h2>

        <p>
            Your SMTP configuration is working.
        </p>

        <p>
            This is a test email from SmartCanteen.
        </p>
    </body>
    </html>
    """

    message.attach(
        MIMEText(
            html,
            "html",
            "utf-8",
        )
    )

    server = None

    try:
        print("\nConnecting to SMTP server...")

        if settings.MAIL_SSL_TLS:
            server = smtplib.SMTP_SSL(
                settings.MAIL_HOST,
                settings.MAIL_PORT,
                timeout=20,
            )
        else:
            server = smtplib.SMTP(
                settings.MAIL_HOST,
                settings.MAIL_PORT,
                timeout=20,
            )

        print("SMTP connection established.")

        server.ehlo()

        if settings.MAIL_STARTTLS:
            print("Starting STARTTLS...")
            server.starttls()
            server.ehlo()
            print("STARTTLS successful.")

        print("Authenticating...")

        server.login(
            settings.MAIL_USERNAME,
            settings.MAIL_PASSWORD,
        )

        print("SMTP authentication successful.")

        print("Sending email...")

        server.sendmail(
            settings.MAIL_FROM,
            [recipient],
            message.as_string(),
        )

        print()
        print("=" * 70)
        print("SUCCESS")
        print("=" * 70)
        print(
            "Test email sent successfully to:",
            recipient,
        )
        print("=" * 70)

    except smtplib.SMTPAuthenticationError as exc:
        print()
        print("=" * 70)
        print("SMTP AUTHENTICATION ERROR")
        print("=" * 70)
        print(exc)
        print()
        print(
            "Check MAIL_USERNAME and MAIL_PASSWORD."
        )
        print(
            "For Brevo SMTP, use the SMTP credentials/key, "
            "not a normal account password or API key."
        )
        print("=" * 70)

    except smtplib.SMTPRecipientsRefused as exc:
        print()
        print("=" * 70)
        print("RECIPIENT REFUSED")
        print("=" * 70)
        print(exc)
        print("=" * 70)

    except smtplib.SMTPSenderRefused as exc:
        print()
        print("=" * 70)
        print("SENDER REFUSED")
        print("=" * 70)
        print(exc)
        print()
        print(
            "Verify that MAIL_FROM is an authorized "
            "Brevo sender."
        )
        print("=" * 70)

    except smtplib.SMTPConnectError as exc:
        print()
        print("=" * 70)
        print("SMTP CONNECTION ERROR")
        print("=" * 70)
        print(exc)
        print("=" * 70)

    except Exception as exc:
        print()
        print("=" * 70)
        print("SMTP ERROR")
        print("=" * 70)
        print(type(exc).__name__)
        print(str(exc))
        print("=" * 70)

    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass


if __name__ == "__main__":
    send_test_email()