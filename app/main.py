from fastapi import FastAPI, Request
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
from app.api.routes_password_reset import router as password_reset_router
from app.utils.overdue import mark_overdue_invoices
from app.api.routes_users import router as users_router
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
app.include_router(password_reset_router)
app.include_router(users_router)
@app.get("/")
def home():
    return {"message": "Payment Reconciliation SaaS is running"}
