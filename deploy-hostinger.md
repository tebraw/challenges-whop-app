# 🚀 Hostinger Deployment Guide - PRODUKTIONSFERTIG

## Schritt-für-Schritt Anleitung für Whop App Deployment

### 1. Hostinger Vorbereitung

1. **Node.js Hosting** aktivieren in Hostinger Control Panel
2. **PostgreSQL Datenbank** erstellen:
   - Gehe zu "Databases" → "Create Database"
   - Notiere dir: Host, Port, Database Name, Username, Password

### 2. Domain & SSL Setup

1. **Domain** zu Hostinger hinzufügen
2. **SSL-Zertifikat** aktivieren (kostenlos über Hostinger)
3. **DNS** konfigurieren (A-Record auf Hostinger IP)

### 3. Environment Variables Setup

Erstelle `.env` auf dem Server:

```env
# Database (Hostinger PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database_name"

# Whop Integration - TRAGE DEINE ECHTEN WERTE EIN!
NEXT_PUBLIC_WHOP_APP_ID="dein_whop_app_id"
NEXT_PUBLIC_WHOP_COMPANY_ID="deine_company_id"
WHOP_CLIENT_SECRET="dein_client_secret"
WHOP_WEBHOOK_SECRET="dein_webhook_secret"

# Production
NODE_ENV="production"
NEXTAUTH_URL="https://deinedomain.com"
NEXTAUTH_SECRET="dein_sicheres_random_string"
```

### 4. Whop App Konfiguration

In https://dev.whop.com:

1. **App erstellen** oder bearbeiten
2. **Redirect URLs** hinzufügen:
   - `https://deinedomain.com/api/auth/whop/callback`
3. **Webhook URL** setzen:
   - `https://deinedomain.com/api/whop/webhook`
4. **Berechtigungen** überprüfen:
   - User data read
   - Membership read
   - Company data read

### 5. File Upload auf Hostinger

```bash
# Lokale Vorbereitung
npm run production:build

# Files hochladen (via FTP/SFTP oder Git)
# Alle Dateien außer:
# - node_modules/ (wird auf Server installiert)
# - .next/ (wird auf Server gebaut)
# - .env (wird auf Server erstellt)
```

### 6. Server Commands (SSH)

```bash
# Dependencies installieren
npm install --production

# Prisma Setup
npx prisma generate
npx prisma db push

# Build für Produktion
npm run build

# Start (mit PM2 für Prozess-Management)
npm install -g pm2
pm2 start npm --name "challenges-app" -- start
pm2 save
pm2 startup
```

### 7. Erste Anmeldung & Admin Setup

1. **App besuchen**: `https://deinedomain.com`
2. **Als App-Creator anmelden** über Whop OAuth
3. **Automatisch Admin-Rechte** erhalten
4. **Erste Challenge erstellen** zum Testen

### 8. Monitoring & Wartung

```bash
# Logs anzeigen
pm2 logs challenges-app

# App neustarten
pm2 restart challenges-app

# Status prüfen
pm2 status

# Datenbank-Backup (empfohlen)
pg_dump DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 9. Wichtige URLs nach Deployment

- **App**: `https://deinedomain.com`
- **Admin**: `https://deinedomain.com/admin`
- **Whop Callback**: `https://deinedomain.com/api/auth/whop/callback`
- **Webhook**: `https://deinedomain.com/api/whop/webhook`

### 10. Troubleshooting

**Build Fehler:**
```bash
# Cache leeren
rm -rf .next node_modules
npm install
npm run build
```

**Datenbank Verbindung:**
```bash
# Testen
npx prisma db push
```

**Logs prüfen:**
```bash
pm2 logs challenges-app --lines 100
```

### 🔒 Sicherheits-Features implementiert:

- ✅ **Admin-Only Access**: Nur App-Installer hat Admin-Rechte
- ✅ **Whop OAuth**: Sichere Benutzerauthentifizierung
- ✅ **Route Protection**: Alle Admin-Routen geschützt
- ✅ **API Security**: Alle Admin-APIs mit requireAdmin()
- ✅ **Production Ready**: Keine Test-Daten, keine Debug-Routen

### 📞 Support

Bei Problemen:
1. PM2 Logs prüfen
2. Whop App-Konfiguration validieren
3. Database Connection testen
4. Environment Variables überprüfen

**Fertig! 🎉**

Deine Whop Challenge-App ist jetzt produktionsfertig und sicher!

# OAuth URIs (mit deiner Domain)
WHOP_OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/whop/callback
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Webhook Secret
WHOP_WEBHOOK_SECRET=your_webhook_secret

# Email (optional)
SMTP_HOST=smtp.hostinger.com
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
```

### 3. Package.json Scripts prüfen
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  }
}
```

## 🔧 Hostinger Setup

### Schritt 1: Node.js App erstellen
1. Hostinger hPanel öffnen
2. "Website" → "Node.js App erstellen"
3. Node.js Version: 18+ wählen
4. App-Name: "challenges-app"

### Schritt 2: Code hochladen
```bash
# ZIP erstellen (ohne node_modules, .next, .git)
# Diese Ordner ausschließen:
- node_modules/
- .next/
- .git/
- prisma/dev.db
```

### Schritt 3: Dependencies installieren
```bash
npm install
npm run build
```

### Schritt 4: Environment Variables setzen
Im Hostinger Panel unter "Environment Variables"

### Schritt 5: Database Setup
PostgreSQL Database erstellen über Hostinger Panel

## 🗄️ Database Migration
```bash
# Prisma Schema für PostgreSQL anpassen
npx prisma migrate deploy
npx prisma generate
```

## 🌍 Domain konfigurieren
1. Subdomain erstellen: challenges.yourdomain.com
2. SSL-Zertifikat aktivieren
3. DNS-Einstellungen prüfen

## ✅ Final Check
- [ ] App läuft auf https://yourdomain.com
- [ ] Database verbunden
- [ ] Whop OAuth URLs aktualisiert
- [ ] SSL-Zertifikat aktiv
