from __future__ import annotations

from typing import Optional

from datetime import date

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.analysis_usage import AnalysisUsage
from app.models.user import User


async def enforce_anonymous_analysis_limit(
    request: Request,
    db: AsyncSession,
    user: Optional[User],
) -> None:
    if user is not None:
        return

    client_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    today = date.today()
    result = await db.execute(
        select(AnalysisUsage).where(
            AnalysisUsage.ip_address == client_ip,
            AnalysisUsage.usage_date == today,
        )
    )
    usage = result.scalar_one_or_none()

    if usage is not None and usage.count >= settings.ANONYMOUS_DAILY_ANALYSIS_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Daily limit of {settings.ANONYMOUS_DAILY_ANALYSIS_LIMIT} analyses reached. "
                "Sign in for unlimited access."
            ),
        )

    if usage is None:
        usage = AnalysisUsage(ip_address=client_ip, usage_date=today, count=1)
        db.add(usage)
    else:
        usage.count += 1

    await db.commit()
