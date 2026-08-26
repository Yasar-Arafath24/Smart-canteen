import base64
from typing import Any

import httpx

from app.core.config import settings


RAZORPAY_BASE_URL = (
    "https://api.razorpay.com/v1"
)


class RazorpayServiceError(Exception):
    pass


def get_basic_auth_header() -> str:
    credentials = (
        f"{settings.RAZORPAY_KEY_ID}:"
        f"{settings.RAZORPAY_KEY_SECRET}"
    )

    encoded = base64.b64encode(
        credentials.encode("utf-8")
    ).decode("utf-8")

    return f"Basic {encoded}"


def validate_config() -> None:
    if not settings.RAZORPAY_KEY_ID:
        raise RazorpayServiceError(
            "Razorpay Key ID is not configured."
        )

    if not settings.RAZORPAY_KEY_SECRET:
        raise RazorpayServiceError(
            "Razorpay Key Secret is not configured."
        )


async def create_upi_qr(
    *,
    amount: float,
    reference_id: str,
    description: str,
) -> dict[str, Any]:

    validate_config()

    amount_paise = int(
        round(
            amount * 100
        )
    )

    if amount_paise <= 0:
        raise RazorpayServiceError(
            "Payment amount must be greater than zero."
        )

    payload = {
        "type": "upi_qr",
        "name": "SmartCanteen",
        "usage": "single_use",
        "fixed_amount": True,
        "payment_amount": amount_paise,
        "description": description,
        "notes": {
            "smartcanteen_payment_id": reference_id,
        },
    }

    headers = {
        "Authorization": get_basic_auth_header(),
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=20.0
        ) as client:

            response = await client.post(
                f"{RAZORPAY_BASE_URL}/payments/qr_codes",
                json=payload,
                headers=headers,
            )

    except httpx.HTTPError as exc:
        raise RazorpayServiceError(
            f"Unable to connect to Razorpay: {exc}"
        ) from exc

    if response.status_code >= 400:
        raise RazorpayServiceError(
            "Razorpay QR creation failed: "
            f"{response.status_code} "
            f"{response.text}"
        )

    try:
        return response.json()
    except ValueError as exc:
        raise RazorpayServiceError(
            "Razorpay returned invalid JSON."
        ) from exc


async def fetch_qr(
    qr_id: str,
) -> dict[str, Any]:

    validate_config()

    headers = {
        "Authorization": get_basic_auth_header(),
    }

    try:
        async with httpx.AsyncClient(
            timeout=20.0
        ) as client:

            response = await client.get(
                f"{RAZORPAY_BASE_URL}/payments/qr_codes/{qr_id}",
                headers=headers,
            )

    except httpx.HTTPError as exc:
        raise RazorpayServiceError(
            f"Unable to connect to Razorpay: {exc}"
        ) from exc

    if response.status_code >= 400:
        raise RazorpayServiceError(
            "Unable to fetch Razorpay QR: "
            f"{response.status_code} "
            f"{response.text}"
        )

    return response.json()


async def close_qr(
    qr_id: str,
) -> dict[str, Any]:

    validate_config()

    headers = {
        "Authorization": get_basic_auth_header(),
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=20.0
        ) as client:

            response = await client.post(
                f"{RAZORPAY_BASE_URL}/payments/qr_codes/{qr_id}/close",
                headers=headers,
            )

    except httpx.HTTPError as exc:
        raise RazorpayServiceError(
            f"Unable to connect to Razorpay: {exc}"
        ) from exc

    if response.status_code >= 400:
        raise RazorpayServiceError(
            "Unable to close Razorpay QR: "
            f"{response.status_code} "
            f"{response.text}"
        )

    return response.json()