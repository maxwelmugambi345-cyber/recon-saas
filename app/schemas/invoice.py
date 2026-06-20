from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from app.models.invoice import InvoiceStatus

class InvoiceCreate(BaseModel):
    customer_id: int
    amount: Decimal
    due_date: date

class InvoiceOut(BaseModel):
    id: int
    customer_id: int
    amount: Decimal
    status: InvoiceStatus
    due_date: date
    created_at: datetime

    class Config:
        from_attributes = True