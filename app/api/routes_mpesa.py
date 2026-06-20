from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.mpesa import stk_push
from app.models.payment import Payment, PaymentChannel
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.services.reconciliation import apply_payment_to_invoice
from app.api.routes_auth import get_current_user
from app.models.user import User
import logging

router = APIRouter(prefix="/mpesa", tags=["M-Pesa"])
logger = logging.getLogger(__name__)

class STKPushRequest(BaseModel):
    phone: str
    amount: int
    invoice_id: int
    customer_id: int

@router.post("/stk-push")
def initiate_stk_push(
    data: STKPushRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    phone = data.phone.strip().replace("+", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    result = stk_push(phone, data.amount, data.invoice_id, f"INV{data.invoice_id}")
    if result.get("ResponseCode") != "0":
        raise HTTPException(status_code=400, detail=result.get("errorMessage", "STK Push failed"))
    return {"message": "STK Push sent", "checkout_request_id": result.get("CheckoutRequestID")}

@router.post("/stk-callback")
async def stk_callback(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    logger.info(f"STK Callback: {body}")
    try:
        stk_callback = body["Body"]["stkCallback"]
        result_code = stk_callback["ResultCode"]
        if result_code != 0:
            logger.warning(f"STK Push failed: {stk_callback.get('ResultDesc')}")
            return {"ResultCode": 0, "ResultDesc": "Accepted"}
        metadata = stk_callback["CallbackMetadata"]["Item"]
        amount = next(i["Value"] for i in metadata if i["Name"] == "Amount")
        receipt = next(i["Value"] for i in metadata if i["Name"] == "MpesaReceiptNumber")
        phone = next(i["Value"] for i in metadata if i["Name"] == "PhoneNumber")
        # Find invoice by checkout request or latest pending
        existing = db.query(Payment).filter(Payment.reference == receipt).first()
        if existing:
            return {"ResultCode": 0, "ResultDesc": "Already processed"}
        # Find customer by phone
        customer = db.query(Customer).filter(Customer.phone.contains(str(phone)[-9:])).first()
        if not customer:
            logger.warning(f"No customer found for phone {phone}")
            return {"ResultCode": 0, "ResultDesc": "Accepted"}
        # Find oldest unpaid invoice
        invoice = db.query(Invoice).filter(
            Invoice.customer_id == customer.id,
            Invoice.status != "paid"
        ).order_by(Invoice.id).first()
        if not invoice:
            logger.warning(f"No unpaid invoice for customer {customer.id}")
            return {"ResultCode": 0, "ResultDesc": "Accepted"}
        payment = Payment(
            invoice_id=invoice.id,
            customer_id=customer.id,
            amount=amount,
            channel=PaymentChannel.mpesa,
            reference=receipt,
            received_by="M-Pesa"
        )
        db.add(payment)
        apply_payment_to_invoice(amount, invoice, db)
        db.commit()
        logger.info(f"Payment recorded: {receipt} KES {amount}")
    except Exception as e:
        logger.error(f"Callback error: {e}")
    return {"ResultCode": 0, "ResultDesc": "Accepted"}

@router.post("/c2b/register")
def register_c2b_urls(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    import httpx, base64
    from app.core.mpesa import get_mpesa_token
    from app.core.config import settings
    token = get_mpesa_token()
    payload = {
        "ShortCode": settings.MPESA_SHORTCODE,
        "ResponseType": "Completed",
        "ConfirmationURL": f"{settings.CALLBACK_BASE_URL}/mpesa/c2b/confirm",
        "ValidationURL": f"{settings.CALLBACK_BASE_URL}/mpesa/c2b/validate"
    }
    response = httpx.post(
        f"{settings.MPESA_BASE_URL}/mpesa/c2b/v1/registerurl",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

@router.post("/c2b/validate")
async def c2b_validate(request: Request):
    return {"ResultCode": 0, "ResultDesc": "Accepted"}

@router.post("/c2b/confirm")
async def c2b_confirm(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    logger.info(f"C2B Confirm: {body}")
    try:
        amount = float(body.get("TransAmount", 0))
        receipt = body.get("TransID")
        phone = body.get("MSISDN", "")
        bill_ref = body.get("BillRefNumber", "")
        existing = db.query(Payment).filter(Payment.reference == receipt).first()
        if existing:
            return {"ResultCode": 0, "ResultDesc": "Already processed"}
        customer = db.query(Customer).filter(Customer.phone.contains(phone[-9:])).first()
        if not customer:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}
        invoice = db.query(Invoice).filter(
            Invoice.customer_id == customer.id,
            Invoice.status != "paid"
        ).order_by(Invoice.id).first()
        if not invoice:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}
        payment = Payment(
            invoice_id=invoice.id,
            customer_id=customer.id,
            amount=amount,
            channel=PaymentChannel.mpesa,
            reference=receipt,
            received_by="M-Pesa C2B"
        )
        db.add(payment)
        apply_payment_to_invoice(amount, invoice, db)
        db.commit()
    except Exception as e:
        logger.error(f"C2B error: {e}")
    return {"ResultCode": 0, "ResultDesc": "Accepted"}
