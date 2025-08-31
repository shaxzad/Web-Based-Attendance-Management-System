# Cloudflare Deployment Guide

This guide will help you deploy your Web-Based Attendance Management System to Cloudflare for testing.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install Cloudflare's CLI tool
3. **GitHub Account**: For connecting your repository

## Installation

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

## Frontend Deployment (Cloudflare Pages)

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

### 2. Deploy to Cloudflare Pages

```bash
# Deploy to production
npm run deploy:cloudflare

# Or deploy to staging
npm run deploy:cloudflare:staging
```

### 3. Alternative: Connect GitHub Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages**
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your repository
6. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`

## Backend Deployment Options

### Option 1: Cloudflare Workers (Recommended for Testing)

**Note**: Cloudflare Workers has limitations with certain Python packages. For a full FastAPI app with database connections, consider Option 2.

### Option 2: Railway/Render/Heroku (Recommended for Production)

For the backend, we recommend using a platform that supports Python applications with databases:

#### Railway Deployment

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Railway Project**:
   ```bash
   cd backend
   railway init
   ```

4. **Add PostgreSQL Database**:
   ```bash
   railway add
   # Select PostgreSQL
   ```

5. **Set Environment Variables**:
   ```bash
   railway variables set SECRET_KEY="your-secret-key"
   railway variables set POSTGRES_PASSWORD="your-db-password"
   railway variables set FIRST_SUPERUSER_PASSWORD="your-admin-password"
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

#### Render Deployment

1. Connect your GitHub repository to Render
2. Create a new **Web Service**
3. Configure:
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in the dashboard

## Environment Configuration

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=https://your-backend-url.com
VITE_APP_NAME="Attendance Management System"
```

### Backend Environment Variables

Set these in your backend deployment platform:

```env
SECRET_KEY=your-secret-key-here
POSTGRES_PASSWORD=your-database-password
FIRST_SUPERUSER_PASSWORD=your-admin-password
ENVIRONMENT=production
```

## Database Setup

### Option 1: Cloudflare D1 (SQLite)

1. Create a D1 database in Cloudflare dashboard
2. Update your backend configuration to use D1

### Option 2: External PostgreSQL (Recommended)

Use services like:
- **Railway PostgreSQL**
- **Render PostgreSQL**
- **Supabase**
- **Neon**

## Testing Your Deployment

1. **Frontend**: Visit your Cloudflare Pages URL
2. **Backend**: Test your API endpoints
3. **Database**: Verify connections and migrations

## Custom Domain Setup

1. In Cloudflare Pages dashboard, go to your project
2. Click **Custom domains**
3. Add your domain
4. Configure DNS settings

## Monitoring and Logs

- **Cloudflare Pages**: View build logs and analytics in the dashboard
- **Backend**: Use your deployment platform's logging features
- **Database**: Monitor connection and performance

## Troubleshooting

### Common Issues

1. **Build Failures**: Check build logs for dependency issues
2. **API Connection**: Ensure CORS is properly configured
3. **Database Connection**: Verify connection strings and credentials
4. **Environment Variables**: Double-check all required variables are set

### Support

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)

## Next Steps

1. Set up CI/CD pipelines
2. Configure monitoring and alerts
3. Set up backup strategies
4. Implement security best practices
5. Plan for scaling
