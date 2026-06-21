import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
from_number = os.getenv("TWILIO_PHONE_NUMBER")

def get_client():
    return Client(account_sid, auth_token)

def normalize_phone(phone: str) -> str:
    phone = str(phone).strip().replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        phone = "+254" + phone[1:]
    elif phone.startswith("254"):
        phone = "+" + phone
    return phone

def send_sms(to: str, message: str) -> bool:
    try:
        client = get_client()
        to_number = normalize_phone(to)
        client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )
        return True
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
