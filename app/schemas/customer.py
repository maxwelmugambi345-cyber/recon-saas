from pydantic import BaseModel, EmailStr

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: EmailStr

class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: str

    class Config:
        from_attributes = True