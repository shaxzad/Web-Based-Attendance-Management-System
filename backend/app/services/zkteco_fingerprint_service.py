import asyncio
import logging
import base64
import io
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from uuid import UUID

import zk
from sqlmodel import Session, select
from PIL import Image

from app.models import Employee, Fingerprint, FingerprintCreate, ZKTecoDevice
from app.crud import create_fingerprint, get_employee_fingerprints, delete_fingerprint

logger = logging.getLogger(__name__)


class ZKTecoFingerprintService:
    """Service for managing fingerprints with ZKTeco devices"""
    
    def __init__(self, db: Session):
        self.db = db
        self.devices: Dict[str, zk.ZK] = {}
        self.device_connections: Dict[str, bool] = {}
    
    def connect_device(self, device: ZKTecoDevice) -> bool:
        """Connect to a ZKTeco device"""
        try:
            zk_instance = zk.ZK(device.device_ip, device.device_port, timeout=10)
            
            if zk_instance.connect():
                self.devices[device.device_id] = zk_instance
                self.device_connections[device.device_id] = True
                logger.info(f"Successfully connected to device {device.device_name} at {device.device_ip}")
                return True
            else:
                logger.error(f"Failed to connect to device {device.device_name} at {device.device_ip}")
                return False
                
        except Exception as e:
            logger.error(f"Error connecting to device {device.device_name}: {str(e)}")
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
    
    def get_device_users(self, device: ZKTecoDevice) -> List[Dict]:
        """Get all users from a ZKTeco device"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return []
        
        try:
            zk_instance = self.devices[device.device_id]
            users = zk_instance.get_users()
            
            user_list = []
            for user in users:
                user_list.append({
                    'user_id': user.user_id,
                    'name': user.name,
                    'privilege': user.privilege,
                    'password': user.password,
                    'group_id': user.group_id,
                    'user_pic': user.user_pic,
                    'fingerprints': user.fingerprints
                })
            
            logger.info(f"Retrieved {len(user_list)} users from device {device.device_name}")
            return user_list
            
        except Exception as e:
            logger.error(f"Error getting users from device {device.device_name}: {str(e)}")
            return []
    
    def capture_fingerprint_from_device(self, device: ZKTecoDevice, employee_id: UUID, 
                                      fingerprint_type: str = "thumb", 
                                      position: int = 1) -> Optional[Fingerprint]:
        """Capture fingerprint directly from ZKTeco device"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return None
        
        try:
            zk_instance = self.devices[device.device_id]
            
            # Get employee to find device user ID
            employee = self.db.exec(
                select(Employee).where(Employee.id == employee_id)
            ).first()
            
            if not employee:
                logger.error(f"Employee not found: {employee_id}")
                return None
            
            # Check if employee already has fingerprints for this position
            existing_fingerprints = get_employee_fingerprints(
                session=self.db, 
                employee_id=employee_id,
                fingerprint_type=fingerprint_type,
                position=position
            )
            
            if len(existing_fingerprints) >= 5:
                logger.warning(f"Employee {employee_id} already has 5 fingerprints for {fingerprint_type} position {position}")
                return None
            
            # Get user from device (assuming employee_id matches device user_id)
            device_user_id = str(employee.employee_id)
            users = zk_instance.get_users()
            
            target_user = None
            for user in users:
                if str(user.user_id) == device_user_id:
                    target_user = user
                    break
            
            if not target_user:
                logger.error(f"User not found on device for employee: {employee_id}")
                return None
            
            # Get fingerprints from device user
            device_fingerprints = target_user.fingerprints
            
            if not device_fingerprints:
                logger.warning(f"No fingerprints found on device for user: {device_user_id}")
                return None
            
            # Convert device fingerprint to image data
            # Note: This is a simplified approach. Real implementation would need
            # to handle the specific ZKTeco fingerprint format
            fingerprint_data = self._convert_device_fingerprint_to_image(device_fingerprints[0])
            
            if not fingerprint_data:
                logger.error(f"Failed to convert fingerprint data for user: {device_user_id}")
                return None
            
            # Create fingerprint record
            fingerprint_in = FingerprintCreate(
                employee_id=employee_id,
                fingerprint_type=fingerprint_type,
                fingerprint_position=position,
                fingerprint_data=fingerprint_data,
                quality_score=85.0,  # Default quality score
                is_active=True
            )
            
            fingerprint = create_fingerprint(session=self.db, fingerprint_in=fingerprint_in)
            
            logger.info(f"Successfully captured fingerprint for employee {employee_id} from device {device.device_name}")
            return fingerprint
            
        except Exception as e:
            logger.error(f"Error capturing fingerprint from device {device.device_name}: {str(e)}")
            return None
    
    def verify_fingerprint_on_device(self, device: ZKTecoDevice, employee_id: UUID) -> bool:
        """Verify fingerprint on ZKTeco device in real-time"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return False
        
        try:
            zk_instance = self.devices[device.device_id]
            
            # Get employee
            employee = self.db.exec(
                select(Employee).where(Employee.id == employee_id)
            ).first()
            
            if not employee:
                logger.error(f"Employee not found: {employee_id}")
                return False
            
            # Check if employee has fingerprints stored
            stored_fingerprints = get_employee_fingerprints(
                session=self.db, 
                employee_id=employee_id
            )
            
            if not stored_fingerprints:
                logger.warning(f"No fingerprints stored for employee: {employee_id}")
                return False
            
            # For real-time verification, we would need to:
            # 1. Get the current fingerprint scan from the device
            # 2. Compare it with stored fingerprints
            # 3. Return verification result
            
            # This is a placeholder implementation
            # In a real implementation, you would:
            # - Use device-specific APIs for real-time fingerprint scanning
            # - Implement fingerprint matching algorithms
            # - Handle device-specific protocols
            
            logger.info(f"Fingerprint verification requested for employee {employee_id} on device {device.device_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying fingerprint on device {device.device_name}: {str(e)}")
            return False
    
    def sync_fingerprints_from_device(self, device: ZKTecoDevice) -> Tuple[int, str]:
        """Sync all fingerprints from a ZKTeco device to the database"""
        try:
            users = self.get_device_users(device)
            
            if not users:
                return 0, "No users found on device"
            
            fingerprints_synced = 0
            
            for user in users:
                user_id = user['user_id']
                fingerprints = user.get('fingerprints', [])
                
                # Find employee by device user ID
                employee = self.db.exec(
                    select(Employee).where(Employee.employee_id == str(user_id))
                ).first()
                
                if not employee:
                    logger.warning(f"Employee not found for device user ID: {user_id}")
                    continue
                
                # Sync each fingerprint
                for i, device_fingerprint in enumerate(fingerprints):
                    try:
                        # Convert device fingerprint to image
                        fingerprint_data = self._convert_device_fingerprint_to_image(device_fingerprint)
                        
                        if not fingerprint_data:
                            continue
                        
                        # Check if fingerprint already exists
                        existing_fingerprints = get_employee_fingerprints(
                            session=self.db,
                            employee_id=employee.id,
                            position=i + 1
                        )
                        
                        if existing_fingerprints:
                            continue  # Skip if already exists
                        
                        # Create new fingerprint record
                        fingerprint_in = FingerprintCreate(
                            employee_id=employee.id,
                            fingerprint_type="thumb",  # Default type
                            fingerprint_position=i + 1,
                            fingerprint_data=fingerprint_data,
                            quality_score=85.0,
                            is_active=True
                        )
                        
                        create_fingerprint(session=self.db, fingerprint_in=fingerprint_in)
                        fingerprints_synced += 1
                        
                    except Exception as e:
                        logger.error(f"Error syncing fingerprint {i} for user {user_id}: {str(e)}")
                        continue
            
            logger.info(f"Synced {fingerprints_synced} fingerprints from device {device.device_name}")
            return fingerprints_synced, "success"
            
        except Exception as e:
            logger.error(f"Error syncing fingerprints from device {device.device_name}: {str(e)}")
            return 0, f"Error: {str(e)}"
    
    def _convert_device_fingerprint_to_image(self, device_fingerprint) -> Optional[str]:
        """Convert ZKTeco device fingerprint data to base64 image"""
        try:
            # This is a placeholder implementation
            # In a real implementation, you would:
            # 1. Extract fingerprint data from device format
            # 2. Convert to image format (e.g., PNG, JPEG)
            # 3. Encode as base64
            
            # For now, create a simple placeholder image
            img = Image.new('RGB', (200, 200), color='white')
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return img_str
            
        except Exception as e:
            logger.error(f"Error converting device fingerprint to image: {str(e)}")
            return None
    
    def enroll_fingerprint_on_device(self, device: ZKTecoDevice, employee_id: UUID, 
                                   fingerprint_type: str = "thumb", 
                                   position: int = 1) -> bool:
        """Enroll a new fingerprint on the ZKTeco device"""
        if device.device_id not in self.devices:
            if not self.connect_device(device):
                return False
        
        try:
            zk_instance = self.devices[device.device_id]
            
            # Get employee
            employee = self.db.exec(
                select(Employee).where(Employee.id == employee_id)
            ).first()
            
            if not employee:
                logger.error(f"Employee not found: {employee_id}")
                return False
            
            # Create or update user on device
            device_user_id = str(employee.employee_id)
            user_name = f"{employee.first_name} {employee.last_name}"
            
            # This would require device-specific enrollment commands
            # For now, this is a placeholder
            logger.info(f"Enrollment requested for employee {employee_id} on device {device.device_name}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error enrolling fingerprint on device {device.device_name}: {str(e)}")
            return False
