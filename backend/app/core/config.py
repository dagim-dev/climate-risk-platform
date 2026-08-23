from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_MAPS_API_KEY: str
    OPENAI_API_KEY: str
    NOAA_API_KEY: str = ""
    NASA_API_KEY: str = ""
    FEMA_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
