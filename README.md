# 🎯 Challenges Fresh - Whop Integration

Eine moderne Challenge-App mit vollständiger Whop-Integration für sichere Benutzerauthentifizierung und Monetarisierung.

## 🚀 Produktions-Deployment

### 1. Vorbereitung

```bash
# Repository klonen
git clone <your-repo>
cd challenges-fresh

# Dependencies installieren
npm install

# Produktions-Umgebung vorbereiten
cp .env.production.example .env
```

### 2. Umgebungsvariablen konfigurieren

Bearbeite `.env` und trage deine echten Whop-Credentials ein:

```env
# Whop App Credentials (von https://dev.whop.com)
NEXT_PUBLIC_WHOP_APP_ID="your_app_id"
NEXT_PUBLIC_WHOP_COMPANY_ID="your_company_id"
WHOP_CLIENT_SECRET="your_client_secret"

# Produktions-Datenbank
DATABASE_URL="postgresql://user:pass@host:port/db"

# Domain
NEXTAUTH_URL="https://yourdomain.com"
```

### 3. Datenbank Setup

```bash
# Prisma-Client generieren
npx prisma generate

# Datenbank-Schema anwenden
npx prisma db push

# (Optional) Produktions-Daten vorbereiten
node scripts/prepare-production.js
```

### 4. Build & Start

```bash
# Produktions-Build erstellen
npm run build

# Produktions-Server starten
npm start
```

## 🔐 Sicherheits-Features

### Admin-Zugang
- **Nur App-Installer**: Nur die Person, die die Whop-App installiert hat, erhält Admin-Rechte
- **Automatische Erkennung**: Wird über `whopCompanyId` im User-Profil identifiziert
- **Multi-Layer-Schutz**: Frontend + Backend + API-Schutz

### User-Authentifizierung
- **Whop OAuth**: Sichere Authentifizierung über Whop
- **Session-Management**: Robuste Session-Verwaltung
- **Automatische Umleitung**: Nicht-authentifizierte User werden zur Anmeldung weitergeleitet

## 📱 Features

### Für Admins (App-Installer)
- ✅ Challenge-Erstellung und -Management
- ✅ Teilnehmer-Übersicht und Analytics
- ✅ Gewinner-Auswahl (manuell/automatisch)
- ✅ Monetarisierung mit Special Offers
- ✅ Upload-Management
- ✅ Mobile-optimierte Admin-Oberfläche

### Für Users (Challenge-Teilnehmer)
- ✅ Challenge-Discovery und -Teilnahme
- ✅ Tägliche/End-of-Challenge Uploads
- ✅ Persönlicher Feed und Fortschritt
- ✅ Mobile-first Design
- ✅ Automatische Whop-Authentifizierung

## 🏗️ Architektur

```
challenges-fresh/
├── app/
│   ├── admin/          # Admin-only Bereich (geschützt)
│   ├── api/            # API-Endpunkte
│   ├── challenges/     # User Challenge-Views
│   └── c/[id]/         # Einzelne Challenge-Seiten
├── components/
│   ├── admin/          # Admin-Komponenten
│   ├── ui/             # Shared UI-Komponenten
│   └── user/           # User-Komponenten
├── lib/
│   ├── auth.ts         # Authentifizierung & Admin-Schutz
│   ├── whop/           # Whop-Integration
│   └── prisma.ts       # Datenbank-Client
└── prisma/
    └── schema.prisma   # Datenbank-Schema
```

## 🌐 Whop-Integration

### OAuth Flow
1. User wird zu Whop OAuth weitergeleitet
2. Nach erfolgreicher Anmeldung: Callback zu `/api/auth/whop/callback`
3. User-Daten werden von Whop API abgerufen
4. Session wird erstellt und User in Datenbank gespeichert
5. Automatische Admin-Rechte für App-Installer

### Membership-Validierung
- Echte Whop-Membership-Prüfung
- Automatische Synchronisation mit Whop-Status
- Sichere API-Calls zu Whop-Endpunkten

## 📋 Deployment-Checkliste

- [ ] Whop-App in dev.whop.com erstellt
- [ ] Redirect-URLs in Whop-App konfiguriert
- [ ] Produktions-Datenbank eingerichtet
- [ ] Umgebungsvariablen gesetzt
- [ ] Domain/SSL-Zertifikat konfiguriert
- [ ] npm run build erfolgreich
- [ ] Admin-Zugang getestet
- [ ] User-Registrierung getestet

## 🚨 Wichtige Hinweise

1. **Erste Anmeldung**: Der erste User, der sich anmeldet, wird automatisch Admin (App-Installer)
2. **Datenbank**: Stelle sicher, dass die Produktions-DB korrekt konfiguriert ist
3. **HTTPS**: Whop OAuth funktioniert nur mit HTTPS in Produktion
4. **Secrets**: Halte deine Whop-Secrets geheim und verwende sie nie im Frontend

## 🆘 Support

Bei Problemen:
1. Überprüfe die Whop-App-Konfiguration
2. Validiere Umgebungsvariablen
3. Teste die Datenbankverbindung
4. Überprüfe die Logs für detaillierte Fehlermeldungen

**Pixel-nahe** zum gelieferten Design (dunkler Hintergrund + türkise Akzente), Admin-Liste & 4‑Step Wizard, Tailwind, Prisma (SQLite), Icons via `lucide-react`.

## Start (Windows)
1. Ordner entpacken (z. B. `C:\Users\Startklar\challenges-fresh`)
2. Terminal öffnen:
   ```cmd
   cd C:\Users\Startklar\challenges-fresh
   npm i
   copy .env.example .env
   npm run prisma:dev
   npm run dev
   ```
3. Öffnen:
   - http://localhost:3000/admin
   - http://localhost:3000/admin/new
   - http://localhost:3000/design-system

> Logos: Lege deine Dateien in `public/` ab: `logo-mark.png`, `logo-horizontal.png`. Wenn nicht vorhanden, werden einfache SVG-Platzhalter genutzt.

## Whop-Integration (Stub)
- `/api/challenges` implementiert GET/POST
- Für Whop (OAuth, License, Webhooks) folgen Routen wie `/api/whop/validate` & `/api/whop/webhook` – Platzhalter können ergänzt werden.

Viel Spaß!