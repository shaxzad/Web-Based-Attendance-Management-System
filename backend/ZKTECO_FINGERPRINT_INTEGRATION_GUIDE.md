# ZKTeco Fingerprint Integration Guide

## Overview

This guide explains how to use the ZKTeco fingerprint integration system for real-time fingerprint capture, storage, and verification. The system connects to ZKTeco devices to capture fingerprints directly from the device and store them in the database for authentication purposes.

## Features

### 1. Real-time Fingerprint Capture
- Capture fingerprints directly from ZKTeco devices
- Store fingerprint data in the database
- Support for multiple fingerprints per employee (up to 5 per finger type)

### 2. Device Integration
- Connect to ZKTeco devices via network
- Sync users and fingerprints from devices
- Real-time verification on devices

### 3. Fingerprint Management
- View and manage stored fingerprints
- Quality assessment and scoring
- Bulk operations for multiple fingerprints

## API Endpoints

### Device Integration Endpoints

#### 1. Capture Fingerprint from Device
```http
POST /fingerprints/capture-from-device/{device_id}/{employee_id}
```

**Parameters:**
- `device_id`: ZKTeco device identifier
- `employee_id`: Employee UUID
- `fingerprint_type`: Type of fingerprint (default: "thumb")
- `position`: Fingerprint position (default: 1)

**Response:**
```json
{
  "id": "fingerprint-uuid",
  "employee_id": "employee-uuid",
  "fingerprint_type": "thumb",
  "fingerprint_position": 1,
  "quality_score": 85.0,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 2. Verify Fingerprint on Device
```http
POST /fingerprints/verify-on-device/{device_id}/{employee_id}
```

**Parameters:**
- `device_id`: ZKTeco device identifier
- `employee_id`: Employee UUID

**Response:**
```json
{
  "verified": true,
  "employee_id": "employee-uuid",
  "device_id": "device-id"
}
```

#### 3. Sync Fingerprints from Device
```http
POST /fingerprints/sync-from-device/{device_id}
```

**Parameters:**
- `device_id`: ZKTeco device identifier

**Response:**
```json
{
  "fingerprints_synced": 5,
  "status": "success",
  "device_id": "device-id"
}
```

#### 4. Enroll Fingerprint on Device
```http
POST /fingerprints/enroll-on-device/{device_id}/{employee_id}
```

**Parameters:**
- `device_id`: ZKTeco device identifier
- `employee_id`: Employee UUID
- `fingerprint_type`: Type of fingerprint (default: "thumb")
- `position`: Fingerprint position (default: 1)

**Response:**
```json
{
  "success": true,
  "employee_id": "employee-uuid",
  "device_id": "device-id"
}
```

#### 5. Get Device Users
```http
GET /fingerprints/device-users/{device_id}
```

**Parameters:**
- `device_id`: ZKTeco device identifier

**Response:**
```json
{
  "users": [
    {
      "user_id": "123",
      "name": "John Doe",
      "privilege": "user",
      "fingerprints": []
    }
  ],
  "count": 1,
  "device_id": "device-id"
}
```

### Standard Fingerprint Endpoints

#### 1. Get Fingerprints
```http
GET /fingerprints/
```

**Query Parameters:**
- `skip`: Number of records to skip (pagination)
- `limit`: Number of records to return (pagination)
- `employee_id`: Filter by employee ID
- `fingerprint_type`: Filter by fingerprint type
- `is_active`: Filter by active status

#### 2. Create Fingerprint
```http
POST /fingerprints/
```

**Request Body:**
```json
{
  "employee_id": "employee-uuid",
  "fingerprint_type": "thumb",
  "fingerprint_position": 1,
  "fingerprint_data": "base64-encoded-image",
  "quality_score": 85.0,
  "is_active": true
}
```

#### 3. Get Employee Fingerprints
```http
GET /fingerprints/employee/{employee_id}
```

#### 4. Delete Fingerprint
```http
DELETE /fingerprints/{fingerprint_id}
```

## Frontend Usage

### 1. Device Management (Required First Step)
1. Go to **Attendance Management** → **Device Management**
2. Add your ZKTeco device with proper configuration
3. Connect the device to establish communication
4. Verify device status shows as "online"

### 2. Fingerprint Management
1. Go to **Fingerprint Management**
2. Select a device from the dropdown (only devices added through device management are shown)
3. The device status will automatically show the connection status
4. Only connected devices can be used for fingerprint operations

### 3. Fingerprint Operations
1. **Enroll on Device**: Register a new fingerprint on the ZKTeco device
2. **Capture from Device**: Retrieve fingerprint data from the device and store in database
3. **Verify on Device**: Perform real-time fingerprint verification on the device
4. **Sync from Device**: Import all fingerprints from the device to the database

### 4. Employee Selection
1. Select an employee from the dropdown
2. View their fingerprint summary and stored fingerprints
3. Perform fingerprint operations for the selected employee

## Device Management

### Adding Devices
**IMPORTANT**: All ZKTeco devices must be added through the Device Management system first.

1. Go to **Attendance Management** → **Device Management**
2. Click **"Add Device"** to add a new ZKTeco device
3. Enter device details:
   - Device Name (e.g., "Main Entrance Device")
   - Device IP Address (e.g., 172.25.10.73)
   - Device Port (usually 4370)
   - Device ID (unique identifier)
4. Save the device

### Connecting Devices
1. After adding a device, click **"Connect"** to establish connection
2. Device status will show as "online" when successfully connected
3. Only connected devices can be used for fingerprint operations

### Device Configuration

#### Network Mode Setup
1. Connect the ZKTeco device to the network via Ethernet cable
2. Configure the device IP address (e.g., 172.25.10.73)
3. Ensure the device is in "Network Mode" (not USB Mode)
4. Set the correct port (usually 4370)

#### USB Mode (Alternative)
If using USB connection:
1. Connect device via USB cable
2. Device will have a self-assigned IP (e.g., 169.254.x.x)
3. Use the self-assigned IP for device connection

## Troubleshooting

### Connection Issues
1. **No route to host**: Check device power and network cable
2. **Connection refused**: Device may not be in network mode
3. **Timeout**: Device may be busy or network is slow

### Fingerprint Issues
1. **No fingerprints found**: Ensure employee has enrolled fingerprints on device
2. **Verification failed**: Check fingerprint quality and enrollment
3. **Sync errors**: Verify device connectivity and user permissions

### Device Status
- **Online**: Device is connected and responding
- **Offline**: Device is not reachable
- **Error**: Connection or communication error

## Best Practices

### 1. Fingerprint Quality
- Ensure good lighting when capturing fingerprints
- Clean the fingerprint sensor regularly
- Capture multiple fingerprints per employee for better reliability

### 2. Device Management
- Regularly sync fingerprints from devices
- Monitor device connectivity status
- Keep device firmware updated

### 3. Security
- Use secure network connections
- Implement proper access controls
- Regularly backup fingerprint data

## Example Workflow

### Setting up a New Employee
1. Add employee to the system
2. **Add and connect ZKTeco device through Device Management**
3. Enroll fingerprints on the device
4. Capture fingerprints from device to database
5. Test verification on device

### Daily Operations
1. Monitor device connectivity through Device Management
2. Sync new fingerprints from devices
3. Verify employee fingerprints as needed
4. Review fingerprint quality and statistics

## Technical Details

### Fingerprint Storage
- Fingerprints are stored as base64-encoded images
- Quality scores are calculated automatically
- Support for multiple fingerprint types (thumb, index, middle, ring, pinky)

### Device Communication
- Uses ZK library for device communication
- Supports multiple ZKTeco device models
- Handles connection pooling and error recovery

### Database Schema
- `fingerprints` table stores fingerprint data
- Links to `employees` table via foreign key
- Includes quality scoring and metadata

## Support

For technical support or questions about the ZKTeco fingerprint integration:
1. Check device connectivity and configuration
2. Review error logs for specific issues
3. Test with known working devices
4. Contact system administrator for assistance
