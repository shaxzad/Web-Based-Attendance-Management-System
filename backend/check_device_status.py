#!/usr/bin/env python3
"""
Check Device Status Script

This script checks the status of ZKTeco devices and provides troubleshooting information.
"""

import sys
import socket
import time

# Add the app directory to the path
sys.path.append('.')

from app.core.config import settings
from app.models import ZKTecoDevice
from sqlmodel import Session, create_engine, select


def check_network_connectivity(ip: str, port: int = 4370) -> tuple:
    """Check network connectivity to device"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        start_time = time.time()
        result = sock.connect_ex((ip, port))
        end_time = time.time()
        sock.close()
        
        return result == 0, result, (end_time - start_time) * 1000
    except Exception as e:
        return False, -1, 0


def get_troubleshooting_tips(error_code: int) -> list:
    """Get troubleshooting tips based on error code"""
    tips = []
    
    if error_code == 65:
        tips = [
            "🔌 Check if the device is powered on",
            "🔗 Verify the Ethernet cable is properly connected",
            "🔄 Try a different Ethernet cable",
            "💡 Check if the device's network port has activity lights"
        ]
    elif error_code == 111:
        tips = [
            "🌐 Ensure the device is in Network Mode (not USB Mode)",
            "⚙️ Check device network settings",
            "🔄 Try resetting the device to factory defaults"
        ]
    elif error_code == 113:
        tips = [
            "🌐 Check network routing configuration",
            "📡 Verify switch/router is working properly",
            "🔗 Try connecting the device directly to your computer"
        ]
    else:
        tips = [
            "🔌 Check device power and connections",
            "🌐 Verify device is in network mode",
            "⚙️ Check network settings",
            "💻 Try connecting from a different computer"
        ]
    
    return tips


def check_device_status(device: ZKTecoDevice) -> dict:
    """Check status of a specific device"""
    print(f"\n📱 Checking device: {device.device_name}")
    print(f"   IP: {device.device_ip}")
    print(f"   Port: {device.device_port}")
    print(f"   Database Status: {device.device_status}")
    
    # Check network connectivity
    print(f"\n🌐 Testing network connectivity...")
    connected, error_code, response_time = check_network_connectivity(device.device_ip, device.device_port)
    
    if connected:
        print(f"✅ Network connectivity: OK ({response_time:.1f}ms)")
        network_status = "online"
    else:
        print(f"❌ Network connectivity: FAILED (Error code: {error_code})")
        network_status = "offline"
    
    # Get troubleshooting tips
    tips = get_troubleshooting_tips(error_code)
    
    return {
        "device_name": device.device_name,
        "device_ip": device.device_ip,
        "database_status": device.device_status,
        "network_status": network_status,
        "error_code": error_code,
        "response_time": response_time,
        "troubleshooting_tips": tips
    }


def main():
    """Main function"""
    print("🔍 ZKTeco Device Status Checker")
    print("=" * 50)
    
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        with Session(engine) as db:
            devices = db.exec(select(ZKTecoDevice)).all()
            
            if not devices:
                print("❌ No devices found in database")
                return
            
            print(f"📋 Found {len(devices)} device(s) in database")
            
            all_online = True
            for device in devices:
                status = check_device_status(device)
                
                if status["network_status"] == "offline":
                    all_online = False
                    print(f"\n⚠️  Device '{device.device_name}' is offline!")
                    print("🔧 Troubleshooting tips:")
                    for tip in status["troubleshooting_tips"]:
                        print(f"   {tip}")
                else:
                    print(f"\n✅ Device '{device.device_name}' is online!")
            
            print("\n" + "=" * 50)
            if all_online:
                print("🎉 All devices are online and ready to use!")
            else:
                print("⚠️  Some devices are offline. Please check the troubleshooting tips above.")
                print("\n💡 Quick fixes to try:")
                print("   1. Check device power and Ethernet cable")
                print("   2. Ensure device is in Network Mode")
                print("   3. Verify device network settings")
                print("   4. Try connecting device directly to computer")
                
    except Exception as e:
        print(f"❌ Error checking devices: {e}")


if __name__ == "__main__":
    main()



