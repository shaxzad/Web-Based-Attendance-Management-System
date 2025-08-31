# Web-Based Attendance Management System - Development

## Local Development Setup

This project is designed to run locally without Docker. Follow these steps to set up your development environment.

### Prerequisites

- Python 3.11+ with uv package manager
- Node.js 18+ with npm
- PostgreSQL database

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies using uv:
```bash
uv sync
```

3. Set up your environment variables by copying the example:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and other configurations.

5. Run database migrations:
```bash
uv run alembic upgrade head
```

6. Start the backend development server:
```bash
uv run fastapi dev app/main.py
```

The backend will be available at: http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

### Database Setup

Make sure you have PostgreSQL running locally. You can:

1. Install PostgreSQL locally on your system
2. Use a cloud database service
3. Use a local PostgreSQL Docker container (if you have Docker installed)

Update the database connection string in your `.env` file accordingly.

### Development URLs

Once both services are running, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger UI)**: http://localhost:8000/docs
- **Alternative API Documentation (ReDoc)**: http://localhost:8000/redoc

## Code Quality and Linting

### Pre-commit Hooks

This project uses [pre-commit](https://pre-commit.com/) for code linting and formatting.

#### Install pre-commit hooks

```bash
cd backend
uv run pre-commit install
```

#### Run pre-commit manually

```bash
cd backend
uv run pre-commit run --all-files
```

### Frontend Linting

For the frontend, you can run:

```bash
cd frontend
npm run lint
npm run format
```

## Testing

### Backend Tests

```bash
cd backend
uv run pytest
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## Environment Variables

The `.env` file contains all your configurations, generated keys, and passwords. Make sure to:

1. Never commit the `.env` file to version control
2. Keep a `.env.example` file with the structure but without sensitive values
3. Set up proper environment variables in your deployment environment

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and the connection string in `.env` is correct
2. **Port Conflicts**: Make sure ports 8000 (backend) and 5173 (frontend) are available
3. **Dependencies**: Run `uv sync` in backend and `npm install` in frontend if you encounter missing dependencies

### Getting Help

- Check the logs in your terminal for error messages
- Ensure all prerequisites are installed and up to date
- Verify your `.env` configuration is correct