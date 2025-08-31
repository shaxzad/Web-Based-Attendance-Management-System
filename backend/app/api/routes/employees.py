import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app import crud
from app.api import deps
from app.models import Employee, EmployeeCreate, EmployeePublic, EmployeeUpdate, EmployeesPublic

router = APIRouter()


@router.get("/", response_model=EmployeesPublic)
def read_employees(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    department_id: str | None = Query(None, description="Filter by department ID"),
) -> Any:
    """
    Retrieve employees.
    """
    dept_uuid = None
    if department_id:
        try:
            dept_uuid = uuid.UUID(department_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid department ID")
    
    employees = crud.get_employees(session=db, skip=skip, limit=limit, department_id=dept_uuid)
    return EmployeesPublic(data=employees, count=len(employees))


@router.post("/", response_model=EmployeePublic)
def create_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_in: EmployeeCreate,
) -> Any:
    """
    Create new employee.
    """
    # Check if employee_id already exists
    existing_employee = crud.get_employee_by_employee_id(session=db, employee_id=employee_in.employee_id)
    if existing_employee:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    # Check if CNIC already exists
    existing_cnic = crud.get_employee_by_cnic(session=db, cnic=employee_in.cnic)
    if existing_cnic:
        raise HTTPException(status_code=400, detail="CNIC already exists")
    
    # Verify department exists
    if employee_in.department_id:
        department = crud.get_department(session=db, department_id=employee_in.department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
    
    employee = crud.create_employee(session=db, employee_in=employee_in)
    return employee


@router.get("/{employee_id}", response_model=EmployeePublic)
def read_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Get employee by ID.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    employee = crud.get_employee(session=db, employee_id=employee_uuid)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.get("/by-employee-id/{employee_id}", response_model=EmployeePublic)
def read_employee_by_employee_id(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Get employee by employee ID (company ID).
    """
    employee = crud.get_employee_by_employee_id(session=db, employee_id=employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.get("/by-cnic/{cnic}", response_model=EmployeePublic)
def read_employee_by_cnic(
    *,
    db: Session = Depends(deps.get_db),
    cnic: str,
) -> Any:
    """
    Get employee by CNIC.
    """
    employee = crud.get_employee_by_cnic(session=db, cnic=cnic)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=EmployeePublic)
def update_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
    employee_in: EmployeeUpdate,
) -> Any:
    """
    Update employee.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    employee = crud.get_employee(session=db, employee_id=employee_uuid)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if employee_id is being updated and if it already exists
    if employee_in.employee_id and employee_in.employee_id != employee.employee_id:
        existing_employee = crud.get_employee_by_employee_id(session=db, employee_id=employee_in.employee_id)
        if existing_employee:
            raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    # Check if CNIC is being updated and if it already exists
    if employee_in.cnic and employee_in.cnic != employee.cnic:
        existing_cnic = crud.get_employee_by_cnic(session=db, cnic=employee_in.cnic)
        if existing_cnic:
            raise HTTPException(status_code=400, detail="CNIC already exists")
    
    # Verify department exists if being updated
    if employee_in.department_id:
        department = crud.get_department(session=db, department_id=employee_in.department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
    
    employee = crud.update_employee(session=db, db_employee=employee, employee_in=employee_in)
    return employee


@router.delete("/{employee_id}")
def delete_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: str,
) -> Any:
    """
    Delete employee.
    """
    try:
        employee_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    
    employee = crud.get_employee(session=db, employee_id=employee_uuid)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    crud.delete_employee(session=db, employee_id=employee_uuid)
    return {"message": "Employee deleted successfully"} 