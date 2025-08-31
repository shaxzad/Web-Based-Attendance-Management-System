import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from uuid import UUID

from sqlmodel import Session, select
from sqlalchemy import and_, or_

from app.models import (
    ZKTecoDevice, ZKTecoDeviceCreate, ZKTecoDeviceUpdate, 
    DeviceSyncLog, DeviceSyncLogBase, Employee, Attendance
)
from app.core.exceptions import (
    DeviceConnectionException, 
    AttendanceValidationException
)
from app.core.validators import DeviceValidator
from app.services.zkteco_service import ZKTecoService
from app import crud

logger = logging.getLogger(__name__)


class DeviceManagementService:
    """Service for managing ZKTeco devices and their operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = DeviceValidator()
        self.zkteco_service = ZKTecoService(db)
    
    def register_device(self, device_data: ZKTecoDeviceCreate) -> ZKTecoDevice:
        """Register a new ZKTeco device"""
        # Validate device data
        self.validator.validate_device_ip(device_data.device_ip)
        self.validator.validate_device_port(device_data.device_port)
        
        # Check for duplicate device ID
        existing_device = crud.get_zkteco_device_by_device_id(
            session=self.db, 
            device_id=device_data.device_id
        )
        if existing_device:
            raise AttendanceValidationException(
                f"Device with ID {device_data.device_id} already exists",
                details={"device_id": device_data.device_id}
            )
        
        # Check for duplicate IP address
        existing_ip = crud.get_zkteco_device_by_ip(
            session=self.db, 
            device_ip=device_data.device_ip
        )
        if existing_ip:
            raise AttendanceValidationException(
                f"Device with IP {device_data.device_ip} already exists",
                details={"device_ip": device_data.device_ip}
            )
        
        # Test device connectivity
        test_device = ZKTecoDevice(
            device_ip=device_data.device_ip,
            device_port=device_data.device_port,
            device_id=device_data.device_id
        )
        
        if not self.zkteco_service.connect_device(test_device):
            raise DeviceConnectionException(
                device_data.device_ip,
                device_data.device_port,
                "Device connectivity test failed during registration"
            )
        
        # Disconnect test connection
        self.zkteco_service.disconnect_device(device_data.device_id)
        
        # Create device record
        device = crud.create_zkteco_device(session=self.db, device_in=device_data)
        return device
    
    def update_device(self, device_id: UUID, device_data: ZKTecoDeviceUpdate) -> ZKTecoDevice:
        """Update an existing device"""
        device = crud.get_zkteco_device(session=self.db, device_id=device_id)
        if not device:
            raise AttendanceValidationException(f"Device {device_id} not found")
        
        # Validate updated data if provided
        if device_data.device_ip:
            self.validator.validate_device_ip(device_data.device_ip)
            # Check for duplicate IP (excluding current device)
            existing_ip = crud.get_zkteco_device_by_ip(
                session=self.db, 
                device_ip=device_data.device_ip
            )
            if existing_ip and existing_ip.id != device_id:
                raise AttendanceValidationException(
                    f"Device with IP {device_data.device_ip} already exists",
                    details={"device_ip": device_data.device_ip}
                )
        
        if device_data.device_port:
            self.validator.validate_device_port(device_data.device_port)
        
        # Update device
        updated_device = crud.update_zkteco_device(
            session=self.db,
            db_device=device,
            device_in=device_data
        )
        return updated_device
    
    def get_device_status(self, device_id: UUID) -> Dict[str, Any]:
        """Get detailed device status and health information"""
        device = crud.get_zkteco_device(session=self.db, device_id=device_id)
        if not device:
            raise AttendanceValidationException(f"Device {device_id} not found")
        
        # Test device connectivity
        is_connected = self.zkteco_service.connect_device(device)
        
        # Get recent sync logs
        recent_logs = crud.get_device_sync_logs(
            session=self.db,
            device_id=device_id,
            limit=10
        )
        
        # Get device statistics
        total_employees = crud.get_employees_count(session=self.db)
        enrolled_employees = crud.get_employees_with_fingerprints_count(session=self.db)
        
        # Get recent attendance from this device
        recent_attendance = crud.get_device_attendances(
            session=self.db,
            device_id=device_id,
            limit=50
        )
        
        return {
            "device": {
                "id": str(device.id),
                "device_id": device.device_id,
                "device_name": device.device_name,
                "device_ip": device.device_ip,
                "device_port": device.device_port,
                "location": device.location,
                "description": device.description,
                "is_active": device.is_active,
                "device_status": device.device_status,
                "sync_interval": device.sync_interval,
                "last_sync": device.last_sync.isoformat() if device.last_sync else None,
                "created_at": device.created_at.isoformat(),
                "updated_at": device.updated_at.isoformat()
            },
            "connectivity": {
                "is_connected": is_connected,
                "last_connection_test": datetime.utcnow().isoformat()
            },
            "statistics": {
                "total_employees": total_employees,
                "enrolled_employees": enrolled_employees,
                "enrollment_rate": round(enrolled_employees / total_employees * 100, 2) if total_employees > 0 else 0,
                "recent_attendance_count": len(recent_attendance)
            },
            "recent_sync_logs": [
                {
                    "id": str(log.id),
                    "sync_type": log.sync_type,
                    "records_synced": log.records_synced,
                    "sync_status": log.sync_status,
                    "error_message": log.error_message,
                    "sync_duration": log.sync_duration,
                    "created_at": log.created_at.isoformat()
                }
                for log in recent_logs
            ],
            "recent_attendance": [
                {
                    "id": str(a.id),
                    "employee_name": f"{a.employee.first_name} {a.employee.last_name}",
                    "check_in_time": a.check_in_time.isoformat(),
                    "check_out_time": a.check_out_time.isoformat() if a.check_out_time else None,
                    "status": a.status
                }
                for a in recent_attendance
            ]
        }
    
    def sync_device_attendance(self, device_id: UUID) -> Dict[str, Any]:
        """Sync attendance data from a ZKTeco device"""
        device = crud.get_zkteco_device(session=self.db, device_id=device_id)
        if not device:
            raise AttendanceValidationException(f"Device {device_id} not found")
        
        sync_start_time = datetime.utcnow()
        sync_log = DeviceSyncLogBase(
            device_id=device_id,
            sync_type="attendance",
            sync_status="in_progress"
        )
        
        try:
            # Connect to device
            if not self.zkteco_service.connect_device(device):
                raise DeviceConnectionException(
                    device.device_ip,
                    device.device_port,
                    "Failed to connect to device for attendance sync"
                )
            
            # Get attendance data from device
            attendance_data = self.zkteco_service.get_attendance_data(device.device_id)
            
            # Process and store attendance records
            synced_records = 0
            for record in attendance_data:
                try:
                    # Find employee by device user ID
                    employee = crud.get_employee_by_device_id(
                        session=self.db,
                        device_id=record.get('user_id')
                    )
                    
                    if employee:
                        # Check if attendance already exists
                        existing_attendance = self._get_attendance_by_device_record(
                            employee_id=employee.id,
                            device_timestamp=record.get('timestamp'),
                            device_id=device.device_id
                        )
                        
                        if not existing_attendance:
                            # Create new attendance record
                            attendance_create = {
                                "employee_id": employee.id,
                                "check_in_time": record.get('timestamp'),
                                "device_id": device.device_id,
                                "zkteco_device_id": device.id,
                                "attendance_type": "fingerprint",
                                "status": "present"
                            }
                            
                            crud.create_attendance(
                                session=self.db,
                                attendance_in=attendance_create
                            )
                            synced_records += 1
                
                except Exception as e:
                    logger.error(f"Error processing attendance record: {e}")
                    continue
            
            # Update device last sync time
            device.last_sync = datetime.utcnow()
            device.device_status = "online"
            self.db.add(device)
            self.db.commit()
            
            # Log successful sync
            sync_duration = (datetime.utcnow() - sync_start_time).total_seconds()
            sync_log.records_synced = synced_records
            sync_log.sync_status = "success"
            sync_log.sync_duration = sync_duration
            
            crud.create_device_sync_log(session=self.db, sync_log=sync_log)
            
            return {
                "device_id": str(device_id),
                "sync_status": "success",
                "records_synced": synced_records,
                "sync_duration": sync_duration,
                "last_sync": device.last_sync.isoformat()
            }
            
        except Exception as e:
            # Log failed sync
            sync_duration = (datetime.utcnow() - sync_start_time).total_seconds()
            sync_log.sync_status = "failed"
            sync_log.error_message = str(e)
            sync_log.sync_duration = sync_duration
            
            crud.create_device_sync_log(session=self.db, sync_log=sync_log)
            
            # Update device status
            device.device_status = "error"
            self.db.add(device)
            self.db.commit()
            
            raise DeviceConnectionException(
                device.device_ip,
                device.device_port,
                f"Attendance sync failed: {str(e)}"
            )
        
        finally:
            # Disconnect from device
            self.zkteco_service.disconnect_device(device.device_id)
    
    def get_device_health_dashboard(self) -> Dict[str, Any]:
        """Get overall device health dashboard"""
        # Get all devices
        devices = crud.get_zkteco_devices(session=self.db)
        
        # Calculate device statistics
        total_devices = len(devices)
        online_devices = len([d for d in devices if d.device_status == "online"])
        offline_devices = len([d for d in devices if d.device_status == "offline"])
        error_devices = len([d for d in devices if d.device_status == "error"])
        
        # Get recent sync activity
        recent_syncs = crud.get_recent_device_sync_logs(
            session=self.db,
            limit=20
        )
        
        # Get devices that need attention
        devices_needing_attention = []
        for device in devices:
            if device.device_status != "online":
                devices_needing_attention.append({
                    "id": str(device.id),
                    "device_name": device.device_name,
                    "device_ip": device.device_ip,
                    "status": device.device_status,
                    "last_sync": device.last_sync.isoformat() if device.last_sync else None
                })
        
        return {
            "overview": {
                "total_devices": total_devices,
                "online_devices": online_devices,
                "offline_devices": offline_devices,
                "error_devices": error_devices,
                "health_percentage": round(online_devices / total_devices * 100, 2) if total_devices > 0 else 0
            },
            "devices_needing_attention": devices_needing_attention,
            "recent_sync_activity": [
                {
                    "device_name": log.device.device_name,
                    "sync_type": log.sync_type,
                    "sync_status": log.sync_status,
                    "records_synced": log.records_synced,
                    "created_at": log.created_at.isoformat()
                }
                for log in recent_syncs
            ]
        }
    
    def _get_attendance_by_device_record(
        self, 
        employee_id: UUID, 
        device_timestamp: datetime, 
        device_id: str
    ) -> Optional[Attendance]:
        """Get existing attendance record by device timestamp"""
        # Look for attendance within a 5-minute window of the device timestamp
        time_window = timedelta(minutes=5)
        start_time = device_timestamp - time_window
        end_time = device_timestamp + time_window
        
        statement = select(Attendance).where(
            and_(
                Attendance.employee_id == employee_id,
                Attendance.device_id == device_id,
                Attendance.check_in_time >= start_time,
                Attendance.check_in_time <= end_time
            )
        )
        
        return self.db.exec(statement).first()
