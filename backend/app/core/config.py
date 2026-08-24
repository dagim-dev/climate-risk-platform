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
