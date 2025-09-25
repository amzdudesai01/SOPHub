from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.routers import users, sops, teams, runs, suggestions, auth, admin


def create_app() -> FastAPI:
    app = FastAPI(title="SOP Hub API", version="0.1.0")

    # CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["system"]) 
    def root():
        return {
            "service": "SOP Hub API",
            "version": "0.1.0",
            "docs": "/docs",
            "health": "/health",
        }

    @app.get("/health", tags=["system"]) 
    def health():
        return {"status": "ok"}

    app.include_router(users.router)
    app.include_router(sops.router)
    app.include_router(teams.router)
    app.include_router(runs.router)
    app.include_router(suggestions.router)
    app.include_router(auth.router)
    app.include_router(admin.router)

    # Ensure media directories exist, then serve uploaded media (DOCX images)
    os.makedirs("media/images", exist_ok=True)
    os.makedirs("media/uploads", exist_ok=True)
    app.mount("/media", StaticFiles(directory="media"), name="media")

    return app


app = create_app()


