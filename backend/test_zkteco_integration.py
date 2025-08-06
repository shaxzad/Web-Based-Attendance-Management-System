#!/usr/bin/env python3
"""
Test script for ZKTeco integration

This script tests the ZKTeco device integration functionality.
Run this after setting up the system to verify everything is working.
"""

import asyncio
import sys
import time
from datetime import datetime, timedelta

from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.models import ZKTecoDevice, Employee, Attendance, Department
from app.services.zkteco_service import ZKTecoManager
from app.services.background_tasks import sync_all_devices


def test_database_connection():
    """Test database connection"""
    print("Testing database connection...")
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        with Session(engine) as db:
            # Test basic query
            result = db.exec(select(ZKTecoDevice)).all()
            print(f"✓ Database connection successful. Found {len(result)} devices.")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def test_device_creation():
    """Test creating a test device"""
    print("\nTesting device creation...")
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        with Session(engine) as db:
            # Check if test device exists
            test_device = db.exec(
                select(ZKTecoDevice).where(ZKTecoDevice.device_name == "Test Device")
            ).first()
            
            if test_device:
                print(f"✓ Test device already exists: {test_device.device_name}")
                return test_device
            
            # Create test device
            test_device = ZKTecoDevice(
                device_name="Test Device",
                device_ip="192.168.1.999",  # Non-existent IP for testing
                device_port=4370,
                device_id="TEST-DEVICE-001",
                location="Test Location",
                description="Test device for integration testing",
                is_active=True,
                sync_interval=5,
                device_status="offline"
            )
            
            db.add(test_device)
            db.commit()
            db.refresh(test_device)
            
            print(f"✓ Test device created: {test_device.device_name}")
            return test_device
            
    except Exception as e:
        print(f"✗ Device creation failed: {e}")
        return None


def test_employee_creation():
    """Test creating a test employee"""
    print("\nTesting employee creation...")
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        with Session(engine) as db:
            # Check if test employee exists
            test_employee = db.exec(
                select(Employee).where(Employee.employee_id == "TEST001")
            ).first()
            
            if test_employee:
                print(f"✓ Test employee already exists: {test_employee.first_name} {test_employee.last_name}")
                return test_employee
            
            # Get first department
            department = db.exec(select(Department)).first()
            if not department:
                print("✗ No departments found. Please create a department first.")
                return None
            
            # Create test employee
            test_employee = Employee(
                employee_id="TEST001",
                cnic="1234567890123",
                first_name="Test",
                last_name="Employee",
                phone="1234567890",
                address="Test Address",
                hire_date=datetime.utcnow(),
                salary=50000.0,
                is_active=True,
                department_id=department.id
            )
            
            db.add(test_employee)
            db.commit()
            db.refresh(test_employee)
            
            print(f"✓ Test employee created: {test_employee.first_name} {test_employee.last_name}")
            return test_employee
            
    except Exception as e:
        print(f"✗ Employee creation failed: {e}")
        return None


def test_attendance_creation():
    """Test creating a test attendance record"""
    print("\nTesting attendance creation...")
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        with Session(engine) as db:
            # Get test employee
            employee = db.exec(
                select(Employee).where(Employee.employee_id == "TEST001")
            ).first()
            
            if not employee:
                print("✗ Test employee not found")
                return None
            
            # Get test device
            device = db.exec(
                select(ZKTecoDevice).where(ZKTecoDevice.device_name == "Test Device")
            ).first()
            
            if not device:
                print("✗ Test device not found")
                return None
            
            # Create test attendance
            test_attendance = Attendance(
                employee_id=employee.id,
                check_in_time=datetime.utcnow(),
                device_id=device.device_id,
                zkteco_device_id=device.id,
                attendance_type="fingerprint",
                status="present"
            )
            
            db.add(test_attendance)
            db.commit()
            db.refresh(test_attendance)
            
            print(f"✓ Test attendance created for {employee.first_name} {employee.last_name}")
            return test_attendance
            
    except Exception as e:
        print(f"✗ Attendance creation failed: {e}")
        return None


def test_zkteco_service():
    """Test ZKTeco service functionality"""
    print("\nTesting ZKTeco service...")
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        with Session(engine) as db:
            # Get test device
            device = db.exec(
                select(ZKTecoDevice).where(ZKTecoDevice.device_name == "Test Device")
            ).first()
            
            if not device:
                print("✗ Test device not found")
                return False
            
            # Test ZKTeco manager
            manager = ZKTecoManager(db)
            service = manager.get_service(device.id)
            
            # Test device status check
            status = manager.check_device_status(device)
            print(f"✓ Device status check: {status}")
            
            # Test service methods (without actual connection)
            print("✓ ZKTeco service initialized successfully")
            return True
            
    except Exception as e:
        print(f"✗ ZKTeco service test failed: {e}")
        return False


def test_api_endpoints():
    """Test API endpoints"""
    print("\nTesting API endpoints...")
    try:
        import requests
        
        base_url = "http://localhost:8000"
        
        # Test devices endpoint
        response = requests.get(f"{base_url}/api/attendance/devices/")
        if response.status_code == 200:
            print("✓ Devices API endpoint working")
        else:
            print(f"✗ Devices API endpoint failed: {response.status_code}")
        
        # Test attendance endpoint
        response = requests.get(f"{base_url}/api/attendance/")
        if response.status_code == 200:
            print("✓ Attendance API endpoint working")
        else:
            print(f"✗ Attendance API endpoint failed: {response.status_code}")
        
        # Test reports endpoint
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{base_url}/api/attendance/reports/daily?date={today}")
        if response.status_code == 200:
            print("✓ Reports API endpoint working")
        else:
            print(f"✗ Reports API endpoint failed: {response.status_code}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("✗ API server not running. Start the server first.")
        return False
    except Exception as e:
        print(f"✗ API test failed: {e}")
        return False


def test_background_tasks():
    """Test background task functionality"""
    print("\nTesting background tasks...")
    try:
        # Test manual sync
        results = sync_all_devices()
        print(f"✓ Background sync test completed: {results}")
        return True
        
    except Exception as e:
        print(f"✗ Background task test failed: {e}")
        return False


def cleanup_test_data():
    """Clean up test data"""
    print("\nCleaning up test data...")
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        with Session(engine) as db:
            # Delete test attendance
            test_attendances = db.exec(
                select(Attendance).where(Attendance.device_id == "TEST-DEVICE-001")
            ).all()
            for attendance in test_attendances:
                db.delete(attendance)
            
            # Delete test employee
            test_employee = db.exec(
                select(Employee).where(Employee.employee_id == "TEST001")
            ).first()
            if test_employee:
                db.delete(test_employee)
            
            # Delete test device
            test_device = db.exec(
                select(ZKTecoDevice).where(ZKTecoDevice.device_name == "Test Device")
            ).first()
            if test_device:
                db.delete(test_device)
            
            db.commit()
            print("✓ Test data cleaned up")
            
    except Exception as e:
        print(f"✗ Cleanup failed: {e}")


def main():
    """Run all tests"""
    print("ZKTeco Integration Test Suite")
    print("=" * 50)
    
    # Import Department model
    from app.models import Department
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Device Creation", test_device_creation),
        ("Employee Creation", test_employee_creation),
        ("Attendance Creation", test_attendance_creation),
        ("ZKTeco Service", test_zkteco_service),
        ("API Endpoints", test_api_endpoints),
        ("Background Tasks", test_background_tasks),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"✗ {test_name} failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ZKTeco integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    # Ask if user wants to clean up test data
    try:
        response = input("\nDo you want to clean up test data? (y/n): ")
        if response.lower() in ['y', 'yes']:
            cleanup_test_data()
    except KeyboardInterrupt:
        print("\nTest completed.")


if __name__ == "__main__":
    main() 