from fastapi import FastAPI
from app.routers import users, sops, teams, runs, suggestions, auth


def create_app() -> FastAPI:
    app = FastAPI(title="SOP Hub API", version="0.1.0")

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

    return app


app = create_app()


