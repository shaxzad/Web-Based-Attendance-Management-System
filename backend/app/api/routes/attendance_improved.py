import uuid
from datetime import datetime, date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session

from app.api import deps
from app.core.exceptions import handle_attendance_exception
from app.models import (
    AttendanceCreate, AttendancePublic, AttendanceUpdate, AttendancesPublic,
    ZKTecoDeviceCreate, ZKTecoDevicePublic, ZKTecoDeviceUpdate, ZKTecoDevicesPublic
)
from app.services.attendance_service import AttendanceService
from app.services.device_management_service import DeviceManagementService

router = APIRouter()


@router.get("/", response_model=AttendancesPublic)
def read_attendances(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    employee_id: str | None = Query(None, description="Filter by employee ID"),
    device_id: str | None = Query(None, description="Filter by device ID"),
    start_date: str | None = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: str | None = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    status: str | None = Query(None, description="Filter by status"),
) -> Any:
    """
    Retrieve attendance records with filtering options.
    """
    try:
        # Parse UUIDs
        employee_uuid = None
        device_uuid = None
        
        if employee_id:
            try:
                employee_uuid = uuid.UUID(employee_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        if device_id:
            try:
                device_uuid = uuid.UUID(device_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid device ID")
        
        # Parse dates
        start_datetime = None
        end_datetime = None
        
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start date format")
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end date format")
        
        # Use service to get attendances
        attendance_service = AttendanceService(db)
        attendances = attendance_service.get_attendances(
            skip=skip,
            limit=limit,
            employee_id=employee_uuid,
            device_id=device_uuid,
            start_date=start_datetime,
            end_date=end_datetime,
            status=status
        )
        
        return AttendancesPublic(data=attendances, count=len(attendances))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving attendances: {str(e)}")


@router.post("/", response_model=AttendancePublic)
def create_attendance(
    *,
    db: Session = Depends(deps.get_db),
    attendance_in: AttendanceCreate,
) -> Any:
    """
    Create new attendance record with validation.
    """
    try:
        attendance_service = AttendanceService(db)
        attendance = attendance_service.create_attendance(attendance_in)
        return attendance
        
    except Exception as e:
        # Handle custom exceptions
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error creating attendance: {str(e)}")


@router.put("/{attendance_id}", response_model=AttendancePublic)
def update_attendance(
    *,
    db: Session = Depends(deps.get_db),
    attendance_id: str,
    attendance_in: AttendanceUpdate,
) -> Any:
    """
    Update an existing attendance record.
    """
    try:
        # Parse attendance ID
        try:
            attendance_uuid = uuid.UUID(attendance_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid attendance ID")
        
        attendance_service = AttendanceService(db)
        attendance = attendance_service.update_attendance(attendance_uuid, attendance_in)
        return attendance
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error updating attendance: {str(e)}")


@router.get("/{attendance_id}", response_model=AttendancePublic)
def read_attendance(
    *,
    db: Session = Depends(deps.get_db),
    attendance_id: str,
) -> Any:
    """
    Get attendance by ID.
    """
    try:
        # Parse attendance ID
        try:
            attendance_uuid = uuid.UUID(attendance_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid attendance ID")
        
        attendance_service = AttendanceService(db)
        attendance = attendance_service.get_attendance(attendance_uuid)
        
        if not attendance:
            raise HTTPException(status_code=404, detail="Attendance not found")
        
        return attendance
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving attendance: {str(e)}")


@router.get("/employee/{employee_id}/summary")
def get_employee_attendance_summary(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
) -> Any:
    """
    Get attendance summary for an employee within a date range.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        # Parse dates
        try:
            start_date_parsed = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_parsed = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
        
        attendance_service = AttendanceService(db)
        summary = attendance_service.get_employee_attendance_summary(
            employee_id=employee_uuid,
            start_date=start_date_parsed,
            end_date=end_date_parsed
        )
        
        return summary
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving attendance summary: {str(e)}")


@router.get("/department/{department_id}/summary")
def get_department_attendance_summary(
    *,
    db: Session = Depends(deps.get_db),
    department_id: str,
    attendance_date: str = Query(..., description="Attendance date (YYYY-MM-DD)"),
) -> Any:
    """
    Get attendance summary for all employees in a department on a specific date.
    """
    try:
        # Parse department ID
        try:
            department_uuid = uuid.UUID(department_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid department ID")
        
        # Parse date
        try:
            attendance_date_parsed = datetime.strptime(attendance_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
        
        attendance_service = AttendanceService(db)
        summary = attendance_service.get_department_attendance_summary(
            department_id=department_uuid,
            attendance_date=attendance_date_parsed
        )
        
        return summary
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving department summary: {str(e)}")


@router.post("/fingerprint/mark")
def mark_attendance_by_fingerprint(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
    employee_device_id: str,
    timestamp: datetime,
) -> Any:
    """
    Mark attendance when fingerprint is verified on device.
    """
    try:
        attendance_service = AttendanceService(db)
        attendance = attendance_service.mark_attendance_by_fingerprint(
            device_id=device_id,
            employee_device_id=employee_device_id,
            timestamp=timestamp
        )
        
        return {
            "message": "Attendance marked successfully",
            "attendance": {
                "id": str(attendance.id),
                "employee_id": str(attendance.employee_id),
                "check_in_time": attendance.check_in_time.isoformat(),
                "check_out_time": attendance.check_out_time.isoformat() if attendance.check_out_time else None,
                "status": attendance.status
            }
        }
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error marking attendance: {str(e)}")


# Device Management Routes
@router.get("/devices/", response_model=ZKTecoDevicesPublic)
def read_devices(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Any:
    """
    Retrieve ZKTeco devices.
    """
    try:
        device_service = DeviceManagementService(db)
        devices = device_service.get_devices(skip=skip, limit=limit)
        return ZKTecoDevicesPublic(data=devices, count=len(devices))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving devices: {str(e)}")


@router.post("/devices/", response_model=ZKTecoDevicePublic)
def create_device(
    *,
    db: Session = Depends(deps.get_db),
    device_in: ZKTecoDeviceCreate,
) -> Any:
    """
    Register a new ZKTeco device.
    """
    try:
        device_service = DeviceManagementService(db)
        device = device_service.register_device(device_in)
        return device
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error registering device: {str(e)}")


@router.get("/devices/{device_id}", response_model=ZKTecoDevicePublic)
def read_device(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Get device by ID.
    """
    try:
        # Parse device ID
        try:
            device_uuid = uuid.UUID(device_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid device ID")
        
        device_service = DeviceManagementService(db)
        device = device_service.get_device(device_uuid)
        
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return device
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving device: {str(e)}")


@router.get("/devices/{device_id}/status")
def get_device_status(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Get detailed device status and health information.
    """
    try:
        # Parse device ID
        try:
            device_uuid = uuid.UUID(device_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid device ID")
        
        device_service = DeviceManagementService(db)
        status = device_service.get_device_status(device_uuid)
        return status
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving device status: {str(e)}")


@router.post("/devices/{device_id}/sync")
def sync_device_attendance(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Sync attendance data from a ZKTeco device.
    """
    try:
        # Parse device ID
        try:
            device_uuid = uuid.UUID(device_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid device ID")
        
        device_service = DeviceManagementService(db)
        
        # Run sync in background
        background_tasks.add_task(device_service.sync_device_attendance, device_uuid)
        
        return {
            "message": "Device sync started in background",
            "device_id": device_id
        }
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error starting device sync: {str(e)}")


@router.get("/devices/health/dashboard")
def get_device_health_dashboard(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get overall device health dashboard.
    """
    try:
        device_service = DeviceManagementService(db)
        dashboard = device_service.get_device_health_dashboard()
        return dashboard
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving device dashboard: {str(e)}")
