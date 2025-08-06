from typing import Dict, Any

# ZKTeco Device Configuration
ZKTECO_CONFIG = {
    # Default device settings
    "default_port": 4370,
    "default_timeout": 10,
    "default_sync_interval": 5,  # minutes
    
    # Connection settings
    "max_retry_attempts": 3,
    "retry_delay": 5,  # seconds
    
    # Data sync settings
    "max_records_per_sync": 1000,
    "sync_batch_size": 100,
    
    # Device status check interval (minutes)
    "status_check_interval": 10,
    
    # Logging settings
    "log_sync_operations": True,
    "log_device_errors": True,
    
    # Security settings
    "enable_device_encryption": False,
    "device_password": "",  # Set if devices have passwords
    
    # Backup settings
    "backup_attendance_data": True,
    "backup_interval_hours": 24,
    
    # Notification settings
    "notify_on_sync_failure": True,
    "notify_on_device_offline": True,
    
    # Performance settings
    "max_concurrent_connections": 10,
    "connection_pool_size": 5,
}

# ZKTeco F22 specific settings (based on the device you mentioned)
ZKTECO_F22_CONFIG = {
    "device_model": "F22",
    "supported_features": [
        "fingerprint_verification",
        "card_verification",
        "face_verification",
        "password_verification",
        "attendance_logging",
        "user_management",
        "real_time_monitoring"
    ],
    
    # Device specifications
    "max_users": 3000,
    "max_fingerprints": 6000,
    "max_face_templates": 3000,
    "max_attendance_records": 100000,
    "max_logs": 100000,
    
    # Communication settings
    "protocol": "TCP/IP",
    "supported_ports": [4370, 4371, 4372],
    "data_format": "binary",
    
    # Time settings
    "time_sync_enabled": True,
    "timezone_support": True,
    
    # Network settings
    "dhcp_support": True,
    "static_ip_support": True,
    "wifi_support": False,  # F22 is wired only
    
    # Security features
    "encryption_support": True,
    "password_protection": True,
    "access_control": True,
}

# Default device parameters for F22
ZKTECO_F22_DEFAULT_PARAMS = {
    "stamp": 0,
    "version": 0,
    "oem": 0,
    "language": 0,
    "timezone": 0,
    "stamp2": 0,
    "cstate": 0,
    "work_code": 0,
    "work_code2": 0,
    "work_code3": 0,
    "work_code4": 0,
    "work_code5": 0,
    "work_code6": 0,
    "work_code7": 0,
    "work_code8": 0,
    "work_code9": 0,
    "work_code10": 0,
    "work_code11": 0,
    "work_code12": 0,
    "work_code13": 0,
    "work_code14": 0,
    "work_code15": 0,
    "work_code16": 0,
    "work_code17": 0,
    "work_code18": 0,
    "work_code19": 0,
    "work_code20": 0,
    "work_code21": 0,
    "work_code22": 0,
    "work_code23": 0,
    "work_code24": 0,
    "work_code25": 0,
    "work_code26": 0,
    "work_code27": 0,
    "work_code28": 0,
    "work_code29": 0,
    "work_code30": 0,
    "work_code31": 0,
    "work_code32": 0,
    "work_code33": 0,
    "work_code34": 0,
    "work_code35": 0,
    "work_code36": 0,
    "work_code37": 0,
    "work_code38": 0,
    "work_code39": 0,
    "work_code40": 0,
    "work_code41": 0,
    "work_code42": 0,
    "work_code43": 0,
    "work_code44": 0,
    "work_code45": 0,
    "work_code46": 0,
    "work_code47": 0,
    "work_code48": 0,
    "work_code49": 0,
    "work_code50": 0,
    "work_code51": 0,
    "work_code52": 0,
    "work_code53": 0,
    "work_code54": 0,
    "work_code55": 0,
    "work_code56": 0,
    "work_code57": 0,
    "work_code58": 0,
    "work_code59": 0,
    "work_code60": 0,
    "work_code61": 0,
    "work_code62": 0,
    "work_code63": 0,
    "work_code64": 0,
    "work_code65": 0,
    "work_code66": 0,
    "work_code67": 0,
    "work_code68": 0,
    "work_code69": 0,
    "work_code70": 0,
    "work_code71": 0,
    "work_code72": 0,
    "work_code73": 0,
    "work_code74": 0,
    "work_code75": 0,
    "work_code76": 0,
    "work_code77": 0,
    "work_code78": 0,
    "work_code79": 0,
    "work_code80": 0,
    "work_code81": 0,
    "work_code82": 0,
    "work_code83": 0,
    "work_code84": 0,
    "work_code85": 0,
    "work_code86": 0,
    "work_code87": 0,
    "work_code88": 0,
    "work_code89": 0,
    "work_code90": 0,
    "work_code91": 0,
    "work_code92": 0,
    "work_code93": 0,
    "work_code94": 0,
    "work_code95": 0,
    "work_code96": 0,
    "work_code97": 0,
    "work_code98": 0,
    "work_code99": 0,
}

# Error codes and messages
ZKTECO_ERROR_CODES = {
    0: "Success",
    1: "Failed to connect to device",
    2: "Device not responding",
    3: "Invalid device ID",
    4: "Authentication failed",
    5: "Permission denied",
    6: "Device busy",
    7: "Timeout",
    8: "Invalid data format",
    9: "Device not found",
    10: "Network error",
    11: "Device locked",
    12: "Invalid command",
    13: "Data corruption",
    14: "Device full",
    15: "Invalid user ID",
    16: "User not found",
    17: "Fingerprint not found",
    18: "Face template not found",
    19: "Card not found",
    20: "Password incorrect",
}

# Device status messages
DEVICE_STATUS_MESSAGES = {
    "online": "Device is online and responding",
    "offline": "Device is offline or not reachable",
    "error": "Device encountered an error",
    "syncing": "Device is currently syncing data",
    "maintenance": "Device is in maintenance mode",
    "locked": "Device is locked",
    "full": "Device storage is full",
    "initializing": "Device is initializing",
}

# Sync status messages
SYNC_STATUS_MESSAGES = {
    "success": "Sync completed successfully",
    "failed": "Sync failed",
    "partial": "Sync completed with some errors",
    "no_data": "No new data to sync",
    "timeout": "Sync timed out",
    "connection_error": "Connection error during sync",
    "device_error": "Device error during sync",
}

def get_device_config(device_model: str = "F22") -> Dict[str, Any]:
    """Get configuration for a specific device model"""
    if device_model.upper() == "F22":
        return {**ZKTECO_CONFIG, **ZKTECO_F22_CONFIG}
    else:
        return ZKTECO_CONFIG

def get_error_message(error_code: int) -> str:
    """Get error message for a specific error code"""
    return ZKTECO_ERROR_CODES.get(error_code, f"Unknown error code: {error_code}")

def get_device_status_message(status: str) -> str:
    """Get status message for a device status"""
    return DEVICE_STATUS_MESSAGES.get(status, f"Unknown status: {status}")

def get_sync_status_message(status: str) -> str:
    """Get status message for a sync status"""
    return SYNC_STATUS_MESSAGES.get(status, f"Unknown sync status: {status}") 