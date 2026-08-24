from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.risk import ClimateRiskReport
from app.services.ai.prompt_builder import build_risk_prompt

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_risk_summary(report: ClimateRiskReport) -> str:
    system_prompt, user_prompt = build_risk_prompt(report)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=400,
        temperature=0.3,
    )

    return response.choices[0].message.content
