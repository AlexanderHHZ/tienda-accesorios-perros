import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./tickets.db")
    APP_PORT: int = int(os.getenv("APP_PORT", 8000))

settings = Settings()