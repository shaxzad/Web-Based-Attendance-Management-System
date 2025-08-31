import asyncio
import logging
import socket
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from uuid import UUID

import zk
from sqlmodel import Session, select

from app.models import Attendance, AttendanceCreate, Employee, ZKTecoDevice, DeviceSyncLog

logger = logging.getLogger(__name__)


class ZKTecoService:
    """Service for managing ZKTeco fingerprint devices"""
    
    def __init__(self, db: Session):
        self.db = db
        self.devices: Dict[str, zk.ZK] = {}
        self.device_connections: Dict[str, bool] = {}
    
    def connect_device(self, device: ZKTecoDevice) -> bool:
        """Connect to a ZKTeco device"""
        try:
            # First, test basic network connectivity
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((device.device_ip, device.device_port))
            sock.close()
            
            if result != 0:
                # Network connectivity failed
                device.device_status = "offline"
                self.db.add(device)
                self.db.commit()
                
                error_msg = f"Network connectivity failed to {device.device_ip}:{device.device_port}"
                if result == 65:
                    error_msg += " (No route to host - check device power and network cable)"
                elif result == 111:
                    error_msg += " (Connection refused - device may not be in network mode)"
                elif result == 113:
                    error_msg += " (No route to host - check network configuration)"
                else:
                    error_msg += f" (Error code: {result})"
                
                logger.error(f"Error connecting to device {device.device_name}: {error_msg}")
                return False
            
            # Network connectivity OK, try ZK connection
            zk_instance = zk.ZK(device.device_ip, device.device_port, timeout=10)
            
            # Test connection
            if zk_instance.connect():
                self.devices[device.device_id] = zk_instance
                self.device_connections[device.device_id] = True
                
                # Update device status
                device.device_status = "online"
                device.last_sync = datetime.utcnow()
                self.db.add(device)
                self.db.commit()
                
                logger.info(f"Successfully connected to device {device.device_name} at {device.device_ip}")
                return True
            else:
                device.device_status = "error"
                self.db.add(device)
                self.db.commit()
                logger.error(f"Failed to connect to device {device.device_name} at {device.device_ip}")
                return False
                
        except Exception as e:
            device.device_status = "error"
            self.db.add(device)
            self.db.commit()
            
            error_msg = str(e)
            if "can't reach device" in error_msg.lower():
                error_msg = f"Device {device.device_ip} is not reachable. Please check: 1) Device is powered on, 2) Ethernet cable is connected, 3) Device is in network mode, 4) Network settings are correct"
            elif "timeout" in error_msg.lower():
                error_msg = f"Connection to device {device.device_ip} timed out. Device may be busy or network is slow"
            elif "connection refused" in error_msg.lower():
                error_msg = f"Connection refused by device {device.device_ip}. Device may not be in network mode or wrong port"
            
            logger.error(f"Error connecting to device {device.device_name}: {error_msg}")
            return False
    
    def disconnect_device(self, device_id: str) -> bool:
        """Disconnect from a ZKTeco device"""
        try:
            if device_id in self.devices:
                zk_instance = self.devices[device_id]
                zk_instance.disconnect()
                del self.devices[device_id]
                self.device_connections[device_id] = False
                logger.info(f"Disconnected from device {device_id}")
                return True
        except Exception as e:
            logger.error(f"Error disconnecting from device {device_id}: {str(e)}")
        return False
    
    def get_device_attendance(self, device: ZKTecoDevice, start_date: datetime = None, end_date: datetime = None) -> List[Dict]:
        """Get attendance records from a ZKTeco device"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return []
        
        try:
            zk_instance = self.devices[device.device_id]
            
            # Get attendance records
            attendance_data = zk_instance.get_attendance()
            
            if not attendance_data:
                logger.info(f"No attendance data found for device {device.device_name}")
                return []
            
            # Filter by date range if provided
            filtered_data = []
            for record in attendance_data:
                timestamp = record.timestamp
                if timestamp:
                    if start_date and timestamp < start_date:
                        continue
                    if end_date and timestamp > end_date:
                        continue
                    filtered_data.append({
                        'user_id': record.user_id,
                        'timestamp': timestamp,
                        'status': record.status
                    })
            
            logger.info(f"Retrieved {len(filtered_data)} attendance records from device {device.device_name}")
            return filtered_data
            
        except Exception as e:
            logger.error(f"Error getting attendance from device {device.device_name}: {str(e)}")
            device.device_status = "error"
            self.db.add(device)
            self.db.commit()
            return []
    
    def sync_attendance_from_device(self, device: ZKTecoDevice) -> Tuple[int, str]:
        """Sync attendance records from a device to the database"""
        start_time = time.time()
        records_synced = 0
        sync_status = "success"
        error_message = None
        
        try:
            # Get last sync time or default to 24 hours ago
            last_sync = device.last_sync or (datetime.utcnow() - timedelta(hours=24))
            
            # Get attendance from device
            attendance_data = self.get_device_attendance(device, start_date=last_sync)
            
            if not attendance_data:
                return 0, "success"
            
            # Process each attendance record
            for record in attendance_data:
                try:
                    # Extract data from device record
                    user_id = record.get('user_id')
                    timestamp = record.get('timestamp')
                    status = record.get('status', 1)  # 1=check-in, 0=check-out
                    
                    if not user_id or not timestamp:
                        continue
                    
                    # Find employee by device user ID (assuming employee_id matches device user_id)
                    employee = self.db.exec(
                        select(Employee).where(Employee.employee_id == str(user_id))
                    ).first()
                    
                    if not employee:
                        logger.warning(f"Employee not found for device user ID: {user_id}")
                        continue
                    
                    # Check if attendance record already exists for this employee and time
                    existing_attendance = self.db.exec(
                        select(Attendance)
                        .where(Attendance.employee_id == employee.id)
                        .where(Attendance.check_in_time == timestamp)
                        .where(Attendance.zkteco_device_id == device.id)
                    ).first()
                    
                    if existing_attendance:
                        continue
                    
                    # Create new attendance record
                    if status == 1:  # Check-in
                        attendance_in = AttendanceCreate(
                            employee_id=employee.id,
                            check_in_time=timestamp,
                            device_id=device.device_id,
                            zkteco_device_id=device.id,
                            attendance_type="fingerprint",
                            status="present"
                        )
                    else:  # Check-out
                        # Find existing check-in record for today
                        today_start = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
                        today_end = today_start + timedelta(days=1)
                        
                        existing_checkin = self.db.exec(
                            select(Attendance)
                            .where(Attendance.employee_id == employee.id)
                            .where(Attendance.check_in_time >= today_start)
                            .where(Attendance.check_in_time < today_end)
                            .where(Attendance.check_out_time.is_(None))
                            .where(Attendance.zkteco_device_id == device.id)
                        ).first()
                        
                        if existing_checkin:
                            # Update existing check-in with check-out time
                            existing_checkin.check_out_time = timestamp
                            self.db.add(existing_checkin)
                        else:
                            # Create new record with check-out only
                            attendance_in = AttendanceCreate(
                                employee_id=employee.id,
                                check_in_time=timestamp,
                                check_out_time=timestamp,
                                device_id=device.device_id,
                                zkteco_device_id=device.id,
                                attendance_type="fingerprint",
                                status="present"
                            )
                            attendance = Attendance.model_validate(attendance_in)
                            self.db.add(attendance)
                    
                    records_synced += 1
                    
                except Exception as e:
                    logger.error(f"Error processing attendance record: {str(e)}")
                    continue
            
            # Commit all changes
            self.db.commit()
            
            # Update device sync time
            device.last_sync = datetime.utcnow()
            device.device_status = "online"
            self.db.add(device)
            self.db.commit()
            
            sync_duration = time.time() - start_time
            
            # Log sync operation
            sync_log = DeviceSyncLog(
                device_id=device.id,
                sync_type="attendance",
                records_synced=records_synced,
                sync_status=sync_status,
                error_message=error_message,
                sync_duration=sync_duration
            )
            self.db.add(sync_log)
            self.db.commit()
            
            logger.info(f"Successfully synced {records_synced} attendance records from device {device.device_name}")
            return records_synced, sync_status
            
        except Exception as e:
            sync_duration = time.time() - start_time
            sync_status = "failed"
            error_message = str(e)
            
            # Log failed sync
            sync_log = DeviceSyncLog(
                device_id=device.id,
                sync_type="attendance",
                records_synced=records_synced,
                sync_status=sync_status,
                error_message=error_message,
                sync_duration=sync_duration
            )
            self.db.add(sync_log)
            self.db.commit()
            
            logger.error(f"Error syncing attendance from device {device.device_name}: {str(e)}")
            return records_synced, sync_status
    
    def upload_users_to_device(self, device: ZKTecoDevice, employees: List[Employee]) -> Tuple[int, str]:
        """Upload employee data to ZKTeco device"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return 0, "failed"
        
        try:
            zk_instance = self.devices[device.device_id]
            users_uploaded = 0
            
            for employee in employees:
                try:
                    # Upload user to device
                    success = zk_instance.set_user(
                        uid=int(employee.employee_id),
                        name=f"{employee.first_name} {employee.last_name}",
                        privilege=0,  # Normal user
                        password="",
                        group="",
                        user_id=employee.employee_id,
                        card=0
                    )
                    
                    if success:
                        users_uploaded += 1
                        logger.info(f"Uploaded user {employee.employee_id} to device {device.device_name}")
                    else:
                        logger.warning(f"Failed to upload user {employee.employee_id} to device {device.device_name}")
                        
                except Exception as e:
                    logger.error(f"Error uploading user {employee.employee_id}: {str(e)}")
                    continue
            
            return users_uploaded, "success"
            
        except Exception as e:
            logger.error(f"Error uploading users to device {device.device_name}: {str(e)}")
            return 0, "failed"
    
    def get_device_info(self, device: ZKTecoDevice) -> Dict:
        """Get device information"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return {}
        
        try:
            zk_instance = self.devices[device.device_id]
            
            info = {
                "device_name": device.device_name,
                "device_ip": device.device_ip,
                "device_id": device.device_id,
                "status": "online",
                "firmware_version": zk_instance.get_firmware_version(),
                "serial_number": zk_instance.get_serial_number(),
                "platform": zk_instance.get_platform(),
                "fingerprint_algorithm": zk_instance.get_fp_version(),
                "face_algorithm": zk_instance.get_face_version(),
                "device_name": zk_instance.get_device_name(),
                "work_code": zk_instance.get_work_code(),
                "users_count": len(zk_instance.get_users()),
                "attendance_count": len(zk_instance.get_attendance())
            }
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting device info for {device.device_name}: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def clear_device_attendance(self, device: ZKTecoDevice) -> bool:
        """Clear attendance records from device"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return False
        
        try:
            zk_instance = self.devices[device.device_id]
            success = zk_instance.clear_attendance()
            
            if success:
                logger.info(f"Cleared attendance records from device {device.device_name}")
                return True
            else:
                logger.error(f"Failed to clear attendance records from device {device.device_name}")
                return False
                
        except Exception as e:
            logger.error(f"Error clearing attendance from device {device.device_name}: {str(e)}")
            return False
    
    def restart_device(self, device: ZKTecoDevice) -> bool:
        """Restart ZKTeco device"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return False
        
        try:
            zk_instance = self.devices[device.device_id]
            success = zk_instance.restart()
            
            if success:
                logger.info(f"Restarted device {device.device_name}")
                # Disconnect after restart
                self.disconnect_device(device.device_id)
                return True
            else:
                logger.error(f"Failed to restart device {device.device_name}")
                return False
                
        except Exception as e:
            logger.error(f"Error restarting device {device.device_name}: {str(e)}")
            return False
    
    def close_all_connections(self):
        """Close all device connections"""
        for device_id in list(self.devices.keys()):
            self.disconnect_device(device_id)
        logger.info("Closed all device connections")


class ZKTecoManager:
    """Manager class for handling multiple ZKTeco devices"""
    
    def __init__(self, db: Session):
        self.db = db
        self.services: Dict[UUID, ZKTecoService] = {}
    
    def get_service(self, device_id: UUID) -> ZKTecoService:
        """Get or create ZKTeco service for a device"""
        if device_id not in self.services:
            self.services[device_id] = ZKTecoService(self.db)
        return self.services[device_id]
    
    def sync_all_devices(self) -> Dict[str, Tuple[int, str]]:
        """Sync all active devices"""
        results = {}
        
        # Get all active devices
        devices = self.db.exec(
            select(ZKTecoDevice).where(ZKTecoDevice.is_active == True)
        ).all()
        
        for device in devices:
            service = self.get_service(device.id)
            records_synced, status = service.sync_attendance_from_device(device)
            results[device.device_name] = (records_synced, status)
        
        return results
    
    def check_device_status(self, device: ZKTecoDevice) -> str:
        """Check if device is online"""
        try:
            # Test TCP connection
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((device.device_ip, device.device_port))
            sock.close()
            
            if result == 0:
                return "online"
            else:
                return "offline"
        except Exception:
            return "offline"
    
    def update_all_device_statuses(self):
        """Update status of all devices"""
        devices = self.db.exec(select(ZKTecoDevice)).all()
        
        for device in devices:
            status = self.check_device_status(device)
            if device.device_status != status:
                device.device_status = status
                self.db.add(device)
        
        self.db.commit()
    
    def close_all_services(self):
        """Close all device services"""
        for service in self.services.values():
            service.close_all_connections()
        self.services.clear() 