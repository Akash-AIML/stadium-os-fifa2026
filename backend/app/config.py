from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    model_name: str = "gemini-2.5-flash"
    max_request_length: int = 500
    rate_limit_per_minute: int = 20
    cors_origins: list[str] = [
        "http://localhost:5173",
        "https://*.vercel.app",
        "https://*.vercel.com",
    ]
    dev_mode: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()