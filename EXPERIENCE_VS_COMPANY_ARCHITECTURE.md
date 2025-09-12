# 🎯 EXPERIENCE vs COMPANY - ARCHITEKTUR KLARSTELLUNG

## ❌ AKTUELLES PROBLEM:

```typescript
// admin/challenges/route.ts verwendet:
tenantId: experienceId  // ❌ FALSCH

// aber auth.ts und challenges/route.ts verwenden:
tenantId: whopCompanyId // ✅ RICHTIG
```

## 🔍 WHOP ARCHITEKTUR VERSTEHEN:

### **Company (Business Entity)**
- `companyId`: "biz_YoIIIT73rXwrtK" 
- Ein Business/Creator Account bei Whop
- Kann MEHRERE Apps installieren
- Kann MEHRERE Experiences haben

### **Experience (App Installation)**
- `experienceId`: "exp_wr9tbkUyeL1Oi5"
- Eine spezifische App-Installation in einer Company
- Gehört zu GENAU EINER Company
- Hat eigene URL: `/company/{companyId}/experiences/{experienceId}`

## 🎯 KORREKTE MULTI-TENANT STRATEGIE:

### **Option 1: Company-Based Tenants (RECOMMENDED)**
```typescript
// Jede Company = Ein Tenant
// Alle Apps/Experiences einer Company teilen Daten
tenantId = companyId
```

**Vorteile:**
- ✅ Company Owner kann alle ihre Apps verwalten
- ✅ Konsistent mit Business-Logik
- ✅ Einfacher zu verstehen
- ✅ Daten bleiben auch bei App-Reinstallation

### **Option 2: Experience-Based Tenants**
```typescript
// Jede App-Installation = Ein Tenant  
// Separate Daten per Experience
tenantId = experienceId
```

**Nachteile:**
- ❌ Company Owner verliert Daten bei App-Reinstallation
- ❌ Keine Daten-Synchronisation zwischen Apps
- ❌ Komplexer für Users

## 🔧 FIXES ERFORDERLICH:

### 1. Experience Context API korrigieren:
```typescript
// app/api/auth/experience-context/route.ts
// Hole BEIDE IDs aber verwende companyId für Tenant-Lookup

const experienceContext = await getExperienceContext();
const companyId = experienceContext.companyId; // ✅ Für Tenants
const experienceId = experienceContext.experienceId; // ✅ Für Experience-scoped checks
```

### 2. Admin Challenges API korrigieren:
```typescript
// app/api/admin/challenges/route.ts
// Ersetze experienceId mit companyId für Tenant-Lookup

const challenges = await prisma.challenge.findMany({
  where: {
    tenantId: companyId  // ✅ NICHT experienceId
  }
});
```

### 3. Whop Access Checks beibehalten:
```typescript
// Experience Access Check weiterhin verwenden für Security
const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
  userId,
  experienceId  // ✅ Für Access Control
});

// Aber Daten-Filtering basierend auf Company
const tenant = await prisma.tenant.findUnique({
  where: { whopCompanyId: companyId }  // ✅ Für Data Isolation
});
```

## 🎯 MIGRATION PLAN:

1. ✅ Alle APIs auf `whopCompanyId` für Tenants umstellen
2. ✅ Experience Access Checks für Security beibehalten  
3. ✅ Datenbank Migration für bestehende Tenants
4. ✅ Testen mit echten Whop Companies

**Result:** Company-based Multi-Tenancy mit Experience-scoped Security!