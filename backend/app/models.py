import uuid
from datetime import datetime, date

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    employee: "Employee" = Relationship(back_populates="user", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Department Management
class DepartmentBase(SQLModel):
    name: str = Field(max_length=100, index=True)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(DepartmentBase):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


class Department(DepartmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    employees: list["Employee"] = Relationship(back_populates="department")


class DepartmentPublic(DepartmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# Employee Management
class EmployeeBase(SQLModel):
    employee_id: str = Field(unique=True, index=True, max_length=20)  # Company employee ID
    cnic: str = Field(unique=True, index=True, max_length=15)  # CNIC number
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    phone: str = Field(max_length=20)
    address: str | None = Field(default=None, max_length=500)
    date_of_birth: datetime | None = None
    hire_date: datetime
    salary: float | None = None
    is_active: bool = True
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)


class EmployeeCreate(EmployeeBase):
    department_id: uuid.UUID
    user_id: uuid.UUID | None = None  # Optional: link to user account


class EmployeeUpdate(EmployeeBase):
    employee_id: str | None = Field(default=None, max_length=20)
    cnic: str | None = Field(default=None, max_length=15)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=500)
    date_of_birth: datetime | None = None
    hire_date: datetime | None = None
    salary: float | None = None
    is_active: bool | None = None
    department_id: uuid.UUID | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)


class Employee(EmployeeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    department_id: uuid.UUID = Field(foreign_key="department.id", nullable=False)
    user_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    department: Department = Relationship(back_populates="employees")
    user: User | None = Relationship(back_populates="employee")
    attendances: list["Attendance"] = Relationship(back_populates="employee", cascade_delete=True)
    fingerprints: list["Fingerprint"] = Relationship(back_populates="employee", cascade_delete=True)


class EmployeePublic(EmployeeBase):
    id: uuid.UUID
    department_id: uuid.UUID
    user_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class EmployeesPublic(SQLModel):
    data: list[EmployeePublic]
    count: int


# Fingerprint Management Models
class FingerprintBase(SQLModel):
    employee_id: uuid.UUID = Field(foreign_key="employee.id", nullable=False)
    fingerprint_type: str = Field(max_length=20)  # thumb, index, middle, ring, pinky
    fingerprint_position: int = Field(ge=1, le=5)  # Position 1-5 for each finger type
    fingerprint_data: str = Field(max_length=1000000)  # Base64 encoded fingerprint image
    fingerprint_format: str = Field(default="base64", max_length=20)  # base64, binary, etc.
    quality_score: float | None = Field(default=None, ge=0, le=100)  # Quality score 0-100
    is_active: bool = Field(default=True)
    notes: str | None = Field(default=None, max_length=500)


class FingerprintCreate(FingerprintBase):
    pass


class FingerprintUpdate(SQLModel):
    fingerprint_type: str | None = Field(default=None, max_length=20)
    fingerprint_position: int | None = Field(default=None, ge=1, le=5)
    fingerprint_data: str | None = Field(default=None, max_length=1000000)
    fingerprint_format: str | None = Field(default=None, max_length=20)
    quality_score: float | None = Field(default=None, ge=0, le=100)
    is_active: bool | None = None
    notes: str | None = Field(default=None, max_length=500)


class Fingerprint(FingerprintBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    employee: Employee = Relationship(back_populates="fingerprints")


class FingerprintPublic(FingerprintBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class FingerprintsPublic(SQLModel):
    data: list[FingerprintPublic]
    count: int


# Employee Fingerprint Summary
class EmployeeFingerprintSummary(SQLModel):
    employee_id: uuid.UUID
    employee_name: str
    total_fingerprints: int
    thumb_fingerprints: int
    index_fingerprints: int
    middle_fingerprints: int
    ring_fingerprints: int
    pinky_fingerprints: int
    last_updated: datetime | None = None


# Bulk Fingerprint Operations
class BulkFingerprintCreate(SQLModel):
    employee_id: uuid.UUID
    fingerprints: list[FingerprintCreate]


class BulkFingerprintResponse(SQLModel):
    success_count: int
    failed_count: int
    errors: list[str]


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# ZKTeco Device Management Models
class ZKTecoDeviceBase(SQLModel):
    device_name: str = Field(max_length=100)
    device_ip: str = Field(max_length=15)  # IP address of the device
    device_port: int = Field(default=4370)  # Default ZKTeco port
    device_id: str = Field(unique=True, max_length=50)  # Device serial number
    location: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    sync_interval: int = Field(default=5, description="Sync interval in minutes")
    last_sync: datetime | None = None
    device_status: str = Field(default="offline", max_length=20)  # online, offline, error


class ZKTecoDeviceCreate(ZKTecoDeviceBase):
    pass


class ZKTecoDeviceUpdate(SQLModel):
    device_name: str | None = Field(default=None, max_length=100)
    device_ip: str | None = Field(default=None, max_length=15)
    device_port: int | None = Field(default=None)
    location: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    sync_interval: int | None = Field(default=None, description="Sync interval in minutes")


class ZKTecoDevice(ZKTecoDeviceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    attendances: list["Attendance"] = Relationship(back_populates="device")


class ZKTecoDevicePublic(ZKTecoDeviceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ZKTecoDevicesPublic(SQLModel):
    data: list[ZKTecoDevicePublic]
    count: int


# Enhanced Attendance Models with device support
class AttendanceBase(SQLModel):
    check_in_time: datetime
    check_out_time: datetime | None = None
    device_id: str | None = Field(default=None, max_length=100)  # ZKTeco device ID
    zkteco_device_id: uuid.UUID | None = Field(default=None, foreign_key="zktecodevice.id")
    attendance_type: str = Field(default="fingerprint", max_length=20)  # fingerprint, card, manual
    status: str = Field(default="present", max_length=20)  # present, absent, late, early_leave


class AttendanceCreate(AttendanceBase):
    employee_id: uuid.UUID


class AttendanceUpdate(SQLModel):
    check_out_time: datetime | None = None
    status: str | None = Field(default=None, max_length=20)


class Attendance(AttendanceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    employee_id: uuid.UUID = Field(foreign_key="employee.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    employee: Employee = Relationship(back_populates="attendances")
    device: ZKTecoDevice | None = Relationship(back_populates="attendances")


class AttendancePublic(AttendanceBase):
    id: uuid.UUID
    employee_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AttendancesPublic(SQLModel):
    data: list[AttendancePublic]
    count: int


# ZKTeco Device Sync Log
class DeviceSyncLogBase(SQLModel):
    device_id: uuid.UUID
    sync_type: str = Field(max_length=20)  # attendance, users, logs
    records_synced: int = 0
    sync_status: str = Field(max_length=20)  # success, failed, partial
    error_message: str | None = Field(default=None, max_length=1000)
    sync_duration: float | None = Field(default=None)  # in seconds


class DeviceSyncLog(DeviceSyncLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HolidayBase(SQLModel):
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    holiday_date: date = Field()
    holiday_type: str = Field(default="public", max_length=50)  # public, company, special
    is_recurring: bool = Field(default=False)
    recurrence_pattern: str | None = Field(default=None, max_length=100)  # yearly, monthly, weekly
    color: str = Field(default="#3182CE", max_length=7)  # hex color
    is_active: bool = Field(default=True)


class Holiday(HolidayBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: uuid.UUID = Field(foreign_key="user.id")


class HolidayCreate(HolidayBase):
    pass


class HolidayUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    holiday_date: date | None = None
    holiday_type: str | None = Field(default=None, max_length=50)
    is_recurring: bool | None = None
    recurrence_pattern: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, max_length=7)
    is_active: bool | None = None


class HolidayPublic(HolidayBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID


class HolidaysPublic(SQLModel):
    data: list[HolidayPublic]
    count: int


class CalendarEvent(SQLModel):
    id: uuid.UUID
    title: str
    description: str | None
    date: date
    holiday_type: str
    color: str
    is_recurring: bool
    recurrence_pattern: str | None


class CalendarView(SQLModel):
    year: int
    month: int
    events: list[CalendarEvent]
    holidays: list[CalendarEvent]
