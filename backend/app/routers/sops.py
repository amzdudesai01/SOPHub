from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.sop import Sop
from app.schemas.sop import SopCreate, SopOut


router = APIRouter(prefix="/sops", tags=["sops"])


@router.get("/", response_model=list[SopOut])
def list_sops(db: Session = Depends(get_db)):
    result = db.execute(select(Sop).order_by(Sop.id.desc()))
    return result.scalars().all()


@router.get("/{sop_id}", response_model=SopOut)
def get_sop(sop_id: str, db: Session = Depends(get_db)):
    result = db.execute(select(Sop).where(Sop.sop_id == sop_id))
    sop = result.scalar_one_or_none()
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    return sop


@router.post("/", response_model=SopOut, status_code=status.HTTP_201_CREATED)
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


