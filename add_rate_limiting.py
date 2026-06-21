# Update main.py to add rate limiting
with open('app/main.py', 'w', encoding='utf-8') as f:
    f.write('''from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.database import Base, engine, SessionLocal
from app.api.routes_customers import router as customers_router
from app.api.routes_invoices import router as invoices_router
from app.api.routes_payments import router as payments_router
from app.api.routes_reconciliation import router as reconciliation_router
from app.api.routes_auth import router as auth_router
from app.api.routes_mpesa import router as mpesa_router
from app.api.routes_bank import router as bank_router
from app.api.routes_bank_import import router as bank_import_router
from app.utils.overdue import mark_overdue_invoices

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Payment Reconciliation SaaS")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://recon-saas.vercel.app",
        "https://recon-saas-git-main-recon-saas.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def check_overdue_middleware(request: Request, call_next):
    db = SessionLocal()
    try:
        mark_overdue_invoices(db)
    finally:
        db.close()
    return await call_next(request)

app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(invoices_router)
app.include_router(payments_router)
app.include_router(reconciliation_router)
app.include_router(mpesa_router)
app.include_router(bank_router)
app.include_router(bank_import_router)

@app.get("/")
def home():
    return {"message": "Payment Reconciliation SaaS is running"}
''')
print('main.py updated with rate limiting!')

# Update auth routes to add rate limiting
with open('app/api/routes_auth.py', 'w', encoding='utf-8') as f:
    f.write('''from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.models.user import User
from app.models.business import Business
from app.schemas.user import UserCreate, UserOut, Token

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
limiter = Limiter(key_func=get_remote_address)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/register", response_model=UserOut)
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    business = Business(
        name=user.business_name,
        email=user.email,
        phone=user.business_phone
    )
    db.add(business)
    db.flush()
    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        business_id=business.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
''')
print('routes_auth.py updated with rate limiting!')