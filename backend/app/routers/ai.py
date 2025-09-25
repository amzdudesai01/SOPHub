from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.settings import settings
import httpx


router = APIRouter(prefix="/ai", tags=["ai"])


class DraftBody(BaseModel):
    title: str
    department: str
    outline: str | None = None


@router.post("/draft")
async def ai_draft(body: DraftBody):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY not configured")
    prompt = f"""
You are an expert SOP writer. Create a clean SOP draft in the Standard SOP Format.
Input:
- Title: {body.title}
- Department: {body.department}
- Outline (optional): {body.outline or '(none)'}
Output:
- Use headings (Purpose, Scope, Roles & RACI, Prerequisites, Tools & Access, Procedure with numbered steps, Quality Standard / Acceptance Criteria, Common Errors & Fixes, Templates & Links, Change Log, Next Review).
- Use imperative voice. Keep steps concise and unambiguous.
"""
    # Minimal Gemini call (text‑only); replace with official SDK if desired
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    params = {"key": settings.gemini_api_key}
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, headers=headers, params=params, json=payload)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail={"upstream": r.text})
    data = r.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        raise HTTPException(status_code=502, detail={"upstream": data})
    return {"title": body.title, "department": body.department, "draft_md": text}


class CleanBody(BaseModel):
    department: str | None = None
    text_md: str | None = None
    text_html: str | None = None
    notes: str | None = None


@router.post("/clean")
async def ai_clean(body: CleanBody):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY not configured")
    source = body.text_md or body.text_html or ""
    if not source:
        raise HTTPException(status_code=422, detail="Provide text_md or text_html")
    prompt = f"""
You are an SOP standardizer. Rewrite the provided content into the Standard SOP Format sections.
Department: {body.department or '(unspecified)'}
Guidelines: Use imperative voice, concise numbered steps, QA criteria, and keep tables/bullets where helpful.
Additional notes: {body.notes or '(none)'}

CONTENT START\n{source}\nCONTENT END
Return clean markdown/plain text with clear section headings.
"""
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    params = {"key": settings.gemini_api_key}
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(url, headers=headers, params=params, json=payload)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail={"upstream": r.text})
    data = r.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        raise HTTPException(status_code=502, detail={"upstream": data})
    return {"clean_md": text}


