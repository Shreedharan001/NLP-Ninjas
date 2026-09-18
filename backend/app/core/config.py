import os
import secrets
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Determine base directory and load .env file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

def get_secure_secret_key() -> str:
    """
    Retrieves SECRET_KEY from environment or generates a cryptographically
    secure 256-bit random key at runtime.
    """
    secret = os.getenv("SECRET_KEY")
    if not secret or secret.strip() == "":
        secret = secrets.token_urlsafe(32)
    return secret

class Settings(BaseModel):
    PROJECT_NAME: str = "Solar Portfolio Intelligence & Autonomous Maintenance Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = Field(default_factory=get_secure_secret_key)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))
    )
    PVWATTS_API_KEY: str = Field(
        default_factory=lambda: os.getenv("PVWATTS_API_KEY", "")
    )
    DATABASE_PATH: str = Field(
        default_factory=lambda: os.getenv("DATABASE_PATH", "solar_intelligence.db")
    )
    DEFAULT_CURRENCY: str = Field(
        default_factory=lambda: os.getenv("DEFAULT_CURRENCY", "₹")
    )
    DEFAULT_CURRENCY_CODE: str = Field(
        default_factory=lambda: os.getenv("DEFAULT_CURRENCY_CODE", "INR")
    )

    class Config:
        arbitrary_types_allowed = True

settings = Settings()
