// lib/winnerSelection.ts
import { PrismaClient, User, Challenge, Enrollment, Proof } from '@prisma/client';
import { sendWhopNotification, getWhopUserIdByEmail } from './whopApi';

const prisma = new PrismaClient();

export interface ParticipantScore {
  user: User;
  enrollment: Enrollment & { proofs: Proof[] };
  score: number;
  metrics: {
    baseScore: number;
    consistencyBonus: number;
    recentActivityBonus: number;
    proofsCount: number;
  };
}

export interface WinnerResult {
  place: number;
  user: User;
  score: number;
  title: string;
  description: string;
  selectionReason: string;
  metrics: ParticipantScore['metrics'];
  whopUserId?: string;
}

export interface WinnerSelectionConfig {
  minParticipants?: number;
  maxWinners?: number;
  requireMinProofs?: number;
  bonusForConsistency?: number;
  bonusForRecent?: number;
  rewardTitles?: string[];
  rewardDescriptions?: string[];
}

const DEFAULT_CONFIG: WinnerSelectionConfig = {
  minParticipants: 1,
  maxWinners: 3,
  requireMinProofs: 1,
  bonusForConsistency: 20,
  bonusForRecent: 15,
  rewardTitles: [
    'First Place Winner',
    'Second Place Winner',
    'Third Place Winner'
  ],
  rewardDescriptions: [
    '$100 Whop Credit + Premium Features Access',
    '$50 Whop Credit + Extended Trial',
    '$25 Whop Credit + Special Badge'
  ]
};

/**
 * Calculate engagement scores for challenge participants
 */
export function calculateParticipantScores(
  enrollments: (Enrollment & { user: User; proofs: Proof[] })[],
  config: WinnerSelectionConfig = {}
): ParticipantScore[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const participantsWithActivity = enrollments.filter(e => e.proofs.length >= (cfg.requireMinProofs || 1));
  
  const scoredParticipants = participantsWithActivity.map(enrollment => {
    const proofs = enrollment.proofs;
    const baseScore = proofs.length * 10; // 10 points per proof
    const consistencyBonus = proofs.length >= 3 ? (cfg.bonusForConsistency || 20) : 0;
    const recentActivityBonus = proofs.some(p => 
      new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) ? (cfg.bonusForRecent || 15) : 0;
    
    const totalScore = baseScore + consistencyBonus + recentActivityBonus;
    
    return {
      user: enrollment.user,
      enrollment: enrollment,
      score: totalScore,
      metrics: {
        baseScore,
        consistencyBonus,
        recentActivityBonus,
        proofsCount: proofs.length
      }
    };
  });

  // Sort by score (highest first)
  return scoredParticipants.sort((a, b) => b.score - a.score);
}

/**
 * Select winners from scored participants
 */
export function selectWinners(
  scoredParticipants: ParticipantScore[],
  challenge: Challenge,
  config: WinnerSelectionConfig = {}
): WinnerResult[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (scoredParticipants.length < (cfg.minParticipants || 1)) {
    throw new Error(`Not enough participants. Need at least ${cfg.minParticipants}, got ${scoredParticipants.length}`);
  }

  const winnerCount = Math.min(cfg.maxWinners || 3, scoredParticipants.length);
  const winners: WinnerResult[] = [];
  
  for (let i = 0; i < winnerCount; i++) {
    const participant = scoredParticipants[i];
    const winner: WinnerResult = {
      place: i + 1,
      user: participant.user,
      score: participant.score,
      title: cfg.rewardTitles?.[i] || `Place ${i + 1}`,
      description: cfg.rewardDescriptions?.[i] || `Winner of place ${i + 1}`,
      selectionReason: `Selected for ${cfg.rewardTitles?.[i] || `place ${i + 1}`} with ${participant.score} engagement points`,
      metrics: participant.metrics
    };
    
    winners.push(winner);
  }

  return winners;
}

/**
 * Send Whop notifications to winners
 */
export async function notifyWinnersViaWhop(
  winners: WinnerResult[],
  challenge: Challenge
): Promise<{ success: number; failed: number; results: { winner: WinnerResult; success: boolean; whopUserId?: string }[] }> {
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const winner of winners) {
    try {
      // Get Whop user ID
      const whopUserId = await getWhopUserIdByEmail(winner.user.email);
      
      if (!whopUserId) {
        console.error(`No Whop user ID found for ${winner.user.email}`);
        results.push({ winner, success: false });
        failedCount++;
        continue;
      }

      const whopNotification = {
        userId: whopUserId,
        title: `🎉 Congratulations! You won ${winner.title}`,
        message: `Dear ${winner.user.name},

Congratulations on winning ${winner.title} in "${challenge.title}"!

🏆 Prize: ${winner.description}
📊 Your Score: ${winner.score} engagement points
📈 Proofs Submitted: ${winner.metrics.proofsCount}
🎯 Selection Reason: ${winner.selectionReason}

Your Whop account will be credited automatically. Check your Whop dashboard for prize details and redemption instructions.

Keep up the great work!

Best regards,
Challenge Team`
      };

      const notificationSent = await sendWhopNotification(whopNotification, challenge.id);
      
      if (notificationSent) {
        winner.whopUserId = whopUserId;
        results.push({ winner, success: true, whopUserId });
        successCount++;
        console.log(`✅ Whop notification sent to ${winner.user.name} (${whopUserId})`);
      } else {
        results.push({ winner, success: false, whopUserId });
        failedCount++;
        console.error(`❌ Failed to send Whop notification to ${winner.user.name}`);
      }
    } catch (error) {
      console.error(`❌ Error sending notification to ${winner.user.name}:`, error);
      results.push({ winner, success: false });
      failedCount++;
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    results
  };
}

/**
 * Complete winner selection process with Whop notifications
 */
export async function selectAndNotifyWinners(
  challengeId: string,
  config: WinnerSelectionConfig = {}
): Promise<{
  challenge: Challenge;
  scoredParticipants: ParticipantScore[];
  winners: WinnerResult[];
  notifications: { success: number; failed: number; results: any[] };
}> {
  // Get challenge with enrollments and proofs
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      enrollments: {
        include: {
          user: true,
          proofs: true
        }
      }
    }
  });

  if (!challenge) {
    throw new Error(`Challenge not found: ${challengeId}`);
  }

  // Calculate scores
  const scoredParticipants = calculateParticipantScores(challenge.enrollments, config);
  
  // Select winners
  const winners = selectWinners(scoredParticipants, challenge, config);
  
  // Send Whop notifications
  const notifications = await notifyWinnersViaWhop(winners, challenge);

  return {
    challenge,
    scoredParticipants,
    winners,
    notifications
  };
}

/**
 * Get challenge analytics including Whop integration data
 */
export async function getChallengeAnalytics(challengeId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      enrollments: {
        include: {
          user: true,
          proofs: true
        }
      }
    }
  });

  if (!challenge) {
    throw new Error(`Challenge not found: ${challengeId}`);
  }

  const participantsWithActivity = challenge.enrollments.filter(e => e.proofs.length > 0);
  const totalProofs = participantsWithActivity.reduce((sum, p) => sum + p.proofs.length, 0);
  const avgProofsPerParticipant = participantsWithActivity.length > 0 
    ? (totalProofs / participantsWithActivity.length) 
    : 0;
  const completionRate = challenge.enrollments.length > 0 
    ? ((participantsWithActivity.filter(p => p.proofs.length >= 3).length / challenge.enrollments.length) * 100) 
    : 0;

  return {
    challengeId,
    challengeTitle: challenge.title,
    totalParticipants: challenge.enrollments.length,
    activeParticipants: participantsWithActivity.length,
    totalProofs,
    averageProofsPerParticipant: Number(avgProofsPerParticipant.toFixed(2)),
    completionRate: Number(completionRate.toFixed(1)),
    startDate: challenge.startAt,
    endDate: challenge.endAt,
    status: new Date() > challenge.endAt ? 'completed' : 'active',
    whopIntegration: {
      enabled: true,
      notificationSystem: 'whop',
      creditAllocation: 'automatic'
    }
  };
}
