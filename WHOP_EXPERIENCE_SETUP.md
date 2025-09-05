# 🔧 Whop Experience Configuration

## URLs für deine Whop Experience App:

### **Production URLs** (für Whop Dashboard):
```
App URL: https://challenges-whop-app-sqmr.vercel.app
OAuth Redirect URL: https://challenges-whop-app-sqmr.vercel.app/api/auth/whop/callback
Webhook URL: https://challenges-whop-app-sqmr.vercel.app/api/whop/webhook
```

### **Development URLs** (für Testing):
```
App URL: http://localhost:3000
OAuth Redirect URL: http://localhost:3000/api/auth/whop/callback
Webhook URL: http://localhost:3000/api/whop/webhook
```

## Nach der App-Erstellung bekommst du:

1. **Experience ID** (z.B. `exp_ABC123DEF456`)
2. **Client ID** (z.B. `client_123ABC456DEF`)
3. **Client Secret** (geheim - für Server)
4. **Webhook Secret** (für Webhook-Validierung)

## Diese IDs musst du dann in Vercel Environment Variables setzen:

```bash
WHOP_EXPERIENCE_ID=exp_ABC123DEF456
WHOP_CLIENT_ID=client_123ABC456DEF
WHOP_CLIENT_SECRET=your_secret_here
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
```

## 🎯 Quick Steps:
1. Gehe zu https://dev.whop.com
2. Create App → Experience
3. URLs von oben eintragen
4. Credentials kopieren
5. In Vercel Environment Variables eintragen
6. App redeploy
