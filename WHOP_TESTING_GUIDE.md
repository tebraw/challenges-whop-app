# 🚀 Whop Testing Guide - Multi-Tenant Isolation

## 🎯 Was wir testen wollen:
**Überprüfen, dass verschiedene Company Owners nur ihre eigenen Challenges sehen**

## 📋 Test-Plan

### Test 1: Basis Funktionalität
1. App im Whop iframe öffnen
2. Admin Panel aufrufen 
3. Prüfen: Werden Challenges angezeigt?
4. Prüfen: Ist die Company ID korrekt?

### Test 2: Multi-Tenant Isolation 
1. Mit verschiedenen Whop-Accounts testen
2. Challenges in Account A erstellen
3. Mit Account B prüfen: Sieht B die Challenges von A? (Sollte NEIN sein)

### Test 3: Automatische Tenant-Erstellung
1. Komplett neuen Whop-Account verwenden
2. App zum ersten Mal öffnen
3. Prüfen: Wird automatisch neuer Tenant erstellt?

## 🔧 Debug URLs für Testing

### Während Whop-Testing verfügbar:
```
[Your Whop App URL]/api/debug/user
[Your Whop App URL]/api/debug/whop-headers  
[Your Whop App URL]/api/auth/experience-context
[Your Whop App URL]/api/admin/challenges
```

### Admin Panel:
```
[Your Whop App URL]/admin
```

## 🕵️ Was bei jedem Test zu prüfen:

### 1. Browser DevTools öffnen (F12)
### 2. Console-Logs checken:
```
✅ Suche nach: "🏢 Valid company context: [companyId]"
✅ Suche nach: "✅ Found existing tenant" oder "🏗️ Creating new tenant"
✅ Suche nach: "📋 Returning X challenges for tenant"
```

### 3. Network Tab checken:
```
✅ GET /api/admin/challenges → Status 200
✅ Response enthält nur Challenges für diese Company
✅ Keine fremden Challenges in der Response
```

### 4. Response Body prüfen:
```json
{
  "success": true,
  "challenges": [...], // Nur eigene Challenges
  "context": {
    "experienceId": "...",
    "userId": "...",
    "accessLevel": "admin"
  }
}
```

## 🚨 Erwartete Ergebnisse:

### ✅ ERFOLGREICH wenn:
- Jeder Company Owner sieht nur seine eigenen Challenges
- Neue Companies bekommen automatisch leeren Tenant
- Console zeigt korrekte Company ID
- API Response enthält nur gefilterte Challenges

### ❌ FEHLER wenn:
- Company A sieht Challenges von Company B
- Error: "Company context required"
- Error: "Admin access required"
- Prisma errors in console

## 🛠️ Troubleshooting

### Problem: "Company context required"
**Lösung:** Whop headers fehlen - App muss im echten Whop iframe laufen

### Problem: "Admin access required" 
**Lösung:** User hat keine Berechtigung für diese Company

### Problem: Challenges von anderen Companies sichtbar
**Lösung:** 🚨 KRITISCHER BUG - sofort melden!

## 📊 Test-Dokumentation

### Für jeden Test bitte notieren:
1. **Company ID:** [Was zeigt die Console?]
2. **Tenant ID:** [Automatisch erstellt oder bestehend?]
3. **Challenge Count:** [Wieviele Challenges werden angezeigt?]
4. **Other Companies:** [Sind fremde Challenges sichtbar?]

### Test-Protokoll:
```
Test 1 - Company: abc123
✅ Company context extracted: abc123
✅ Tenant auto-created: tenant_xyz
✅ Challenges shown: 0 (leer - korrekt für neue Company)
✅ No foreign challenges visible

Test 2 - Company: def456  
✅ Company context extracted: def456
✅ Existing tenant found: tenant_uvw
✅ Challenges shown: 3 (nur eigene)
✅ Cannot see challenges from Company abc123
```

## 🎉 Erfolgs-Kriterien:

Das System ist **erfolgreich** wenn:
1. ✅ Automatische Tenant-Erstellung für neue Companies
2. ✅ Perfekte Isolation zwischen Companies  
3. ✅ Keine manuellen Database-Eingriffe nötig
4. ✅ Stabile Performance im Whop iframe

**Ready for Whop Testing!** 🚀