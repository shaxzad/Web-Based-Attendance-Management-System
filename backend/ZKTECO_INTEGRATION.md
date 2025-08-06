# ZKTeco Device Integration Guide

This guide explains how to integrate ZKTeco fingerprint devices with the attendance management system to automatically capture and store attendance records.

## Overview

The ZKTeco integration allows you to:
- Connect multiple ZKTeco fingerprint devices (up to 10+ devices)
- Automatically sync attendance data from devices to the database
- Manage device configurations and settings
- Generate attendance reports
- Handle 100+ employee records efficiently

## Supported Devices

- **ZKTeco F22** (Primary support)
- Other ZKTeco fingerprint devices (compatible with zklib)

## Prerequisites

1. **Network Setup**: Ensure all ZKTeco devices are connected to the same network as the server
2. **Device Configuration**: Configure devices with static IP addresses
3. **Employee Data**: Add all employees to the system before uploading to devices
4. **Dependencies**: Install required Python packages

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install zklib celery redis schedule
```

### 2. Run Database Migration

```bash
cd backend
alembic upgrade head
```

This will create the necessary tables:
- `zktecodevice` - Device management
- `devicesynclog` - Sync operation logs
- Enhanced `attendance` table with device support

## Device Setup

### 1. Discover Devices

Use the setup script to discover devices on your network:

```bash
cd backend
python -m app.scripts.setup_zkteco_devices --discover 192.168.1.0/24
```

### 2. Add Device to Database

```bash
python -m app.scripts.setup_zkteco_devices --add 192.168.1.100 --name "Main Entrance" --location "Building A"
```

### 3. Complete Device Setup

```bash
python -m app.scripts.setup_zkteco_devices --setup 192.168.1.100 --name "Main Entrance" --location "Building A"
```

This will:
- Add device to database
- Test connection
- Configure device settings
- Upload employee data

## API Endpoints

### Device Management

#### List Devices
```http
GET /api/attendance/devices/
```

#### Add Device
```http
POST /api/attendance/devices/
Content-Type: application/json

{
  "device_name": "Main Entrance",
  "device_ip": "192.168.1.100",
  "device_port": 4370,
  "device_id": "SN123456789",
  "location": "Building A",
  "description": "Main entrance fingerprint device",
  "sync_interval": 5
}
```

#### Connect to Device
```http
POST /api/attendance/devices/{device_id}/connect
```

#### Sync Device Data
```http
POST /api/attendance/devices/{device_id}/sync
```

#### Sync All Devices
```http
POST /api/attendance/devices/sync-all
```

#### Get Device Info
```http
GET /api/attendance/devices/{device_id}/info
```

#### Restart Device
```http
POST /api/attendance/devices/{device_id}/restart
```

#### Clear Device Attendance
```http
POST /api/attendance/devices/{device_id}/clear-attendance
```

### Attendance Management

#### List Attendance Records
```http
GET /api/attendance/?employee_id={employee_id}&device_id={device_id}&start_date=2024-01-01&end_date=2024-01-31
```

#### Create Attendance Record
```http
POST /api/attendance/
Content-Type: application/json

{
  "employee_id": "uuid",
  "check_in_time": "2024-01-01T09:00:00Z",
  "device_id": "SN123456789",
  "zkteco_device_id": "uuid",
  "attendance_type": "fingerprint",
  "status": "present"
}
```

#### Get Employee Attendance
```http
GET /api/attendance/employee/{employee_id}
```

### Reports

#### Daily Attendance Report
```http
GET /api/attendance/reports/daily?date=2024-01-01&department_id={department_id}
```

#### Monthly Attendance Report
```http
GET /api/attendance/reports/monthly?year=2024&month=1&department_id={department_id}
```

## Configuration

### Device Settings

Each device can be configured with:

- **Sync Interval**: How often to sync data (in minutes)
- **Location**: Physical location of the device
- **Description**: Additional device information
- **Status**: Active/Inactive

### System Configuration

Edit `app/core/zkteco_config.py` to modify:

- Default connection settings
- Sync parameters
- Error handling
- Performance settings

## Background Tasks

The system includes automatic background tasks for:

### Automatic Sync
- Syncs attendance data from all active devices
- Runs based on each device's sync interval
- Logs all sync operations

### Status Monitoring
- Monitors device connectivity
- Updates device status in database
- Logs connection issues

### Start Background Tasks

```python
from app.services.background_tasks import start_background_tasks

# Start in your application startup
start_background_tasks()
```

## Employee Management

### Upload Employees to Devices

Before employees can use fingerprint devices:

1. **Add employees to the system** via the employee management API
2. **Upload employee data to devices** using the setup script or API

```bash
python -m app.scripts.setup_zkteco_devices --upload 192.168.1.100
```

### Employee ID Mapping

The system maps employees using:
- **Employee ID**: Company employee ID (must match device user ID)
- **Device User ID**: Internal device user identifier

## Troubleshooting

### Common Issues

#### 1. Device Connection Failed
- Check network connectivity
- Verify device IP and port
- Ensure device is powered on
- Check firewall settings

#### 2. Sync Not Working
- Verify device is active in database
- Check sync interval settings
- Review sync logs for errors
- Test manual sync first

#### 3. Employee Not Found
- Ensure employee is added to system
- Verify employee ID matches device user ID
- Upload employee data to device

#### 4. Attendance Not Syncing
- Check device connection status
- Verify last sync time
- Review device sync logs
- Test device connectivity

### Debug Commands

#### Test Device Connection
```bash
python -m app.scripts.setup_zkteco_devices --test 192.168.1.100
```

#### List All Devices
```bash
python -m app.scripts.setup_zkteco_devices --list
```

#### Manual Sync
```bash
curl -X POST http://localhost:8000/api/attendance/devices/sync-all
```

### Logs

Check logs for:
- Device connection issues
- Sync operation results
- Error messages
- Performance metrics

## Performance Optimization

### For 100+ Employees

1. **Batch Processing**: Sync data in batches
2. **Connection Pooling**: Reuse device connections
3. **Background Tasks**: Use async processing
4. **Database Indexing**: Optimize queries

### For 10+ Devices

1. **Concurrent Connections**: Limit simultaneous connections
2. **Load Balancing**: Distribute sync load
3. **Error Handling**: Implement retry logic
4. **Monitoring**: Track device performance

## Security Considerations

1. **Network Security**: Use VPN for remote devices
2. **Device Passwords**: Set device passwords if available
3. **Access Control**: Limit API access to authorized users
4. **Data Encryption**: Enable encryption if supported
5. **Audit Logging**: Log all device operations

## Backup and Recovery

### Data Backup
- Regular database backups
- Device configuration backups
- Sync log archives

### Disaster Recovery
- Device reconfiguration procedures
- Data restoration processes
- System recovery documentation

## Monitoring and Alerts

### Key Metrics
- Device connectivity status
- Sync success rates
- Data processing times
- Error frequencies

### Alerts
- Device offline notifications
- Sync failure alerts
- Performance degradation warnings
- Security incident notifications

## Support

For technical support:
1. Check the troubleshooting section
2. Review system logs
3. Test with setup script
4. Contact system administrator

## API Documentation

Complete API documentation is available at:
```
http://localhost:8000/docs
```

## Examples

### Python Client Example

```python
import requests

# Add device
device_data = {
    "device_name": "Main Entrance",
    "device_ip": "192.168.1.100",
    "device_port": 4370,
    "device_id": "SN123456789",
    "location": "Building A"
}

response = requests.post("http://localhost:8000/api/attendance/devices/", json=device_data)
device_id = response.json()["id"]

# Sync device
requests.post(f"http://localhost:8000/api/attendance/devices/{device_id}/sync")

# Get attendance report
report = requests.get("http://localhost:8000/api/attendance/reports/daily?date=2024-01-01")
```

### cURL Examples

```bash
# List devices
curl -X GET "http://localhost:8000/api/attendance/devices/"

# Sync all devices
curl -X POST "http://localhost:8000/api/attendance/devices/sync-all"

# Get daily report
curl -X GET "http://localhost:8000/api/attendance/reports/daily?date=2024-01-01"
```

## Changelog

### Version 1.0.0
- Initial ZKTeco integration
- Support for F22 devices
- Automatic sync functionality
- Device management API
- Attendance reporting
- Background task processing 