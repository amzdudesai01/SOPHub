from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import UploadFile, File, Form

from app.db import get_db
from app.models.sop import Sop
from app.schemas.sop import SopCreate, SopOut, SopUpdate
from app.deps import require_roles
from app.deps import get_current_user
from app.rbac import assert_can_view_sop


router = APIRouter(prefix="/sops", tags=["sops"])


@router.get("/", response_model=list[SopOut], dependencies=[Depends(get_current_user)])
def list_sops(db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Admins see all
    if user.get("role") == "admin":
        return db.execute(select(Sop).order_by(Sop.id.desc())).scalars().all()
    # Non-admins: return SOPs where allowed teams overlap, or none assigned
    from app.rbac import user_team_ids
    from app.models.sop_allowed_team import SopAllowedTeam
    uteams = user_team_ids(db, int(user["sub"]))
    if not uteams:
        allowed = db.execute(select(SopAllowedTeam.sop_id)).scalars().all()
        allowed_set = set(allowed)
        return db.execute(select(Sop).where(~Sop.id.in_(allowed_set)).order_by(Sop.id.desc())).scalars().all()
    allowed_rows = db.execute(select(SopAllowedTeam.sop_id, SopAllowedTeam.team_id)).all()
    visible = {row[0] for row in allowed_rows if row[1] in uteams}
    if visible:
        return db.execute(select(Sop).where(Sop.id.in_(visible)).order_by(Sop.id.desc())).scalars().all()
    # fallback to unrestricted
    restricted = {row[0] for row in allowed_rows}
    return db.execute(select(Sop).where(~Sop.id.in_(restricted)).order_by(Sop.id.desc())).scalars().all()


@router.get("/{sop_id}", response_model=SopOut, dependencies=[Depends(get_current_user)])
def get_sop(sop_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
    result = db.execute(select(Sop).where(Sop.sop_id == sop_id))
    sop = result.scalar_one_or_none()
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    assert_can_view_sop(db, int(user["sub"]), sop.id)
    return sop


@router.get("/by-id/{id}", response_model=SopOut, dependencies=[Depends(get_current_user)])
def get_sop_by_id(id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    sop = db.get(Sop, id)
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    assert_can_view_sop(db, int(user["sub"]), sop.id)
    return sop


@router.post("/", response_model=SopOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("admin","dept_lead","editor"))])
def create_sop(payload: SopCreate, db: Session = Depends(get_db)):
    exists = db.execute(select(Sop).where(Sop.sop_id == payload.sop_id)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="sop_id already exists")
    sop = Sop(
        sop_id=payload.sop_id,
        title=payload.title,
        department=payload.department,
        content_md=payload.content_md,
        content_json=payload.content_json,
        status="draft",
        version=1,
    )
    db.add(sop)
    db.commit()
    db.refresh(sop)
    return sop


@router.patch("/{id}", response_model=SopOut, dependencies=[Depends(require_roles("admin","dept_lead","editor"))])
def update_sop(id: int, payload: SopUpdate, db: Session = Depends(get_db)):
    sop = db.get(Sop, id)
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    if payload.title is not None:
        sop.title = payload.title
    if payload.department is not None:
        sop.department = payload.department
    if payload.content_md is not None:
        sop.content_md = payload.content_md
    sop.version = (sop.version or 1) + 1
    db.commit()
    db.refresh(sop)
    return sop


@router.post("/{id}/publish", response_model=SopOut, dependencies=[Depends(require_roles("admin","dept_lead"))])
def publish_sop(id: int, db: Session = Depends(get_db)):
    sop = db.get(Sop, id)
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    sop.status = "published"
    sop.version = (sop.version or 1) + 1
    db.commit()
    db.refresh(sop)
    return sop


@router.post("/import_docx", response_model=SopOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("admin","dept_lead","editor"))])
async def import_docx(
    sop_id: str = Form(...),
    title: str = Form(...),
    department: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Import a DOCX and convert to HTML with images saved to /media.
    Stores HTML in content_json as { html }, and a plaintext in content_md for fallback.
    """
    # Save uploaded docx temporarily
    import os, uuid, mammoth
    os.makedirs("media/uploads", exist_ok=True)
    temp_path = os.path.join("media/uploads", f"{uuid.uuid4()}.docx")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Convert to HTML; extract images to /media/images
    os.makedirs("media/images", exist_ok=True)
    def image_handler(image):
        image_name = f"{uuid.uuid4()}.{image.content_type.split('/')[-1]}"
        image_path = os.path.join("media/images", image_name)
        # image.open() returns a context manager (closing wrapper). Use it properly.
        with image.open() as img_fp:
            data = img_fp.read()
        with open(image_path, "wb") as img:
            img.write(data)
        return {"src": f"/media/images/{image_name}"}

    try:
        with open(temp_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file, convert_image=mammoth.images.inline(image_handler))
            html = result.value  # HTML string
            messages = result.messages
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {e}")

    # Fallback plain text (strip tags)
    import re
    text = re.sub("<[^>]+>", "\n", html)
    text = re.sub("\n+", "\n", text).strip()

    # Create SOP record
    exists = db.execute(select(Sop).where(Sop.sop_id == sop_id)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="sop_id already exists")
    sop = Sop(
        sop_id=sop_id,
        title=title,
        department=department,
        content_md=text,
        content_json={"html": html},
        status="draft",
        version=1,
    )
    db.add(sop)
    db.commit()
    db.refresh(sop)
    return sop


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles("admin","dept_lead"))])
def delete_sop(id: int, db: Session = Depends(get_db)):
    sop = db.get(Sop, id)
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    db.delete(sop)
    db.commit()
    return None

