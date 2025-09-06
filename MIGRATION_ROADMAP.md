# 🏗️ WHOP MIGRATION ROADMAP

## 🎯 Neuer Architektur-Plan (Based on Official Whop Docs)

### 📂 Neue File Structure:
```
app/
  experiences/
    [experienceId]/
      page.tsx         # EINZIGE Route! Conditional rendering
      components/      # Spezifische Experience Components
      admin/          # Admin-only Components (conditional)
      customer/       # Customer-only Components (conditional)
  api/
    experience/
      [experienceId]/
        challenges/    # API für Challenge CRUD
        participants/  # API für Participation
        upload/       # File upload API
  globals.css
  layout.tsx
```

### 🔐 Vereinfachte Authentication:
```typescript
// lib/whop-auth-simple.ts
import { whopSdk } from './whop-sdk';

export async function authenticateUser(experienceId: string) {
  const token = cookies().get('whop_token')?.value;
  
  if (!token) {
    return { accessLevel: 'no_access', user: null };
  }
  
  const user = await whopSdk.verifyUserToken(token);
  const access = await whopSdk.checkIfUserHasAccessToExperience(experienceId, user.id);
  
  return { accessLevel: access.valid ? access.level : 'no_access', user };
}
```

### 🎨 Experience Route mit Conditional Rendering:
```typescript
// app/experiences/[experienceId]/page.tsx
export default async function ExperiencePage({ params }) {
  const { accessLevel, user } = await authenticateUser(params.experienceId);
  
  if (accessLevel === 'no_access') {
    return <WhopLoginButton />;
  }
  
  if (accessLevel === 'admin') {
    return <AdminDashboard experienceId={params.experienceId} />;
  }
  
  if (accessLevel === 'customer') {
    return <CustomerChallenges experienceId={params.experienceId} />;
  }
}
```

## 🔄 Migration Steps:

### Phase 1: Setup (30 min)
1. Neue /app/experiences/[experienceId]/page.tsx erstellen
2. Simplified authentication implementieren
3. Basic conditional rendering

### Phase 2: Component Migration (60 min)
1. Admin components in /admin/ subfolder
2. Customer components in /customer/ subfolder
3. Shared components optimieren

### Phase 3: API Routes (45 min)
1. Challenge CRUD APIs aktualisieren
2. File upload API anpassen
3. Database queries optimieren

### Phase 4: Testing (30 min)
1. Admin access testen
2. Customer access testen
3. No access fallback testen

### Phase 5: Cleanup (15 min)
1. Alte routes löschen
2. Unused auth code entfernen
3. Final testing

---

**Total Time**: ~3 Stunden
**Benefit**: Vollständig Whop-konform, viel einfacher zu maintainen
