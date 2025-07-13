import uuid
from datetime import datetime

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


class EmployeePublic(EmployeeBase):
    id: uuid.UUID
    department_id: uuid.UUID
    user_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class EmployeesPublic(SQLModel):
    data: list[EmployeePublic]
    count: int


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


# Attendance Models (for future use)
class AttendanceBase(SQLModel):
    check_in_time: datetime
    check_out_time: datetime | None = None
    device_id: str | None = Field(default=None, max_length=100)  # Zetco device ID


class AttendanceCreate(AttendanceBase):
    employee_id: uuid.UUID


class Attendance(AttendanceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    employee_id: uuid.UUID = Field(foreign_key="employee.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    employee: Employee = Relationship(back_populates="attendances")


class AttendancePublic(AttendanceBase):
    id: uuid.UUID
    employee_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AttendancesPublic(SQLModel):
    data: list[AttendancePublic]
    count: int
