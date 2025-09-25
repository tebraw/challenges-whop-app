# Whop Access Pass Setup für Dashboard App Checkouts

## Problem
Checkouts funktionieren nicht, weil wir **Product IDs** statt **Plan IDs** und **Access Pass IDs** verwendet haben.

## Lösung: Access Passes in Whop Dashboard einrichten

### Schritt 1: Whop Dashboard öffnen
1. Gehe zu [app.whop.com](https://app.whop.com)  
2. Wähle dein Company/Business aus
3. Navigiere zu **"Products"** → **"Access Passes"**

### Schritt 2: Access Passes erstellen

#### Basic Access Pass
1. Klicke **"Create Access Pass"**
2. **Name**: `Basic Challenge Plan`
3. **Description**: `Erstelle bis zu 3 Challenges pro Monat`
4. **Price**: `€9.99/Monat`
5. **Settings**:
   - Recurring: ✅ Monthly
   - Stock: Unlimited
   - Active: ✅
6. **Speichern** → Access Pass ID kopieren (format: `pass_xxxxx`)

#### Plus Access Pass  
1. Klicke **"Create Access Pass"**
2. **Name**: `Plus Challenge Plan` 
3. **Description**: `Unbegrenzte Challenges erstellen`
4. **Price**: `€19.99/Monat`
5. **Settings**:
   - Recurring: ✅ Monthly
   - Stock: Unlimited
   - Active: ✅
6. **Speichern** → Access Pass ID kopieren

#### ProPlus Access Pass
1. Klicke **"Create Access Pass"**
2. **Name**: `ProPlus Challenge Plan`
3. **Description**: `Unbegrenzte Challenges + Paid Challenges erstellen`
4. **Price**: `€39.99/Monat`  
5. **Settings**:
   - Recurring: ✅ Monthly
   - Stock: Unlimited
   - Active: ✅
6. **Speichern** → Access Pass ID kopieren

### Schritt 3: Plan IDs aus Access Passes holen

Jeder Access Pass hat **mehrere Plan IDs** (verschiedene Billing-Zyklen):
- Monthly Plan ID (format: `plan_xxxxx`)
- Jährlich Plan ID (falls aktiviert)

### Schritt 4: Environment Variables setzen

Erstelle/Update `.env.local` mit den kopierten IDs:

```env
# Basic Tier
NEXT_PUBLIC_BASIC_ACCESS_PASS_ID=pass_basic_hier_einfügen
NEXT_PUBLIC_BASIC_PLAN_ID=plan_basic_monthly_hier_einfügen

# Plus Tier  
NEXT_PUBLIC_PLUS_ACCESS_PASS_ID=pass_plus_hier_einfügen
NEXT_PUBLIC_PLUS_PLAN_ID=plan_plus_monthly_hier_einfügen

# ProPlus Tier
NEXT_PUBLIC_PROPLUS_ACCESS_PASS_ID=pass_proplus_hier_einfügen  
NEXT_PUBLIC_PROPLUS_PLAN_ID=plan_proplus_monthly_hier_einfügen
```

### Schritt 5: Vercel Environment Variables

Setze die gleichen Variablen in Vercel Dashboard:
1. Gehe zu [vercel.com/dashboard](https://vercel.com/dashboard)
2. Wähle `challenges-whop-app-sqmr` Projekt
3. **Settings** → **Environment Variables**
4. Füge alle 6 Variablen hinzu
5. **Deploy** um Changes zu aktivieren

## Testing nach Setup

### Local Testing
```bash
pnpm dev
```

### Vercel Testing  
Nach Deploy in Dashboard App gehen und "Manage Plans" testen.

### Debug Logs
Die `handlePlanSelect` Funktion hat jetzt umfassende Logs:
- Plan ID wird geloggt
- iFrame SDK Response wird geloggt  
- Fehler werden detailliert angezeigt

## Wichtige Punkte

1. **Access Pass ID ≠ Plan ID**: Access Pass ist Container, Plan ID ist spezifischer Billing-Zyklus
2. **WhopIframeSdkProvider**: Bereits korrekt in Layout hinzugefügt
3. **Environment Variables**: Müssen NEXT_PUBLIC_ Prefix haben für Frontend-Zugriff
4. **Testing**: Erst local, dann Vercel Deploy für vollständigen Test

## Nächste Schritte

1. ✅ **Layout korrekt mit WhopIframeSdkProvider**
2. ✅ **Code updated für Plan IDs statt Product IDs** 
3. 📋 **Access Passes in Whop Dashboard erstellen**
4. 📋 **Environment Variables setzen**
5. 📋 **Vercel Deploy testen**

Nach diesem Setup sollten die Checkouts korrekt funktionieren!