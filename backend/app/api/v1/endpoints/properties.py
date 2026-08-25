from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.property import Property
from app.models.user import User
from app.schemas.property import PropertyCreate, PropertyListItem, PropertyResponse

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
        updated_at=property_.updated_at,
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

    return PropertyResponse(
        id=property_.id,
        address=property_.address,
        latitude=property_.latitude,
        longitude=property_.longitude,
        report_data=report,
        created_at=property_.created_at,
        updated_at=property_.updated_at,
    )


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
