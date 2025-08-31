from datetime import datetime, time, date
from typing import Optional
from uuid import UUID

from app.core.exceptions import AttendanceValidationException


class AttendanceValidator:
    """Validates attendance-related business rules"""
    
    @staticmethod
    def validate_attendance_time(check_in_time: datetime, check_out_time: Optional[datetime] = None) -> None:
        """Validate attendance time logic"""
        if check_out_time and check_in_time >= check_out_time:
            raise AttendanceValidationException(
                "Check-out time must be after check-in time",
                details={
                    "check_in_time": check_in_time.isoformat(),
                    "check_out_time": check_out_time.isoformat()
                }
            )
    
    @staticmethod
    def validate_work_hours(check_in_time: datetime, check_out_time: datetime, 
                          max_hours: int = 24) -> None:
        """Validate that work hours don't exceed maximum"""
        work_duration = check_out_time - check_in_time
        if work_duration.total_seconds() > max_hours * 3600:
            raise AttendanceValidationException(
                f"Work duration exceeds maximum {max_hours} hours",
                details={
                    "work_duration_hours": work_duration.total_seconds() / 3600,
                    "max_hours": max_hours
                }
            )
    
    @staticmethod
    def validate_attendance_date(attendance_date: date) -> None:
        """Validate attendance date is not in the future"""
        if attendance_date > date.today():
            raise AttendanceValidationException(
                "Attendance date cannot be in the future",
                details={"attendance_date": attendance_date.isoformat()}
            )


class EmployeeValidator:
    """Validates employee-related business rules"""
    
    @staticmethod
    def validate_employee_id(employee_id: str) -> None:
        """Validate employee ID format"""
        if not employee_id or len(employee_id.strip()) == 0:
            raise AttendanceValidationException("Employee ID cannot be empty")
        
        if len(employee_id) > 20:
            raise AttendanceValidationException(
                "Employee ID cannot exceed 20 characters",
                details={"employee_id_length": len(employee_id)}
            )
    
    @staticmethod
    def validate_cnic(cnic: str) -> None:
        """Validate CNIC format (Pakistani National ID)"""
        if not cnic or len(cnic.strip()) == 0:
            raise AttendanceValidationException("CNIC cannot be empty")
        
        # Basic CNIC format validation (XXXXX-XXXXXXX-X)
        if not (len(cnic) == 15 and cnic[5] == '-' and cnic[13] == '-'):
            raise AttendanceValidationException(
                "CNIC must be in format XXXXX-XXXXXXX-X",
                details={"cnic": cnic}
            )
    
    @staticmethod
    def validate_phone(phone: str) -> None:
        """Validate phone number format"""
        if not phone or len(phone.strip()) == 0:
            raise AttendanceValidationException("Phone number cannot be empty")
        
        # Remove spaces and special characters for validation
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        if len(clean_phone) < 10 or len(clean_phone) > 15:
            raise AttendanceValidationException(
                "Phone number must be between 10-15 digits",
                details={"phone": phone, "clean_phone": clean_phone}
            )


class DeviceValidator:
    """Validates device-related business rules"""
    
    @staticmethod
    def validate_device_ip(device_ip: str) -> None:
        """Validate device IP address format"""
        if not device_ip or len(device_ip.strip()) == 0:
            raise AttendanceValidationException("Device IP cannot be empty")
        
        # Basic IP validation
        parts = device_ip.split('.')
        if len(parts) != 4:
            raise AttendanceValidationException(
                "Invalid IP address format",
                details={"device_ip": device_ip}
            )
        
        try:
            for part in parts:
                if not 0 <= int(part) <= 255:
                    raise AttendanceValidationException(
                        "Invalid IP address range",
                        details={"device_ip": device_ip}
                    )
        except ValueError:
            raise AttendanceValidationException(
                "Invalid IP address format",
                details={"device_ip": device_ip}
            )
    
    @staticmethod
    def validate_device_port(device_port: int) -> None:
        """Validate device port number"""
        if not 1 <= device_port <= 65535:
            raise AttendanceValidationException(
                "Device port must be between 1 and 65535",
                details={"device_port": device_port}
            )


class FingerprintValidator:
    """Validates fingerprint-related business rules"""
    
    @staticmethod
    def validate_fingerprint_type(fingerprint_type: str) -> None:
        """Validate fingerprint type"""
        valid_types = ["thumb", "index", "middle", "ring", "pinky"]
        if fingerprint_type not in valid_types:
            raise AttendanceValidationException(
                f"Invalid fingerprint type. Must be one of: {', '.join(valid_types)}",
                details={"fingerprint_type": fingerprint_type}
            )
    
    @staticmethod
    def validate_fingerprint_position(position: int) -> None:
        """Validate fingerprint position"""
        if not 1 <= position <= 5:
            raise AttendanceValidationException(
                "Fingerprint position must be between 1 and 5",
                details={"position": position}
            )
    
    @staticmethod
    def validate_quality_score(quality_score: Optional[float]) -> None:
        """Validate fingerprint quality score"""
        if quality_score is not None and not 0 <= quality_score <= 100:
            raise AttendanceValidationException(
                "Quality score must be between 0 and 100",
                details={"quality_score": quality_score}
            )
