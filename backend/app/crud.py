import uuid
from datetime import datetime, date, timedelta
from typing import Any, List

from sqlmodel import Session, select
from sqlalchemy import extract, func

from app.core.security import get_password_hash, verify_password
from app.models import (
    Attendance, AttendanceCreate, AttendanceUpdate, Department, DepartmentCreate, DepartmentUpdate,
    Employee, EmployeeCreate, EmployeeUpdate, Item, ItemCreate, User, UserCreate, UserUpdate,
    Holiday, HolidayCreate, HolidayUpdate, ZKTecoDevice, ZKTecoDeviceCreate, ZKTecoDeviceUpdate,
    DeviceSyncLog, DeviceSyncLogBase
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


def get_attendances(
    *, 
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    employee_id: uuid.UUID | None = None,
    device_id: uuid.UUID | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    status: str | None = None
) -> List[Attendance]:
    statement = select(Attendance)
    
    if employee_id:
        statement = statement.where(Attendance.employee_id == employee_id)
    if device_id:
        statement = statement.where(Attendance.zkteco_device_id == device_id)
    if start_date:
        statement = statement.where(Attendance.check_in_time >= start_date)
    if end_date:
        statement = statement.where(Attendance.check_in_time <= end_date)
    if status:
        statement = statement.where(Attendance.status == status)
    
    statement = statement.offset(skip).limit(limit).order_by(Attendance.check_in_time.desc())
    return session.exec(statement).all()


def update_attendance(*, session: Session, db_attendance: Attendance, attendance_in: AttendanceUpdate) -> Attendance:
    attendance_data = attendance_in.model_dump(exclude_unset=True)
    attendance_data["updated_at"] = datetime.utcnow()
    
    for field, value in attendance_data.items():
        setattr(db_attendance, field, value)
    
    session.add(db_attendance)
    session.commit()
    session.refresh(db_attendance)
    return db_attendance


def delete_attendance(*, session: Session, attendance_id: uuid.UUID) -> bool:
    attendance = get_attendance(session=session, attendance_id=attendance_id)
    if not attendance:
        return False
    session.delete(attendance)
    session.commit()
    return True


def get_attendance_count(*, session: Session) -> int:
    return session.exec(select(func.count(Attendance.id))).one()


# Holiday CRUD operations
def create_holiday(*, session: Session, holiday_in: HolidayCreate, created_by: uuid.UUID) -> Holiday:
    holiday_data = holiday_in.model_dump()
    holiday_data["created_by"] = created_by
    holiday = Holiday(**holiday_data)
    session.add(holiday)
    session.commit()
    session.refresh(holiday)
    return holiday


def get_holiday(*, session: Session, holiday_id: uuid.UUID) -> Holiday | None:
    return session.get(Holiday, holiday_id)


def get_holidays(
    *, 
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    year: int | None = None,
    month: int | None = None,
    holiday_type: str | None = None
) -> List[Holiday]:
    statement = select(Holiday)
    
    if year is not None:
        statement = statement.where(extract('year', Holiday.holiday_date) == year)
    if month is not None:
        statement = statement.where(extract('month', Holiday.holiday_date) == month)
    if holiday_type is not None:
        statement = statement.where(Holiday.holiday_type == holiday_type)
    
    statement = statement.offset(skip).limit(limit).order_by(Holiday.holiday_date)
    return session.exec(statement).all()


def get_holidays_for_date_range(
    *, 
    session: Session, 
    start_date: date, 
    end_date: date
) -> List[Holiday]:
    """Get all holidays (including recurring ones) for a date range"""
    # Get non-recurring holidays in the date range
    non_recurring = session.exec(
        select(Holiday)
        .where(Holiday.holiday_date >= start_date)
        .where(Holiday.holiday_date <= end_date)
        .where(Holiday.is_recurring == False)
        .where(Holiday.is_active == True)
    ).all()
    
    # Get recurring holidays
    recurring = session.exec(
        select(Holiday)
        .where(Holiday.is_recurring == True)
        .where(Holiday.is_active == True)
    ).all()
    
    # Generate recurring holiday instances for the date range
    recurring_instances = []
    for holiday in recurring:
        instances = generate_recurring_dates(holiday, start_date, end_date)
        for instance_date in instances:
            recurring_instances.append(Holiday(
                id=holiday.id,
                title=holiday.title,
                description=holiday.description,
                holiday_date=instance_date,
                holiday_type=holiday.holiday_type,
                is_recurring=holiday.is_recurring,
                recurrence_pattern=holiday.recurrence_pattern,
                color=holiday.color,
                is_active=holiday.is_active,
                created_at=holiday.created_at,
                updated_at=holiday.updated_at,
                created_by=holiday.created_by
            ))
    
    return non_recurring + recurring_instances


def generate_recurring_dates(holiday: Holiday, start_date: date, end_date: date) -> List[date]:
    """Generate recurring dates for a holiday within the given range"""
    if not holiday.is_recurring or not holiday.recurrence_pattern:
        return []
    
    dates = []
    current_date = holiday.holiday_date
    
    while current_date <= end_date:
        if current_date >= start_date:
            dates.append(current_date)
        
        # Calculate next occurrence based on pattern
        if holiday.recurrence_pattern == "yearly":
            current_date = current_date.replace(year=current_date.year + 1)
        elif holiday.recurrence_pattern == "monthly":
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        elif holiday.recurrence_pattern == "weekly":
            current_date = current_date + timedelta(days=7)
        else:
            break
    
    return dates


def update_holiday(*, session: Session, db_holiday: Holiday, holiday_in: HolidayUpdate) -> Holiday:
    update_data = holiday_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_holiday, field, value)
    
    session.add(db_holiday)
    session.commit()
    session.refresh(db_holiday)
    return db_holiday


def delete_holiday(*, session: Session, holiday_id: uuid.UUID) -> None:
    holiday = session.get(Holiday, holiday_id)
    if holiday:
        session.delete(holiday)
        session.commit()


def get_holiday_count(*, session: Session) -> int:
    return session.exec(select(func.count(Holiday.id))).one()


# ZKTeco Device CRUD operations
def create_zkteco_device(*, session: Session, device_in: ZKTecoDeviceCreate) -> ZKTecoDevice:
    device_data = device_in.model_dump()
    device = ZKTecoDevice(**device_data)
    session.add(device)
    session.commit()
    session.refresh(device)
    return device


def get_zkteco_device(*, session: Session, device_id: uuid.UUID) -> ZKTecoDevice | None:
    return session.get(ZKTecoDevice, device_id)


def get_zkteco_device_by_device_id(*, session: Session, device_id: str) -> ZKTecoDevice | None:
    statement = select(ZKTecoDevice).where(ZKTecoDevice.device_id == device_id)
    return session.exec(statement).first()


def get_zkteco_devices(*, session: Session, skip: int = 0, limit: int = 100, is_active: bool | None = None) -> List[ZKTecoDevice]:
    statement = select(ZKTecoDevice)
    if is_active is not None:
        statement = statement.where(ZKTecoDevice.is_active == is_active)
    statement = statement.offset(skip).limit(limit)
    return session.exec(statement).all()


def update_zkteco_device(*, session: Session, db_device: ZKTecoDevice, device_in: ZKTecoDeviceUpdate) -> ZKTecoDevice:
    device_data = device_in.model_dump(exclude_unset=True)
    device_data["updated_at"] = datetime.utcnow()
    
    for field, value in device_data.items():
        setattr(db_device, field, value)
    
    session.add(db_device)
    session.commit()
    session.refresh(db_device)
    return db_device


def delete_zkteco_device(*, session: Session, device_id: uuid.UUID) -> bool:
    device = get_zkteco_device(session=session, device_id=device_id)
    if not device:
        return False
    session.delete(device)
    session.commit()
    return True


# Device Sync Log CRUD operations
def create_device_sync_log(*, session: Session, sync_log_in: DeviceSyncLogBase) -> DeviceSyncLog:
    sync_log = DeviceSyncLog(**sync_log_in.model_dump())
    session.add(sync_log)
    session.commit()
    session.refresh(sync_log)
    return sync_log


def get_device_sync_logs(
    *, 
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    device_id: uuid.UUID | None = None,
    sync_type: str | None = None,
    sync_status: str | None = None
) -> List[DeviceSyncLog]:
    statement = select(DeviceSyncLog)
    
    if device_id:
        statement = statement.where(DeviceSyncLog.device_id == device_id)
    if sync_type:
        statement = statement.where(DeviceSyncLog.sync_type == sync_type)
    if sync_status:
        statement = statement.where(DeviceSyncLog.sync_status == sync_status)
    
    statement = statement.offset(skip).limit(limit).order_by(DeviceSyncLog.created_at.desc())
    return session.exec(statement).all()


def get_device_sync_log(*, session: Session, log_id: uuid.UUID) -> DeviceSyncLog | None:
    return session.get(DeviceSyncLog, log_id)
