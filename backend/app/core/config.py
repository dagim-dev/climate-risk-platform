from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_MAPS_API_KEY: str
    OPENAI_API_KEY: str
    NOAA_API_KEY: str = ""
    NASA_API_KEY: str = ""
    FEMA_API_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    APP_VERSION: str = "0.1.0"
    SENTRY_DSN: str = ""
    JWT_SECRET: str = "dev-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    ANONYMOUS_DAILY_ANALYSIS_LIMIT: int = 3
    PDF_STORAGE_DIR: str = "storage/pdfs"
    PDF_SIGNED_URL_EXPIRE_MINUTES: int = 60
    API_BASE_URL: str = "http://localhost:8000"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_INDIVIDUAL: str = ""
    STRIPE_PRICE_PROFESSIONAL: str = ""
    STRIPE_PRICE_BUSINESS: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    class Config:
        env_file = ".env"


settings = Settings()
