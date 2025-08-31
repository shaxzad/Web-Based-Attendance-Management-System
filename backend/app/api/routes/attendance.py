import uuid
from datetime import datetime, date, timedelta
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session

from app import crud
from app.api import deps
from app.models import (
    Attendance, AttendanceCreate, AttendancePublic, AttendanceUpdate, AttendancesPublic,
    ZKTecoDevice, ZKTecoDeviceCreate, ZKTecoDevicePublic, ZKTecoDeviceUpdate, ZKTecoDevicesPublic,
    DeviceSyncLog
)
from app.services.zkteco_service import ZKTecoManager

router = APIRouter()


# Attendance Routes
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
    Retrieve attendance records.
    """
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
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end date format")
    
    attendances = crud.get_attendances(
        session=db,
        skip=skip,
        limit=limit,
        employee_id=employee_uuid,
        device_id=device_uuid,
        start_date=start_datetime,
        end_date=end_datetime,
        status=status
    )
    
    return AttendancesPublic(data=attendances, count=len(attendances))


@router.post("/", response_model=AttendancePublic)
def create_attendance(
    *,
    db: Session = Depends(deps.get_db),
    attendance_in: AttendanceCreate,
) -> Any:
    """
    Create new attendance record.
    """
    # Verify employee exists
    employee = crud.get_employee(session=db, employee_id=attendance_in.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Verify device exists if provided
    if attendance_in.zkteco_device_id:
        device = crud.get_zkteco_device(session=db, device_id=attendance_in.zkteco_device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
    
    attendance = crud.create_attendance(session=db, attendance_in=attendance_in)
    return attendance


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
        attendance_uuid = uuid.UUID(attendance_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid attendance ID")
    
    attendance = crud.get_attendance(session=db, attendance_id=attendance_uuid)
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance


@router.put("/{attendance_id}", response_model=AttendancePublic)
def update_attendance(
    *,
    db: Session = Depends(deps.get_db),
    attendance_id: str,
    attendance_in: AttendanceUpdate,
) -> Any:
    """
    Update attendance record.
    """
    try:
        attendance_uuid = uuid.UUID(attendance_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid attendance ID")
    
    attendance = crud.get_attendance(session=db, attendance_id=attendance_uuid)
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    attendance = crud.update_attendance(session=db, db_attendance=attendance, attendance_in=attendance_in)
    return attendance


@router.delete("/{attendance_id}")
def delete_attendance(
    *,
    db: Session = Depends(deps.get_db),
    attendance_id: str,
) -> Any:
    """
    Delete attendance record.
    """
    try:
        attendance_uuid = uuid.UUID(attendance_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid attendance ID")
    
    success = crud.delete_attendance(session=db, attendance_id=attendance_uuid)
    if not success:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return {"message": "Attendance record deleted successfully"}


@router.get("/employee/{employee_id}", response_model=AttendancesPublic)
def read_employee_attendances(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Any:
    """
    Get attendance records for a specific employee.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    # Verify employee exists
    employee = crud.get_employee(session=db, employee_id=employee_uuid)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    attendances = crud.get_employee_attendances(
        session=db, employee_id=employee_uuid, skip=skip, limit=limit
    )
    return AttendancesPublic(data=attendances, count=len(attendances))


# ZKTeco Device Routes
@router.get("/devices/", response_model=ZKTecoDevicesPublic)
def read_zkteco_devices(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: bool | None = Query(None, description="Filter by active status"),
) -> Any:
    """
    Retrieve ZKTeco devices.
    """
    devices = crud.get_zkteco_devices(session=db, skip=skip, limit=limit, is_active=is_active)
    return ZKTecoDevicesPublic(data=devices, count=len(devices))


@router.post("/devices/", response_model=ZKTecoDevicePublic)
def create_zkteco_device(
    *,
    db: Session = Depends(deps.get_db),
    device_in: ZKTecoDeviceCreate,
) -> Any:
    """
    Create new ZKTeco device.
    """
    # Check if device_id already exists
    existing_device = crud.get_zkteco_device_by_device_id(session=db, device_id=device_in.device_id)
    if existing_device:
        raise HTTPException(status_code=400, detail="Device ID already exists")
    
    device = crud.create_zkteco_device(session=db, device_in=device_in)
    return device


@router.get("/devices/{device_id}", response_model=ZKTecoDevicePublic)
def read_zkteco_device(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Get ZKTeco device by ID.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/devices/{device_id}", response_model=ZKTecoDevicePublic)
def update_zkteco_device(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
    device_in: ZKTecoDeviceUpdate,
) -> Any:
    """
    Update ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device = crud.update_zkteco_device(session=db, db_device=device, device_in=device_in)
    return device


@router.delete("/devices/{device_id}")
def delete_zkteco_device(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Delete ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    # Get device details before deletion for better error messages
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device_name = device.device_name
    device_ip = device.device_ip
    
    # Check if device is currently connected
    manager = ZKTecoManager(db)
    service = manager.get_service(device.id)
    
    # Disconnect device if connected
    if device.device_id in service.devices:
        service.disconnect_device(device.device_id)
    
    # Delete the device
    success = crud.delete_zkteco_device(session=db, device_id=device_uuid)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete device")
    
    return {
        "message": f"Device '{device_name}' ({device_ip}) deleted successfully",
        "deleted_device": {
            "name": device_name,
            "ip": device_ip,
            "id": str(device_uuid)
        }
    }


@router.delete("/devices/")
def delete_multiple_devices(
    *,
    db: Session = Depends(deps.get_db),
    device_ids: List[str],
) -> Any:
    """
    Delete multiple ZKTeco devices.
    """
    if not device_ids:
        raise HTTPException(status_code=400, detail="No device IDs provided")
    
    deleted_devices = []
    failed_deletions = []
    
    for device_id in device_ids:
        try:
            device_uuid = uuid.UUID(device_id)
            device = crud.get_zkteco_device(session=db, device_id=device_uuid)
            
            if device:
                device_name = device.device_name
                device_ip = device.device_ip
                
                # Disconnect device if connected
                manager = ZKTecoManager(db)
                service = manager.get_service(device.id)
                if device.device_id in service.devices:
                    service.disconnect_device(device.device_id)
                
                # Delete the device
                success = crud.delete_zkteco_device(session=db, device_id=device_uuid)
                if success:
                    deleted_devices.append({
                        "id": device_id,
                        "name": device_name,
                        "ip": device_ip
                    })
                else:
                    failed_deletions.append({
                        "id": device_id,
                        "error": "Failed to delete device"
                    })
            else:
                failed_deletions.append({
                    "id": device_id,
                    "error": "Device not found"
                })
                
        except ValueError:
            failed_deletions.append({
                "id": device_id,
                "error": "Invalid device ID format"
            })
        except Exception as e:
            failed_deletions.append({
                "id": device_id,
                "error": str(e)
            })
    
    return {
        "message": f"Deleted {len(deleted_devices)} devices, {len(failed_deletions)} failed",
        "deleted_devices": deleted_devices,
        "failed_deletions": failed_deletions
    }


@router.delete("/devices/cleanup/all")
def delete_all_devices(
    *,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Delete all ZKTeco devices (use with caution).
    """
    # Get all devices
    devices = crud.get_zkteco_devices(session=db)
    
    if not devices:
        return {
            "message": "No devices found to delete",
            "deleted_count": 0
        }
    
    deleted_devices = []
    failed_deletions = []
    
    for device in devices:
        try:
            device_name = device.device_name
            device_ip = device.device_ip
            
            # Disconnect device if connected
            manager = ZKTecoManager(db)
            service = manager.get_service(device.id)
            if device.device_id in service.devices:
                service.disconnect_device(device.device_id)
            
            # Delete the device
            success = crud.delete_zkteco_device(session=db, device_id=device.id)
            if success:
                deleted_devices.append({
                    "id": str(device.id),
                    "name": device_name,
                    "ip": device_ip
                })
            else:
                failed_deletions.append({
                    "id": str(device.id),
                    "name": device_name,
                    "error": "Failed to delete device"
                })
                
        except Exception as e:
            failed_deletions.append({
                "id": str(device.id),
                "name": device.device_name,
                "error": str(e)
            })
    
    return {
        "message": f"Deleted {len(deleted_devices)} devices, {len(failed_deletions)} failed",
        "deleted_count": len(deleted_devices),
        "deleted_devices": deleted_devices,
        "failed_deletions": failed_deletions
    }


# Device Management Routes
@router.post("/devices/{device_id}/connect")
def connect_device(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Connect to a ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check device status first
    if device.device_status == "offline":
        raise HTTPException(
            status_code=503, 
            detail=f"Device {device.device_name} is offline. Please check: 1) Device is powered on, 2) Ethernet cable is connected, 3) Device is in network mode"
        )
    
    manager = ZKTecoManager(db)
    service = manager.get_service(device.id)
    success = service.connect_device(device)
    
    if success:
        return {"message": f"Successfully connected to device {device.device_name}"}
    else:
        # Get the current device status to provide better error message
        device = crud.get_zkteco_device(session=db, device_id=device_uuid)
        if device.device_status == "offline":
            raise HTTPException(
                status_code=503,
                detail=f"Device {device.device_name} is not reachable. Please check: 1) Device is powered on, 2) Ethernet cable is connected, 3) Device is in network mode, 4) Network settings are correct"
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to connect to device {device.device_name}. Device may be busy or there's a communication error."
            )


@router.post("/devices/{device_id}/sync")
def sync_device_attendance(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Sync attendance records from a ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    manager = ZKTecoManager(db)
    service = manager.get_service(device.id)
    records_synced, status = service.sync_attendance_from_device(device)
    
    return {
        "message": f"Sync completed with status: {status}",
        "records_synced": records_synced,
        "status": status
    }


@router.post("/devices/sync-all")
def sync_all_devices(
    *,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Sync attendance records from all active devices.
    """
    manager = ZKTecoManager(db)
    results = manager.sync_all_devices()
    
    total_records = sum(records for records, _ in results.values())
    success_count = sum(1 for _, status in results.values() if status == "success")
    
    return {
        "message": f"Sync completed for {len(results)} devices",
        "total_records_synced": total_records,
        "successful_syncs": success_count,
        "device_results": results
    }


@router.get("/devices/{device_id}/status")
def get_device_status(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Check the current status of a ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check network connectivity
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    result = sock.connect_ex((device.device_ip, device.device_port))
    sock.close()
    
    network_status = "online" if result == 0 else "offline"
    
    return {
        "device_name": device.device_name,
        "device_ip": device.device_ip,
        "device_port": device.device_port,
        "database_status": device.device_status,
        "network_status": network_status,
        "last_sync": device.last_sync,
        "is_active": device.is_active,
        "network_error_code": result if result != 0 else None,
        "troubleshooting_tips": get_troubleshooting_tips(result)
    }


def get_troubleshooting_tips(error_code: int) -> list:
    """Get troubleshooting tips based on error code"""
    tips = []
    
    if error_code == 65:
        tips = [
            "Check if the device is powered on",
            "Verify the Ethernet cable is properly connected",
            "Try a different Ethernet cable",
            "Check if the device's network port has activity lights"
        ]
    elif error_code == 111:
        tips = [
            "Ensure the device is in Network Mode (not USB Mode)",
            "Check device network settings",
            "Try resetting the device to factory defaults"
        ]
    elif error_code == 113:
        tips = [
            "Check network routing configuration",
            "Verify switch/router is working properly",
            "Try connecting the device directly to your computer"
        ]
    else:
        tips = [
            "Check device power and connections",
            "Verify device is in network mode",
            "Check network settings",
            "Try connecting from a different computer"
        ]
    
    return tips


@router.get("/devices/{device_id}/info")
def get_device_info(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Get detailed information about a ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    manager = ZKTecoManager(db)
    service = manager.get_service(device.id)
    info = service.get_device_info(device)
    
    return info


@router.post("/devices/{device_id}/restart")
def restart_device(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Restart a ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    manager = ZKTecoManager(db)
    service = manager.get_service(device.id)
    success = service.restart_device(device)
    
    if success:
        return {"message": f"Device {device.device_name} restarted successfully"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to restart device {device.device_name}")


@router.post("/devices/{device_id}/clear-attendance")
def clear_device_attendance(
    *,
    db: Session = Depends(deps.get_db),
    device_id: str,
) -> Any:
    """
    Clear attendance records from a ZKTeco device.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    manager = ZKTecoManager(db)
    service = manager.get_service(device.id)
    success = service.clear_device_attendance(device)
    
    if success:
        return {"message": f"Attendance records cleared from device {device.device_name}"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to clear attendance from device {device.device_name}")


# Reporting Routes
@router.get("/reports/daily")
def get_daily_attendance_report(
    *,
    db: Session = Depends(deps.get_db),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    department_id: str | None = Query(None, description="Filter by department ID"),
) -> Any:
    """
    Get daily attendance report.
    """
    try:
        report_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    start_date = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=1) - timedelta(seconds=1)
    
    # Get all employees
    employees = crud.get_employees(session=db)
    if department_id:
        try:
            dept_uuid = uuid.UUID(department_id)
            employees = [e for e in employees if e.department_id == dept_uuid]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid department ID")
    
    report_data = []
    for employee in employees:
        # Get attendance for this employee on the specified date
        attendances = crud.get_attendances(
            session=db,
            employee_id=employee.id,
            start_date=start_date,
            end_date=end_date
        )
        
        check_in = None
        check_out = None
        status = "absent"
        
        if attendances:
            # Get first check-in and last check-out
            check_ins = [a for a in attendances if a.check_out_time is None]
            check_outs = [a for a in attendances if a.check_out_time is not None]
            
            if check_ins:
                check_in = min(check_ins, key=lambda x: x.check_in_time).check_in_time
            if check_outs:
                check_out = max(check_outs, key=lambda x: x.check_out_time).check_out_time
            
            if check_in:
                status = "present"
        
        report_data.append({
            "employee_id": employee.employee_id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "department": employee.department.name,
            "check_in": check_in.isoformat() if check_in else None,
            "check_out": check_out.isoformat() if check_out else None,
            "status": status,
            "total_hours": None  # Calculate if needed
        })
    
    return {
        "date": date,
        "total_employees": len(report_data),
        "present_count": sum(1 for r in report_data if r["status"] == "present"),
        "absent_count": sum(1 for r in report_data if r["status"] == "absent"),
        "attendance_data": report_data
    }


@router.get("/reports/monthly")
def get_monthly_attendance_report(
    *,
    db: Session = Depends(deps.get_db),
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month (1-12)"),
    department_id: str | None = Query(None, description="Filter by department ID"),
) -> Any:
    """
    Get monthly attendance report.
    """
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Invalid month")
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)
    
    # Get all employees
    employees = crud.get_employees(session=db)
    if department_id:
        try:
            dept_uuid = uuid.UUID(department_id)
            employees = [e for e in employees if e.department_id == dept_uuid]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid department ID")
    
    report_data = []
    for employee in employees:
        # Get all attendance records for this employee in the month
        attendances = crud.get_attendances(
            session=db,
            employee_id=employee.id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Calculate attendance statistics
        present_days = 0
        absent_days = 0
        total_hours = 0
        
        # Group by date
        attendance_by_date = {}
        for attendance in attendances:
            date_key = attendance.check_in_time.date()
            if date_key not in attendance_by_date:
                attendance_by_date[date_key] = []
            attendance_by_date[date_key].append(attendance)
        
        for date_key, day_attendances in attendance_by_date.items():
            if day_attendances:
                present_days += 1
                # Calculate hours worked for this day
                check_ins = [a for a in day_attendances if a.check_out_time is None]
                check_outs = [a for a in day_attendances if a.check_out_time is not None]
                
                if check_ins and check_outs:
                    first_check_in = min(check_ins, key=lambda x: x.check_in_time).check_in_time
                    last_check_out = max(check_outs, key=lambda x: x.check_out_time).check_out_time
                    hours_worked = (last_check_out - first_check_in).total_seconds() / 3600
                    total_hours += hours_worked
        
        # Calculate absent days (working days - present days)
        # This is a simplified calculation - you might want to consider holidays
        working_days = 22  # Approximate working days per month
        absent_days = max(0, working_days - present_days)
        
        report_data.append({
            "employee_id": employee.employee_id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "department": employee.department.name,
            "present_days": present_days,
            "absent_days": absent_days,
            "total_hours": round(total_hours, 2),
            "attendance_percentage": round((present_days / working_days) * 100, 2) if working_days > 0 else 0
        })
    
    return {
        "year": year,
        "month": month,
        "total_employees": len(report_data),
        "average_attendance_percentage": round(
            sum(r["attendance_percentage"] for r in report_data) / len(report_data), 2
        ) if report_data else 0,
        "employee_data": report_data
    } 