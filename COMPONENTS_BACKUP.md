# 🗂️ WICHTIGE COMPONENTS BACKUP

## 📊 Database Schema (Prisma) - BEHALTEN!
```typescript
// prisma/schema.prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  tenantId      String?
  whopCompanyId String?
  whopUserId    String?  @unique
  tenant        Tenant?  @relation(fields: [tenantId], references: [id])
  challenges    Challenge[]
  participations Participation[]
}

model Challenge {
  id               String          @id @default(cuid())
  title            String
  description      String?
  rules            Json?
  startAt          DateTime?
  endAt            DateTime?
  proofType        String          @default("image")
  imageUrl         String?
  maxParticipants  Int?
  tenantId         String
  createdById      String
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  tenant           Tenant          @relation(fields: [tenantId], references: [id])
  createdBy        User            @relation(fields: [createdById], references: [id])
  participations   Participation[]
}

// etc...
```

## 🎨 UI Components - WIEDERVERWENDEN!

### Challenge Card Component:
- Modern card design mit Thumbnail
- Challenge status indicators
- Participant count
- Join/Leave buttons
- Progress tracking

### Admin Interface Components:
- Challenge creation form
- Rich text editor für descriptions
- Date/time pickers
- Image upload
- Rule builder
- Participant management

### User Interface Components:
- Challenge discovery feed
- Proof upload forms
- Leaderboard tables
- Personal stats dashboard
- Winner announcements

## 🔧 Wichtige Utils - BEHALTEN!

### Challenge Rules System:
```typescript
// lib/challengeRules.ts
export interface ChallengeRule {
  type: 'daily' | 'streak' | 'total' | 'custom';
  description: string;
  target?: number;
  timeframe?: string;
}
```

### Premium Targeting:
```typescript
// lib/premiumTargeting.ts
// Premium challenge access logic
```

### File Upload System:
```typescript
// app/api/upload/route.ts
// Image/video upload mit validation
```

## 📱 Design Patterns - WIEDERVERWENDEN!

### Tailwind Styling:
- Consistent spacing (p-4, m-6, etc.)
- Color scheme (blue-600, green-500, etc.)
- Responsive breakpoints
- Component compositions

### Form Handling:
- React Hook Form integration
- Validation patterns
- Error handling
- Success feedback

### State Management:
- Client-side state patterns
- Server actions
- Loading states
- Error boundaries

---

**Zweck**: Wichtige Components und Patterns für Neuaufbau sichern
**Datum**: September 6, 2025
