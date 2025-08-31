import uuid
from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session

from app import crud
from app.api import deps
from app.models import (
    Employee, Fingerprint, FingerprintCreate, FingerprintPublic, FingerprintUpdate, 
    FingerprintsPublic, EmployeeFingerprintSummary, BulkFingerprintCreate, BulkFingerprintResponse,
    ZKTecoDevice
)
from app.services.zkteco_fingerprint_service import ZKTecoFingerprintService

router = APIRouter()


@router.get("/", response_model=FingerprintsPublic)
def read_fingerprints(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    employee_id: str | None = Query(None, description="Filter by employee ID"),
    fingerprint_type: str | None = Query(None, description="Filter by fingerprint type"),
    is_active: bool | None = Query(None, description="Filter by active status"),
) -> Any:
    """
    Retrieve fingerprints with optional filtering.
    """
    # Parse employee_id if provided
    employee_uuid = None
    if employee_id:
        try:
            employee_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    # Get fingerprints using CRUD functions
    if employee_uuid:
        fingerprints = crud.get_employee_fingerprints(session=db, employee_id=employee_uuid)
    else:
        # Get all fingerprints (you might want to add pagination here)
        fingerprints = crud.get_fingerprints(
            session=db,
            skip=skip,
            limit=limit,
            employee_id=employee_uuid,
            fingerprint_type=fingerprint_type,
            is_active=is_active
        )
    
    return FingerprintsPublic(data=fingerprints, count=len(fingerprints))


@router.post("/", response_model=FingerprintPublic)
def create_fingerprint(
    *,
    db: Session = Depends(deps.get_db),
    fingerprint_in: FingerprintCreate,
) -> Any:
    """
    Create new fingerprint for an employee.
    """
    try:
        fingerprint = crud.create_fingerprint(session=db, fingerprint_in=fingerprint_in)
        return fingerprint
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating fingerprint: {str(e)}")


@router.post("/upload-image")
def upload_fingerprint_image(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str = Query(..., description="Employee ID"),
    fingerprint_type: str = Query("thumb", description="Fingerprint type (thumb, index, middle, ring, pinky)"),
    fingerprint_position: int = Query(..., description="Position number (1-5)"),
    file: UploadFile = File(...),
    notes: str | None = Query(None, description="Optional notes"),
) -> Any:
    """
    Upload fingerprint image file.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read and encode file
    file_content = file.file.read()
    import base64
    encoded_data = base64.b64encode(file_content).decode("utf-8")
    
    # Create fingerprint data
    fingerprint_data = f"data:{file.content_type};base64,{encoded_data}"
    
    # Create fingerprint record
    fingerprint_in = FingerprintCreate(
        employee_id=employee_uuid,
        fingerprint_type=fingerprint_type,
        fingerprint_position=fingerprint_position,
        fingerprint_data=fingerprint_data,
        fingerprint_format="image",
        notes=notes
    )
    
    fingerprint_service = FingerprintStorageService(db)
    
    try:
        fingerprint = fingerprint_service.create_fingerprint(fingerprint_in)
        return {
            "message": "Fingerprint uploaded successfully",
            "fingerprint_id": str(fingerprint.id),
            "quality_score": fingerprint.quality_score,
            "file_path": fingerprint.notes
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading fingerprint: {str(e)}")


@router.get("/{fingerprint_id}", response_model=FingerprintPublic)
def read_fingerprint(
    *,
    db: Session = Depends(deps.get_db),
    fingerprint_id: str,
) -> Any:
    """
    Get fingerprint by ID.
    """
    try:
        fingerprint_uuid = uuid.UUID(fingerprint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid fingerprint ID")
    
    fingerprint = crud.get_fingerprint(session=db, fingerprint_id=fingerprint_uuid)
    if not fingerprint:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    
    return fingerprint


@router.put("/{fingerprint_id}", response_model=FingerprintPublic)
def update_fingerprint(
    *,
    db: Session = Depends(deps.get_db),
    fingerprint_id: str,
    fingerprint_in: FingerprintUpdate,
) -> Any:
    """
    Update fingerprint.
    """
    try:
        fingerprint_uuid = uuid.UUID(fingerprint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid fingerprint ID")
    
    fingerprint = crud.get_fingerprint(session=db, fingerprint_id=fingerprint_uuid)
    if not fingerprint:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    
    fingerprint_service = FingerprintStorageService(db)
    
    try:
        updated_fingerprint = fingerprint_service.update_fingerprint(fingerprint_uuid, fingerprint_in)
        return updated_fingerprint
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating fingerprint: {str(e)}")


@router.delete("/{fingerprint_id}")
def delete_fingerprint(
    *,
    db: Session = Depends(deps.get_db),
    fingerprint_id: str,
) -> Any:
    """
    Delete fingerprint.
    """
    try:
        fingerprint_uuid = uuid.UUID(fingerprint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid fingerprint ID")
    
    fingerprint_service = FingerprintStorageService(db)
    
    success = fingerprint_service.delete_fingerprint(fingerprint_uuid)
    if not success:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    
    return {"message": "Fingerprint deleted successfully"}


@router.get("/employee/{employee_id}/summary", response_model=EmployeeFingerprintSummary)
def get_employee_fingerprint_summary(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Get fingerprint summary for an employee.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    fingerprint_service = FingerprintStorageService(db)
    
    try:
        summary = fingerprint_service.get_fingerprint_summary(employee_uuid)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/employee/{employee_id}/fingerprints", response_model=FingerprintsPublic)
def get_employee_fingerprints(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    fingerprint_type: str | None = Query(None, description="Filter by fingerprint type"),
) -> Any:
    """
    Get all fingerprints for an employee.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    fingerprint_service = FingerprintStorageService(db)
    
    try:
        fingerprints = fingerprint_service.get_employee_fingerprints(employee_uuid, fingerprint_type)
        return FingerprintsPublic(data=fingerprints, count=len(fingerprints))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/employee/{employee_id}/available-positions")
def get_available_positions(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    fingerprint_type: str = Query(..., description="Fingerprint type"),
) -> Any:
    """
    Get available positions for a fingerprint type.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    fingerprint_service = FingerprintStorageService(db)
    
    try:
        available_positions = fingerprint_service.get_available_positions(employee_uuid, fingerprint_type)
        return {
            "employee_id": employee_id,
            "fingerprint_type": fingerprint_type,
            "available_positions": available_positions,
            "max_positions": fingerprint_service.max_fingerprints_per_type
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/employee/{employee_id}/bulk", response_model=BulkFingerprintResponse)
def bulk_create_fingerprints(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    bulk_data: BulkFingerprintCreate,
) -> Any:
    """
    Bulk create fingerprints for an employee.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    # Validate employee_id matches
    if bulk_data.employee_id != employee_uuid:
        raise HTTPException(status_code=400, detail="Employee ID mismatch")
    
    fingerprint_service = FingerprintStorageService(db)
    
    try:
        results = fingerprint_service.bulk_create_fingerprints(employee_uuid, bulk_data.fingerprints)
        return BulkFingerprintResponse(**results)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating fingerprints: {str(e)}")


@router.post("/employee/{employee_id}/bulk-thumbs")
def bulk_create_thumb_fingerprints(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    fingerprint_data_list: List[str] = Query(..., description="List of base64 encoded fingerprint images"),
    notes: str | None = Query(None, description="Optional notes"),
) -> Any:
    """
    Bulk create thumb fingerprints for an employee (up to 5 thumbs).
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    if len(fingerprint_data_list) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 thumb fingerprints allowed")
    
    fingerprint_service = FingerprintStorageService(db)
    
    # Get available positions
    available_positions = fingerprint_service.get_available_positions(employee_uuid, "thumb")
    
    if len(fingerprint_data_list) > len(available_positions):
        raise HTTPException(
            status_code=400, 
            detail=f"Only {len(available_positions)} positions available for thumb fingerprints"
        )
    
    # Create fingerprint records
    fingerprints = []
    for i, fingerprint_data in enumerate(fingerprint_data_list):
        fingerprint_in = FingerprintCreate(
            employee_id=employee_uuid,
            fingerprint_type="thumb",
            fingerprint_position=available_positions[i],
            fingerprint_data=fingerprint_data,
            fingerprint_format="image",
            notes=notes
        )
        fingerprints.append(fingerprint_in)
    
    try:
        results = fingerprint_service.bulk_create_fingerprints(employee_uuid, fingerprints)
        return {
            "message": f"Successfully created {results['total_added']} thumb fingerprints",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating thumb fingerprints: {str(e)}")


@router.get("/statistics")
def get_fingerprint_statistics(
    *,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get overall fingerprint statistics.
    """
    fingerprint_service = FingerprintStorageService(db)
    
    try:
        stats = fingerprint_service.get_fingerprint_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")


@router.get("/validate/{fingerprint_id}")
def validate_fingerprint_quality(
    *,
    db: Session = Depends(deps.get_db),
    fingerprint_id: str,
) -> Any:
    """
    Validate fingerprint quality and provide recommendations.
    """
    try:
        fingerprint_uuid = uuid.UUID(fingerprint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid fingerprint ID")
    
    fingerprint = crud.get_fingerprint(session=db, fingerprint_id=fingerprint_uuid)
    if not fingerprint:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    
    # Analyze quality
    quality_score = fingerprint.quality_score or 0
    
    recommendations = []
    if quality_score < 50:
        recommendations.append("Low quality fingerprint - consider re-capturing")
    elif quality_score < 70:
        recommendations.append("Medium quality - acceptable but could be improved")
    else:
        recommendations.append("High quality fingerprint")
    
    if fingerprint.fingerprint_format == "image":
        recommendations.append("Image format detected - suitable for storage and analysis")
    
    return {
        "fingerprint_id": fingerprint_id,
        "quality_score": quality_score,
        "fingerprint_type": fingerprint.fingerprint_type,
        "fingerprint_position": fingerprint.fingerprint_position,
        "format": fingerprint.fingerprint_format,
        "recommendations": recommendations,
        "status": "excellent" if quality_score >= 80 else "good" if quality_score >= 60 else "needs_improvement"
    }


# ZKTeco Device Integration Endpoints

@router.post("/capture-from-device/{device_id}/{employee_id}")
def capture_fingerprint_from_device(
    device_id: str,
    employee_id: UUID,
    fingerprint_type: str = "thumb",
    position: int = 1,
    db: Session = Depends(deps.get_db)
):
    """
    Capture fingerprint directly from ZKTeco device.
    Device must be added and connected through device management first.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    # Get device from database (must be added through device management)
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found. Please add device through device management first.")
    
    # Check if device is connected
    if device.device_status != "online":
        raise HTTPException(
            status_code=503, 
            detail=f"Device {device.device_name} is not connected. Please connect the device through device management first."
        )
    
    # Use ZKTeco fingerprint service
    fingerprint_service = ZKTecoFingerprintService(db)
    
    try:
        fingerprint = fingerprint_service.capture_fingerprint_from_device(
            device=device,
            employee_id=employee_id,
            fingerprint_type=fingerprint_type,
            position=position
        )
        
        if not fingerprint:
            raise HTTPException(status_code=400, detail="Failed to capture fingerprint from device")
        
        return fingerprint
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error capturing fingerprint: {str(e)}")


@router.post("/verify-on-device/{device_id}/{employee_id}")
def verify_fingerprint_on_device(
    device_id: str,
    employee_id: UUID,
    db: Session = Depends(deps.get_db)
):
    """
    Verify fingerprint on ZKTeco device in real-time.
    Device must be added and connected through device management first.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    # Get device from database (must be added through device management)
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found. Please add device through device management first.")
    
    # Check if device is connected
    if device.device_status != "online":
        raise HTTPException(
            status_code=503, 
            detail=f"Device {device.device_name} is not connected. Please connect the device through device management first."
        )
    
    # Use ZKTeco fingerprint service
    fingerprint_service = ZKTecoFingerprintService(db)
    
    try:
        is_verified = fingerprint_service.verify_fingerprint_on_device(
            device=device,
            employee_id=employee_id
        )
        
        return {"verified": is_verified, "employee_id": employee_id, "device_id": device_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying fingerprint: {str(e)}")


@router.post("/sync-from-device/{device_id}")
def sync_fingerprints_from_device(
    device_id: str,
    db: Session = Depends(deps.get_db)
):
    """
    Sync all fingerprints from ZKTeco device to database.
    Device must be added and connected through device management first.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    # Get device from database (must be added through device management)
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found. Please add device through device management first.")
    
    # Check if device is connected
    if device.device_status != "online":
        raise HTTPException(
            status_code=503, 
            detail=f"Device {device.device_name} is not connected. Please connect the device through device management first."
        )
    
    # Use ZKTeco fingerprint service
    fingerprint_service = ZKTecoFingerprintService(db)
    
    try:
        count, status = fingerprint_service.sync_fingerprints_from_device(device)
        
        return {
            "fingerprints_synced": count,
            "status": status,
            "device_id": device_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing fingerprints: {str(e)}")


@router.post("/enroll-on-device/{device_id}/{employee_id}")
def enroll_fingerprint_on_device(
    device_id: str,
    employee_id: UUID,
    fingerprint_type: str = "thumb",
    position: int = 1,
    db: Session = Depends(deps.get_db)
):
    """
    Enroll a new fingerprint on ZKTeco device.
    Device must be added and connected through device management first.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    # Get device from database (must be added through device management)
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found. Please add device through device management first.")
    
    # Check if device is connected
    if device.device_status != "online":
        raise HTTPException(
            status_code=503, 
            detail=f"Device {device.device_name} is not connected. Please connect the device through device management first."
        )
    
    # Use ZKTeco fingerprint service
    fingerprint_service = ZKTecoFingerprintService(db)
    
    try:
        success = fingerprint_service.enroll_fingerprint_on_device(
            device=device,
            employee_id=employee_id,
            fingerprint_type=fingerprint_type,
            position=position
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to enroll fingerprint on device")
        
        return {"success": True, "employee_id": employee_id, "device_id": device_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enrolling fingerprint: {str(e)}")


@router.get("/device-users/{device_id}")
def get_device_users(
    device_id: str,
    db: Session = Depends(deps.get_db)
):
    """
    Get all users from ZKTeco device.
    Device must be added and connected through device management first.
    """
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    
    # Get device from database (must be added through device management)
    device = crud.get_zkteco_device(session=db, device_id=device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found. Please add device through device management first.")
    
    # Check if device is connected
    if device.device_status != "online":
        raise HTTPException(
            status_code=503, 
            detail=f"Device {device.device_name} is not connected. Please connect the device through device management first."
        )
    
    # Use ZKTeco fingerprint service
    fingerprint_service = ZKTecoFingerprintService(db)
    
    try:
        users = fingerprint_service.get_device_users(device)
        
        return {"users": users, "count": len(users), "device_id": device_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting device users: {str(e)}")


@router.get("/available-devices")
def get_available_devices(
    db: Session = Depends(deps.get_db)
):
    """
    Get all available ZKTeco devices from device management.
    Only returns devices that are added through device management.
    """
    try:
        devices = crud.get_zkteco_devices(session=db, is_active=True)
        
        device_list = []
        for device in devices:
            device_list.append({
                "id": str(device.id),
                "device_id": device.device_id,
                "device_name": device.device_name,
                "device_ip": device.device_ip,
                "device_port": device.device_port,
                "device_status": device.device_status,
                "is_active": device.is_active,
                "last_sync": device.last_sync.isoformat() if device.last_sync else None
            })
        
        return {
            "devices": device_list,
            "count": len(device_list),
            "message": "Only devices added through device management are shown"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting available devices: {str(e)}")
