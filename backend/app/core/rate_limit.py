from __future__ import annotations

import math
import time
from collections import deque
from threading import Lock

from fastapi import HTTPException, Request, status

from app.core.config import settings

MINUTE_SECONDS = 60.0
DAY_SECONDS = 24 * 60 * 60.0
# Drop idle clients occasionally so the table doesn't grow without bound.
PRUNE_EVERY_SECONDS = 10 * 60.0

RATE_LIMIT_MESSAGE = "Too many searches from your network. Please wait a bit and try again."


class SlidingWindowLimiter:
    """Per-key sliding-window limiter, held in memory.

    Each Cloud Run instance keeps its own counts, so the effective limit is
    ``limit * instances``; keep ``--max-instances`` low to bound it.
    """

    def __init__(self, per_minute: int, per_day: int):
        self.per_minute = per_minute
        self.per_day = per_day
        self._hits: dict[str, deque[float]] = {}
        self._lock = Lock()
        self._last_prune = time.monotonic()

    def check(self, key: str, now: float | None = None) -> int | None:
        """Record a hit for ``key``; return seconds to wait if it is over a limit."""
        now = time.monotonic() if now is None else now
        with self._lock:
            if now - self._last_prune > PRUNE_EVERY_SECONDS:
                self._prune(now)

            hits = self._hits.setdefault(key, deque())
            while hits and now - hits[0] >= DAY_SECONDS:
                hits.popleft()

            if len(hits) >= self.per_day:
                return math.ceil(DAY_SECONDS - (now - hits[0]))

            recent = [t for t in hits if now - t < MINUTE_SECONDS]
            if len(recent) >= self.per_minute:
                return math.ceil(MINUTE_SECONDS - (now - recent[0]))

            hits.append(now)
            return None

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()

    def _prune(self, now: float) -> None:
        self._last_prune = now
        stale = [k for k, hits in self._hits.items() if not hits or now - hits[-1] >= DAY_SECONDS]
        for key in stale:
            del self._hits[key]


def client_ip(request: Request) -> str:
    # Cloud Run's front end appends the real client IP as the LAST X-Forwarded-For
    # entry; anything before it is client-supplied and can be spoofed.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        last = forwarded.split(",")[-1].strip()
        if last:
            return last
    return request.client.host if request.client else "unknown"


analyze_limiter = SlidingWindowLimiter(
    per_minute=settings.ANALYZE_RATE_LIMIT_PER_MINUTE,
    per_day=settings.ANALYZE_RATE_LIMIT_PER_DAY,
)


async def limit_analyze(request: Request) -> None:
    retry_after = analyze_limiter.check(client_ip(request))
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=RATE_LIMIT_MESSAGE,
            headers={"Retry-After": str(retry_after)},
        )
