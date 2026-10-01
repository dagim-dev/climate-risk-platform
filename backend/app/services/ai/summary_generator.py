from functools import lru_cache
from typing import Optional

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.risk import ClimateRiskReport
from app.services.ai.prompt_builder import build_risk_prompt

# The summary is best-effort; don't let a slow model hold up the whole analysis.
OPENAI_TIMEOUT_SECONDS = 20.0


@lru_cache(maxsize=1)
def _client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=OPENAI_TIMEOUT_SECONDS,
        max_retries=1,
    )


async def generate_risk_summary(report: ClimateRiskReport) -> Optional[str]:
    system_prompt, user_prompt = build_risk_prompt(report)

    response = await _client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=400,
        temperature=0.3,
    )

    return response.choices[0].message.content
