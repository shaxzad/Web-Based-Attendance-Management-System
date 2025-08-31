import uuid
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app import crud
from app.api import deps
from app.models import (
    Holiday, HolidayCreate, HolidayPublic, HolidayUpdate, 
    HolidaysPublic, CalendarEvent, CalendarView
)

router = APIRouter()


@router.get("/", response_model=HolidaysPublic)
def read_holidays(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    year: int | None = Query(None, description="Filter by year"),
    month: int | None = Query(None, description="Filter by month"),
    holiday_type: str | None = Query(None, description="Filter by holiday type"),
) -> Any:
    """
    Retrieve holidays.
    """
    holidays = crud.get_holidays(
        session=db, 
        skip=skip, 
        limit=limit, 
        year=year, 
        month=month, 
        holiday_type=holiday_type
    )
    return HolidaysPublic(data=holidays, count=len(holidays))


@router.post("/", response_model=HolidayPublic)
def create_holiday(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser,
    holiday_in: HolidayCreate,
) -> Any:
    """
    Create new holiday.
    """
    holiday = crud.create_holiday(
        session=db, 
        holiday_in=holiday_in, 
        created_by=current_user.id
    )
    return holiday


@router.get("/{holiday_id}", response_model=HolidayPublic)
def read_holiday(
    *,
    db: Session = Depends(deps.get_db),
    holiday_id: str,
) -> Any:
    """
    Get holiday by ID.
    """
    try:
        holiday_uuid = uuid.UUID(holiday_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid holiday ID")
    
    holiday = crud.get_holiday(session=db, holiday_id=holiday_uuid)
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return holiday


@router.put("/{holiday_id}", response_model=HolidayPublic)
def update_holiday(
    *,
    db: Session = Depends(deps.get_db),
    holiday_id: str,
    holiday_in: HolidayUpdate,
) -> Any:
    """
    Update holiday.
    """
    try:
        holiday_uuid = uuid.UUID(holiday_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid holiday ID")
    
    holiday = crud.get_holiday(session=db, holiday_id=holiday_uuid)
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    
    holiday = crud.update_holiday(session=db, db_holiday=holiday, holiday_in=holiday_in)
    return holiday


@router.delete("/{holiday_id}")
def delete_holiday(
    *,
    db: Session = Depends(deps.get_db),
    holiday_id: str,
) -> Any:
    """
    Delete holiday.
    """
    try:
        holiday_uuid = uuid.UUID(holiday_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid holiday ID")
    
    holiday = crud.get_holiday(session=db, holiday_id=holiday_uuid)
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    
    crud.delete_holiday(session=db, holiday_id=holiday_uuid)
    return {"message": "Holiday deleted successfully"}


@router.get("/calendar/{year}/{month}", response_model=CalendarView)
def get_calendar_view(
    *,
    db: Session = Depends(deps.get_db),
    year: int,
    month: int,
) -> Any:
    """
    Get calendar view for a specific month.
    """
    # Calculate start and end dates for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    # Get holidays for the month (including recurring ones)
    holidays = crud.get_holidays_for_date_range(
        session=db, 
        start_date=start_date, 
        end_date=end_date
    )
    
    # Convert to CalendarEvent format
    calendar_events = []
    for holiday in holidays:
        calendar_events.append(CalendarEvent(
            id=holiday.id,
            title=holiday.title,
            description=holiday.description,
            date=holiday.holiday_date,
            holiday_type=holiday.holiday_type,
            color=holiday.color,
            is_recurring=holiday.is_recurring,
            recurrence_pattern=holiday.recurrence_pattern
        ))
    
    return CalendarView(
        year=year,
        month=month,
        events=calendar_events,
        holidays=calendar_events
    )


@router.get("/calendar/range/")
def get_calendar_range(
    *,
    db: Session = Depends(deps.get_db),
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
) -> Any:
    """
    Get calendar events for a date range.
    """
    holidays = crud.get_holidays_for_date_range(
        session=db, 
        start_date=start_date, 
        end_date=end_date
    )
    
    calendar_events = []
    for holiday in holidays:
        calendar_events.append(CalendarEvent(
            id=holiday.id,
            title=holiday.title,
            description=holiday.description,
            date=holiday.holiday_date,
            holiday_type=holiday.holiday_type,
            color=holiday.color,
            is_recurring=holiday.is_recurring,
            recurrence_pattern=holiday.recurrence_pattern
        ))
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "events": calendar_events,
        "count": len(calendar_events)
    } 