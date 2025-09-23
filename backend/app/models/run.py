from sqlalchemy import ForeignKey, Integer, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from .base import Base


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sop_id: Mapped[int] = mapped_column(ForeignKey("sops.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    exception_note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    steps = relationship("RunStep", back_populates="run", cascade="all, delete-orphan")


class RunStep(Base):
    __tablename__ = "run_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("runs.id", ondelete="CASCADE"), index=True)
    step_no: Mapped[int] = mapped_column(Integer)
    checked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    run = relationship("Run", back_populates="steps")


