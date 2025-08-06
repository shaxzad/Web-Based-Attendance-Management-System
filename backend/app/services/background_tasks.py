import asyncio
import logging
import schedule
import time
from datetime import datetime
from typing import Dict, List

from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.models import ZKTecoDevice
from app.services.zkteco_service import ZKTecoManager

logger = logging.getLogger(__name__)


class BackgroundTaskManager:
    """Manager for background tasks related to ZKTeco devices"""
    
    def __init__(self):
        self.engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        self.running = False
        self.sync_task = None
    
    def start_sync_scheduler(self):
        """Start the background sync scheduler"""
        if self.running:
            logger.warning("Sync scheduler is already running")
            return
        
        self.running = True
        
        # Schedule sync tasks for each device based on their sync interval
        with Session(self.engine) as db:
            devices = db.exec(select(ZKTecoDevice).where(ZKTecoDevice.is_active == True)).all()
            
            for device in devices:
                if device.sync_interval > 0:
                    schedule.every(device.sync_interval).minutes.do(
                        self._sync_device_attendance, device_id=device.id
                    )
                    logger.info(f"Scheduled sync for device {device.device_name} every {device.sync_interval} minutes")
        
        # Start the scheduler in a separate thread
        self.sync_task = asyncio.create_task(self._run_scheduler())
        logger.info("Background sync scheduler started")
    
    def stop_sync_scheduler(self):
        """Stop the background sync scheduler"""
        if not self.running:
            return
        
        self.running = False
        schedule.clear()
        
        if self.sync_task:
            self.sync_task.cancel()
        
        logger.info("Background sync scheduler stopped")
    
    async def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.running:
            try:
                schedule.run_pending()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in scheduler loop: {str(e)}")
                await asyncio.sleep(60)
    
    def _sync_device_attendance(self, device_id: str):
        """Sync attendance from a specific device"""
        try:
            with Session(self.engine) as db:
                device = db.get(ZKTecoDevice, device_id)
                if not device or not device.is_active:
                    return
                
                manager = ZKTecoManager(db)
                service = manager.get_service(device.id)
                records_synced, status = service.sync_attendance_from_device(device)
                
                logger.info(f"Background sync for device {device.device_name}: {records_synced} records, status: {status}")
                
        except Exception as e:
            logger.error(f"Error in background sync for device {device_id}: {str(e)}")
    
    def sync_all_devices_now(self) -> Dict[str, tuple]:
        """Manually trigger sync for all active devices"""
        results = {}
        
        try:
            with Session(self.engine) as db:
                manager = ZKTecoManager(db)
                results = manager.sync_all_devices()
                
                logger.info(f"Manual sync completed: {results}")
                
        except Exception as e:
            logger.error(f"Error in manual sync: {str(e)}")
        
        return results
    
    def update_device_schedules(self):
        """Update sync schedules when device configurations change"""
        schedule.clear()
        
        with Session(self.engine) as db:
            devices = db.exec(select(ZKTecoDevice).where(ZKTecoDevice.is_active == True)).all()
            
            for device in devices:
                if device.sync_interval > 0:
                    schedule.every(device.sync_interval).minutes.do(
                        self._sync_device_attendance, device_id=device.id
                    )
                    logger.info(f"Updated schedule for device {device.device_name}: every {device.sync_interval} minutes")


# Global instance
background_task_manager = BackgroundTaskManager()


def start_background_tasks():
    """Start all background tasks"""
    background_task_manager.start_sync_scheduler()


def stop_background_tasks():
    """Stop all background tasks"""
    background_task_manager.stop_sync_scheduler()


def sync_all_devices():
    """Manually trigger sync for all devices"""
    return background_task_manager.sync_all_devices_now()


def update_device_schedules():
    """Update device sync schedules"""
    background_task_manager.update_device_schedules() 