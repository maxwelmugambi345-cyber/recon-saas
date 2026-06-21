from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.models.user import User
from app.models.reset_token import ResetToken
from app.core.security import hash_password
from app.services.email_service import send_password_reset_email
from slowapi import Limiter
from slowapi.util import get_remote_address
import secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Password Reset"])
limiter = Limiter(key_func=get_remote_address)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Return success even if user not found (security best practice)
        return {"message": "If this email exists, a reset link has been sent"}
    # Generate token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    # Delete old tokens for this email
    db.query(ResetToken).filter(ResetToken.email == data.email).delete()
    # Save new token
    reset_token = ResetToken(email=data.email, token=token, expires_at=expires_at)
    db.add(reset_token)
    db.commit()
    # Send email
    try:
        send_password_reset_email(data.email, token)
    except Exception as e:
        print(f"Email error: {e}")
    return {"message": "If this email exists, a reset link has been sent"}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = db.query(ResetToken).filter(
        ResetToken.token == data.token,
        ResetToken.used == 0
    ).first()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")
    user = db.query(User).filter(User.email == reset_token.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(data.new_password)
    reset_token.used = 1
    db.commit()
    return {"message": "Password reset successfully"}
