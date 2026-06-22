from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.api.routes_auth import get_current_user
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["Users"])

class InviteUser(BaseModel):
    email: EmailStr
    password: str
    role: str = "staff"

@router.get("/")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can view users")
    users = db.query(User).filter(User.business_id == current_user.business_id).all()
    return [{"id": u.id, "email": u.email, "role": u.role, "is_active": u.is_active} for u in users]

@router.post("/invite")
def invite_user(data: InviteUser, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can invite users")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        business_id=current_user.business_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"User {data.email} added successfully", "id": new_user.id}

@router.delete("/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can remove users")
    user = db.query(User).filter(
        User.id == user_id,
        User.business_id == current_user.business_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    db.delete(user)
    db.commit()
    return {"message": "User removed successfully"}