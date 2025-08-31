import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app import crud
from app.api import deps
from app.models import Department, DepartmentCreate, DepartmentPublic, DepartmentUpdate

router = APIRouter()


@router.get("/", response_model=list[DepartmentPublic])
def read_departments(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Any:
    """
    Retrieve departments.
    """
    departments = crud.get_departments(session=db, skip=skip, limit=limit)
    return departments


@router.post("/", response_model=DepartmentPublic)
def create_department(
    *,
    db: Session = Depends(deps.get_db),
    department_in: DepartmentCreate,
) -> Any:
    """
    Create new department.
    """
    department = crud.create_department(session=db, department_in=department_in)
    return department


@router.get("/{department_id}", response_model=DepartmentPublic)
def read_department(
    *,
    db: Session = Depends(deps.get_db),
    department_id: str,
) -> Any:
    """
    Get department by ID.
    """
    try:
        department_uuid = uuid.UUID(department_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    department = crud.get_department(session=db, department_id=department_uuid)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.put("/{department_id}", response_model=DepartmentPublic)
def update_department(
    *,
    db: Session = Depends(deps.get_db),
    department_id: str,
    department_in: DepartmentUpdate,
) -> Any:
    """
    Update department.
    """
    try:
        department_uuid = uuid.UUID(department_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    department = crud.get_department(session=db, department_id=department_uuid)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    department = crud.update_department(session=db, db_department=department, department_in=department_in)
    return department


@router.delete("/{department_id}")
def delete_department(
    *,
    db: Session = Depends(deps.get_db),
    department_id: str,
) -> Any:
    """
    Delete department.
    """
    try:
        department_uuid = uuid.UUID(department_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    department = crud.get_department(session=db, department_id=department_uuid)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    crud.delete_department(session=db, department_id=department_uuid)
    return {"message": "Department deleted successfully"} 