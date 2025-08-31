from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlmodel import Session, select
from sqlalchemy import extract, func, and_, or_

from app.models import Attendance, AttendanceCreate, AttendanceUpdate, Employee, ZKTecoDevice
from app.core.exceptions import (
    EmployeeNotFoundException, 
    AttendanceValidationException,
    DeviceConnectionException
)
from app.core.validators import AttendanceValidator
from app import crud


class AttendanceService:
    """Service for managing attendance operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = AttendanceValidator()
    
    def create_attendance(self, attendance_data: AttendanceCreate) -> Attendance:
        """Create a new attendance record with validation"""
        # Validate employee exists
        employee = crud.get_employee(session=self.db, employee_id=attendance_data.employee_id)
        if not employee:
            raise EmployeeNotFoundException(str(attendance_data.employee_id))
        
        # Validate attendance times
        self.validator.validate_attendance_time(
            attendance_data.check_in_time, 
            attendance_data.check_out_time
        )
        
        # Validate attendance date
        attendance_date = attendance_data.check_in_time.date()
        self.validator.validate_attendance_date(attendance_date)
        
        # Check for duplicate attendance on same date
        existing_attendance = self.get_attendance_by_date(
            employee_id=attendance_data.employee_id,
            attendance_date=attendance_date
        )
        
        if existing_attendance:
            raise AttendanceValidationException(
                f"Attendance record already exists for {attendance_date}",
                details={
                    "employee_id": str(attendance_data.employee_id),
                    "attendance_date": attendance_date.isoformat(),
                    "existing_attendance_id": str(existing_attendance.id)
                }
            )
        
        # Create attendance record
        attendance = crud.create_attendance(session=self.db, attendance_in=attendance_data)
        return attendance
    
    def update_attendance(self, attendance_id: UUID, attendance_data: AttendanceUpdate) -> Attendance:
        """Update an existing attendance record"""
        attendance = crud.get_attendance(session=self.db, attendance_id=attendance_id)
        if not attendance:
            raise AttendanceValidationException(f"Attendance record {attendance_id} not found")
        
        # Validate updated times if provided
        if attendance_data.check_out_time:
            self.validator.validate_attendance_time(
                attendance.check_in_time,
                attendance_data.check_out_time
            )
            
            # Validate work hours
            self.validator.validate_work_hours(
                attendance.check_in_time,
                attendance_data.check_out_time
            )
        
        # Update attendance
        updated_attendance = crud.update_attendance(
            session=self.db,
            db_attendance=attendance,
            attendance_in=attendance_data
        )
        return updated_attendance
    
    def get_attendance_by_date(self, employee_id: UUID, attendance_date: date) -> Optional[Attendance]:
        """Get attendance record for a specific employee and date"""
        start_of_day = datetime.combine(attendance_date, datetime.min.time())
        end_of_day = datetime.combine(attendance_date, datetime.max.time())
        
        statement = select(Attendance).where(
            and_(
                Attendance.employee_id == employee_id,
                Attendance.check_in_time >= start_of_day,
                Attendance.check_in_time <= end_of_day
            )
        )
        
        return self.db.exec(statement).first()
    
    def get_employee_attendance_summary(
        self, 
        employee_id: UUID, 
        start_date: date, 
        end_date: date
    ) -> Dict[str, Any]:
        """Get attendance summary for an employee within a date range"""
        employee = crud.get_employee(session=self.db, employee_id=employee_id)
        if not employee:
            raise EmployeeNotFoundException(str(employee_id))
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Get attendance records
        statement = select(Attendance).where(
            and_(
                Attendance.employee_id == employee_id,
                Attendance.check_in_time >= start_datetime,
                Attendance.check_in_time <= end_datetime
            )
        ).order_by(Attendance.check_in_time)
        
        attendances = self.db.exec(statement).all()
        
        # Calculate summary statistics
        total_days = len(attendances)
        present_days = len([a for a in attendances if a.status == "present"])
        absent_days = len([a for a in attendances if a.status == "absent"])
        late_days = len([a for a in attendances if a.status == "late"])
        
        total_hours = 0
        for attendance in attendances:
            if attendance.check_out_time:
                duration = attendance.check_out_time - attendance.check_in_time
                total_hours += duration.total_seconds() / 3600
        
        return {
            "employee_id": str(employee_id),
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_days": total_days,
                "present_days": present_days,
                "absent_days": absent_days,
                "late_days": late_days,
                "total_hours": round(total_hours, 2),
                "average_hours_per_day": round(total_hours / total_days, 2) if total_days > 0 else 0
            },
            "attendances": [
                {
                    "id": str(a.id),
                    "date": a.check_in_time.date().isoformat(),
                    "check_in": a.check_in_time.isoformat(),
                    "check_out": a.check_out_time.isoformat() if a.check_out_time else None,
                    "status": a.status,
                    "hours_worked": round((a.check_out_time - a.check_in_time).total_seconds() / 3600, 2) if a.check_out_time else 0
                }
                for a in attendances
            ]
        }
    
    def get_department_attendance_summary(
        self, 
        department_id: UUID, 
        attendance_date: date
    ) -> Dict[str, Any]:
        """Get attendance summary for all employees in a department on a specific date"""
        start_of_day = datetime.combine(attendance_date, datetime.min.time())
        end_of_day = datetime.combine(attendance_date, datetime.max.time())
        
        # Get all employees in department
        employees = crud.get_employees_by_department(
            session=self.db, 
            department_id=department_id
        )
        
        department_summary = {
            "department_id": str(department_id),
            "attendance_date": attendance_date.isoformat(),
            "total_employees": len(employees),
            "present_count": 0,
            "absent_count": 0,
            "late_count": 0,
            "early_leave_count": 0,
            "attendance_rate": 0.0,
            "employee_details": []
        }
        
        for employee in employees:
            attendance = self.get_attendance_by_date(
                employee_id=employee.id,
                attendance_date=attendance_date
            )
            
            status = attendance.status if attendance else "absent"
            
            if status == "present":
                department_summary["present_count"] += 1
            elif status == "absent":
                department_summary["absent_count"] += 1
            elif status == "late":
                department_summary["late_count"] += 1
            elif status == "early_leave":
                department_summary["early_leave_count"] += 1
            
            department_summary["employee_details"].append({
                "employee_id": str(employee.id),
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "employee_code": employee.employee_id,
                "status": status,
                "check_in_time": attendance.check_in_time.isoformat() if attendance else None,
                "check_out_time": attendance.check_out_time.isoformat() if attendance and attendance.check_out_time else None
            })
        
        # Calculate attendance rate
        if department_summary["total_employees"] > 0:
            department_summary["attendance_rate"] = round(
                (department_summary["present_count"] + department_summary["late_count"]) / 
                department_summary["total_employees"] * 100, 2
            )
        
        return department_summary
    
    def mark_attendance_by_fingerprint(
        self, 
        device_id: str, 
        employee_device_id: str, 
        timestamp: datetime
    ) -> Attendance:
        """Mark attendance when fingerprint is verified on device"""
        # Find employee by device ID
        employee = crud.get_employee_by_device_id(
            session=self.db, 
            device_id=employee_device_id
        )
        
        if not employee:
            raise EmployeeNotFoundException(f"Employee with device ID {employee_device_id} not found")
        
        # Get device
        device = crud.get_zkteco_device_by_device_id(
            session=self.db, 
            device_id=device_id
        )
        
        if not device:
            raise AttendanceValidationException(f"Device {device_id} not found")
        
        # Check if attendance already exists for today
        today = timestamp.date()
        existing_attendance = self.get_attendance_by_date(
            employee_id=employee.id,
            attendance_date=today
        )
        
        if existing_attendance:
            # Update check-out time if it's a check-out
            if not existing_attendance.check_out_time:
                attendance_data = AttendanceUpdate(check_out_time=timestamp)
                return self.update_attendance(existing_attendance.id, attendance_data)
            else:
                raise AttendanceValidationException(
                    f"Employee {employee.employee_id} already has complete attendance for {today}"
                )
        else:
            # Create new attendance record (check-in)
            attendance_data = AttendanceCreate(
                employee_id=employee.id,
                check_in_time=timestamp,
                device_id=device_id,
                zkteco_device_id=device.id,
                attendance_type="fingerprint",
                status="present"
            )
            return self.create_attendance(attendance_data)
