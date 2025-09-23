from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Suggestion(Base):
    __tablename__ = "suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    sop_id: Mapped[int] = mapped_column(ForeignKey("sops.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(index=True)
    raw_text: Mapped[str] = mapped_column(String(2000))
    ai_summary: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    ai_changeset_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="queued")


