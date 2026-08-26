from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.geocoding import router as geocoding_router
from app.api.v1.endpoints.properties import router as properties_router
from app.api.v1.endpoints.risk import router as risk_router
from app.core.config import settings
from app.core.sentry import init_sentry

init_sentry()

app = FastAPI(
    title="Climate Risk Intelligence Platform API",
    version=settings.APP_VERSION,
    description="API for address-level climate risk analysis.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(geocoding_router, prefix="/api/v1")
app.include_router(properties_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


if settings.ENVIRONMENT != "production":
    @app.get("/debug/sentry-test")
    async def sentry_test():
        raise RuntimeError("Sentry test error — intentional for error monitoring verification")
