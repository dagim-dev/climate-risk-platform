from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_JWT_SECRET = "dev-jwt-secret-change-in-production"


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_MAPS_API_KEY: str
    OPENAI_API_KEY: str
    NOAA_API_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    APP_VERSION: str = "2.0.0"
    SENTRY_DSN: str = ""
    JWT_SECRET: str = _DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    PDF_STORAGE_DIR: str = "storage/pdfs"
    PDF_SIGNED_URL_EXPIRE_MINUTES: int = 60
    API_BASE_URL: str = "http://localhost:8000"
    GOOGLE_CLIENT_ID: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @model_validator(mode="after")
    def require_secure_jwt_in_production(self):
        if self.ENVIRONMENT == "production":
            secret = (self.JWT_SECRET or "").strip()
            if not secret or secret == _DEV_JWT_SECRET:
                raise ValueError(
                    "JWT_SECRET must be set to a strong unique value in production"
                )
        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
