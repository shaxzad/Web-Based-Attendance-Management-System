import base64
import io
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from uuid import UUID

import cv2
import numpy as np
from PIL import Image
from sqlmodel import Session, select

from app.models import Employee, Fingerprint, FingerprintCreate, FingerprintUpdate, EmployeeFingerprintSummary

logger = logging.getLogger(__name__)


class FingerprintStorageService:
    """Service for managing employee fingerprint storage"""
    
    def __init__(self, db: Session):
        self.db = db
        self.storage_path = "fingerprints"  # Directory to store fingerprint images
        self.max_fingerprints_per_type = 5  # Maximum fingerprints per finger type
        self.supported_formats = ["image", "template", "feature_vector"]
        self.supported_types = ["thumb", "index", "middle", "ring", "pinky"]
        
        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_path, exist_ok=True)
    
    def validate_fingerprint_data(self, fingerprint_data: str, fingerprint_format: str) -> Tuple[bool, str]:
        """Validate fingerprint data format and content"""
        try:
            if fingerprint_format == "image":
                # Validate base64 image data
                if not fingerprint_data.startswith("data:image/"):
                    return False, "Invalid image format. Expected base64 encoded image."
                
                # Decode and validate image
                image_data = fingerprint_data.split(",")[1]
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
                
                # Check image dimensions (typical fingerprint images are 200x200 to 500x500)
                width, height = image.size
                if width < 100 or height < 100 or width > 1000 or height > 1000:
                    return False, f"Image dimensions ({width}x{height}) are outside acceptable range (100x100 to 1000x1000)"
                
                return True, "Valid image data"
            
            elif fingerprint_format == "template":
                # Validate template data (binary or encoded)
                if len(fingerprint_data) < 100:
                    return False, "Template data too short"
                return True, "Valid template data"
            
            elif fingerprint_format == "feature_vector":
                # Validate feature vector (numeric data)
                try:
                    features = np.frombuffer(base64.b64decode(fingerprint_data), dtype=np.float32)
                    if len(features) < 10:
                        return False, "Feature vector too short"
                    return True, "Valid feature vector"
                except:
                    return False, "Invalid feature vector format"
            
            else:
                return False, f"Unsupported format: {fingerprint_format}"
                
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def calculate_quality_score(self, fingerprint_data: str, fingerprint_format: str) -> float:
        """Calculate quality score for fingerprint data"""
        try:
            if fingerprint_format == "image":
                # Decode image and calculate quality metrics
                image_data = fingerprint_data.split(",")[1]
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
                
                # Convert to OpenCV format for analysis
                cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
                
                # Calculate quality metrics
                # 1. Contrast
                contrast = cv_image.std()
                
                # 2. Sharpness (using Laplacian variance)
                laplacian = cv2.Laplacian(cv_image, cv2.CV_64F)
                sharpness = laplacian.var()
                
                # 3. Brightness
                brightness = cv_image.mean()
                
                # 4. Ridge clarity (using Sobel)
                sobel_x = cv2.Sobel(cv_image, cv2.CV_64F, 1, 0, ksize=3)
                sobel_y = cv2.Sobel(cv_image, cv2.CV_64F, 0, 1, ksize=3)
                ridge_clarity = np.sqrt(sobel_x**2 + sobel_y**2).mean()
                
                # Normalize and combine metrics
                quality_score = (
                    min(contrast / 50, 1.0) * 0.3 +
                    min(sharpness / 1000, 1.0) * 0.3 +
                    min(brightness / 128, 1.0) * 0.2 +
                    min(ridge_clarity / 50, 1.0) * 0.2
                ) * 100
                
                return max(0, min(100, quality_score))
            
            else:
                # For non-image formats, return a default score
                return 75.0
                
        except Exception as e:
            logger.error(f"Error calculating quality score: {e}")
            return 50.0  # Default score
    
    def save_fingerprint_image(self, fingerprint_data: str, employee_id: UUID, fingerprint_type: str, position: int) -> str:
        """Save fingerprint image to file system"""
        try:
            # Create employee directory
            employee_dir = os.path.join(self.storage_path, str(employee_id))
            os.makedirs(employee_dir, exist_ok=True)
            
            # Generate filename
            filename = f"{fingerprint_type}_{position}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            filepath = os.path.join(employee_dir, filename)
            
            # Decode and save image
            image_data = fingerprint_data.split(",")[1]
            image_bytes = base64.b64decode(image_data)
            
            with open(filepath, "wb") as f:
                f.write(image_bytes)
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error saving fingerprint image: {e}")
            raise
    
    def create_fingerprint(self, fingerprint_in: FingerprintCreate) -> Fingerprint:
        """Create a new fingerprint record"""
        try:
            # Validate employee exists
            employee = self.db.exec(
                select(Employee).where(Employee.id == fingerprint_in.employee_id)
            ).first()
            
            if not employee:
                raise ValueError("Employee not found")
            
            # Validate fingerprint data
            is_valid, error_msg = self.validate_fingerprint_data(
                fingerprint_in.fingerprint_data, 
                fingerprint_in.fingerprint_format
            )
            
            if not is_valid:
                raise ValueError(error_msg)
            
            # Check if position is available
            existing = self.db.exec(
                select(Fingerprint).where(
                    Fingerprint.employee_id == fingerprint_in.employee_id,
                    Fingerprint.fingerprint_type == fingerprint_in.fingerprint_type,
                    Fingerprint.fingerprint_position == fingerprint_in.fingerprint_position,
                    Fingerprint.is_active == True
                )
            ).first()
            
            if existing:
                raise ValueError(f"Fingerprint position {fingerprint_in.fingerprint_position} already exists for {fingerprint_in.fingerprint_type}")
            
            # Calculate quality score
            quality_score = self.calculate_quality_score(
                fingerprint_in.fingerprint_data, 
                fingerprint_in.fingerprint_format
            )
            
            # Create fingerprint record
            fingerprint = Fingerprint(
                employee_id=fingerprint_in.employee_id,
                fingerprint_type=fingerprint_in.fingerprint_type,
                fingerprint_position=fingerprint_in.fingerprint_position,
                fingerprint_data=fingerprint_in.fingerprint_data,
                fingerprint_format=fingerprint_in.fingerprint_format,
                quality_score=quality_score,
                notes=fingerprint_in.notes
            )
            
            # Save image file if it's an image format
            if fingerprint_in.fingerprint_format == "image":
                filepath = self.save_fingerprint_image(
                    fingerprint_in.fingerprint_data,
                    fingerprint_in.employee_id,
                    fingerprint_in.fingerprint_type,
                    fingerprint_in.fingerprint_position
                )
                fingerprint.notes = f"File saved: {filepath}"
            
            self.db.add(fingerprint)
            self.db.commit()
            self.db.refresh(fingerprint)
            
            logger.info(f"Created fingerprint for employee {fingerprint_in.employee_id}, type: {fingerprint_in.fingerprint_type}, position: {fingerprint_in.fingerprint_position}")
            
            return fingerprint
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating fingerprint: {e}")
            raise
    
    def get_employee_fingerprints(self, employee_id: UUID, fingerprint_type: Optional[str] = None) -> List[Fingerprint]:
        """Get all fingerprints for an employee"""
        query = select(Fingerprint).where(
            Fingerprint.employee_id == employee_id,
            Fingerprint.is_active == True
        )
        
        if fingerprint_type:
            query = query.where(Fingerprint.fingerprint_type == fingerprint_type)
        
        return self.db.exec(query).all()
    
    def get_fingerprint_summary(self, employee_id: UUID) -> EmployeeFingerprintSummary:
        """Get fingerprint summary for an employee"""
        fingerprints = self.get_employee_fingerprints(employee_id)
        
        employee = self.db.exec(
            select(Employee).where(Employee.id == employee_id)
        ).first()
        
        if not employee:
            raise ValueError("Employee not found")
        
        # Count fingerprints by type
        thumb_count = len([f for f in fingerprints if f.fingerprint_type == "thumb"])
        index_count = len([f for f in fingerprints if f.fingerprint_type == "index"])
        middle_count = len([f for f in fingerprints if f.fingerprint_type == "middle"])
        ring_count = len([f for f in fingerprints if f.fingerprint_type == "ring"])
        pinky_count = len([f for f in fingerprints if f.fingerprint_type == "pinky"])
        
        # Get last updated timestamp
        last_updated = max([f.updated_at for f in fingerprints]) if fingerprints else None
        
        return EmployeeFingerprintSummary(
            employee_id=employee_id,
            employee_name=f"{employee.first_name} {employee.last_name}",
            total_fingerprints=len(fingerprints),
            thumb_fingerprints=thumb_count,
            index_fingerprints=index_count,
            middle_fingerprints=middle_count,
            ring_fingerprints=ring_count,
            pinky_fingerprints=pinky_count,
            last_updated=last_updated
        )
    
    def update_fingerprint(self, fingerprint_id: UUID, fingerprint_update: FingerprintUpdate) -> Fingerprint:
        """Update a fingerprint record"""
        fingerprint = self.db.exec(
            select(Fingerprint).where(Fingerprint.id == fingerprint_id)
        ).first()
        
        if not fingerprint:
            raise ValueError("Fingerprint not found")
        
        # Update fields
        update_data = fingerprint_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(fingerprint, field, value)
        
        fingerprint.updated_at = datetime.utcnow()
        
        # Recalculate quality score if data changed
        if fingerprint_update.fingerprint_data:
            fingerprint.quality_score = self.calculate_quality_score(
                fingerprint_update.fingerprint_data,
                fingerprint.fingerprint_format
            )
        
        self.db.add(fingerprint)
        self.db.commit()
        self.db.refresh(fingerprint)
        
        return fingerprint
    
    def delete_fingerprint(self, fingerprint_id: UUID) -> bool:
        """Delete a fingerprint record"""
        fingerprint = self.db.exec(
            select(Fingerprint).where(Fingerprint.id == fingerprint_id)
        ).first()
        
        if not fingerprint:
            return False
        
        # Soft delete
        fingerprint.is_active = False
        fingerprint.updated_at = datetime.utcnow()
        
        self.db.add(fingerprint)
        self.db.commit()
        
        return True
    
    def bulk_create_fingerprints(self, employee_id: UUID, fingerprints: List[FingerprintCreate]) -> Dict[str, Any]:
        """Bulk create fingerprints for an employee"""
        employee = self.db.exec(
            select(Employee).where(Employee.id == employee_id)
        ).first()
        
        if not employee:
            raise ValueError("Employee not found")
        
        results = {
            "employee_id": employee_id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "total_added": 0,
            "total_failed": 0,
            "errors": []
        }
        
        for fingerprint_in in fingerprints:
            try:
                # Set employee_id if not provided
                if not fingerprint_in.employee_id:
                    fingerprint_in.employee_id = employee_id
                
                self.create_fingerprint(fingerprint_in)
                results["total_added"] += 1
                
            except Exception as e:
                results["total_failed"] += 1
                results["errors"].append(f"Position {fingerprint_in.fingerprint_position}: {str(e)}")
        
        return results
    
    def get_available_positions(self, employee_id: UUID, fingerprint_type: str) -> List[int]:
        """Get available positions for a fingerprint type"""
        existing_positions = self.db.exec(
            select(Fingerprint.fingerprint_position).where(
                Fingerprint.employee_id == employee_id,
                Fingerprint.fingerprint_type == fingerprint_type,
                Fingerprint.is_active == True
            )
        ).all()
        
        # Handle both tuple and scalar results
        if existing_positions and isinstance(existing_positions[0], tuple):
            existing_positions = [pos[0] for pos in existing_positions]
        else:
            existing_positions = [pos for pos in existing_positions]
            
        all_positions = list(range(1, self.max_fingerprints_per_type + 1))
        
        return [pos for pos in all_positions if pos not in existing_positions]
    
    def get_fingerprint_statistics(self) -> Dict[str, Any]:
        """Get overall fingerprint statistics"""
        total_employees = len(self.db.exec(select(Employee)).all())
        
        employees_with_fingerprints = len(self.db.exec(
            select(Employee).join(Fingerprint).where(Fingerprint.is_active == True)
        ).all())
        
        total_fingerprints = len(self.db.exec(
            select(Fingerprint).where(Fingerprint.is_active == True)
        ).all())
        
        # Count by type
        thumb_count = len(self.db.exec(
            select(Fingerprint).where(
                Fingerprint.fingerprint_type == "thumb",
                Fingerprint.is_active == True
            )
        ).all())
        
        index_count = len(self.db.exec(
            select(Fingerprint).where(
                Fingerprint.fingerprint_type == "index",
                Fingerprint.is_active == True
            )
        ).all())
        
        return {
            "total_employees": total_employees,
            "employees_with_fingerprints": employees_with_fingerprints,
            "total_fingerprints": total_fingerprints,
            "thumb_fingerprints": thumb_count,
            "index_fingerprints": index_count,
            "coverage_percentage": (employees_with_fingerprints / total_employees * 100) if total_employees > 0 else 0
        }

