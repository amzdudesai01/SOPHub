from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.suggestion import Suggestion
from app.schemas.suggestion import SuggestionCreate, SuggestionOut
from app.deps import get_current_user
from app.rbac import assert_can_view_sop


router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.get("/", response_model=list[SuggestionOut], dependencies=[Depends(get_current_user)])
def list_suggestions(status: str | None = None, db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Non-admins: return only suggestions for SOPs they can view
    from app.models.user import User
    from app.models.sop_allowed_team import SopAllowedTeam
    from app.rbac import user_team_ids
    role = db.execute(select(User.role).where(User.id == int(user["sub"]))).scalar_one_or_none()
    stmt = select(Suggestion)
    if status:
        stmt = stmt.where(Suggestion.status == status)
    if role != "admin":
        uteams = user_team_ids(db, int(user["sub"]))
        if not uteams:
            # only unrestricted SOPs
            restricted = {row[0] for row in db.execute(select(SopAllowedTeam.sop_id)).all()}
            if restricted:
                stmt = stmt.where(~Suggestion.sop_id.in_(restricted))
        else:
            rows = db.execute(select(SopAllowedTeam.sop_id, SopAllowedTeam.team_id)).all()
            visible = {row[0] for row in rows if row[1] in uteams}
            if visible:
                stmt = stmt.where(Suggestion.sop_id.in_(visible))
            else:
                restricted = {row[0] for row in rows}
                if restricted:
                    stmt = stmt.where(~Suggestion.sop_id.in_(restricted))
    return db.execute(stmt).scalars().all()


@router.post("/", response_model=SuggestionOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
def create_suggestion(payload: SuggestionCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    assert_can_view_sop(db, int(user["sub"]), payload.sop_id)
    s = Suggestion(sop_id=payload.sop_id, user_id=payload.user_id, raw_text=payload.raw_text)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/{id}", response_model=SuggestionOut, dependencies=[Depends(get_current_user)])
def update_suggestion(id: int, status: str | None = None, db: Session = Depends(get_db)):
    s = db.get(Suggestion, id)
    if not s:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if status is not None:
        s.status = status
    db.commit()
    db.refresh(s)
    return s

