from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.models.run import Run, RunStep
from app.schemas.run import RunStart, RunOut


router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("/", response_model=list[RunOut])
def list_runs(db: Session = Depends(get_db)):
    return db.execute(select(Run).order_by(Run.id.desc())).scalars().all()


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/", response_model=RunOut, status_code=status.HTTP_201_CREATED)
def start_run(payload: RunStart, db: Session = Depends(get_db)):
    run = Run(sop_id=payload.sop_id, user_id=payload.user_id)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.patch("/{run_id}/check", response_model=RunOut)
def check_step(run_id: int, step_no: int, db: Session = Depends(get_db)):
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    step = db.execute(select(RunStep).where(RunStep.run_id == run_id, RunStep.step_no == step_no)).scalar_one_or_none()
    if not step:
        step = RunStep(run_id=run_id, step_no=step_no, checked_at=datetime.utcnow())
        db.add(step)
    else:
        step.checked_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return run


@router.post("/{run_id}/complete", response_model=RunOut)
def complete_run(run_id: int, passed: bool = True, exception_note: str | None = None, db: Session = Depends(get_db)):
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run.completed_at = datetime.utcnow()
    run.passed = passed
    run.exception_note = exception_note
    db.commit()
    db.refresh(run)
    return run


