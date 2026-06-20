from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.payment import Payment
from app.models.invoice import Invoice, InvoiceStatus
from app.models.customer import Customer
from app.schemas.payment import PaymentCreate, PaymentOut
from app.services.reconciliation import apply_payment_to_invoice
from app.api.routes_auth import get_current_user
from app.services.email_service import send_payment_received
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/", response_model=PaymentOut)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == payment.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Invoice is already fully paid")
    if payment.reference:
        existing = db.query(Payment).filter(Payment.reference == payment.reference).first()
        if existing:
            raise HTTPException(status_code=400, detail="Duplicate payment reference")
    new_payment = Payment(
        invoice_id=payment.invoice_id,
        customer_id=payment.customer_id,
        amount=payment.amount,
        channel=payment.channel,
        reference=payment.reference,
        received_by=payment.received_by
    )
    db.add(new_payment)
    apply_payment_to_invoice(payment.amount, invoice, db)
    db.commit()
    db.refresh(new_payment)
    # Send email notification
    try:
        customer = db.query(Customer).filter(Customer.id == payment.customer_id).first()
        if customer and customer.email:
            send_payment_received(
                customer.email, customer.name,
                new_payment.invoice_id, float(new_payment.amount),
                new_payment.reference or "", new_payment.channel.value
            )
    except Exception:
        pass
    return new_payment

@router.get("/", response_model=list[PaymentOut])
def get_payments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Payment).all()