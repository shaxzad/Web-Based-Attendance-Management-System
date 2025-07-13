"""Add employee management and departments

Revision ID: 002_employee_management
Revises: 1a31ce608336
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_employee_management'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create department table
    op.create_table(
        'department',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes for department
    op.create_index('ix_department_name', 'department', ['name'])
    
    # Create employee table
    op.create_table(
        'employee',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('employee_id', sa.String(length=20), nullable=False),
        sa.Column('cnic', sa.String(length=15), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('date_of_birth', sa.DateTime(), nullable=True),
        sa.Column('hire_date', sa.DateTime(), nullable=False),
        sa.Column('salary', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('emergency_contact_name', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['department.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id'),
        sa.UniqueConstraint('cnic')
    )
    
    # Add indexes for employee
    op.create_index('ix_employee_employee_id', 'employee', ['employee_id'])
    op.create_index('ix_employee_cnic', 'employee', ['cnic'])
    op.create_index('ix_employee_department_id', 'employee', ['department_id'])
    op.create_index('ix_employee_user_id', 'employee', ['user_id'])
    
    # Create attendance table
    op.create_table(
        'attendance',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('check_in_time', sa.DateTime(), nullable=False),
        sa.Column('check_out_time', sa.DateTime(), nullable=True),
        sa.Column('device_id', sa.String(length=100), nullable=True),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employee.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes for attendance
    op.create_index('ix_attendance_employee_id', 'attendance', ['employee_id'])
    op.create_index('ix_attendance_check_in_time', 'attendance', ['check_in_time'])


def downgrade() -> None:
    # Drop attendance table
    op.drop_index('ix_attendance_check_in_time', table_name='attendance')
    op.drop_index('ix_attendance_employee_id', table_name='attendance')
    op.drop_table('attendance')
    
    # Drop employee table
    op.drop_index('ix_employee_user_id', table_name='employee')
    op.drop_index('ix_employee_department_id', table_name='employee')
    op.drop_index('ix_employee_cnic', table_name='employee')
    op.drop_index('ix_employee_employee_id', table_name='employee')
    op.drop_table('employee')
    
    # Drop department table
    op.drop_index('ix_department_name', table_name='department')
    op.drop_table('department') 