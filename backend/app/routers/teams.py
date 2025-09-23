from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamOut
from app.deps import require_roles


router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.execute(select(Team)).scalars().all()


@router.post("/", response_model=TeamOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("admin"))])
def create_team(payload: TeamCreate, db: Session = Depends(get_db)):
    exists = db.execute(select(Team).where(Team.name == payload.name)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Team name exists")
    team = Team(name=payload.name, department=payload.department)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


