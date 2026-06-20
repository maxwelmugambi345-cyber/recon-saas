from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.payment import Payment, PaymentChannel
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.services.reconciliation import apply_payment_to_invoice
from app.api.routes_auth import get_current_user
from app.models.user import User
import csv
import io
import logging

router = APIRouter(prefix="/bank-import", tags=["Bank Import"])
logger = logging.getLogger(__name__)

def normalize_phone(phone: str) -> str:
    phone = str(phone).strip().replace(" ", "").replace("-", "")
    if phone.startswith("+254"):
        phone = "0" + phone[4:]
    elif phone.startswith("254"):
        phone = "0" + phone[3:]
    return phone

def match_customer(db: Session, name: str = "", account: str = "", phone: str = ""):
    if phone:
        normalized = normalize_phone(phone)
        customer = db.query(Customer).filter(Customer.phone == normalized).first()
        if customer:
            return customer
    if name:
        customer = db.query(Customer).filter(Customer.name.ilike(f"%{name}%")).first()
        if customer:
            return customer
    return None

@router.post("/upload")
async def upload_bank_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    decoded = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    results = {
        "matched": [],
        "unmatched": [],
        "duplicates": [],
        "errors": []
    }

    for row in reader:
        try:
            # Normalize keys to lowercase
            row = {k.lower().strip(): v.strip() for k, v in row.items()}

            # Try to extract fields from common bank CSV formats
            amount = None
            for key in ["credit", "amount", "deposit", "cr amount", "credit amount"]:
                if key in row and row[key]:
                    try:
                        amount = float(row[key].replace(",", ""))
                        break
                    except:
                        pass

            if not amount or amount <= 0:
                continue

            reference = (
                row.get("reference") or
                row.get("transaction id") or
                row.get("trans id") or
                row.get("cheque no") or
                row.get("ref")
            )

            date = row.get("date") or row.get("value date") or row.get("transaction date", "")
            name = row.get("description") or row.get("narration") or row.get("particulars", "")
            phone = row.get("phone") or row.get("mobile", "")

            if not reference:
                results["errors"].append({"row": row, "reason": "No reference found"})
                continue

            # Check duplicate
            existing = db.query(Payment).filter(Payment.reference == reference).first()
            if existing:
                results["duplicates"].append({"reference": reference, "amount": amount})
                continue

            # Match customer
            customer = match_customer(db, name=name, phone=phone)
            if not customer:
                results["unmatched"].append({
                    "reference": reference,
                    "amount": amount,
                    "description": name,
                    "date": date
                })
                continue

            # Find oldest unpaid invoice
            invoice = db.query(Invoice).filter(
                Invoice.customer_id == customer.id,
                Invoice.status != "paid"
            ).order_by(Invoice.id).first()

            if not invoice:
                results["unmatched"].append({
                    "reference": reference,
                    "amount": amount,
                    "description": name,
                    "reason": f"No unpaid invoice for {customer.name}"
                })
                continue

            payment = Payment(
                invoice_id=invoice.id,
                customer_id=customer.id,
                amount=amount,
                channel=PaymentChannel.bank,
                reference=reference,
                received_by=name[:100] if name else "Bank Import"
            )
            db.add(payment)
            apply_payment_to_invoice(amount, invoice, db)
            db.commit()

            results["matched"].append({
                "reference": reference,
                "amount": amount,
                "customer": customer.name,
                "invoice_id": invoice.id
            })

        except Exception as e:
            logger.error(f"Row error: {e}, row: {row}")
            results["errors"].append({"row": str(row), "reason": str(e)})

    return {
        "summary": {
            "matched": len(results["matched"]),
            "unmatched": len(results["unmatched"]),
            "duplicates": len(results["duplicates"]),
            "errors": len(results["errors"])
        },
        "details": results
    }
