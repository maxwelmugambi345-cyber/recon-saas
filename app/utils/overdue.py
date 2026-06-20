from datetime import date
from sqlalchemy.orm import Session
from app.models.invoice import Invoice, InvoiceStatus

def mark_overdue_invoices(db: Session):
    """Mark all unpaid/partial invoices past due_date as overdue."""
    today = date.today()
    overdue_invoices = db.query(Invoice).filter(
        Invoice.due_date < today,
        Invoice.status.in_([InvoiceStatus.pending, InvoiceStatus.partial])
    ).all()
    for invoice in overdue_invoices:
        invoice.status = InvoiceStatus.overdue
    if overdue_invoices:
        db.commit()
    return len(overdue_invoices)