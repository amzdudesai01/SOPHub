from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.suggestion import Suggestion
from app.schemas.suggestion import SuggestionCreate, SuggestionOut
from app.deps import get_current_user
from app.rbac import assert_can_view_sop


router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.get("/", response_model=list[SuggestionOut], dependencies=[Depends(get_current_user)])
def list_suggestions(db: Session = Depends(get_db)):
    return db.execute(select(Suggestion)).scalars().all()


@router.post("/", response_model=SuggestionOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
def create_suggestion(payload: SuggestionCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    assert_can_view_sop(db, int(user["sub"]), payload.sop_id)
    s = Suggestion(sop_id=payload.sop_id, user_id=payload.user_id, raw_text=payload.raw_text)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


