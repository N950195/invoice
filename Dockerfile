# Production Dockerfile for Invoice Management System
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S invoice -u 1001

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R invoice:nodejs uploads

USER invoice

EXPOSE 3000

CMD ["npm", "start"]
