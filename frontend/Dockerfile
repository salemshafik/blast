# Use Node.js 18 LTS as base image
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=base /app/dist /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html /etc/nginx/conf.d
RUN chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
