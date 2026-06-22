from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from dateutil.relativedelta import relativedelta
from app.core.database import get_db
from app.core.mpesa import stk_push
from app.api.routes_auth import get_current_user
from app.models.user import User
from app.models.subscription import Subscription
import logging

router = APIRouter(prefix="/billing", tags=["Billing"])
logger = logging.getLogger(__name__)


class PayRequest(BaseModel):
    phone: str


@router.get("/subscription")
def get_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="No business associated with account")

    sub = db.query(Subscription).filter(
        Subscription.business_id == current_user.business_id
    ).first()

    if not sub:
        # Auto-create subscription on first visit
        from app.models.business import Business
        business = db.query(Business).filter(
            Business.id == current_user.business_id
        ).first()
        next_billing = business.created_at if business and business.created_at else datetime.utcnow()
        sub = Subscription(
            business_id=current_user.business_id,
            is_active=False,
            next_billing_date=next_billing,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    return {
        "is_active": sub.is_active,
        "amount": sub.amount,
        "last_payment_date": sub.last_payment_date,
        "next_billing_date": sub.next_billing_date,
    }


@router.post("/pay")
def pay_subscription(
    data: PayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="No business associated with account")

    phone = data.phone.strip().replace("+", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]

    result = stk_push(
        phone=phone,
        amount=2000,
        invoice_id=0,
        account_ref="SUBSCRIPTION"
    )

    if result.get("ResponseCode") != "0":
        raise HTTPException(
            status_code=400,
            detail=result.get("errorMessage", "STK Push failed")
        )

    # Update subscription on successful STK push initiation
    sub = db.query(Subscription).filter(
        Subscription.business_id == current_user.business_id
    ).first()

    if sub:
        sub.is_active = True
        sub.last_payment_date = datetime.utcnow()
        sub.next_billing_date = datetime.utcnow() + relativedelta(months=1)
        db.commit()

    return {
        "message": "M-Pesa prompt sent",
        "checkout_request_id": result.get("CheckoutRequestID")
    }