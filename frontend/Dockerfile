# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files for better caching
COPY package*.json /app/

# Install dependencies with production optimizations
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY ./ /app/

# Build argument for API URL
ARG VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.25-alpine

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Copy built application
COPY --from=build-stage /app/dist/ /usr/share/nginx/html

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1
