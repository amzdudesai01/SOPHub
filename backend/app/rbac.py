from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_team import UserTeam
from app.models.sop_allowed_team import SopAllowedTeam
from app.models.user import User


def user_team_ids(db: Session, user_id: int) -> set[int]:
    rows = db.execute(select(UserTeam.team_id).where(UserTeam.user_id == user_id)).all()
    return {r[0] for r in rows}


def can_view_sop(db: Session, user_id: int, sop_id: int) -> bool:
    # Admins can view everything
    role = db.execute(select(User.role).where(User.id == user_id)).scalar_one_or_none()
    if role == "admin":
        return True
    u_teams = user_team_ids(db, user_id)
    if not u_teams:
        return False
    rows = db.execute(select(SopAllowedTeam.team_id).where(SopAllowedTeam.sop_id == sop_id)).all()
    allowed = {r[0] for r in rows}
    return bool(u_teams & allowed) or not allowed  # if none assigned, treat as open for now


def assert_can_view_sop(db: Session, user_id: int, sop_id: int) -> None:
    if not can_view_sop(db, user_id, sop_id):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden: SOP not assigned to your teams")


