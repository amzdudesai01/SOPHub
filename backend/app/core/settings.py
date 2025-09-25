from pydantic_settings import BaseSettings
from pydantic import AnyUrl
from typing import List


class Settings(BaseSettings):
    env: str = "development"
    database_url: str
    allowed_origins: List[str] = ["http://localhost:3000"]
    jwt_secret: str = "dev_secret_change_me"
    jwt_algorithm: str = "HS256"
    gemini_api_key: str | None = None

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
        "env_prefix": "",
        "populate_by_name": True,
        "fields": {
            "database_url": {"env": ["DATABASE_URL"]},
            "allowed_origins": {"env": ["ALLOWED_ORIGINS"]},
            "jwt_secret": {"env": ["JWT_SECRET"]},
            "jwt_algorithm": {"env": ["JWT_ALGORITHM"]},
            "gemini_api_key": {"env": ["GEMINI_API_KEY"]},
        },
    }


settings = Settings()  # type: ignore[call-arg]


