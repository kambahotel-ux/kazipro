# KaziPro - Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] No console errors
- [ ] Production build successful

### Environment
- [ ] Supabase project created
- [ ] Database tables created
- [ ] RLS policies configured
- [ ] Environment variables set

### Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] Setup guide written
- [ ] Troubleshooting guide written

---

## Step 1: Prepare Supabase for Production

### Create Production Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to users
4. Set strong password
5. Wait for project to initialize

### Get Production Credentials
1. Go to Project Settings → API
2. Copy `Project URL`
3. Copy `anon public` key
4. Save these securely

### Set Up Production Database
1. Go to SQL Editor
2. Run `sql/init_tables.sql` to create tables
3. Run `sql/simple_admin_access.sql` to set up RLS
4. Create admin account:
   ```sql
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('admin@kazipro.com', crypt('Admin@123456', gen_salt('bf')), now());
   ```

### Configure RLS Policies
1. Enable RLS on all tables
2. Create policies for each table
3. Test policies with different roles

---

## Step 2: Configure Environment Variables

### Create `.env.production`
```
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_key
```

### Secure Environment Variables
- [ ] Never commit `.env` files
- [ ] Use `.env.local` for development
- [ ] Use `.env.production` for production
- [ ] Add to `.gitignore`

### Hosting Platform Setup

#### Vercel
1. Connect GitHub repository
2. Add environment variables in Settings
3. Deploy automatically on push

#### Netlify
1. Connect GitHub repository
2. Add environment variables in Build & Deploy
3. Deploy automatically on push

#### AWS/Azure/GCP
1. Set up CI/CD pipeline
2. Configure environment variables
3. Deploy to production

---

## Step 3: Build for Production

### Local Build
```bash
npm run build
```

### Verify Build
- [ ] No errors
- [ ] No warnings
- [ ] All assets included
- [ ] Bundle size acceptable

### Build Output
```
dist/
├── index.html
├── assets/
│   ├── index-*.css
│   └── index-*.js
└── ...
```

---

## Step 4: Deploy to Hosting

### Option 1: Vercel (Recommended)

#### Setup
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

#### Configuration
1. Go to Vercel Dashboard
2. Select project
3. Go to Settings
4. Add environment variables
5. Redeploy

#### Custom Domain
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records
4. Wait for SSL certificate

### Option 2: Netlify

#### Setup
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`

#### Configuration
1. Go to Netlify Dashboard
2. Select site
3. Go to Site Settings
4. Add environment variables
5. Redeploy

#### Custom Domain
1. Go to Domain Settings
2. Add custom domain
3. Update DNS records
4. Wait for SSL certificate

### Option 3: Docker

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

#### Build Image
```bash
docker build -t kazipro:latest .
```

#### Run Container
```bash
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  kazipro:latest
```

---

## Step 5: Post-Deployment Verification

### Test Production URL
- [ ] Site loads
- [ ] No 404 errors
- [ ] All pages accessible
- [ ] Database connected
- [ ] Authentication works

### Test Functionality
- [ ] User registration works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Data displays correctly
- [ ] Forms submit successfully

### Monitor Performance
- [ ] Page load times acceptable
- [ ] No console errors
- [ ] No network errors
- [ ] Database queries fast

### Check Security
- [ ] HTTPS enabled
- [ ] SSL certificate valid
- [ ] No mixed content warnings
- [ ] Security headers set

---

## Step 6: Set Up Monitoring

### Error Tracking
1. Set up Sentry
2. Add Sentry DSN to environment
3. Monitor errors in production

### Analytics
1. Set up Google Analytics
2. Add tracking code
3. Monitor user behavior

### Performance Monitoring
1. Set up New Relic or DataDog
2. Monitor performance metrics
3. Set up alerts

### Uptime Monitoring
1. Set up UptimeRobot
2. Monitor site availability
3. Get alerts if down

---

## Step 7: Set Up CI/CD Pipeline

### GitHub Actions

#### Create `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### GitLab CI

#### Create `.gitlab-ci.yml`
```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  script:
    - npm ci
    - npm run test

deploy:
  stage: deploy
  script:
    - npm ci
    - npm run build
    - # Deploy to production
```

---

## Step 8: Backup and Recovery

### Database Backups
1. Enable automatic backups in Supabase
2. Set backup frequency (daily)
3. Test restore process
4. Document recovery procedure

### Code Backups
1. Use GitHub for version control
2. Tag releases
3. Keep backup branches
4. Document rollback procedure

### Disaster Recovery Plan
1. Document recovery steps
2. Test recovery process
3. Keep runbook updated
4. Train team on recovery

---

## Step 9: Maintenance Plan

### Regular Updates
- [ ] Update dependencies monthly
- [ ] Security patches immediately
- [ ] Test updates in staging
- [ ] Deploy to production

### Performance Optimization
- [ ] Monitor performance metrics
- [ ] Optimize slow queries
- [ ] Optimize bundle size
- [ ] Cache static assets

### Security Audits
- [ ] Run security scans
- [ ] Check for vulnerabilities
- [ ] Update security policies
- [ ] Train team on security

### User Support
- [ ] Monitor error logs
- [ ] Respond to user issues
- [ ] Document common issues
- [ ] Update troubleshooting guide

---

## Troubleshooting

### Site Not Loading
1. Check DNS records
2. Check SSL certificate
3. Check server logs
4. Check database connection

### Database Connection Error
1. Check Supabase status
2. Check environment variables
3. Check RLS policies
4. Check network connectivity

### Authentication Not Working
1. Check Supabase auth settings
2. Check email configuration
3. Check OTP settings
4. Check session management

### Performance Issues
1. Check database queries
2. Check bundle size
3. Check server resources
4. Check CDN configuration

---

## Rollback Procedure

### If Deployment Fails
1. Identify the issue
2. Fix the code
3. Rebuild and test
4. Redeploy

### If Production Issue
1. Revert to previous version
2. Investigate issue
3. Fix and test
4. Redeploy

### Rollback Commands

#### Vercel
```bash
vercel rollback
```

#### Netlify
```bash
netlify deploy --prod --dir=dist
```

#### Docker
```bash
docker run -p 3000:3000 kazipro:previous-tag
```

---

## Post-Launch Checklist

- [ ] Site is live and accessible
- [ ] All functionality working
- [ ] Database connected
- [ ] Authentication working
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Team trained
- [ ] Documentation updated
- [ ] Support process established
- [ ] Performance acceptable

---

## Support Contacts

### Supabase Support
- Website: https://supabase.com/support
- Email: support@supabase.com
- Docs: https://supabase.com/docs

### Hosting Support
- Vercel: https://vercel.com/support
- Netlify: https://www.netlify.com/support/
- AWS: https://aws.amazon.com/support/

### Development Team
- Lead Developer: [Name]
- DevOps: [Name]
- QA: [Name]

---

## Deployment Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Preparation | 1-2 days | Setup Supabase, configure env |
| Build & Test | 1 day | Build, test, verify |
| Deployment | 1-2 hours | Deploy to production |
| Verification | 2-4 hours | Test all functionality |
| Monitoring | Ongoing | Monitor performance, errors |

---

## Success Criteria

✅ **Deployment Successful When:**
- Site is live and accessible
- All pages load without errors
- Authentication works
- Database queries work
- No console errors
- Performance acceptable
- Monitoring active
- Team trained

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Status:** ✅ READY FOR PRODUCTION

