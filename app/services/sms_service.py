import os
import requests
from dotenv import load_dotenv

load_dotenv()

TERMII_API_KEY = os.getenv("TERMII_API_KEY")
TERMII_SENDER_ID = os.getenv("TERMII_SENDER_ID", "PayRecon")
TERMII_URL = "https://v3.api.termii.com/api/sms/send"

def normalize_phone(phone: str) -> str:
    phone = str(phone).strip().replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    elif phone.startswith("+"):
        phone = phone[1:]
    return phone

def send_sms(to: str, message: str) -> bool:
    try:
        to_number = normalize_phone(to)
        payload = {
            "to": to_number,
            "from": TERMII_SENDER_ID,
            "sms": message,
            "type": "plain",
            "channel": "generic",
            "api_key": TERMII_API_KEY,
        }
        response = requests.post(TERMII_URL, json=payload)
        result = response.json()
        print(f"Termii response: {result}")
        return response.status_code == 200
    except Exception as e:
        print(f"SMS error: {e}")
        return False

def send_invoice_sms(phone: str, customer_name: str, invoice_id: int, amount: float, due_date: str):
    message = f"Dear {customer_name}, Invoice #{invoice_id} of KES {amount:,.0f} has been created. Due date: {due_date}. Please pay on time."
    return send_sms(phone, message)

def send_payment_received_sms(phone: str, customer_name: str, amount: float, invoice_id: int, reference: str):
    message = f"Dear {customer_name}, payment of KES {amount:,.0f} received for Invoice #{invoice_id}. Ref: {reference or 'N/A'}. Thank you!"
    return send_sms(phone, message)

def send_overdue_sms(phone: str, customer_name: str, invoice_id: int, amount: float, days_overdue: int):
    message = f"Dear {customer_name}, Invoice #{invoice_id} of KES {amount:,.0f} is {days_overdue} days overdue. Please pay immediately to avoid penalties."
    return send_sms(phone, message)