from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class SopAllowedTeam(Base):
    __tablename__ = "sop_allowed_teams"
    __table_args__ = (
        UniqueConstraint("sop_id", "team_id", name="uq_sop_allowed_team"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    sop_id: Mapped[int] = mapped_column(Integer, ForeignKey("sops.id", ondelete="CASCADE"), index=True)
    team_id: Mapped[int] = mapped_column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), index=True)


