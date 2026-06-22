from app.utils.overdue import mark_overdue_invoices
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app.core.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.models.customer import Customer
from app.api.routes_auth import get_current_user
from app.models.user import User
from decimal import Decimal

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])

@router.get("/invoice/{invoice_id}")
def get_invoice_reconciliation(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    payments = db.query(Payment).filter(Payment.invoice_id == invoice_id).all()
    total_paid = sum(Decimal(str(p.amount)) for p in payments) or Decimal("0")
    balance = Decimal(str(invoice.amount)) - total_paid
    return {
        "invoice_id": invoice.id,
        "customer_id": invoice.customer_id,
        "invoice_amount": invoice.amount,
        "total_paid": total_paid,
        "balance": balance,
        "status": invoice.status,
        "due_date": invoice.due_date,
        "payments": [
            {
                "payment_id": p.id,
                "amount": p.amount,
                "channel": p.channel,
                "reference": p.reference,
                "received_by": p.received_by,
                "payment_date": p.payment_date
            }
            for p in payments
        ]
    }

@router.get("/customer/{customer_id}")
def get_customer_reconciliation(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.business_id == current_user.business_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    invoices = db.query(Invoice).filter(Invoice.customer_id == customer_id, Invoice.business_id == current_user.business_id).all()
    summary = []
    total_invoiced = Decimal("0")
    total_paid = Decimal("0")
    for invoice in invoices:
        payments = db.query(Payment).filter(Payment.invoice_id == invoice.id).all()
        paid = sum(Decimal(str(p.amount)) for p in payments) or Decimal("0")
        balance = Decimal(str(invoice.amount)) - paid
        total_invoiced += Decimal(str(invoice.amount))
        total_paid += paid
        summary.append({
            "invoice_id": invoice.id,
            "amount": invoice.amount,
            "total_paid": paid,
            "balance": balance,
            "status": invoice.status,
            "due_date": invoice.due_date
        })
    return {
        "customer_id": customer_id,
        "customer_name": customer.name,
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "outstanding_balance": total_invoiced - total_paid,
        "invoices": summary
    }

@router.get("/summary")
def get_overall_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoices = db.query(Invoice).all()
    total_invoiced = sum(Decimal(str(i.amount)) for i in invoices) or Decimal("0")
    payments = db.query(Payment).all()
    total_paid = sum(Decimal(str(p.amount)) for p in payments) or Decimal("0")
    pending = db.query(Invoice).filter(Invoice.status == InvoiceStatus.pending).count()
    partial = db.query(Invoice).filter(Invoice.status == InvoiceStatus.partial).count()
    paid = db.query(Invoice).filter(Invoice.status == InvoiceStatus.paid).count()
    overdue = db.query(Invoice).filter(Invoice.status == InvoiceStatus.overdue).count()
    return {
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "outstanding_balance": total_invoiced - total_paid,
        "invoice_counts": {
            "pending": pending,
            "partial": partial,
            "paid": paid,
            "overdue": overdue
        }
    }

@router.get("/monthly-revenue")
def get_monthly_revenue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_year = datetime.utcnow().year
    results = (
        db.query(
            extract('month', Payment.payment_date).label('month'),
            func.sum(Payment.amount).label('total')
        )
        .filter(extract('year', Payment.payment_date) == current_year)
        .filter(Payment.business_id == current_user.business_id)
        .group_by(extract('month', Payment.payment_date))
        .order_by(extract('month', Payment.payment_date))
        .all()
    )
    months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    data = {m: 0 for m in months}
    for row in results:
        data[months[int(row.month) - 1]] = float(row.total)
    return data

@router.post("/mark-overdue")
def mark_overdue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = mark_overdue_invoices(db)
    return {"message": f"{count} invoice(s) marked as overdue"}