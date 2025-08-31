# Render.com Deployment Guide

This guide will help you deploy your Attendance Management System to Render.com.

## Prerequisites

- A GitHub repository with your code
- A Render.com account
- A PostgreSQL database (you can use Render's PostgreSQL service)

## Step 1: Prepare Your Repository

1. Make sure all your changes are committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Add Render.com deployment configuration"
   git push origin main
   ```

## Step 2: Create a PostgreSQL Database on Render

1. Go to your Render.com dashboard
2. Click "New +" and select "PostgreSQL"
3. Configure the database:
   - **Name**: `attendance-system-db`
   - **Database**: `attendance_db`
   - **User**: `attendance_user`
   - **Region**: Choose the closest to your users
4. Click "Create Database"
5. Note down the connection details (you'll need them later)

## Step 3: Deploy the Backend Service

1. In your Render.com dashboard, click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `attendance-system-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install uv
     uv sync --frozen
     uv run alembic upgrade head
     ```
   - **Start Command**: 
     ```bash
     uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

## Step 4: Configure Environment Variables

In your Render.com service settings, add these environment variables:

### Required Variables (must be set):
- `PROJECT_NAME`: `Attendance Management System`
- `SECRET_KEY`: Generate a secure random string (Render can auto-generate this)
- `POSTGRES_SERVER`: Your PostgreSQL host from Step 2
- `POSTGRES_PORT`: `5432`
- `POSTGRES_USER`: Your PostgreSQL username from Step 2
- `POSTGRES_PASSWORD`: Your PostgreSQL password from Step 2
- `POSTGRES_DB`: `attendance_db`
- `FIRST_SUPERUSER`: Your admin email (e.g., `admin@yourdomain.com`)
- `FIRST_SUPERUSER_PASSWORD`: A strong password for the admin user

### Optional Variables (set as needed):
- `ENVIRONMENT`: `production`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `11520` (8 days)
- `FRONTEND_HOST`: Your frontend URL (e.g., `https://yourdomain.com`)
- `BACKEND_CORS_ORIGINS`: `["https://yourdomain.com","https://www.yourdomain.com"]`
- `REDIS_URL`: Your Redis connection URL (if using Redis)
- `SMTP_HOST`: Your SMTP server
- `SMTP_USER`: Your SMTP username
- `SMTP_PASSWORD`: Your SMTP password
- `EMAILS_FROM_EMAIL`: `noreply@yourdomain.com`
- `EMAILS_FROM_NAME`: `Attendance System`

## Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Monitor the build logs for any issues

## Step 6: Verify Deployment

1. Once deployed, your service will have a URL like: `https://your-service-name.onrender.com`
2. Test the health endpoint: `https://your-service-name.onrender.com/health`
3. Test the API docs: `https://your-service-name.onrender.com/docs`

## Troubleshooting

### Common Issues:

1. **Build fails with "alembic: command not found"**
   - Solution: Make sure you're using `uv run alembic upgrade head` in the build command

2. **Database connection errors**
   - Check that all PostgreSQL environment variables are correctly set
   - Verify the database is accessible from your service

3. **Import errors**
   - Make sure all dependencies are listed in `pyproject.toml`
   - Check that the Python version is compatible

4. **Environment variable errors**
   - Verify all required environment variables are set
   - Check for typos in variable names

### Debugging:

1. Check the build logs in Render.com dashboard
2. Use the Render.com CLI for better log access
3. Test locally with the same environment variables

## Security Considerations

1. **Never commit sensitive data** like passwords or API keys
2. **Use Render's secret management** for sensitive environment variables
3. **Enable HTTPS** (Render provides this automatically)
4. **Set up proper CORS** for your frontend domain
5. **Use strong passwords** for database and admin accounts

## Scaling

- Render.com automatically scales based on traffic
- You can upgrade to paid plans for better performance
- Consider using Redis for caching in production

## Monitoring

- Set up health checks for your service
- Monitor logs for errors
- Set up alerts for downtime
- Use Render's built-in monitoring tools

## Support

- Render.com documentation: https://render.com/docs
- FastAPI documentation: https://fastapi.tiangolo.com/
- Alembic documentation: https://alembic.sqlalchemy.org/

## Next Steps

After successful deployment:

1. Set up your frontend to connect to the backend API
2. Configure your domain name (if using a custom domain)
3. Set up monitoring and alerts
4. Configure backups for your database
5. Set up CI/CD for automatic deployments
