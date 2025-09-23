from pydantic import BaseModel


class SuggestionCreate(BaseModel):
    sop_id: int
    user_id: int
    raw_text: str


class SuggestionOut(BaseModel):
    id: int
    sop_id: int
    user_id: int
    raw_text: str
    ai_summary: str | None
    ai_changeset_json: dict | None
    status: str

    class Config:
        from_attributes = True


