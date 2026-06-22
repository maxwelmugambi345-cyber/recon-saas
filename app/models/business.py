from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="business")
    customers = relationship("Customer", back_populates="business")
    invoices = relationship("Invoice", back_populates="business")
    payments = relationship("Payment", back_populates="business")
    subscription = relationship("Subscription", back_populates="business", uselist=False)