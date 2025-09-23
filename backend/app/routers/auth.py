from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.user import User
from app.core.security import create_jwt
from app.deps import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user:
        # Dev-friendly behavior: create user on first login
        display_name = payload.name or payload.email.split("@")[0]
        user = User(name=display_name, email=payload.email)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_jwt({"sub": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(access_token=token, user={
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    })


@router.get("/me")
def me(current = Depends(get_current_user)):
    return current


