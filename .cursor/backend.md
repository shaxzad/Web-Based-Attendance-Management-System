# Backend Development Rules

## Python Code Style
- Follow PEP 8 standards with 88-character line length
- Use type hints for all function parameters and return values
- Prefer `sqlmodel` over raw SQLAlchemy for database models
- Use Pydantic models for API request/response validation
- Follow FastAPI best practices for endpoint design

## Database Models
- All models should inherit from `sqlmodel.SQLModel`
- Use proper foreign key relationships with cascade options
- Include `__tablename__` for explicit table naming
- Add proper indexes for frequently queried fields
- Use UUIDs for primary keys when security is important

## API Endpoints
- Use dependency injection for authentication and database sessions
- Implement proper error handling with HTTPException
- Use Pydantic models for request/response schemas
- Follow RESTful conventions for endpoint naming
- Include proper OpenAPI documentation

## Security
- Always hash passwords using bcrypt
- Use JWT tokens for authentication
- Validate all user inputs
- Implement proper CORS settings
- Use environment variables for sensitive configuration

## Testing
- Write unit tests for all CRUD operations
- Test API endpoints with proper authentication
- Use pytest fixtures for database setup
- Mock external services in tests
- Aim for >80% code coverage

## Code Quality Standards
- Use Ruff for linting and formatting
- Follow mypy strict mode
- Use pre-commit hooks
- Write docstrings for all public functions
- Use proper exception handling

## Database Guidelines
- Use Alembic for database migrations
- Write reversible migrations when possible
- Test migrations on development data
- Use proper foreign key constraints
- Implement soft deletes where appropriate

## API Design
- Use consistent HTTP status codes
- Implement proper pagination for list endpoints
- Use query parameters for filtering and sorting
- Return consistent error response formats
- Include proper rate limiting

## File Organization
```
backend/
├── app/
│   ├── api/          # API routes and endpoints
│   ├── core/         # Configuration and core utilities
│   ├── crud/         # Database CRUD operations
│   ├── models/       # Database models
│   └── utils/        # Utility functions
├── tests/            # Test files
└── alembic/          # Database migrations
``` 