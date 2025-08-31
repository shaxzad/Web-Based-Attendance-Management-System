from typing import Any, Dict, Optional
from fastapi import HTTPException


class AttendanceManagementException(Exception):
    """Base exception for attendance management system"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class EmployeeNotFoundException(AttendanceManagementException):
    """Raised when an employee is not found"""
    def __init__(self, employee_id: str):
        super().__init__(
            message=f"Employee with ID {employee_id} not found",
            status_code=404,
            details={"employee_id": employee_id}
        )


class DeviceConnectionException(AttendanceManagementException):
    """Raised when there's an issue connecting to ZKTeco device"""
    def __init__(self, device_ip: str, device_port: int, error: str):
        super().__init__(
            message=f"Failed to connect to device {device_ip}:{device_port}",
            status_code=503,
            details={
                "device_ip": device_ip,
                "device_port": device_port,
                "error": error
            }
        )


class FingerprintEnrollmentException(AttendanceManagementException):
    """Raised when fingerprint enrollment fails"""
    def __init__(self, employee_id: str, error: str):
        super().__init__(
            message=f"Fingerprint enrollment failed for employee {employee_id}",
            status_code=400,
            details={"employee_id": employee_id, "error": error}
        )


class AttendanceValidationException(AttendanceManagementException):
    """Raised when attendance validation fails"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            details=details or {}
        )


class DeviceSyncException(AttendanceManagementException):
    """Raised when device synchronization fails"""
    def __init__(self, device_id: str, sync_type: str, error: str):
        super().__init__(
            message=f"Device sync failed for {device_id}",
            status_code=500,
            details={
                "device_id": device_id,
                "sync_type": sync_type,
                "error": error
            }
        )


def handle_attendance_exception(exc: AttendanceManagementException) -> HTTPException:
    """Convert custom exceptions to FastAPI HTTPException"""
    return HTTPException(
        status_code=exc.status_code,
        detail={
            "message": exc.message,
            "details": exc.details
        }
    )
