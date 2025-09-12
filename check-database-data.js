const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("=== Database Check ===");
    
    // Get current tenant ID
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, tenantId: true }
    });
    
    console.log("Admin user:", admin);
    
    if (!admin?.tenantId) {
      console.log("No admin user found or no tenant ID");
      return;
    }
    
    // Check all users in this tenant
    const users = await prisma.user.findMany({
      where: { tenantId: admin.tenantId },
      select: { id: true, email: true, role: true, createdAt: true }
    });
    
    console.log(`\nUsers in tenant ${admin.tenantId}:`, users.length);
    users.forEach(user => {
      console.log(`- ${user.id} | ${user.email} | ${user.role}`);
    });
    
    // Check all challenges in this tenant
    const challenges = await prisma.challenge.findMany({
      where: { tenantId: admin.tenantId },
      select: { id: true, title: true, createdAt: true }
    });
    
    console.log(`\nChallenges in tenant ${admin.tenantId}:`, challenges.length);
    challenges.forEach(challenge => {
      console.log(`- ${challenge.id} | ${challenge.title}`);
    });
    
    // Check specific user and challenge from the error
    const targetUser = await prisma.user.findUnique({
      where: { id: 'cmfexq21500040afswld15eyz' },
      select: { id: true, email: true, tenantId: true }
    });
    console.log(`\nTarget user cmfexq21500040afswld15eyz:`, targetUser);
    
    const targetChallenge = await prisma.challenge.findUnique({
      where: { id: 'cmffnzz16000106fnrg4pdg6f' },
      select: { id: true, title: true, tenantId: true }
    });
    console.log(`Target challenge cmffnzz16000106fnrg4pdg6f:`, targetChallenge);
    
    // Check enrollments for this challenge
    const enrollments = await prisma.enrollment.findMany({
      where: { challengeId: 'cmffnzz16000106fnrg4pdg6f' },
      include: {
        user: { select: { id: true, email: true, tenantId: true } },
        challenge: { select: { id: true, title: true, tenantId: true } }
      }
    });
    console.log(`\nEnrollments for challenge cmffnzz16000106fnrg4pdg6f:`, enrollments.length);
    enrollments.forEach(enrollment => {
      console.log(`- User: ${enrollment.user.email} (${enrollment.user.id}) | Tenant: ${enrollment.user.tenantId}`);
      console.log(`- Challenge: ${enrollment.challenge.title} | Tenant: ${enrollment.challenge.tenantId}`);
    });

    // Check if this is a cross-tenant enrollment issue
    console.log("\n=== TENANT MISMATCH ANALYSIS ===");
    if (targetUser && targetChallenge) {
      console.log(`User tenant: ${targetUser.tenantId}`);
      console.log(`Challenge tenant: ${targetChallenge.tenantId}`);
      console.log(`Match: ${targetUser.tenantId === targetChallenge.tenantId}`);
    }
    
  } catch (error) {
    console.error("Database check error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();