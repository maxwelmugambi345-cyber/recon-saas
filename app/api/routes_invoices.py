from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.customer import Customer
from app.models.business import Business
from app.schemas.invoice import InvoiceCreate, InvoiceOut
from app.api.routes_auth import get_current_user
from app.models.user import User
from app.services.email_service import send_invoice_created
from app.services.sms_service import send_invoice_sms
from app.services.pdf_service import generate_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post("/", response_model=InvoiceOut)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(
        Customer.id == invoice.customer_id,
        Customer.business_id == current_user.business_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    new_invoice = Invoice(
        customer_id=invoice.customer_id,
        business_id=current_user.business_id,
        amount=invoice.amount,
        due_date=invoice.due_date
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    try:
        if customer.email:
            send_invoice_created(customer.email, customer.name, new_invoice.id, float(new_invoice.amount), str(new_invoice.due_date))
    except Exception:
        pass
    try:
        if customer.phone:
            send_invoice_sms(customer.phone, customer.name, new_invoice.id, float(new_invoice.amount), str(new_invoice.due_date))
    except Exception:
        pass
    return new_invoice

@router.get("/", response_model=list[InvoiceOut])
def get_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Invoice).filter(Invoice.business_id == current_user.business_id).all()

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.business_id == current_user.business_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    pdf_bytes = generate_invoice_pdf(invoice, customer, business)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id}.pdf"}
    )