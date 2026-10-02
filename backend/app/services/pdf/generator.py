from __future__ import annotations

import base64
import logging
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.schemas.risk import ClimateRiskReport

logger = logging.getLogger(__name__)

_TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"
_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
)
# Same pin as frontend/src/app/icon.svg; keep the two in sync.
_LOGO_SVG_B64 = base64.b64encode((_TEMPLATE_DIR / "logo.svg").read_bytes()).decode("ascii")

HAZARDS = [
    {"field": "flood_risk", "label": "Flood", "icon": "🌊"},
    {"field": "hurricane_risk", "label": "Hurricane", "icon": "🌀"},
    {"field": "heat_risk", "label": "Heat", "icon": "🌡️"},
    {"field": "wildfire_risk", "label": "Wildfire", "icon": "🔥"},
]


def _format_generated_at(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y at %I:%M %p UTC")
    except ValueError:
        return iso


def render_report_html(report: ClimateRiskReport) -> str:
    template = _env.get_template("report.html")
    hazards = []
    for hazard in HAZARDS:
        data = getattr(report, hazard["field"])
        hazards.append(
            {
                "label": hazard["label"],
                "icon": hazard["icon"],
                "score": data.score if data.score is not None else "N/A",
                "severity": data.severity or "Unavailable",
            }
        )

    return template.render(
        report=report,
        hazards=hazards,
        generated_at=_format_generated_at(report.generated_at),
        logo_svg_b64=_LOGO_SVG_B64,
    )


def _generate_with_weasyprint(html: str) -> bytes | None:
    try:
        from weasyprint import HTML
    except (ImportError, OSError) as exc:
        logger.debug("WeasyPrint unavailable: %s", exc)
        return None

    try:
        return HTML(string=html).write_pdf()
    except Exception as exc:
        logger.warning("WeasyPrint PDF generation failed: %s", exc)
        return None


def _generate_with_xhtml2pdf(html: str) -> bytes:
    from io import BytesIO

    from xhtml2pdf import pisa

    buffer = BytesIO()
    result = pisa.CreatePDF(html, dest=buffer)
    if result.err:
        raise RuntimeError("xhtml2pdf failed to generate PDF")
    return buffer.getvalue()


def generate_report_pdf(report: ClimateRiskReport) -> bytes:
    html = render_report_html(report)
    pdf_bytes = _generate_with_weasyprint(html)
    if pdf_bytes is not None:
        return pdf_bytes
    return _generate_with_xhtml2pdf(html)
