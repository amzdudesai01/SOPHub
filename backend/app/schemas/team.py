from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str
    department: str


class TeamOut(BaseModel):
    id: int
    name: str
    department: str

    class Config:
        from_attributes = True


