from __future__ import annotations

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
                "score": data.score,
                "severity": data.severity,
            }
        )

    return template.render(
        report=report,
        hazards=hazards,
        generated_at=_format_generated_at(report.generated_at),
    )


def _generate_with_weasyprint(html: str) -> bytes | None:
    try:
        from weasyprint import HTML
    except (ImportError, OSError) as exc:
        logger.debug("WeasyPrint unavailable: %s", exc)
        return None

    try:
        return HTML(string=html).write_pdf()
    except OSError as exc:
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
