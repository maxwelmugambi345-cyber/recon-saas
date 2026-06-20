from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment

def get_invoice_balance(invoice: Invoice, db: Session) -> Decimal:
    """Compute remaining balance from total payments made against an invoice."""
    total_paid = db.query(Payment).filter(Payment.invoice_id == invoice.id).with_entities(
        Payment.amount
    ).all()
    paid = sum(row.amount for row in total_paid) or Decimal("0")
    return Decimal(str(invoice.amount)) - paid

def apply_payment_to_invoice(payment_amount: Decimal, invoice: Invoice, db: Session):
    """Apply a payment to an invoice and update its status."""
    balance = get_invoice_balance(invoice, db)
    remaining = balance - Decimal(str(payment_amount))

    if remaining <= 0:
        invoice.status = InvoiceStatus.paid
    else:
        invoice.status = InvoiceStatus.partial