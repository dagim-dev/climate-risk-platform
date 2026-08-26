from __future__ import annotations

from pathlib import Path

from app.core.config import settings


def get_pdf_storage_dir() -> Path:
    storage_dir = Path(settings.PDF_STORAGE_DIR)
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def pdf_file_path(property_id: int) -> Path:
    return get_pdf_storage_dir() / f"property-{property_id}.pdf"


def save_pdf(property_id: int, pdf_bytes: bytes) -> Path:
    path = pdf_file_path(property_id)
    path.write_bytes(pdf_bytes)
    return path


def load_pdf(property_id: int) -> bytes | None:
    path = pdf_file_path(property_id)
    if not path.exists():
        return None
    return path.read_bytes()
