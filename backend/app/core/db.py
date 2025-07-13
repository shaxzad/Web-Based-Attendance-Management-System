from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, Holiday, HolidayCreate
from datetime import date

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)

        # Create sample holidays
        sample_holidays = [
            HolidayCreate(
                title="New Year's Day",
                description="Public holiday celebrating the new year",
                holiday_date=date(2024, 1, 1),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Pakistan Day",
                description="National holiday commemorating the Lahore Resolution",
                holiday_date=date(2024, 3, 23),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Independence Day",
                description="National holiday celebrating Pakistan's independence",
                holiday_date=date(2024, 8, 14),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Defence Day",
                description="National holiday honoring Pakistan's armed forces",
                holiday_date=date(2024, 9, 6),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Christmas",
                description="Christian holiday celebrating the birth of Jesus Christ",
                holiday_date=date(2024, 12, 25),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Company Annual Meeting",
                description="Annual company-wide meeting and team building",
                holiday_date=date(2024, 6, 15),
                holiday_type="company",
                is_recurring=False,
                color="#38A169"
            ),
            HolidayCreate(
                title="Eid al-Fitr",
                description="Islamic holiday marking the end of Ramadan",
                holiday_date=date(2024, 4, 10),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Eid al-Adha",
                description="Islamic holiday of sacrifice",
                holiday_date=date(2024, 6, 17),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Muharram",
                description="Islamic New Year and day of mourning",
                holiday_date=date(2024, 7, 8),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Milad un-Nabi",
                description="Birthday of Prophet Muhammad",
                holiday_date=date(2024, 9, 16),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Team Building Day",
                description="Company team building and bonding activities",
                holiday_date=date(2024, 5, 20),
                holiday_type="company",
                is_recurring=False,
                color="#38A169"
            ),
            HolidayCreate(
                title="Office Anniversary",
                description="Celebrating the company's founding anniversary",
                holiday_date=date(2024, 11, 10),
                holiday_type="company",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#38A169"
            ),
            # 2025 holidays
            HolidayCreate(
                title="New Year's Day 2025",
                description="Public holiday celebrating the new year",
                holiday_date=date(2025, 1, 1),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Pakistan Day 2025",
                description="National holiday commemorating the Lahore Resolution",
                holiday_date=date(2025, 3, 23),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Independence Day 2025",
                description="National holiday celebrating Pakistan's independence",
                holiday_date=date(2025, 8, 14),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Defence Day 2025",
                description="National holiday honoring Pakistan's armed forces",
                holiday_date=date(2025, 9, 6),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Christmas 2025",
                description="Christian holiday celebrating the birth of Jesus Christ",
                holiday_date=date(2025, 12, 25),
                holiday_type="public",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#3182CE"
            ),
            HolidayCreate(
                title="Company Annual Meeting 2025",
                description="Annual company-wide meeting and team building",
                holiday_date=date(2025, 6, 15),
                holiday_type="company",
                is_recurring=False,
                color="#38A169"
            ),
            HolidayCreate(
                title="Eid al-Fitr 2025",
                description="Islamic holiday marking the end of Ramadan",
                holiday_date=date(2025, 3, 31),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Eid al-Adha 2025",
                description="Islamic holiday of sacrifice",
                holiday_date=date(2025, 6, 7),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Muharram 2025",
                description="Islamic New Year and day of mourning",
                holiday_date=date(2025, 6, 27),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Milad un-Nabi 2025",
                description="Birthday of Prophet Muhammad",
                holiday_date=date(2025, 9, 5),
                holiday_type="public",
                is_recurring=False,
                color="#3182CE"
            ),
            HolidayCreate(
                title="Team Building Day 2025",
                description="Company team building and bonding activities",
                holiday_date=date(2025, 5, 20),
                holiday_type="company",
                is_recurring=False,
                color="#38A169"
            ),
            HolidayCreate(
                title="Office Anniversary 2025",
                description="Celebrating the company's founding anniversary",
                holiday_date=date(2025, 11, 10),
                holiday_type="company",
                is_recurring=True,
                recurrence_pattern="yearly",
                color="#38A169"
            )
        ]

        # Check if holidays already exist
        existing_holidays = session.exec(select(Holiday)).all()
        if not existing_holidays:
            for holiday_data in sample_holidays:
                holiday = Holiday(
                    **holiday_data.model_dump(),
                    created_by=user.id
                )
                session.add(holiday)
            session.commit()
