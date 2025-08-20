# Invoice Management System - Deployment Guide

## Export from Replit

1. **Download Project Code**:
   - In Replit, click the three dots menu (⋯) in the top right
   - Select "Download as zip" to export your entire project
   - This will download a zip file with all your code

## Project Structure

Your downloaded project contains:

```
invoice-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── hooks/
│   └── index.html
├── server/                 # Node.js/Express backend
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/                 # Shared types/schemas
│   └── schema.ts
├── package.json           # Dependencies
├── vite.config.ts         # Build configuration
├── tailwind.config.ts     # Styling configuration
└── tsconfig.json          # TypeScript configuration
```

## Deployment Options

### Option 1: VPS/Dedicated Server (Recommended for full control)

**Requirements:**
- Node.js 18+ installed
- PostgreSQL database (or use in-memory storage)
- Domain name (optional)
- SSL certificate (recommended)

**Steps:**

1. **Upload Code to Server**:
   ```bash
   # Extract the zip file
   unzip invoice-management-system.zip
   cd invoice-management-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create `.env` file:
   ```env
   NODE_ENV=production
   PORT=3000
   # If using PostgreSQL:
   DATABASE_URL=postgresql://username:password@localhost:5432/invoicedb
   ```

4. **Build the Application**:
   ```bash
   npm run build
   ```

5. **Start the Application**:
   ```bash
   npm run dev  # For development
   # Or for production with PM2:
   npm install -g pm2
   pm2 start "npm run dev" --name "invoice-app"
   ```

6. **Configure Reverse Proxy (Nginx)**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### Option 2: Cloud Platforms

#### **Vercel (Easiest for frontend + serverless)**
1. Create account at vercel.com
2. Connect your GitHub repo (upload code to GitHub first)
3. Vercel will auto-deploy

#### **Railway**
1. Create account at railway.app
2. Connect GitHub repo
3. Set environment variables
4. Deploy automatically

#### **DigitalOcean App Platform**
1. Create DigitalOcean account
2. Use "Create App" from GitHub
3. Configure build settings
4. Deploy

#### **AWS/GCP/Azure**
- Use their container services (ECS, Cloud Run, Container Instances)
- More complex but highly scalable

### Option 3: Shared Hosting (Limited)

Most shared hosting providers don't support Node.js applications. You would need:
- cPanel with Node.js support
- Or convert to a static site (frontend only)

## Database Options

### PostgreSQL (Production Recommended)
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE invoicedb;
CREATE USER invoiceuser WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE invoicedb TO invoiceuser;
```

### SQLite (Simple Alternative)
Update `server/storage.ts` to use SQLite instead of PostgreSQL for simpler deployment.

### In-Memory Storage (Development Only)
The current setup uses in-memory storage, which resets on server restart.

## SSL Certificate (Recommended)

### Using Let's Encrypt (Free)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring & Maintenance

### Process Management
```bash
# Using PM2
pm2 start npm --name "invoice-app" -- run dev
pm2 startup
pm2 save
```

### Log Management
```bash
# View logs
pm2 logs invoice-app

# Restart application
pm2 restart invoice-app
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to code
2. **HTTPS**: Always use SSL in production
3. **Database Security**: Use strong passwords, limit access
4. **Regular Updates**: Keep Node.js and dependencies updated
5. **Firewall**: Configure server firewall properly

## Troubleshooting

### Common Issues:
1. **Port Already in Use**: Change PORT in .env file
2. **Database Connection**: Check DATABASE_URL format
3. **Build Errors**: Ensure all dependencies are installed
4. **File Permissions**: Set proper permissions on upload folder

### Performance Optimization:
1. **Enable Gzip**: Configure Nginx compression
2. **Static Assets**: Serve from CDN
3. **Database Optimization**: Add indexes, connection pooling
4. **Caching**: Implement Redis for session storage

## Cost Estimates

### VPS Options:
- **DigitalOcean Droplet**: $5-20/month
- **AWS EC2 t3.micro**: $8-15/month
- **Linode**: $5-20/month

### Cloud Platform Pricing:
- **Vercel**: Free tier available, $20/month for pro
- **Railway**: $5/month + usage
- **Netlify**: Free tier for frontend only

## Next Steps After Deployment

1. Set up automated backups
2. Configure monitoring (Uptime Robot, New Relic)
3. Set up CI/CD pipeline
4. Add domain name and SSL
5. Configure email notifications
6. Set up regular security updates

## Support

For deployment issues:
1. Check server logs
2. Verify environment variables
3. Test database connection
4. Check firewall settings
5. Review proxy configuration

Remember to test thoroughly in a staging environment before deploying to production!