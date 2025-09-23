from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.sop import Sop
from app.schemas.sop import SopCreate, SopOut
from app.deps import require_roles
from app.deps import get_current_user
from app.rbac import assert_can_view_sop


router = APIRouter(prefix="/sops", tags=["sops"])


@router.get("/", response_model=list[SopOut], dependencies=[Depends(get_current_user)])
def list_sops(db: Session = Depends(get_db), user = Depends(get_current_user)):
    # naive filter: return SOPs where allowed teams overlap, or none assigned
    # Build a set of visible sop ids
    from app.rbac import user_team_ids
    from app.models.sop_allowed_team import SopAllowedTeam
    uteams = user_team_ids(db, int(user["sub"]))
    if not uteams:
        # show only SOPs with no restrictions
        allowed = db.execute(select(SopAllowedTeam.sop_id)).scalars().all()
        allowed_set = set(allowed)
        return db.execute(select(Sop).where(~Sop.id.in_(allowed_set)).order_by(Sop.id.desc())).scalars().all()
    allowed_rows = db.execute(select(SopAllowedTeam.sop_id, SopAllowedTeam.team_id)).all()
    visible = {row[0] for row in allowed_rows if row[1] in uteams}
    if visible:
        return db.execute(select(Sop).where(Sop.id.in_(visible)).order_by(Sop.id.desc())).scalars().all()
    # fallback to unrestricted
    restricted = {row[0] for row in allowed_rows}
    return db.execute(select(Sop).where(~Sop.id.in_(restricted)).order_by(Sop.id.desc())).scalars().all()


@router.get("/{sop_id}", response_model=SopOut, dependencies=[Depends(get_current_user)])
def get_sop(sop_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
    result = db.execute(select(Sop).where(Sop.sop_id == sop_id))
    sop = result.scalar_one_or_none()
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    assert_can_view_sop(db, int(user["sub"]), sop.id)
    return sop


@router.post("/", response_model=SopOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("admin","dept_lead","editor"))])
def create_sop(payload: SopCreate, db: Session = Depends(get_db)):
    exists = db.execute(select(Sop).where(Sop.sop_id == payload.sop_id)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="sop_id already exists")
    sop = Sop(
        sop_id=payload.sop_id,
        title=payload.title,
        department=payload.department,
        content_md=payload.content_md,
        content_json=payload.content_json,
        status="draft",
        version=1,
    )
    db.add(sop)
    db.commit()
    db.refresh(sop)
    return sop


