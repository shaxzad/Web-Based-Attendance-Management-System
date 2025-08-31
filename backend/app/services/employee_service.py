from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlmodel import Session, select
from sqlalchemy import and_

from app.models import (
    Employee, EmployeeCreate, EmployeeUpdate, Department, 
    Fingerprint, FingerprintCreate, User, UserCreate
)
from app.core.exceptions import (
    EmployeeNotFoundException, 
    AttendanceValidationException,
    FingerprintEnrollmentException
)
from app.core.validators import EmployeeValidator
from app import crud


class EmployeeService:
    """Service for managing employee operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = EmployeeValidator()
    
    def create_employee(self, employee_data: EmployeeCreate) -> Employee:
        """Create a new employee with validation"""
        # Validate employee data
        self.validator.validate_employee_id(employee_data.employee_id)
        self.validator.validate_cnic(employee_data.cnic)
        self.validator.validate_phone(employee_data.phone)
        
        # Check for duplicate employee ID
        existing_employee = crud.get_employee_by_employee_id(
            session=self.db, 
            employee_id=employee_data.employee_id
        )
        if existing_employee:
            raise AttendanceValidationException(
                f"Employee with ID {employee_data.employee_id} already exists",
                details={"employee_id": employee_data.employee_id}
            )
        
        # Check for duplicate CNIC
        existing_cnic = crud.get_employee_by_cnic(
            session=self.db, 
            cnic=employee_data.cnic
        )
        if existing_cnic:
            raise AttendanceValidationException(
                f"Employee with CNIC {employee_data.cnic} already exists",
                details={"cnic": employee_data.cnic}
            )
        
        # Validate department exists
        department = crud.get_department(
            session=self.db, 
            department_id=employee_data.department_id
        )
        if not department:
            raise AttendanceValidationException(
                f"Department {employee_data.department_id} not found",
                details={"department_id": str(employee_data.department_id)}
            )
        
        # Create employee
        employee = crud.create_employee(session=self.db, employee_in=employee_data)
        return employee
    
    def update_employee(self, employee_id: UUID, employee_data: EmployeeUpdate) -> Employee:
        """Update an existing employee"""
        employee = crud.get_employee(session=self.db, employee_id=employee_id)
        if not employee:
            raise EmployeeNotFoundException(str(employee_id))
        
        # Validate updated data if provided
        if employee_data.employee_id:
            self.validator.validate_employee_id(employee_data.employee_id)
            # Check for duplicate employee ID (excluding current employee)
            existing_employee = crud.get_employee_by_employee_id(
                session=self.db, 
                employee_id=employee_data.employee_id
            )
            if existing_employee and existing_employee.id != employee_id:
                raise AttendanceValidationException(
                    f"Employee with ID {employee_data.employee_id} already exists",
                    details={"employee_id": employee_data.employee_id}
                )
        
        if employee_data.cnic:
            self.validator.validate_cnic(employee_data.cnic)
            # Check for duplicate CNIC (excluding current employee)
            existing_cnic = crud.get_employee_by_cnic(
                session=self.db, 
                cnic=employee_data.cnic
            )
            if existing_cnic and existing_cnic.id != employee_id:
                raise AttendanceValidationException(
                    f"Employee with CNIC {employee_data.cnic} already exists",
                    details={"cnic": employee_data.cnic}
                )
        
        if employee_data.phone:
            self.validator.validate_phone(employee_data.phone)
        
        # Validate department if provided
        if employee_data.department_id:
            department = crud.get_department(
                session=self.db, 
                department_id=employee_data.department_id
            )
            if not department:
                raise AttendanceValidationException(
                    f"Department {employee_data.department_id} not found",
                    details={"department_id": str(employee_data.department_id)}
                )
        
        # Update employee
        updated_employee = crud.update_employee(
            session=self.db,
            db_employee=employee,
            employee_in=employee_data
        )
        return updated_employee
    
    def get_employee_with_details(self, employee_id: UUID) -> Dict[str, Any]:
        """Get employee with detailed information including fingerprints and attendance"""
        employee = crud.get_employee(session=self.db, employee_id=employee_id)
        if not employee:
            raise EmployeeNotFoundException(str(employee_id))
        
        # Get employee fingerprints
        fingerprints = crud.get_employee_fingerprints(
            session=self.db, 
            employee_id=employee_id
        )
        
        # Get recent attendance (last 30 days)
        thirty_days_ago = datetime.utcnow() - datetime.timedelta(days=30)
        recent_attendance = crud.get_employee_attendances(
            session=self.db,
            employee_id=employee_id,
            start_date=thirty_days_ago,
            limit=30
        )
        
        # Calculate attendance statistics
        total_attendance = len(recent_attendance)
        present_days = len([a for a in recent_attendance if a.status == "present"])
        absent_days = len([a for a in recent_attendance if a.status == "absent"])
        late_days = len([a for a in recent_attendance if a.status == "late"])
        
        attendance_rate = (present_days + late_days) / total_attendance * 100 if total_attendance > 0 else 0
        
        return {
            "employee": {
                "id": str(employee.id),
                "employee_id": employee.employee_id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "full_name": f"{employee.first_name} {employee.last_name}",
                "cnic": employee.cnic,
                "phone": employee.phone,
                "email": employee.user.email if employee.user else None,
                "department": {
                    "id": str(employee.department.id),
                    "name": employee.department.name
                },
                "hire_date": employee.hire_date.isoformat(),
                "salary": employee.salary,
                "is_active": employee.is_active,
                "emergency_contact": {
                    "name": employee.emergency_contact_name,
                    "phone": employee.emergency_contact_phone
                },
                "created_at": employee.created_at.isoformat(),
                "updated_at": employee.updated_at.isoformat()
            },
            "fingerprints": {
                "total_count": len(fingerprints),
                "enrolled_fingers": [
                    {
                        "type": fp.fingerprint_type,
                        "position": fp.fingerprint_position,
                        "quality_score": fp.quality_score,
                        "is_active": fp.is_active,
                        "enrolled_at": fp.created_at.isoformat()
                    }
                    for fp in fingerprints
                ]
            },
            "attendance_summary": {
                "total_days": total_attendance,
                "present_days": present_days,
                "absent_days": absent_days,
                "late_days": late_days,
                "attendance_rate": round(attendance_rate, 2)
            },
            "recent_attendance": [
                {
                    "id": str(a.id),
                    "date": a.check_in_time.date().isoformat(),
                    "check_in": a.check_in_time.isoformat(),
                    "check_out": a.check_out_time.isoformat() if a.check_out_time else None,
                    "status": a.status,
                    "device": a.device.device_name if a.device else None
                }
                for a in recent_attendance
            ]
        }
    
    def enroll_fingerprint(
        self, 
        employee_id: UUID, 
        fingerprint_data: FingerprintCreate
    ) -> Fingerprint:
        """Enroll a fingerprint for an employee"""
        # Validate employee exists
        employee = crud.get_employee(session=self.db, employee_id=employee_id)
        if not employee:
            raise EmployeeNotFoundException(str(employee_id))
        
        # Check if fingerprint already exists for this finger type and position
        existing_fingerprint = crud.get_employee_fingerprint_by_type_position(
            session=self.db,
            employee_id=employee_id,
            fingerprint_type=fingerprint_data.fingerprint_type,
            position=fingerprint_data.fingerprint_position
        )
        
        if existing_fingerprint:
            raise FingerprintEnrollmentException(
                str(employee_id),
                f"Fingerprint already enrolled for {fingerprint_data.fingerprint_type} position {fingerprint_data.fingerprint_position}"
            )
        
        # Validate fingerprint data
        if not fingerprint_data.fingerprint_data or len(fingerprint_data.fingerprint_data.strip()) == 0:
            raise FingerprintEnrollmentException(
                str(employee_id),
                "Fingerprint data cannot be empty"
            )
        
        # Create fingerprint record
        fingerprint = crud.create_fingerprint(session=self.db, fingerprint_in=fingerprint_data)
        return fingerprint
    
    def get_employee_fingerprint_summary(self, employee_id: UUID) -> Dict[str, Any]:
        """Get fingerprint enrollment summary for an employee"""
        employee = crud.get_employee(session=self.db, employee_id=employee_id)
        if not employee:
            raise EmployeeNotFoundException(str(employee_id))
        
        fingerprints = crud.get_employee_fingerprints(
            session=self.db, 
            employee_id=employee_id
        )
        
        # Group fingerprints by type
        fingerprint_summary = {
            "thumb": [],
            "index": [],
            "middle": [],
            "ring": [],
            "pinky": []
        }
        
        for fp in fingerprints:
            if fp.fingerprint_type in fingerprint_summary:
                fingerprint_summary[fp.fingerprint_type].append({
                    "position": fp.fingerprint_position,
                    "quality_score": fp.quality_score,
                    "is_active": fp.is_active,
                    "enrolled_at": fp.created_at.isoformat()
                })
        
        # Calculate statistics
        total_fingerprints = len(fingerprints)
        active_fingerprints = len([fp for fp in fingerprints if fp.is_active])
        average_quality = sum(fp.quality_score or 0 for fp in fingerprints) / total_fingerprints if total_fingerprints > 0 else 0
        
        return {
            "employee_id": str(employee_id),
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "summary": {
                "total_fingerprints": total_fingerprints,
                "active_fingerprints": active_fingerprints,
                "average_quality_score": round(average_quality, 2),
                "enrollment_complete": total_fingerprints >= 5  # Assuming 5 fingerprints is complete
            },
            "fingerprints": fingerprint_summary
        }
    
    def deactivate_employee(self, employee_id: UUID) -> Employee:
        """Deactivate an employee (soft delete)"""
        employee = crud.get_employee(session=self.db, employee_id=employee_id)
        if not employee:
            raise EmployeeNotFoundException(str(employee_id))
        
        # Deactivate employee
        employee_data = EmployeeUpdate(is_active=False)
        updated_employee = crud.update_employee(
            session=self.db,
            db_employee=employee,
            employee_in=employee_data
        )
        
        # Deactivate associated user account if exists
        if employee.user:
            user_data = {"is_active": False}
            crud.update_user(
                session=self.db,
                db_user=employee.user,
                user_in=user_data
            )
        
        return updated_employee
    
    def create_employee_with_user_account(
        self, 
        employee_data: EmployeeCreate, 
        user_data: UserCreate
    ) -> Employee:
        """Create an employee with an associated user account"""
        # Create user account first
        user = crud.create_user(session=self.db, user_create=user_data)
        
        # Create employee with user reference
        employee_data.user_id = user.id
        employee = self.create_employee(employee_data)
        
        return employee
