import httpx
import base64
from datetime import datetime
from app.core.config import settings

def get_mpesa_token():
    credentials = base64.b64encode(
        f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}".encode()
    ).decode()
    response = httpx.get(
        f"{settings.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials",
        headers={"Authorization": f"Basic {credentials}"}
    )
    return response.json()["access_token"]

def generate_password(shortcode, passkey, timestamp):
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode()).decode()

def stk_push(phone: str, amount: int, invoice_id: int, account_ref: str):
    token = get_mpesa_token()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = generate_password(
        settings.MPESA_SHORTCODE, settings.MPESA_PASSKEY, timestamp
    )
    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": f"{settings.CALLBACK_BASE_URL}/mpesa/stk-callback",
        "AccountReference": account_ref,
        "TransactionDesc": f"Payment for Invoice {invoice_id}"
    }
    response = httpx.post(
        f"{settings.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()
