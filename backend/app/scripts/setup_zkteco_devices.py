#!/usr/bin/env python3
"""
This script helps set up and configure ZKTeco fingerprint devices for the Lamhatrack HRMS system.
"""

import argparse
import ipaddress
import socket
import sys
import time
from datetime import datetime
from typing import List, Dict, Optional

from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.core.zkteco_config import get_device_config, ZKTECO_F22_DEFAULT_PARAMS
from app.models import ZKTecoDevice, ZKTecoDeviceCreate, Employee
from app.services.zkteco_service import ZKTecoManager


class ZKTecoDeviceSetup:
    """Setup utility for ZKTeco devices"""
    
    def __init__(self):
        self.engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
        self.manager = None
    
    def discover_devices(self, network_range: str, ports: List[int] = None) -> List[Dict]:
        """
        Discover ZKTeco devices on the network
        
        Args:
            network_range: Network range in CIDR notation (e.g., "192.168.1.0/24")
            ports: List of ports to scan (default: [4370, 4371, 4372])
        
        Returns:
            List of discovered devices
        """
        if ports is None:
            ports = [4370, 4371, 4372]
        
        print(f"Scanning network {network_range} for ZKTeco devices...")
        discovered_devices = []
        
        try:
            network = ipaddress.IPv4Network(network_range, strict=False)
        except ValueError as e:
            print(f"Invalid network range: {e}")
            return []
        
        total_ips = network.num_addresses
        current_ip = 0
        
        for ip in network.hosts():
            current_ip += 1
            ip_str = str(ip)
            
            # Progress indicator
            if current_ip % 10 == 0:
                progress = (current_ip / total_ips) * 100
                print(f"Progress: {progress:.1f}% ({current_ip}/{total_ips})")
            
            for port in ports:
                try:
                    # Test TCP connection
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex((ip_str, port))
                    sock.close()
                    
                    if result == 0:
                        # Try to connect with ZKTeco library
                        try:
                            import zk
                            zk_instance = zk.ZK(ip_str, port, timeout=3)
                            if zk_instance.connect():
                                # Get device info
                                device_info = {
                                    "ip": ip_str,
                                    "port": port,
                                    "serial_number": zk_instance.get_serial_number(),
                                    "device_name": zk_instance.get_device_name(),
                                    "firmware_version": zk_instance.get_firmware_version(),
                                    "platform": zk_instance.get_platform(),
                                    "users_count": len(zk_instance.get_users()),
                                    "attendance_count": len(zk_instance.get_attendance())
                                }
                                discovered_devices.append(device_info)
                                print(f"Found device: {ip_str}:{port} - {device_info['device_name']}")
                                zk_instance.disconnect()
                        except Exception as e:
                            print(f"Error connecting to {ip_str}:{port}: {e}")
                
                except Exception as e:
                    continue
        
        print(f"Discovery completed. Found {len(discovered_devices)} devices.")
        return discovered_devices
    
    def add_device_to_database(self, device_info: Dict, device_name: str = None, 
                              location: str = None, description: str = None) -> Optional[ZKTecoDevice]:
        """
        Add a discovered device to the database
        
        Args:
            device_info: Device information from discovery
            device_name: Custom device name
            location: Device location
            description: Device description
        
        Returns:
            Created device object or None if failed
        """
        try:
            with Session(self.engine) as db:
                # Check if device already exists
                existing_device = db.exec(
                    select(ZKTecoDevice).where(ZKTecoDevice.device_ip == device_info["ip"])
                ).first()
                
                if existing_device:
                    print(f"Device {device_info['ip']} already exists in database")
                    return existing_device
                
                # Create new device
                device_create = ZKTecoDeviceCreate(
                    device_name=device_name or device_info.get("device_name", f"Device-{device_info['ip']}"),
                    device_ip=device_info["ip"],
                    device_port=device_info["port"],
                    device_id=device_info.get("serial_number", f"SN-{device_info['ip']}"),
                    location=location,
                    description=description,
                    is_active=True,
                    sync_interval=5,
                    device_status="offline"
                )
                
                device = ZKTecoDevice(**device_create.model_dump())
                db.add(device)
                db.commit()
                db.refresh(device)
                
                print(f"Added device {device.device_name} to database")
                return device
                
        except Exception as e:
            print(f"Error adding device to database: {e}")
            return None
    
    def test_device_connection(self, device: ZKTecoDevice) -> bool:
        """
        Test connection to a device
        
        Args:
            device: Device object from database
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            with Session(self.engine) as db:
                manager = ZKTecoManager(db)
                service = manager.get_service(device.id)
                success = service.connect_device(device)
                
                if success:
                    print(f"✓ Successfully connected to {device.device_name} at {device.device_ip}")
                    return True
                else:
                    print(f"✗ Failed to connect to {device.device_name} at {device.device_ip}")
                    return False
                    
        except Exception as e:
            print(f"✗ Error testing connection to {device.device_name}: {e}")
            return False
    
    def upload_employees_to_device(self, device: ZKTecoDevice) -> bool:
        """
        Upload employee data to a device
        
        Args:
            device: Device object from database
        
        Returns:
            True if upload successful, False otherwise
        """
        try:
            with Session(self.engine) as db:
                # Get all active employees
                employees = db.exec(
                    select(Employee).where(Employee.is_active == True)
                ).all()
                
                if not employees:
                    print("No active employees found in database")
                    return False
                
                manager = ZKTecoManager(db)
                service = manager.get_service(device.id)
                
                # Connect to device
                if not service.connect_device(device):
                    print(f"Failed to connect to device {device.device_name}")
                    return False
                
                # Upload employees
                users_uploaded, status = service.upload_users_to_device(device, employees)
                
                if status == "success":
                    print(f"✓ Successfully uploaded {users_uploaded} employees to {device.device_name}")
                    return True
                else:
                    print(f"✗ Failed to upload employees to {device.device_name}")
                    return False
                    
        except Exception as e:
            print(f"✗ Error uploading employees to {device.device_name}: {e}")
            return False
    
    def configure_device_settings(self, device: ZKTecoDevice) -> bool:
        """
        Configure device settings
        
        Args:
            device: Device object from database
        
        Returns:
            True if configuration successful, False otherwise
        """
        try:
            with Session(self.engine) as db:
                manager = ZKTecoManager(db)
                service = manager.get_service(device.id)
                
                # Connect to device
                if not service.connect_device(device):
                    print(f"Failed to connect to device {device.device_name}")
                    return False
                
                # Get device info
                device_info = service.get_device_info(device)
                print(f"Device info for {device.device_name}:")
                for key, value in device_info.items():
                    print(f"  {key}: {value}")
                
                # Set device parameters
                try:
                    import zk
                    zk_instance = service.devices.get(device.device_id)
                    if zk_instance:
                        # Set time
                        zk_instance.set_time()
                        print(f"✓ Set time on {device.device_name}")
                        
                        # Set device name
                        zk_instance.set_device_name(device.device_name)
                        print(f"✓ Set device name on {device.device_name}")
                        
                        return True
                except Exception as e:
                    print(f"✗ Error configuring device settings: {e}")
                    return False
                    
        except Exception as e:
            print(f"✗ Error configuring device {device.device_name}: {e}")
            return False
    
    def list_devices(self) -> List[ZKTecoDevice]:
        """
        List all devices in the database
        
        Returns:
            List of device objects
        """
        try:
            with Session(self.engine) as db:
                devices = db.exec(select(ZKTecoDevice)).all()
                return devices
        except Exception as e:
            print(f"Error listing devices: {e}")
            return []
    
    def setup_device(self, ip: str, port: int = 4370, device_name: str = None, 
                    location: str = None, description: str = None) -> bool:
        """
        Complete setup for a single device
        
        Args:
            ip: Device IP address
            port: Device port
            device_name: Custom device name
            location: Device location
            description: Device description
        
        Returns:
            True if setup successful, False otherwise
        """
        print(f"Setting up device at {ip}:{port}")
        
        # Create device info
        device_info = {
            "ip": ip,
            "port": port,
            "serial_number": f"SN-{ip}",
            "device_name": device_name or f"Device-{ip}"
        }
        
        # Add to database
        device = self.add_device_to_database(device_info, device_name, location, description)
        if not device:
            return False
        
        # Test connection
        if not self.test_device_connection(device):
            return False
        
        # Configure settings
        if not self.configure_device_settings(device):
            return False
        
        # Upload employees
        if not self.upload_employees_to_device(device):
            return False
        
        print(f"✓ Device {device.device_name} setup completed successfully")
        return True


def main():
    parser = argparse.ArgumentParser(description="ZKTeco Device Setup Script")
    parser.add_argument("--discover", metavar="NETWORK", 
                       help="Discover devices on network (e.g., 192.168.1.0/24)")
    parser.add_argument("--add", metavar="IP", help="Add device by IP address")
    parser.add_argument("--port", type=int, default=4370, help="Device port (default: 4370)")
    parser.add_argument("--name", help="Device name")
    parser.add_argument("--location", help="Device location")
    parser.add_argument("--description", help="Device description")
    parser.add_argument("--test", metavar="IP", help="Test connection to device")
    parser.add_argument("--list", action="store_true", help="List all devices")
    parser.add_argument("--upload", metavar="IP", help="Upload employees to device")
    parser.add_argument("--configure", metavar="IP", help="Configure device settings")
    parser.add_argument("--setup", metavar="IP", help="Complete setup for device")
    
    args = parser.parse_args()
    
    setup = ZKTecoDeviceSetup()
    
    if args.discover:
        devices = setup.discover_devices(args.discover)
        if devices:
            print("\nDiscovered devices:")
            for i, device in enumerate(devices, 1):
                print(f"{i}. {device['ip']}:{device['port']} - {device['device_name']}")
    
    elif args.add:
        device_info = {
            "ip": args.add,
            "port": args.port,
            "serial_number": f"SN-{args.add}",
            "device_name": args.name or f"Device-{args.add}"
        }
        device = setup.add_device_to_database(device_info, args.name, args.location, args.description)
        if device:
            print(f"Device added: {device.device_name}")
    
    elif args.test:
        with Session(setup.engine) as db:
            device = db.exec(select(ZKTecoDevice).where(ZKTecoDevice.device_ip == args.test)).first()
            if device:
                setup.test_device_connection(device)
            else:
                print(f"Device {args.test} not found in database")
    
    elif args.list:
        devices = setup.list_devices()
        if devices:
            print("\nDevices in database:")
            for device in devices:
                print(f"- {device.device_name} ({device.device_ip}:{device.device_port}) - {device.device_status}")
        else:
            print("No devices found in database")
    
    elif args.upload:
        with Session(setup.engine) as db:
            device = db.exec(select(ZKTecoDevice).where(ZKTecoDevice.device_ip == args.upload)).first()
            if device:
                setup.upload_employees_to_device(device)
            else:
                print(f"Device {args.upload} not found in database")
    
    elif args.configure:
        with Session(setup.engine) as db:
            device = db.exec(select(ZKTecoDevice).where(ZKTecoDevice.device_ip == args.configure)).first()
            if device:
                setup.configure_device_settings(device)
            else:
                print(f"Device {args.configure} not found in database")
    
    elif args.setup:
        setup.setup_device(args.setup, args.port, args.name, args.location, args.description)
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main() 