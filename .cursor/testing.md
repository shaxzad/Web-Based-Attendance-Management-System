# Testing Rules

## Backend Testing (Pytest)
- Write unit tests for all CRUD operations
- Test API endpoints with proper authentication
- Use pytest fixtures for database setup
- Mock external services in tests
- Aim for >80% code coverage

## Frontend Testing (Playwright)
- Write E2E tests for critical user flows
- Test authentication flows
- Test form submissions and validations
- Test responsive design on different screen sizes
- Test accessibility features

## Test Organization
```
tests/
├── api/              # API endpoint tests
├── crud/             # Database operation tests
├── integration/      # Integration tests
└── e2e/              # End-to-end tests
```

## Test Data Management
- Use factories for consistent test data
- Clean up test data after each test
- Use database transactions for test isolation
- Mock external API calls
- Use environment-specific test configurations

## Test Naming Conventions
- Use descriptive test names
- Follow the pattern: `test_[functionality]_[scenario]`
- Group related tests in classes
- Use fixtures for common setup

## Coverage Requirements
- Minimum 80% code coverage for backend
- Test all critical user paths in frontend
- Include error handling scenarios
- Test edge cases and boundary conditions

## Performance Testing
- Test API response times
- Test database query performance
- Test frontend bundle size
- Test loading states and transitions

## Security Testing
- Test authentication and authorization
- Test input validation
- Test SQL injection prevention
- Test XSS prevention
- Test CSRF protection 