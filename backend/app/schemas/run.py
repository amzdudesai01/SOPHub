from pydantic import BaseModel
from datetime import datetime


class RunStart(BaseModel):
    sop_id: int
    user_id: int


class RunOut(BaseModel):
    id: int
    sop_id: int
    user_id: int
    started_at: datetime
    completed_at: datetime | None
    passed: bool | None
    exception_note: str | None

    class Config:
        from_attributes = True


