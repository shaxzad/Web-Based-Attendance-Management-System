# Database Rules

## Migration Management
- Use Alembic for all database migrations
- Write reversible migrations when possible
- Test migrations on development data before production
- Use descriptive migration names
- Include proper rollback procedures

## Schema Design
- Use proper foreign key relationships
- Add indexes for frequently queried fields
- Use appropriate data types and constraints
- Implement soft deletes where appropriate
- Use UUIDs for primary keys when security is important

## Migration File Patterns
```python
# Example migration structure
"""Add user attendance tracking

Revision ID: 001_add_attendance_table
Revises: 000_initial_schema
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    # Create attendance table
    op.create_table(
        'attendance',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('check_in_time', sa.DateTime(), nullable=False),
        sa.Column('check_out_time', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes
    op.create_index('ix_attendance_user_id', 'attendance', ['user_id'])
    op.create_index('ix_attendance_check_in_time', 'attendance', ['check_in_time'])

def downgrade() -> None:
    op.drop_index('ix_attendance_check_in_time', table_name='attendance')
    op.drop_index('ix_attendance_user_id', table_name='attendance')
    op.drop_table('attendance')
```

## Database Operations
- Always use parameterized queries
- Implement proper error handling
- Use transactions for multi-step operations
- Monitor query performance
- Use connection pooling

## Data Validation
- Validate data at the database level with constraints
- Use check constraints for business rules
- Implement proper foreign key constraints
- Use unique constraints where appropriate
- Validate data types and formats

## Performance Guidelines
- Add indexes for WHERE, ORDER BY, and JOIN clauses
- Use composite indexes for multi-column queries
- Monitor slow queries and optimize
- Use appropriate data types
- Consider partitioning for large tables

## Backup and Recovery
- Regular automated backups
- Test backup restoration procedures
- Use point-in-time recovery when possible
- Document recovery procedures
- Monitor backup success and size

## Security
- Use least privilege principle for database users
- Encrypt sensitive data at rest
- Use SSL connections in production
- Regular security updates
- Audit logging for sensitive operations 