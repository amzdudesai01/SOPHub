from pydantic import BaseModel


class SopCreate(BaseModel):
    sop_id: str
    title: str
    department: str
    content_md: str | None = None
    content_json: dict | None = None


class SopOut(BaseModel):
    id: int
    sop_id: str
    title: str
    department: str
    status: str
    version: int
    content_md: str | None
    content_json: dict | None

    class Config:
        from_attributes = True


class SopUpdate(BaseModel):
    title: str | None = None
    department: str | None = None
    content_md: str | None = None


