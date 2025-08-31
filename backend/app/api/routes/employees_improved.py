import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session

from app.api import deps
from app.core.exceptions import handle_attendance_exception
from app.models import (
    Employee, EmployeeCreate, EmployeePublic, EmployeeUpdate, EmployeesPublic,
    FingerprintCreate, FingerprintPublic, FingerprintsPublic,
    UserCreate
)
from app.services.employee_service import EmployeeService
from app.services.zkteco_fingerprint_service import ZKTecoFingerprintService

router = APIRouter()


@router.get("/", response_model=EmployeesPublic)
def read_employees(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    department_id: str | None = Query(None, description="Filter by department ID"),
    is_active: bool | None = Query(None, description="Filter by active status"),
) -> Any:
    """
    Retrieve employees with filtering options.
    """
    try:
        # Parse department ID if provided
        department_uuid = None
        if department_id:
            try:
                department_uuid = uuid.UUID(department_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid department ID")
        
        employee_service = EmployeeService(db)
        employees = employee_service.get_employees(
            skip=skip,
            limit=limit,
            department_id=department_uuid,
            is_active=is_active
        )
        
        return EmployeesPublic(data=employees, count=len(employees))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving employees: {str(e)}")


@router.post("/", response_model=EmployeePublic)
def create_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_in: EmployeeCreate,
) -> Any:
    """
    Create new employee with validation.
    """
    try:
        employee_service = EmployeeService(db)
        employee = employee_service.create_employee(employee_in)
        return employee
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error creating employee: {str(e)}")


@router.post("/with-account", response_model=EmployeePublic)
def create_employee_with_account(
    *,
    db: Session = Depends(deps.get_db),
    employee_in: EmployeeCreate,
    user_in: UserCreate,
) -> Any:
    """
    Create new employee with associated user account.
    """
    try:
        employee_service = EmployeeService(db)
        employee = employee_service.create_employee_with_user_account(employee_in, user_in)
        return employee
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error creating employee with account: {str(e)}")


@router.get("/{employee_id}", response_model=EmployeePublic)
def read_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Get employee by ID.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        employee_service = EmployeeService(db)
        employee = employee_service.get_employee(employee_uuid)
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return employee
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving employee: {str(e)}")


@router.get("/{employee_id}/details")
def get_employee_details(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Get employee with detailed information including fingerprints and attendance.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        employee_service = EmployeeService(db)
        details = employee_service.get_employee_with_details(employee_uuid)
        return details
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving employee details: {str(e)}")


@router.put("/{employee_id}", response_model=EmployeePublic)
def update_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    employee_in: EmployeeUpdate,
) -> Any:
    """
    Update an existing employee.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        employee_service = EmployeeService(db)
        employee = employee_service.update_employee(employee_uuid, employee_in)
        return employee
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error updating employee: {str(e)}")


@router.delete("/{employee_id}")
def deactivate_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Deactivate an employee (soft delete).
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        employee_service = EmployeeService(db)
        employee = employee_service.deactivate_employee(employee_uuid)
        
        return {
            "message": "Employee deactivated successfully",
            "employee_id": str(employee.id),
            "is_active": employee.is_active
        }
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error deactivating employee: {str(e)}")


# Fingerprint Management Routes
@router.get("/{employee_id}/fingerprints", response_model=FingerprintsPublic)
def read_employee_fingerprints(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Get all fingerprints for an employee.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        employee_service = EmployeeService(db)
        fingerprints = employee_service.get_employee_fingerprints(employee_uuid)
        
        return FingerprintsPublic(data=fingerprints, count=len(fingerprints))
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving fingerprints: {str(e)}")


@router.get("/{employee_id}/fingerprints/summary")
def get_employee_fingerprint_summary(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Get fingerprint enrollment summary for an employee.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        employee_service = EmployeeService(db)
        summary = employee_service.get_employee_fingerprint_summary(employee_uuid)
        return summary
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving fingerprint summary: {str(e)}")


@router.post("/{employee_id}/fingerprints", response_model=FingerprintPublic)
def enroll_fingerprint(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    fingerprint_in: FingerprintCreate,
) -> Any:
    """
    Enroll a fingerprint for an employee.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        # Set employee ID in fingerprint data
        fingerprint_in.employee_id = employee_uuid
        
        employee_service = EmployeeService(db)
        fingerprint = employee_service.enroll_fingerprint(employee_uuid, fingerprint_in)
        return fingerprint
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error enrolling fingerprint: {str(e)}")


@router.post("/{employee_id}/fingerprints/upload")
def upload_fingerprint_image(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    fingerprint_type: str,
    fingerprint_position: int,
    fingerprint_image: UploadFile = File(...),
) -> Any:
    """
    Upload fingerprint image and enroll it for an employee.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        # Validate file type
        if not fingerprint_image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = fingerprint_image.file.read()
        
        # Convert to base64
        import base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Create fingerprint data
        fingerprint_data = FingerprintCreate(
            employee_id=employee_uuid,
            fingerprint_type=fingerprint_type,
            fingerprint_position=fingerprint_position,
            fingerprint_data=image_base64,
            fingerprint_format="base64"
        )
        
        employee_service = EmployeeService(db)
        fingerprint = employee_service.enroll_fingerprint(employee_uuid, fingerprint_data)
        
        return {
            "message": "Fingerprint uploaded and enrolled successfully",
            "fingerprint": {
                "id": str(fingerprint.id),
                "type": fingerprint.fingerprint_type,
                "position": fingerprint.fingerprint_position,
                "quality_score": fingerprint.quality_score
            }
        }
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error uploading fingerprint: {str(e)}")


@router.post("/{employee_id}/fingerprints/zkteco-enroll")
def enroll_fingerprint_on_device(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    device_id: str,
    fingerprint_type: str,
    fingerprint_position: int,
) -> Any:
    """
    Enroll fingerprint directly on ZKTeco device for an employee.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        # Parse device ID
        try:
            device_uuid = uuid.UUID(device_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid device ID")
        
        # Use ZKTeco fingerprint service
        fingerprint_service = ZKTecoFingerprintService(db)
        result = fingerprint_service.enroll_fingerprint_on_device(
            employee_id=employee_uuid,
            device_id=device_uuid,
            fingerprint_type=fingerprint_type,
            fingerprint_position=fingerprint_position
        )
        
        return {
            "message": "Fingerprint enrollment initiated on device",
            "enrollment_id": result.get("enrollment_id"),
            "status": "pending"
        }
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error enrolling fingerprint on device: {str(e)}")


@router.get("/{employee_id}/fingerprints/zkteco-status")
def get_device_enrollment_status(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    device_id: str,
) -> Any:
    """
    Get fingerprint enrollment status on ZKTeco device for an employee.
    """
    try:
        # Parse employee ID
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        # Parse device ID
        try:
            device_uuid = uuid.UUID(device_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid device ID")
        
        # Use ZKTeco fingerprint service
        fingerprint_service = ZKTecoFingerprintService(db)
        status = fingerprint_service.get_enrollment_status(
            employee_id=employee_uuid,
            device_id=device_uuid
        )
        
        return status
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving enrollment status: {str(e)}")


@router.delete("/{employee_id}/fingerprints/{fingerprint_id}")
def delete_fingerprint(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    fingerprint_id: str,
) -> Any:
    """
    Delete a fingerprint for an employee.
    """
    try:
        # Parse IDs
        try:
            employee_uuid = uuid.UUID(employee_id)
            fingerprint_uuid = uuid.UUID(fingerprint_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
        
        employee_service = EmployeeService(db)
        success = employee_service.delete_fingerprint(employee_uuid, fingerprint_uuid)
        
        if not success:
            raise HTTPException(status_code=404, detail="Fingerprint not found")
        
        return {
            "message": "Fingerprint deleted successfully",
            "fingerprint_id": fingerprint_id
        }
        
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise handle_attendance_exception(e)
        raise HTTPException(status_code=500, detail=f"Error deleting fingerprint: {str(e)}")
