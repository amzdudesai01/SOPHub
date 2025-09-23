from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str = "contributor"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    status: str
    is_active: bool

    class Config:
        from_attributes = True


