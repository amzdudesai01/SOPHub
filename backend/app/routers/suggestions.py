from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.suggestion import Suggestion
from app.schemas.suggestion import SuggestionCreate, SuggestionOut


router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.get("/", response_model=list[SuggestionOut])
def list_suggestions(db: Session = Depends(get_db)):
    return db.execute(select(Suggestion)).scalars().all()


@router.post("/", response_model=SuggestionOut, status_code=status.HTTP_201_CREATED)
def create_suggestion(payload: SuggestionCreate, db: Session = Depends(get_db)):
    s = Suggestion(sop_id=payload.sop_id, user_id=payload.user_id, raw_text=payload.raw_text)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


