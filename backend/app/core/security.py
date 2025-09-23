from datetime import datetime, timedelta
from typing import Any, Optional

from jose import jwt

from app.core.settings import settings


def create_jwt(payload: dict[str, Any], expires_minutes: int = 60) -> str:
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_jwt(token: str) -> Optional[dict[str, Any]]:
    try:
        data = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return data
    except Exception:
        return None


