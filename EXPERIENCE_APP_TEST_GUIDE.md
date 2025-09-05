# 🖼️ Experience App Test - Schritt für Schritt

## **Problem:** Whop Login funktioniert nicht
**Lösung:** Experience App richtig in Whop Company testen

## 🎯 **Schritt 1: Whop Developer Portal öffnen**

1. Gehe zu: **https://dev.whop.com**
2. Login mit deinem Whop Account
3. Finde deine App: **`app_zPVd4wYq8wpnEr`**

## 🏢 **Schritt 2: Company für Testing erstellen**

1. **Neue Company erstellen:**
   - Gehe zu: https://whop.com/create-company
   - Name: `Test Challenge Company`
   - Beschreibung: `Testing Challenge App`

2. **Company ID notieren** (z.B. `biz_ABC123`)

## 🔧 **Schritt 3: App in Company installieren**

### **Option A: Über Developer Portal**
1. Gehe zu deiner App in https://dev.whop.com
2. Klicke **"Install in Company"** 
3. Wähle deine Test Company
4. Bestätige Installation

### **Option B: Über Whop Marketplace** 
1. Publishe deine App im Marketplace (falls noch nicht)
2. Installiere sie in deiner Company

## 🖼️ **Schritt 4: Experience App konfigurieren**

1. **In Developer Portal:**
   - App Settings → **Experience Configuration**
   - **App URL:** `https://challenges-whop-app-sqmr.vercel.app`
   - **Type:** `iFrame Experience`
   - **Permissions:** `user:read`, `memberships:read`

2. **Experience URL erstellen:**
   ```
   https://whop.com/company/[COMPANY_ID]/experiences/[APP_ID]
   ```
   
   **Beispiel:**
   ```
   https://whop.com/company/biz_YoIIIT73rXwrtK/experiences/app_zPVd4wYq8wpnEr
   ```

## 🧪 **Schritt 5: Experience App testen**

1. **Öffne die Experience URL** (von Schritt 4)
2. **Du solltest die Challenge App in einem iFrame sehen**
3. **Navigiere zu:** `/whop-debug`
4. **Klicke:** "Test Experience Auth"

## ✅ **Was du sehen solltest:**

```json
{
  "experienceContext": {
    "userId": "user_ABC123",
    "companyId": "biz_XYZ789",
    "isEmbedded": true
  },
  "currentUser": {
    "id": "usr_...",
    "email": "user_ABC123@whop.com",
    "role": "ADMIN"
  },
  "status": {
    "hasContext": true,
    "hasUser": true,
    "isAuthenticated": true,
    "authMethod": "experience-app"
  }
}
```

## 🚨 **Falls es nicht funktioniert:**

### **Debugging Steps:**
1. **Check Whop Headers** - zeigt alle verfügbaren Headers
2. **Browser Console** - prüfe auf JavaScript Errors
3. **Network Tab** - prüfe API calls

### **Häufige Probleme:**
- **Keine Headers:** App nicht als Experience konfiguriert
- **Keine Company ID:** App nicht in Company installiert
- **iFrame blockiert:** Browser blockiert iFrame content

## 📱 **Alternative: Direkte URL testen**

Falls Experience App nicht funktioniert, teste OAuth Login:

1. **Gehe direkt zu:** `https://challenges-whop-app-sqmr.vercel.app/whop-debug`
2. **Klicke:** "Try Whop Login"
3. **Whop OAuth sollte starten**

## 🎯 **Next Steps nach erfolgreichem Test:**

1. **Multi-Tenant Test:** Installiere App in 2. Company
2. **Admin Dashboard:** Teste Challenge Creation
3. **Member Access:** Teste als normaler Company Member

---

**💡 Tipp:** Experience Apps funktionieren nur wenn sie richtig in Whop Companies installiert und über Whop aufgerufen werden!
