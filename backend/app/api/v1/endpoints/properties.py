from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_pdf_download_token,
    user_can_download_pdf,
    verify_pdf_download_token,
)
from app.models.property import Property
from app.models.user import User
from app.schemas.pdf import PdfDownloadResponse
from app.schemas.property import PropertyCreate, PropertyListItem, PropertyResponse
from app.schemas.risk import ClimateRiskReport
from app.services.pdf.generator import generate_report_pdf
from app.services.pdf.storage import load_pdf, save_pdf

router = APIRouter(prefix="/properties", tags=["properties"])


def _to_list_item(property_: Property) -> PropertyListItem:
    report = property_.report_data
    return PropertyListItem(
        id=property_.id,
        address=property_.address,
        latitude=property_.latitude,
        longitude=property_.longitude,
        overall_risk_score=report.get("overall_risk_score", 0),
        verdict=report.get("verdict", "Caution"),
        pdf_url=property_.pdf_url,
        updated_at=property_.updated_at,
    )


def _to_response(property_: Property, report: ClimateRiskReport) -> PropertyResponse:
    return PropertyResponse(
        id=property_.id,
        address=property_.address,
        latitude=property_.latitude,
        longitude=property_.longitude,
        report_data=report,
        pdf_url=property_.pdf_url,
        created_at=property_.created_at,
        updated_at=property_.updated_at,
    )


def _build_signed_pdf_url(property_id: int, user_id: int) -> str:
    token = create_pdf_download_token(property_id, user_id)
    return (
        f"{settings.API_BASE_URL}/api/v1/properties/{property_id}/pdf/download"
        f"?token={token}"
    )


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = body.report
    existing = await db.execute(
        select(Property).where(
            Property.user_id == current_user.id,
            Property.address == report.address,
        )
    )
    property_ = existing.scalar_one_or_none()

    if property_ is not None:
        property_.latitude = report.latitude
        property_.longitude = report.longitude
        property_.report_data = report.model_dump()
        property_.pdf_url = None
    else:
        property_ = Property(
            user_id=current_user.id,
            address=report.address,
            latitude=report.latitude,
            longitude=report.longitude,
            report_data=report.model_dump(),
        )
        db.add(property_)

    await db.commit()
    await db.refresh(property_)

    return _to_response(property_, report)


@router.get("", response_model=list[PropertyListItem])
async def list_properties(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Property)
        .where(Property.user_id == current_user.id)
        .order_by(Property.updated_at.desc())
    )
    properties = result.scalars().all()
    return [_to_list_item(p) for p in properties]


@router.post("/{property_id}/pdf", response_model=PdfDownloadResponse)
async def generate_property_pdf(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_download_pdf(current_user.subscription_tier):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PDF download requires a paid subscription. Upgrade to access server-generated reports.",
        )

    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.user_id == current_user.id,
        )
    )
    property_ = result.scalar_one_or_none()
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    report = ClimateRiskReport.model_validate(property_.report_data)
    pdf_bytes = generate_report_pdf(report)
    save_pdf(property_id, pdf_bytes)

    signed_url = _build_signed_pdf_url(property_id, current_user.id)
    property_.pdf_url = signed_url
    await db.commit()

    return PdfDownloadResponse(pdf_url=signed_url)


@router.get("/{property_id}/pdf/download")
async def download_property_pdf(
    property_id: int,
    token: str = Query(..., min_length=1),
):
    user_id = verify_pdf_download_token(token, property_id)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired download link")

    pdf_bytes = load_pdf(property_id)
    if pdf_bytes is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF not found")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="climate-risk-report-{property_id}.pdf"'
        },
    )


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.user_id == current_user.id,
        )
    )
    property_ = result.scalar_one_or_none()
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    await db.delete(property_)
    await db.commit()
