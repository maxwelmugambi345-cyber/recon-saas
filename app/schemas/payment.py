from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from app.models.payment import PaymentChannel

class PaymentCreate(BaseModel):
    invoice_id: int
    customer_id: int
    amount: Decimal
    channel: PaymentChannel
    reference: str | None = None
    received_by: str | None = None

class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    customer_id: int
    amount: Decimal
    channel: PaymentChannel
    reference: str | None
    received_by: str | None
    payment_date: datetime

    class Config:
        from_attributes = True