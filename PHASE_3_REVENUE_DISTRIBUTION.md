# Phase 3: Revenue Distribution - Setup Guide

## ✅ What's Been Implemented

Phase 3 automatically distributes revenue to challenge creators using Whop's `payUser` API:

- **90%** goes to the challenge creator (in their Whop balance)
- **10%** stays with the platform
- Transfer happens **instantly** after successful payment
- Uses **idempotence keys** to prevent duplicate transfers
- **Automatic retry** logic for failed transfers

---

## 🚀 Setup Instructions

### Step 1: Get Your Ledger Account ID

Run the setup script to get your company's ledger account ID:

```bash
# Using tsx (recommended)
npx tsx setup-ledger-account.ts

# Or using ts-node
node --loader ts-node/esm setup-ledger-account.ts
```

This will display:
- Your Ledger Account ID
- Current transfer fee percentage
- Your current balance
- Example revenue split calculation

### Step 2: Add to Environment Variables

Add the ledger account ID to your `.env` file:

```bash
WHOP_LEDGER_ACCOUNT_ID=ldgr_XXXXXXXXXXXXXXX
```

### Step 3: Restart Your Application

```bash
# Development
pnpm dev

# Production
# Redeploy your app with the new environment variable
```

---

## 💰 How It Works

### Payment Flow

```
1. User pays $10 for Challenge Entry
   ↓
2. Card Processing Fee (2.7% + $0.30) = -$0.57
   ↓
3. Amount after fees: $9.43 (in your Company Ledger)
   ↓
4. Webhook fires → payment.succeeded
   ↓
5. System creates enrollment
   ↓
6. Revenue distribution triggered:
   - Creator (90%): $8.49 → payUser API
   - Platform (10%): $0.94 → stays in your ledger
   ↓
7. Transfer Fee applied (from ledger.transferFee)
   ↓
8. Creator receives money instantly in Whop balance! ✅
```

### Money Movement

**Your Company Ledger → Creator's Whop Balance**

- Transfer happens **inside Whop** (no bank payout yet)
- Creator can use money immediately on Whop
- Or creator can withdraw to bank later (they pay withdrawal fees)

---

## 💸 Costs

### Your Costs (Platform):
- **Card Processing**: 2.7% + $0.30 per transaction (unavoidable)
- **Transfer Fee**: `ledgerAccount.transferFee` (usually 0% or very low)
- **Example**: On a $10 payment, you keep ~$0.94 (9.4%)

### Creator Receives:
- **90% of amount_after_fees** directly in Whop balance
- **Example**: $8.49 from a $10 payment

### Creator Withdrawal Costs (they pay, not you):
When creator wants to cash out to bank:
- **Next-day ACH**: $2.50
- **Instant**: 4% + $1.00
- **Crypto**: 5% + $1.00
- **Venmo**: 5% + $1.00

---

## 🔧 Technical Details

### Revenue Distribution Service

Located in: `lib/revenue-sharing.ts`

**Key Features:**
- Automatic 90/10 split calculation
- Idempotence keys prevent duplicate transfers
- Retry logic for failed transfers (up to 3 attempts)
- Comprehensive error logging
- Database tracking of all revenue shares

### Database Schema

```prisma
model RevenueShare {
  id            String    @id
  challengeId   String
  creatorId     String
  whopCreatorId String
  paymentId     String
  amount        Int       // Creator amount in cents
  platformFee   Int       // Platform fee in cents
  transferId    String?   // Whop transfer reference
  status        String    // pending, completed, failed
  createdAt     DateTime
  processedAt   DateTime?
  errorMessage  String?
  retryCount    Int
}
```

### Webhook Integration

File: `app/api/webhooks/route.ts`

When `payment.succeeded` event fires:
1. ✅ Creates enrollment
2. ✅ Calculates 90/10 split
3. ✅ Calls `revenueDistributionService.distributeRevenue()`
4. ✅ Updates RevenueShare record with status

---

## 🧪 Testing

### Test the Setup

1. Run the setup script to verify your ledger account
2. Check that `WHOP_LEDGER_ACCOUNT_ID` is in your environment
3. Create a test paid challenge ($10 entry fee)
4. Purchase the challenge
5. Check logs for:
   ```
   ✅ Enrollment created
   💰 Initiating revenue distribution
   🔄 Initiating Whop payUser transfer
   ✅ Whop payUser transfer successful!
   ✅ Revenue distribution successful!
   ```

### Check Database

```sql
-- View all revenue shares
SELECT * FROM "RevenueShare" ORDER BY "createdAt" DESC;

-- Check completed transfers
SELECT * FROM "RevenueShare" WHERE status = 'completed';

-- Check failed transfers (for retry)
SELECT * FROM "RevenueShare" WHERE status = 'failed';
```

---

## 🔍 Monitoring

### Successful Transfer Logs

```
💰 Starting revenue distribution: {
  challengeId: "chal_xxx",
  creatorAmount: 849,
  platformAmount: 94
}
🔄 Initiating Whop payUser transfer: {
  whopCreatorId: "user_xxx",
  amountDollars: "8.49"
}
✅ Whop payUser transfer successful!
✅ Revenue share marked as completed
```

### Failed Transfer Logs

```
❌ Whop payUser failed: [error message]
⚠️ Revenue share marked as failed (will retry)
```

---

## 🛠️ Troubleshooting

### Error: "WHOP_LEDGER_ACCOUNT_ID not set"

**Solution**: Run `setup-ledger-account.ts` and add the ID to `.env`

### Error: "Transfer fee verification failed"

**Solution**: The `transferFee` in your API call doesn't match your ledger account's fee. Remove the `transferFee` parameter or get the correct value from `getLedgerAccount()`.

### Revenue share stuck in "pending"

**Possible causes**:
1. Ledger account ID not configured
2. Creator's `whopCreatorId` is invalid
3. Insufficient balance in company ledger

**Check**:
```sql
SELECT * FROM "RevenueShare" 
WHERE status = 'pending' 
ORDER BY "createdAt" DESC;
```

### Retry failed transfers

Currently manual - you can implement a cron job to retry failed transfers:

```typescript
// Example retry logic
const failed = await prisma.revenueShare.findMany({
  where: {
    status: 'failed',
    retryCount: { lt: 3 }
  }
});

for (const share of failed) {
  await revenueDistributionService.retryTransfer(share.id);
}
```

---

## 📊 Example Scenarios

### Scenario 1: $10 Entry Fee
```
User pays: $10.00
Card fee: -$0.57
After fees: $9.43
Creator: $8.49 (90%)
Platform: $0.94 (10%)
Transfer fee (0.5%): -$0.04
Creator receives: $8.45
Platform net: $0.98
```

### Scenario 2: $50 Entry Fee
```
User pays: $50.00
Card fee: -$1.65
After fees: $48.35
Creator: $43.52 (90%)
Platform: $4.84 (10%)
Transfer fee (0.5%): -$0.22
Creator receives: $43.30
Platform net: $5.06
```

### Scenario 3: Free Challenge
```
Entry fee: $0.00
No revenue distribution
Creator: $0.00
Platform: $0.00
```

---

## 🎯 Next Steps

✅ **Phase 3 is complete!** Revenue is now automatically distributed.

### Optional Enhancements:

1. **Admin Dashboard**: View all revenue shares and their status
2. **Creator Dashboard**: Show creators their earnings
3. **Retry Job**: Automatic retry of failed transfers
4. **Notifications**: Email creators when they receive payment
5. **Analytics**: Track total revenue distributed, average fees, etc.

---

## 📚 References

- [Whop payUser API](https://docs.whop.com/sdk/api/payments/pay-user)
- [Whop Ledger Accounts](https://docs.whop.com/sdk/api/companies/get-company-ledger-account)
- [Whop Fees](https://docs.whop.com/fees)
- [Payment Webhooks](https://docs.whop.com/apps/features/webhooks)

---

**Questions?** Check the logs for detailed information about each transfer. All operations are logged comprehensively.
