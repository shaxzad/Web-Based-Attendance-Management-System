from fastapi import APIRouter, Depends
from pydantic.networks import EmailStr
from sqlmodel import func, select
from datetime import datetime, timedelta

from app.api.deps import get_current_active_superuser, SessionDep
from app.models import Message, Department, Employee
from app.utils import generate_test_email, send_email

router = APIRouter(prefix="/utils", tags=["utils"])


@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> Message:
    """
    Test emails.
    """
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Test email sent")


@router.get("/health-check/")
async def health_check() -> bool:
    return True


@router.get("/dashboard-stats/")
def get_dashboard_stats(session: SessionDep) -> dict:
    """
    Get dashboard statistics.
    """
    # Get total counts
    total_departments = session.exec(select(func.count(Department.id))).one()
    total_employees = session.exec(select(func.count(Employee.id))).one()
    active_employees = session.exec(select(func.count(Employee.id)).where(Employee.is_active == True)).one()
    inactive_employees = total_employees - active_employees

    # Get employees by department
    departments = session.exec(select(Department)).all()
    department_stats = []
    
    for dept in departments:
        dept_employees = session.exec(
            select(Employee).where(Employee.department_id == dept.id)
        ).all()
        
        dept_active = len([e for e in dept_employees if e.is_active])
        dept_inactive = len(dept_employees) - dept_active
        
        department_stats.append({
            "id": str(dept.id),
            "name": dept.name,
            "total_employees": len(dept_employees),
            "active_employees": dept_active,
            "inactive_employees": dept_inactive
        })

    # Get recent hires (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_hires = session.exec(
        select(Employee).where(Employee.hire_date >= six_months_ago)
    ).all()

    # Group by month
    monthly_hires = {}
    for employee in recent_hires:
        hire_date = employee.hire_date
        month_key = f"{hire_date.year}-{hire_date.month:02d}"
        monthly_hires[month_key] = monthly_hires.get(month_key, 0) + 1

    # Convert to chart format
    monthly_hire_data = [
        {
            "month": f"{month.split('-')[1]}/{month.split('-')[0][-2:]}",
            "hires": count
        }
        for month, count in sorted(monthly_hires.items())
    ]

    return {
        "total_departments": total_departments,
        "total_employees": total_employees,
        "active_employees": active_employees,
        "inactive_employees": inactive_employees,
        "department_stats": department_stats,
        "monthly_hires": monthly_hire_data,
        "employee_status": [
            {"name": "Active", "value": active_employees, "color": "#48BB78"},
            {"name": "Inactive", "value": inactive_employees, "color": "#F56565"}
        ]
    }
