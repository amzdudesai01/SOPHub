from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.user import User
from app.models.team import Team
from app.models.user_team import UserTeam
from app.models.sop_allowed_team import SopAllowedTeam
from app.deps import require_roles


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles("admin"))])


@router.post("/users/{user_id}/role")
def set_user_role(user_id: int, role: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"ok": True, "user_id": user_id, "role": role}


@router.post("/users/{user_id}/teams")
def assign_user_team(user_id: int, team_id: int, db: Session = Depends(get_db)):
    if not db.get(User, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    if not db.get(Team, team_id):
        raise HTTPException(status_code=404, detail="Team not found")
    exists = db.execute(select(UserTeam).where(UserTeam.user_id == user_id, UserTeam.team_id == team_id)).scalar_one_or_none()
    if exists:
        return {"ok": True, "user_id": user_id, "team_id": team_id}
    link = UserTeam(user_id=user_id, team_id=team_id)
    db.add(link)
    db.commit()
    return {"ok": True, "user_id": user_id, "team_id": team_id}


@router.post("/sops/{sop_id}/teams")
def assign_sop_team(sop_id: int, team_id: int, db: Session = Depends(get_db)):
    # ensure sop exists via get
    from app.models.sop import Sop
    if not db.get(Sop, sop_id):
        raise HTTPException(status_code=404, detail="SOP not found")
    if not db.get(Team, team_id):
        raise HTTPException(status_code=404, detail="Team not found")
    exists = db.execute(select(SopAllowedTeam).where(SopAllowedTeam.sop_id == sop_id, SopAllowedTeam.team_id == team_id)).scalar_one_or_none()
    if exists:
        return {"ok": True, "sop_id": sop_id, "team_id": team_id}
    link = SopAllowedTeam(sop_id=sop_id, team_id=team_id)
    db.add(link)
    db.commit()
    return {"ok": True, "sop_id": sop_id, "team_id": team_id}


