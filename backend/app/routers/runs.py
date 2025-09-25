from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.run import Run, RunStep
from app.schemas.run import RunStart, RunOut
from app.deps import get_current_user
from app.rbac import assert_can_view_sop


router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("/", response_model=list[RunOut], dependencies=[Depends(get_current_user)])
def list_runs(db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Non-admins: only runs for SOPs they can view (or their own runs)
    from app.models.user import User
    from app.models.sop_allowed_team import SopAllowedTeam
    from app.rbac import user_team_ids
    role = db.execute(select(User.role).where(User.id == int(user["sub"]))).scalar_one_or_none()
    stmt = select(Run).order_by(Run.id.desc())
    if role != "admin":
      uteams = user_team_ids(db, int(user["sub"]))
      rows = db.execute(select(SopAllowedTeam.sop_id, SopAllowedTeam.team_id)).all()
      restricted = {row[0] for row in rows}
      visible = {row[0] for row in rows if row[1] in uteams}
      if visible:
          stmt = stmt.where((Run.sop_id.in_(visible)) | (Run.user_id == int(user["sub"])) | (~Run.sop_id.in_(restricted)))
      else:
          stmt = stmt.where((Run.user_id == int(user["sub"])) | (~Run.sop_id.in_(restricted)))
    return db.execute(stmt).scalars().all()


@router.get("/{run_id}", response_model=RunOut, dependencies=[Depends(get_current_user)])
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/", response_model=RunOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
def start_run(payload: RunStart, db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Ensure the caller can access the SOP being run
    assert_can_view_sop(db, int(user["sub"]), payload.sop_id)
    run = Run(sop_id=payload.sop_id, user_id=payload.user_id)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.patch("/{run_id}/check", response_model=RunOut, dependencies=[Depends(get_current_user)])
def check_step(run_id: int, step_no: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    assert_can_view_sop(db, int(user["sub"]), run.sop_id)
    step = db.execute(select(RunStep).where(RunStep.run_id == run_id, RunStep.step_no == step_no)).scalar_one_or_none()
    if not step:
        step = RunStep(run_id=run_id, step_no=step_no, checked_at=datetime.utcnow())
        db.add(step)
    else:
        step.checked_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return run


@router.post("/{run_id}/complete", response_model=RunOut, dependencies=[Depends(get_current_user)])
def complete_run(run_id: int, passed: bool = True, exception_note: str | None = None, db: Session = Depends(get_db), user = Depends(get_current_user)):
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    assert_can_view_sop(db, int(user["sub"]), run.sop_id)
    run.completed_at = datetime.utcnow()
    run.passed = passed
    run.exception_note = exception_note
    db.commit()
    db.refresh(run)
    return run


