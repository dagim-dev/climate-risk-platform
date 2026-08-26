from pydantic import BaseModel


class PdfDownloadResponse(BaseModel):
    pdf_url: str
