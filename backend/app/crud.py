import uuid
from datetime import datetime
from typing import Any, List

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Attendance, AttendanceCreate, Department, DepartmentCreate, DepartmentUpdate,
    Employee, EmployeeCreate, EmployeeUpdate, Item, ItemCreate, User, UserCreate, UserUpdate
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


# Department CRUD operations
def create_department(*, session: Session, department_in: DepartmentCreate) -> Department:
    db_department = Department.model_validate(department_in)
    session.add(db_department)
    session.commit()
    session.refresh(db_department)
    return db_department


def get_department(*, session: Session, department_id: uuid.UUID) -> Department | None:
    statement = select(Department).where(Department.id == department_id)
    return session.exec(statement).first()


def get_departments(*, session: Session, skip: int = 0, limit: int = 100) -> List[Department]:
    statement = select(Department).offset(skip).limit(limit)
    return session.exec(statement).all()


def update_department(*, session: Session, db_department: Department, department_in: DepartmentUpdate) -> Department:
    department_data = department_in.model_dump(exclude_unset=True)
    db_department.sqlmodel_update(department_data)
    session.add(db_department)
    session.commit()
    session.refresh(db_department)
    return db_department


def delete_department(*, session: Session, department_id: uuid.UUID) -> bool:
    department = get_department(session=session, department_id=department_id)
    if not department:
        return False
    session.delete(department)
    session.commit()
    return True


# Employee CRUD operations
def create_employee(*, session: Session, employee_in: EmployeeCreate) -> Employee:
    db_employee = Employee.model_validate(employee_in)
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    return db_employee


def get_employee(*, session: Session, employee_id: uuid.UUID) -> Employee | None:
    statement = select(Employee).where(Employee.id == employee_id)
    return session.exec(statement).first()


def get_employee_by_employee_id(*, session: Session, employee_id: str) -> Employee | None:
    statement = select(Employee).where(Employee.employee_id == employee_id)
    return session.exec(statement).first()


def get_employee_by_cnic(*, session: Session, cnic: str) -> Employee | None:
    statement = select(Employee).where(Employee.cnic == cnic)
    return session.exec(statement).first()


def get_employees(*, session: Session, skip: int = 0, limit: int = 100, department_id: uuid.UUID | None = None) -> List[Employee]:
    statement = select(Employee)
    if department_id:
        statement = statement.where(Employee.department_id == department_id)
    statement = statement.offset(skip).limit(limit)
    return session.exec(statement).all()


def update_employee(*, session: Session, db_employee: Employee, employee_in: EmployeeUpdate) -> Employee:
    employee_data = employee_in.model_dump(exclude_unset=True)
    db_employee.sqlmodel_update(employee_data)
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    return db_employee


def delete_employee(*, session: Session, employee_id: uuid.UUID) -> bool:
    employee = get_employee(session=session, employee_id=employee_id)
    if not employee:
        return False
    session.delete(employee)
    session.commit()
    return True


# Attendance CRUD operations
def create_attendance(*, session: Session, attendance_in: AttendanceCreate) -> Attendance:
    db_attendance = Attendance.model_validate(attendance_in)
    session.add(db_attendance)
    session.commit()
    session.refresh(db_attendance)
    return db_attendance


def get_attendance(*, session: Session, attendance_id: uuid.UUID) -> Attendance | None:
    statement = select(Attendance).where(Attendance.id == attendance_id)
    return session.exec(statement).first()


def get_employee_attendances(*, session: Session, employee_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Attendance]:
    statement = select(Attendance).where(Attendance.employee_id == employee_id).offset(skip).limit(limit)
    return session.exec(statement).all()


def update_attendance(*, session: Session, db_attendance: Attendance, check_out_time: datetime) -> Attendance:
    db_attendance.check_out_time = check_out_time
    session.add(db_attendance)
    session.commit()
    session.refresh(db_attendance)
    return db_attendance
