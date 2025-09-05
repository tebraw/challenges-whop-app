#!/usr/bin/env node

/**
 * Vercel Environment Variable Checker
 * Checks what environment variables are needed for production
 */

const requiredEnvVars = {
  // Whop Configuration
  'WHOP_APP_ID': 'app_ZYUHlzHinpA5Ce', // From your existing .env.local
  'WHOP_API_KEY': 'xGCaKZ6n2xk4ZjdhNphMUI6MXMnTQmEKyDN1eCIuIIc', // From your existing .env.local
  'WHOP_CLIENT_SECRET': 'your_client_secret_here', // Needs to be added from Whop Dashboard
  'WHOP_WEBHOOK_SECRET': 'your_webhook_secret_here', // Needs to be added from Whop Dashboard
  
  // URLs for Production
  'WHOP_APP_URL': 'https://challenges-whop-app-sqmr.vercel.app',
  'WHOP_REDIRECT_URL': 'https://challenges-whop-app-sqmr.vercel.app/api/auth/whop/callback',
  'WHOP_WEBHOOK_URL': 'https://challenges-whop-app-sqmr.vercel.app/api/whop/webhook',
  
  // Database (Your existing Prisma setup)
  'DATABASE_URL': 'postgres://d52d76d0acd7c3b9106aced0cccc0fac33677d545be55ac319c3322be519f8c5:sk_vJsj_G_7eXDCgSvMqOjKt@db.prisma.io:5432/postgres?sslmode=require',
  'DIRECT_URL': 'postgres://d52d76d0acd7c3b9106aced0cccc0fac33677d545be55ac319c3322be519f8c5:sk_vJsj_G_7eXDCgSvMqOjKt@db.prisma.io:5432/postgres?sslmode=require',
  'PRISMA_DATABASE_URL': 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza192SnNqX0dfN2VYRENnU3ZNcU9qS3QiLCJhcGlfa2V5IjoiMDFLNEI4WUVDRzFGV1NENjM5WFhUOEJaQ1AiLCJ0ZW5hbnRfaWQiOiJkNTJkNzZkMGFjZDdjM2I5MTA2YWNlZDBjY2NjMGZhYzMzNjc3ZDU0NWJlNTVhYzMxOWMzMzIyYmU1MTlmOGM1IiwiaW50ZXJuYWxfc2VjcmV0IjoiZDVlZjI1MGQtNTg2ZC00YmRhLWE5NjYtOTQ1NjUzNzAzYTNlIn0.Gm_A1m6iZkMb3H4tAubcirxCAs-8sL__s5t3LrPsTjM',
  
  // NextAuth
  'NEXTAUTH_URL': 'https://challenges-whop-app-sqmr.vercel.app',
  'NEXTAUTH_SECRET': 'your-super-secret-random-string-here', // Generate a secure random string
  
  // Public Variables
  'NEXT_PUBLIC_WHOP_APP_ID': 'app_ZYUHlzHinpA5Ce',
  'NEXT_PUBLIC_WHOP_AGENT_USER_ID': 'user_Z9GOqqGEJWyjG',
  'NEXT_PUBLIC_WHOP_COMPANY_ID': 'biz_YoIIIT73rXwrtK',
  
  // Optional
  'NODE_ENV': 'production',
  'ENABLE_DEV_AUTH': 'false'
};

console.log('🔧 Vercel Environment Variables Setup\n');
console.log('Copy these to your Vercel Dashboard → Settings → Environment Variables:\n');

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📋 Steps to configure:');
console.log('1. Go to https://vercel.com/filip-grujicics-projects/challenges-whop-app-sqmr');
console.log('2. Settings → Environment Variables');
console.log('3. Add each variable above');
console.log('4. Redeploy your app');

console.log('\n⚠️  Don\'t forget to:');
console.log('- Set up a PostgreSQL database (Supabase/PlanetScale)');
console.log('- Get real Whop CLIENT_SECRET and WEBHOOK_SECRET from Whop Dashboard');
console.log('- Generate a secure NEXTAUTH_SECRET');
