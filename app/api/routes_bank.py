from fastapi import APIRouter, Depends, Request, Header, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.payment import Payment, PaymentChannel
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.services.reconciliation import apply_payment_to_invoice
import logging

router = APIRouter(prefix="/bank", tags=["Bank Webhook"])
logger = logging.getLogger(__name__)

BANK_WEBHOOK_SECRET = "your-bank-webhook-secret"

@router.post("/webhook")
async def bank_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_secret: str = Header(None)
):
    if x_webhook_secret != BANK_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")
    body = await request.json()
    logger.info(f"Bank webhook: {body}")
    try:
        amount = float(body.get("amount", 0))
        reference = body.get("reference") or body.get("transaction_id")
        account = body.get("account") or body.get("account_number", "")
        sender_name = body.get("sender_name", "Bank Transfer")
        if not amount or not reference:
            raise HTTPException(status_code=400, detail="Missing amount or reference")
        existing = db.query(Payment).filter(Payment.reference == reference).first()
        if existing:
            return {"status": "already_processed"}
        # Match customer by account number or name
        customer = db.query(Customer).filter(
            (Customer.phone == account) | (Customer.name.ilike(f"%{sender_name}%"))
        ).first()
        if not customer:
            logger.warning(f"No customer matched for bank payment {reference}")
            return {"status": "accepted", "warning": "No customer matched"}
        invoice = db.query(Invoice).filter(
            Invoice.customer_id == customer.id,
            Invoice.status != "paid"
        ).order_by(Invoice.id).first()
        if not invoice:
            return {"status": "accepted", "warning": "No unpaid invoice found"}
        payment = Payment(
            invoice_id=invoice.id,
            customer_id=customer.id,
            amount=amount,
            channel=PaymentChannel.bank,
            reference=reference,
            received_by=sender_name
        )
        db.add(payment)
        apply_payment_to_invoice(amount, invoice, db)
        db.commit()
        logger.info(f"Bank payment recorded: {reference} KES {amount}")
        return {"status": "success", "payment_id": payment.id}
    except Exception as e:
        logger.error(f"Bank webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
