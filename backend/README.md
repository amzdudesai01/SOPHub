# SOP Hub Backend (FastAPI)

## Quickstart

```powershell
cd backend
. .\.venv\Scripts\Activate.ps1
uvicorn app.main:create_app --factory --reload
```

Open http://127.0.0.1:8000/health

## Project layout
```
backend/
  app/
    __init__.py
    main.py
  pyproject.toml
  .gitignore
```

