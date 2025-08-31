#!/usr/bin/env python3
"""
ZKTeco Device Manager

A comprehensive tool for managing ZKTeco devices including create, read, update, delete operations.
"""

import sys
import json
import requests
from datetime import datetime

# Add the app directory to the path
sys.path.append('.')


class DeviceManager:
    """Device management class"""
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1/attendance/devices"
    
    def list_devices(self):
        """List all devices"""
        print("📋 Current Devices:")
        print("=" * 50)
        
        try:
            response = requests.get(self.api_base)
            if response.status_code == 200:
                devices = response.json()["data"]
                if not devices:
                    print("  No devices found")
                    return []
                
                for i, device in enumerate(devices, 1):
                    print(f"  {i}. {device['device_name']}")
                    print(f"     ID: {device['id']}")
                    print(f"     IP: {device['device_ip']}")
                    print(f"     Port: {device['device_port']}")
                    print(f"     Status: {device['device_status']}")
                    print(f"     Active: {device['is_active']}")
                    if device['last_sync']:
                        print(f"     Last Sync: {device['last_sync']}")
                    print()
                
                return devices
            else:
                print(f"  ❌ Error: {response.status_code}")
                return []
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return []
    
    def create_device(self, device_data):
        """Create a new device"""
        print(f"➕ Creating device: {device_data.get('device_name', 'Unknown')}")
        print("=" * 50)
        
        try:
            response = requests.post(self.api_base, json=device_data)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Device created successfully!")
                print(f"   ID: {result['id']}")
                print(f"   Name: {result['device_name']}")
                print(f"   IP: {result['device_ip']}")
                return result
            elif response.status_code == 422:
                print("❌ Validation error:")
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
                return None
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def update_device(self, device_id, update_data):
        """Update a device"""
        print(f"✏️  Updating device: {device_id}")
        print("=" * 50)
        
        try:
            response = requests.put(f"{self.api_base}/{device_id}", json=update_data)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Device updated successfully!")
                print(f"   Name: {result['device_name']}")
                print(f"   IP: {result['device_ip']}")
                return result
            elif response.status_code == 404:
                print("❌ Device not found")
                return None
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def delete_device(self, device_id):
        """Delete a single device"""
        print(f"🗑️  Deleting device: {device_id}")
        print("=" * 50)
        
        try:
            response = requests.delete(f"{self.api_base}/{device_id}")
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Device deleted successfully!")
                print(f"   {result['message']}")
                return True
            elif response.status_code == 404:
                print("❌ Device not found")
                return False
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def delete_multiple_devices(self, device_ids):
        """Delete multiple devices"""
        print(f"🗑️  Deleting multiple devices: {len(device_ids)} devices")
        print("=" * 50)
        
        try:
            response = requests.delete(self.api_base, json=device_ids)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {result['message']}")
                
                if result['deleted_devices']:
                    print("\nDeleted devices:")
                    for device in result['deleted_devices']:
                        print(f"  - {device['name']} ({device['ip']})")
                
                if result['failed_deletions']:
                    print("\nFailed deletions:")
                    for failure in result['failed_deletions']:
                        print(f"  - {failure['id']}: {failure['error']}")
                
                return True
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def delete_all_devices(self):
        """Delete all devices"""
        print("🗑️  Deleting ALL devices")
        print("=" * 50)
        
        try:
            response = requests.delete(f"{self.api_base}/cleanup/all")
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {result['message']}")
                print(f"   Deleted: {result['deleted_count']} devices")
                
                if result['deleted_devices']:
                    print("\nDeleted devices:")
                    for device in result['deleted_devices']:
                        print(f"  - {device['name']} ({device['ip']})")
                
                return True
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def connect_device(self, device_id):
        """Connect to a device"""
        print(f"🔌 Connecting to device: {device_id}")
        print("=" * 50)
        
        try:
            response = requests.post(f"{self.api_base}/{device_id}/connect")
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {result['message']}")
                return True
            elif response.status_code == 503:
                print("❌ Device is offline")
                print(f"Response: {response.json()['detail']}")
                return False
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def get_device_status(self, device_id):
        """Get device status"""
        print(f"📊 Device status: {device_id}")
        print("=" * 50)
        
        try:
            response = requests.get(f"{self.api_base}/{device_id}/status")
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Device: {result['device_name']}")
                print(f"   IP: {result['device_ip']}")
                print(f"   Database Status: {result['database_status']}")
                print(f"   Network Status: {result['network_status']}")
                print(f"   Active: {result['is_active']}")
                
                if result['network_error_code']:
                    print(f"   Network Error Code: {result['network_error_code']}")
                
                if result['troubleshooting_tips']:
                    print("\n🔧 Troubleshooting tips:")
                    for tip in result['troubleshooting_tips']:
                        print(f"   - {tip}")
                
                return result
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None


def interactive_menu():
    """Interactive menu for device management"""
    manager = DeviceManager()
    
    while True:
        print("\n" + "=" * 60)
        print("🗂️  ZKTeco Device Manager")
        print("=" * 60)
        print("1. List all devices")
        print("2. Create new device")
        print("3. Update device")
        print("4. Delete single device")
        print("5. Delete multiple devices")
        print("6. Delete all devices")
        print("7. Connect to device")
        print("8. Get device status")
        print("9. Exit")
        
        choice = input("\nEnter your choice (1-9): ").strip()
        
        if choice == "1":
            manager.list_devices()
        
        elif choice == "2":
            print("\n➕ Create New Device")
            print("Enter device details:")
            
            device_data = {}
            device_data['device_name'] = input("Device name: ").strip()
            device_data['device_ip'] = input("Device IP: ").strip()
            device_data['device_port'] = int(input("Device port (default 4370): ").strip() or "4370")
            device_data['device_id'] = input("Device ID: ").strip()
            device_data['location'] = input("Location (optional): ").strip() or None
            device_data['description'] = input("Description (optional): ").strip() or None
            
            manager.create_device(device_data)
        
        elif choice == "3":
            devices = manager.list_devices()
            if devices:
                device_id = input("Enter device ID to update: ").strip()
                
                print("Enter new values (press Enter to keep current):")
                update_data = {}
                
                name = input("Device name: ").strip()
                if name:
                    update_data['device_name'] = name
                
                ip = input("Device IP: ").strip()
                if ip:
                    update_data['device_ip'] = ip
                
                port = input("Device port: ").strip()
                if port:
                    update_data['device_port'] = int(port)
                
                location = input("Location: ").strip()
                if location:
                    update_data['location'] = location
                
                description = input("Description: ").strip()
                if description:
                    update_data['description'] = description
                
                if update_data:
                    manager.update_device(device_id, update_data)
                else:
                    print("No changes specified")
        
        elif choice == "4":
            devices = manager.list_devices()
            if devices:
                device_id = input("Enter device ID to delete: ").strip()
                confirm = input("Are you sure? (yes/no): ").strip().lower()
                if confirm == "yes":
                    manager.delete_device(device_id)
                else:
                    print("Deletion cancelled")
        
        elif choice == "5":
            devices = manager.list_devices()
            if devices:
                print("Enter device IDs (comma-separated):")
                device_ids_input = input("Device IDs: ").strip()
                if device_ids_input:
                    device_ids = [id.strip() for id in device_ids_input.split(",")]
                    confirm = input(f"Delete {len(device_ids)} devices? (yes/no): ").strip().lower()
                    if confirm == "yes":
                        manager.delete_multiple_devices(device_ids)
                    else:
                        print("Deletion cancelled")
        
        elif choice == "6":
            confirm = input("⚠️  Delete ALL devices? This cannot be undone! (yes/no): ").strip().lower()
            if confirm == "yes":
                manager.delete_all_devices()
            else:
                print("Deletion cancelled")
        
        elif choice == "7":
            devices = manager.list_devices()
            if devices:
                device_id = input("Enter device ID to connect: ").strip()
                manager.connect_device(device_id)
        
        elif choice == "8":
            devices = manager.list_devices()
            if devices:
                device_id = input("Enter device ID for status: ").strip()
                manager.get_device_status(device_id)
        
        elif choice == "9":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please try again.")


def main():
    """Main function"""
    print("🗂️  ZKTeco Device Manager")
    print("=" * 60)
    
    # Check if API is available
    try:
        response = requests.get("http://localhost:8000/api/v1/attendance/devices/")
        if response.status_code != 200:
            print("❌ API server is not running or not accessible")
            print("Please start the backend server first")
            return
    except Exception as e:
        print(f"❌ Cannot connect to API server: {e}")
        print("Please start the backend server first")
        return
    
    print("✅ API server is running")
    
    # Start interactive menu
    interactive_menu()


if __name__ == "__main__":
    main()



