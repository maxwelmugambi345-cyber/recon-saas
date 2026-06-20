from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.customer import Customer
from app.schemas.invoice import InvoiceCreate, InvoiceOut
from app.api.routes_auth import get_current_user
from app.models.customer import Customer
from app.services.email_service import send_invoice_created
from app.models.user import User

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post("/", response_model=InvoiceOut)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    new_invoice = Invoice(
        customer_id=invoice.customer_id,
        amount=invoice.amount,
        due_date=invoice.due_date,
        status=InvoiceStatus.pending
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    # Send email notification
    try:
        customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
        if customer and customer.email:
            send_invoice_created(
                customer.email, customer.name,
                new_invoice.id, float(new_invoice.amount),
                str(new_invoice.due_date)
            )
    except Exception:
        pass
    return new_invoice

@router.get("/", response_model=list[InvoiceOut])
def get_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Invoice).all()

@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice