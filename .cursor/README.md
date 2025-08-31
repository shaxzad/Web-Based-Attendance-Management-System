# Cursor Rules for Web-Based Attendance Management System

This folder contains specialized cursor rules for different aspects of the project development.

## Rule Files Overview

### [backend.md](./backend.md)
Backend-specific rules for FastAPI, SQLModel, and Python development including:
- Python code style and type hints
- Database models and relationships
- API endpoint design
- Security practices
- Testing strategies

### [frontend.md](./frontend.md)
Frontend-specific rules for React, TypeScript, and Chakra UI development including:
- TypeScript best practices
- React component patterns
- State management with TanStack Query
- UI/UX guidelines
- Performance optimization

### [testing.md](./testing.md)
Testing strategies for both backend and frontend including:
- Pytest for backend testing
- Playwright for E2E testing
- Test organization and naming
- Coverage requirements
- Security testing

### [security.md](./security.md)
Security-focused rules including:
- Authentication and authorization
- Input validation
- Data protection
- API security
- Environment security

### [deployment.md](./deployment.md)
Deployment and DevOps rules including:
- Docker configuration
- CI/CD pipeline
- Production deployment
- Monitoring and logging
- Performance optimization

### [git-workflow.md](./git-workflow.md)
Git workflow and collaboration rules including:
- Branch strategy
- Commit message conventions
- Pull request process
- Code review guidelines
- Release management

### [database.md](./database.md)
Database-specific rules including:
- Migration management with Alembic
- Schema design patterns
- Performance optimization
- Data validation
- Backup and recovery strategies

## Usage

These rules help Cursor AI understand your project structure and coding standards, providing more accurate and contextually relevant suggestions. The rules are organized by domain to make them easier to maintain and update.

## Database Connection (MCP)

The project includes MCP (Model Context Protocol) configuration for direct database access:

### Connection String
```
postgresql://postgres:passpass@localhost:5432/Attandance
```

### Configuration Files
- `mcp-config.json` - MCP server configuration for Cursor
- `test-db-connection.sh` - Script to test database connectivity

### Setup Instructions
1. Ensure PostgreSQL is running (Docker or local)
2. Copy the MCP configuration to your Cursor settings
3. Test connection using the provided script
4. Use MCP for database operations and migrations

## Project Technology Stack

- **Backend**: FastAPI, SQLModel, PostgreSQL, Pytest
- **Frontend**: React, TypeScript, Chakra UI, TanStack Router, Playwright
- **DevOps**: Docker, Traefik, GitHub Actions
- **Code Quality**: Ruff (Python), Biome (TypeScript)

## Contributing

When adding new rules or modifying existing ones:
1. Keep rules specific and actionable
2. Update this README if adding new rule files
3. Ensure rules align with the project's technology stack
4. Test rules with actual development scenarios 

---

## **What to Do**

### 1. Change `colorPalette="primary"` to `colorScheme="primary"` on all primary buttons:

#### **AddEmployee.tsx**
```tsx
<Button
  value="add-employee"
  my={4}
  colorScheme="primary"
  variant="solid"
  size="lg"
  fontWeight="bold"
>
  <FaPlus fontSize="24px" />
  Add Employee
</Button>
```

#### **AddDepartment.tsx**
```tsx
<Button
  value="add-department"
  my={4}
  colorScheme="primary"
  variant="solid"
  size="lg"
  fontWeight="bold"
>
  <FaPlus fontSize="24px" />
  Add Department
</Button>
```

---

### 2. (Optional) If you want to be 100% sure, also check your theme provider in `main.tsx` or `App.tsx` to ensure your custom theme is being used.

---

Would you like me to apply this fix to both buttons in your codebase? 

This error means that your file `frontend/src/routes/_layout/employees.tsx` is missing a required export:

```
Uncaught SyntaxError: The requested module '/src/routes/_layout/employees.tsx' does not provide an export named 'Route'
```

### Why does this happen?

- Your routing system (TanStack Router) expects every route file to export a named export called `Route`.
- This is usually done with:
  ```tsx
  import { createFileRoute } from "@tanstack/react-router";
  export const Route = createFileRoute("/_layout/employees")({
    component: Employees,
  });
  ```
- If you remove or forget this export, the router cannot find the route definition, and you get this error.

---

### How to fix

1. **Add the Route export back to the bottom of your file:**

   ```tsx
   import { createFileRoute } from "@tanstack/react-router";
   // ...rest of your code...

   export const Route = createFileRoute("/_layout/employees")({
     component: Employees,
   });
   ```

2. **Make sure the export comes after the Employees component is defined.**

---

#### **Summary**

- The error means the file does not export `Route`.
- Add the `Route` export as shown above.
- Save and reload your frontend.

Would you like me to add this export for you? 