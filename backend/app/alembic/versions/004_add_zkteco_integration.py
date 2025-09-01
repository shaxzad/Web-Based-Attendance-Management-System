"""Add ZKTeco device integration

Revision ID: 004_add_zkteco_integration
Revises: 003_add_holidays_table
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_zkteco_integration'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create zkteco_device table
    op.create_table('zktecodevice',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_name', sa.String(length=100), nullable=False),
        sa.Column('device_ip', sa.String(length=15), nullable=False),
        sa.Column('device_port', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.String(length=50), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sync_interval', sa.Integer(), nullable=False),
        sa.Column('last_sync', sa.DateTime(), nullable=True),
        sa.Column('device_status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for zkteco_device
    op.create_index('ix_zktecodevice_device_id', 'zktecodevice', ['device_id'], unique=True)
    op.create_index('ix_zktecodevice_device_ip', 'zktecodevice', ['device_ip'])
    op.create_index('ix_zktecodevice_is_active', 'zktecodevice', ['is_active'])
    
    # Add new columns to attendance table
    op.add_column('attendance', sa.Column('zkteco_device_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('attendance', sa.Column('attendance_type', sa.String(length=20), nullable=False, server_default='fingerprint'))
    op.add_column('attendance', sa.Column('status', sa.String(length=20), nullable=False, server_default='present'))
    
    # Create foreign key for attendance.zkteco_device_id
    op.create_foreign_key('fk_attendance_zkteco_device_id', 'attendance', 'zktecodevice', ['zkteco_device_id'], ['id'])
    
    # Create index for attendance.zkteco_device_id
    op.create_index('ix_attendance_zkteco_device_id', 'attendance', ['zkteco_device_id'])
    op.create_index('ix_attendance_attendance_type', 'attendance', ['attendance_type'])
    op.create_index('ix_attendance_status', 'attendance', ['status'])
    
    # Create device_sync_log table
    op.create_table('devicesynclog',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sync_type', sa.String(length=20), nullable=False),
        sa.Column('records_synced', sa.Integer(), nullable=False),
        sa.Column('sync_status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.String(length=1000), nullable=True),
        sa.Column('sync_duration', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for device_sync_log
    op.create_index('ix_devicesynclog_device_id', 'devicesynclog', ['device_id'])
    op.create_index('ix_devicesynclog_sync_type', 'devicesynclog', ['sync_type'])
    op.create_index('ix_devicesynclog_sync_status', 'devicesynclog', ['sync_status'])
    op.create_index('ix_devicesynclog_created_at', 'devicesynclog', ['created_at'])
    
    # Create foreign key for device_sync_log.device_id
    op.create_foreign_key('fk_devicesynclog_device_id', 'devicesynclog', 'zktecodevice', ['device_id'], ['id'])
    
    # Create fingerprint table
    op.create_table('fingerprint',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('fingerprint_type', sa.String(length=20), nullable=False),
        sa.Column('fingerprint_position', sa.String(length=20), nullable=False),
        sa.Column('fingerprint_data', sa.TEXT(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for fingerprint table
    op.create_index('ix_fingerprint_employee_id', 'fingerprint', ['employee_id'])
    op.create_index('ix_fingerprint_fingerprint_type', 'fingerprint', ['fingerprint_type'])
    op.create_index('ix_fingerprint_fingerprint_position', 'fingerprint', ['fingerprint_position'])
    op.create_index('ix_fingerprint_is_active', 'fingerprint', ['is_active'])
    op.create_index('ix_fingerprint_created_at', 'fingerprint', ['created_at'])
    
    # Create unique constraint for fingerprint
    op.create_unique_constraint('uq_fingerprint_employee_type_position', 'fingerprint', ['employee_id', 'fingerprint_type', 'fingerprint_position'])
    
    # Create foreign key for fingerprint.employee_id
    op.create_foreign_key('fingerprint_employee_id_fkey', 'fingerprint', 'employee', ['employee_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    # Drop foreign keys
    op.drop_constraint('fk_devicesynclog_device_id', 'devicesynclog', type_='foreignkey')
    op.drop_constraint('fk_attendance_zkteco_device_id', 'attendance', type_='foreignkey')
    
    # Drop indexes
    op.drop_index('ix_devicesynclog_created_at', table_name='devicesynclog')
    op.drop_index('ix_devicesynclog_sync_status', table_name='devicesynclog')
    op.drop_index('ix_devicesynclog_sync_type', table_name='devicesynclog')
    op.drop_index('ix_devicesynclog_device_id', table_name='devicesynclog')
    op.drop_index('ix_attendance_status', table_name='attendance')
    op.drop_index('ix_attendance_attendance_type', table_name='attendance')
    op.drop_index('ix_attendance_zkteco_device_id', table_name='attendance')
    op.drop_index('ix_zktecodevice_is_active', table_name='zktecodevice')
    op.drop_index('ix_zktecodevice_device_ip', table_name='zktecodevice')
    op.drop_index('ix_zktecodevice_device_id', table_name='zktecodevice')
    
    # Drop columns from attendance table
    op.drop_column('attendance', 'status')
    op.drop_column('attendance', 'attendance_type')
    op.drop_column('attendance', 'zkteco_device_id')
    
    # Drop foreign keys
    op.drop_constraint('fingerprint_employee_id_fkey', 'fingerprint', type_='foreignkey')
    
    # Drop indexes and constraints for fingerprint
    op.drop_constraint('uq_fingerprint_employee_type_position', 'fingerprint', type_='unique')
    op.drop_index('ix_fingerprint_created_at', table_name='fingerprint')
    op.drop_index('ix_fingerprint_is_active', table_name='fingerprint')
    op.drop_index('ix_fingerprint_fingerprint_position', table_name='fingerprint')
    op.drop_index('ix_fingerprint_fingerprint_type', table_name='fingerprint')
    op.drop_index('ix_fingerprint_employee_id', table_name='fingerprint')
    
    # Drop tables
    op.drop_table('fingerprint')
    op.drop_table('devicesynclog')
    op.drop_table('zktecodevice') 