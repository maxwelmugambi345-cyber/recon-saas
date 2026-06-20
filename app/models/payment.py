from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class PaymentChannel(str, enum.Enum):
    cash = "cash"
    mpesa = "mpesa"
    bank = "bank"

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    channel = Column(Enum(PaymentChannel), nullable=False)
    reference = Column(String, unique=True, nullable=True)
    received_by = Column(String, nullable=True)
    payment_date = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")
    customer = relationship("Customer")