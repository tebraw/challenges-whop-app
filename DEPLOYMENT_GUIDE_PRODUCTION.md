# 🚀 Production Deployment Guide

## 1. Whop Integration Setup

### Whop Developer Dashboard
1. Go to https://dev.whop.com
2. Create new app: "Challenge Platform"
3. Configure redirect URLs:
   - Development: `http://localhost:3000/api/auth/whop/callback`
   - Production: `https://your-domain.vercel.app/api/auth/whop/callback`
4. Copy credentials:
   - `WHOP_APP_ID`
   - `WHOP_API_KEY` 
   - `WHOP_CLIENT_SECRET`
   - `WHOP_WEBHOOK_SECRET`

## 2. Database Setup (Choose one)

### Option A: Supabase (Recommended)
```bash
# 1. Create project at supabase.com
# 2. Get connection string
# 3. Add to environment variables
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
DIRECT_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

### Option B: PlanetScale
```bash
# 1. Create database at planetscale.com
# 2. Create main branch
# 3. Get connection string
DATABASE_URL=mysql://[user]:[password]@[host]/[database]
```

### Option C: Railway
```bash
# 1. Create project at railway.app
# 2. Add PostgreSQL service
# 3. Get connection string
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

## 3. Vercel Deployment

### Step 1: Connect Repository
1. Go to https://vercel.com
2. Import your Git repository
3. Configure project settings

### Step 2: Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Whop Configuration
WHOP_APP_ID=your_app_id
WHOP_API_KEY=your_api_key
WHOP_CLIENT_SECRET=your_client_secret
WHOP_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=your_database_url
DIRECT_URL=your_database_url

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=random-secret-string

# URLs
WHOP_APP_URL=https://your-app.vercel.app
WHOP_REDIRECT_URL=https://your-app.vercel.app/api/auth/whop/callback
WHOP_WEBHOOK_URL=https://your-app.vercel.app/api/whop/webhook
```

### Step 3: Deploy
1. Push to main branch
2. Vercel auto-deploys
3. Check deployment logs

## 4. Post-Deployment Setup

### Database Migration
```bash
# Run this once after deployment
npx prisma db push
npx prisma generate
```

### Whop Webhook Configuration
1. Go to Whop Developer Dashboard
2. Set webhook URL: `https://your-app.vercel.app/api/whop/webhook`
3. Enable events:
   - payment.succeeded
   - membership.created
   - membership.cancelled

### Test Integration
1. Visit your app: `https://your-app.vercel.app`
2. Test Whop login flow
3. Verify webhook events
4. Check database synchronization

## 5. Domain Setup (Optional)

### Custom Domain
1. Vercel Dashboard → Domains
2. Add your custom domain
3. Update Whop app settings with new domain
4. Update environment variables

## ✅ Deployment Checklist

- [ ] Whop app created and configured
- [ ] Database setup and connected
- [ ] Environment variables configured
- [ ] Repository connected to Vercel
- [ ] First deployment successful
- [ ] Database migrated
- [ ] Webhooks configured
- [ ] Integration tested
- [ ] Custom domain configured (optional)

## 🔧 Troubleshooting

### Common Issues
1. **Build fails**: Check environment variables
2. **Database errors**: Verify connection string
3. **Whop auth fails**: Check redirect URLs
4. **Webhooks not working**: Verify webhook URL and secret

### Support
- Whop Docs: https://docs.whop.com
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
