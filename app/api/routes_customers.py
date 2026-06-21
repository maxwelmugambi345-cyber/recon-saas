from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerOut
from app.api.routes_auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("/", response_model=CustomerOut)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_customer = Customer(
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        business_id=current_user.business_id
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.get("/", response_model=list[CustomerOut])
def get_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Customer).filter(Customer.business_id == current_user.business_id).all()
