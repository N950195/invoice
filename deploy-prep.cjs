#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * Run this before deploying to production server
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Invoice Management System for deployment...\n');

// 1. Create production environment file template
const envTemplate = `# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database Configuration (uncomment and configure for PostgreSQL)
# DATABASE_URL=postgresql://username:password@localhost:5432/invoicedb

# Session Secret (generate a secure random string)
SESSION_SECRET=your-secure-session-secret-here

# File Upload Configuration
MAX_FILE_SIZE=5MB
UPLOAD_PATH=./uploads

# CORS Configuration (if needed)
# ALLOWED_ORIGINS=https://your-domain.com

# SSL Configuration (if using HTTPS)
# SSL_CERT_PATH=/path/to/certificate.crt
# SSL_KEY_PATH=/path/to/private.key
`;

try {
  if (!fs.existsSync('.env.production')) {
    fs.writeFileSync('.env.production', envTemplate);
    console.log('✅ Created .env.production template');
  } else {
    console.log('ℹ️  .env.production already exists');
  }
} catch (error) {
  console.log('❌ Failed to create .env.production:', error.message);
}

// 2. Create deployment scripts in package.json
const packageJsonPath = './package.json';
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add production scripts if they don't exist
  const productionScripts = {
    "build": "vite build",
    "start": "NODE_ENV=production tsx server/index.ts",
    "preview": "vite preview",
    "deploy": "npm run build && npm run start"
  };

  packageJson.scripts = { ...packageJson.scripts, ...productionScripts };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with production scripts');
} catch (error) {
  console.log('❌ Failed to update package.json:', error.message);
}

// 3. Create uploads directory
try {
  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads', { recursive: true });
    console.log('✅ Created uploads directory');
  }
  
  // Create .gitkeep file to ensure uploads directory is tracked
  const gitkeepPath = './uploads/.gitkeep';
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log('✅ Created uploads/.gitkeep');
  }
} catch (error) {
  console.log('❌ Failed to create uploads directory:', error.message);
}

// 4. Create production Docker files
const dockerfile = `# Production Dockerfile for Invoice Management System
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
`;

const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=invoiceuser
      - POSTGRES_PASSWORD=invoice_password_change_me
      - POSTGRES_DB=invoicedb
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
`;

try {
  fs.writeFileSync('Dockerfile', dockerfile);
  fs.writeFileSync('docker-compose.yml', dockerCompose);
  console.log('✅ Created Docker configuration files');
} catch (error) {
  console.log('❌ Failed to create Docker files:', error.message);
}

// 5. Create Nginx configuration
const nginxConfig = `events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com www.your-domain.com;

        # SSL Configuration (uncomment when you have certificates)
        # ssl_certificate /etc/nginx/ssl/certificate.crt;
        # ssl_certificate_key /etc/nginx/ssl/private.key;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Handle static files
        location /assets/ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
`;

try {
  fs.writeFileSync('nginx.conf', nginxConfig);
  console.log('✅ Created Nginx configuration');
} catch (error) {
  console.log('❌ Failed to create Nginx config:', error.message);
}

// 6. Create deployment checklist
const checklist = `# Pre-Deployment Checklist

## Before Uploading to Server:

### Code Preparation:
- [ ] Run \`npm run build\` locally to test build process
- [ ] Test all functionality with sample data
- [ ] Remove any development console.logs
- [ ] Update environment variables in .env.production
- [ ] Generate secure SESSION_SECRET

### Server Preparation:
- [ ] Node.js 18+ installed on server
- [ ] PostgreSQL installed (if using database)
- [ ] Domain name configured (optional)
- [ ] SSL certificate obtained (recommended)

### Upload Process:
1. [ ] Upload extracted project files to server
2. [ ] Run \`npm install --production\`
3. [ ] Copy .env.production to .env
4. [ ] Create uploads directory with write permissions
5. [ ] Test application with \`npm start\`

### Database Setup (if using PostgreSQL):
- [ ] Create database and user
- [ ] Update DATABASE_URL in .env
- [ ] Test database connection

### Production Configuration:
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up SSL certificate
- [ ] Configure firewall rules
- [ ] Set up process manager (PM2)
- [ ] Configure automated backups

### Testing:
- [ ] Test invoice creation
- [ ] Test PDF generation
- [ ] Test logo upload
- [ ] Test all calculations
- [ ] Test on mobile devices

### Monitoring:
- [ ] Set up uptime monitoring
- [ ] Configure log management
- [ ] Set up error notifications
- [ ] Document rollback procedure

## Production URLs to Test:
- [ ] Homepage loads correctly
- [ ] Invoice creation form works
- [ ] PDF generation functions
- [ ] File uploads work
- [ ] All calculations are accurate

## Post-Deployment:
- [ ] Set up regular backups
- [ ] Configure monitoring alerts
- [ ] Document deployment process
- [ ] Set up staging environment for future updates
`;

try {
  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  console.log('✅ Created deployment checklist');
} catch (error) {
  console.log('❌ Failed to create checklist:', error.message);
}

console.log('\n🎉 Deployment preparation complete!');
console.log('\nNext steps:');
console.log('1. Download your project as ZIP from Replit (⋯ menu → Download as zip)');
console.log('2. Review DEPLOYMENT_GUIDE.md for hosting options');
console.log('3. Follow DEPLOYMENT_CHECKLIST.md before going live');
console.log('4. Configure .env.production with your settings');
console.log('5. Choose your hosting method and deploy!');