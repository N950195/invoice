# Pre-Deployment Checklist

## Before Uploading to Server:

### Code Preparation:
- [ ] Run `npm run build` locally to test build process
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
2. [ ] Run `npm install --production`
3. [ ] Copy .env.production to .env
4. [ ] Create uploads directory with write permissions
5. [ ] Test application with `npm start`

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
