# Security Rules

## Authentication
- Use JWT tokens for stateless authentication
- Implement proper token refresh mechanisms
- Use secure password hashing (bcrypt)
- Implement account lockout after failed attempts
- Use HTTPS in production environments

## Authorization
- Implement role-based access control (RBAC)
- Validate user permissions on every request
- Use dependency injection for auth checks
- Implement proper session management
- Log all authentication events

## Input Validation
- Validate all user inputs on both frontend and backend
- Use Pydantic models for request validation
- Implement proper sanitization for user data
- Use parameterized queries to prevent SQL injection
- Validate file uploads and content types

## Data Protection
- Encrypt sensitive data at rest
- Use environment variables for secrets
- Never commit sensitive data to version control
- Implement proper CORS settings
- Use secure headers (HSTS, CSP, etc.)

## API Security
- Rate limiting for API endpoints
- Implement proper error handling without information leakage
- Use HTTPS for all API communications
- Validate API keys and tokens
- Log security events and suspicious activities

## Frontend Security
- Implement proper XSS prevention
- Use Content Security Policy (CSP)
- Validate form inputs on client side
- Implement proper CSRF protection
- Use secure cookie settings

## Database Security
- Use parameterized queries
- Implement proper access controls
- Regular security updates
- Backup encryption
- Audit logging for sensitive operations

## Environment Security
- Use different configurations for dev/staging/prod
- Rotate secrets regularly
- Use proper secret management in production
- Implement proper logging and monitoring
- Regular security audits and penetration testing 