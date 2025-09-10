// Define types locally based on Prisma schema
type Cadence = "DAILY" | "END_OF_CHALLENGE";

interface Challenge {
  cadence: Cadence;
  startAt: Date | string;
  endAt: Date | string;
}

interface Enrollment {
  id: string;
}

interface Checkin {
  id: string;
  enrollmentId: string;
  createdAt: Date | string;
  text?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
}

interface Proof {
  id: string;
  enrollmentId: string;
  type: string;
  url?: string | null;
  text?: string | null;
  version: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ChallengeValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
}

export interface CheckinConstraints {
  canCheckin: boolean;
  existingTodayCheckin?: Checkin;
  reason?: string;
}

export interface ProofConstraints {
  canSubmitProof: boolean;
  existingProof?: Proof;
  reason?: string;
}

/**
 * Validates if a check-in is allowed based on the challenge cadence
 */
export function validateCheckinRules(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  enrollment: Pick<Enrollment, 'id'>,
  existingCheckins: Checkin[] = [],
  currentDate: Date = new Date()
): CheckinConstraints {
  
  // Basic time validation
  const now = currentDate.getTime();
  const startTime = new Date(challenge.startAt).getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  // Challenge not started yet
  if (now < startTime) {
    return {
      canCheckin: false,
      reason: "Challenge has not started yet"
    };
  }
  
  // Challenge already ended
  if (now > endTime) {
    return {
      canCheckin: false,
      reason: "Challenge has already ended"
    };
  }
  
  if (challenge.cadence === "END_OF_CHALLENGE") {
    return validateEndOfChallengeCheckin(challenge, existingCheckins, currentDate);
  }
  
  if (challenge.cadence === "DAILY") {
    return validateDailyCheckin(challenge, existingCheckins, currentDate);
  }
  
  return {
    canCheckin: false,
    reason: "Unknown challenge cadence"
  };
}

/**
 * Validation for END_OF_CHALLENGE cadence
 */
function validateEndOfChallengeCheckin(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  existingCheckins: Checkin[],
  currentDate: Date
): CheckinConstraints {
  const now = currentDate.getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  // For END_OF_CHALLENGE: Check-in only allowed after challenge ends
  if (now < endTime) {
    return {
      canCheckin: false,
      reason: "Check-in is only possible after the challenge ends"
    };
  }
  
  // Existing check-in can be replaced
  if (existingCheckins.length > 0) {
    return {
      canCheckin: true,
      existingTodayCheckin: existingCheckins[0],
      reason: "Existing check-in will be replaced"
    };
  }
  
  return {
    canCheckin: true,
    reason: "Check-in possible after challenge ends"
  };
}

/**
 * Validation for DAILY cadence
 */
function validateDailyCheckin(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  existingCheckins: Checkin[],
  currentDate: Date
): CheckinConstraints {
  // Check if a check-in already exists today
  const todayStart = new Date(currentDate);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(currentDate);
  todayEnd.setHours(23, 59, 59, 999);
  
  const todayCheckin = existingCheckins.find(checkin => {
    const checkinDate = new Date(checkin.createdAt);
    return checkinDate >= todayStart && checkinDate <= todayEnd;
  });
  
  if (todayCheckin) {
    return {
      canCheckin: true,
      existingTodayCheckin: todayCheckin,
      reason: "Today's check-in can be updated"
    };
  }
  
  return {
    canCheckin: true,
    reason: "Daily check-in possible"
  };
}

/**
 * Validates proof submission based on challenge rules
 */
export function validateProofRules(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  enrollment: Pick<Enrollment, 'id'>,
  existingProofs: Proof[] = [],
  currentDate: Date = new Date()
): ProofConstraints {
  
  // Basic time validation
  const now = currentDate.getTime();
  const startTime = new Date(challenge.startAt).getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  // Challenge not started yet
  if (now < startTime) {
    return {
      canSubmitProof: false,
      reason: "Challenge has not started yet"
    };
  }
  
  if (challenge.cadence === "END_OF_CHALLENGE") {
    // For END_OF_CHALLENGE: Only one file total allowed, the last one replaces all previous ones
    const activeProofs = existingProofs.filter(p => p.isActive);
    
    if (activeProofs.length > 0) {
      return {
        canSubmitProof: true,
        existingProof: activeProofs[0],
        reason: "The previous file will be replaced by the new one. Only the last file counts for the challenge."
      };
    }
    
    return {
      canSubmitProof: true,
      reason: "Proof submission possible"
    };
  }
  
  if (challenge.cadence === "DAILY") {
    // For DAILY: Proof can be submitted daily while challenge is running
    if (now > endTime) {
      return {
        canSubmitProof: false,
        reason: "Challenge has already ended"
      };
    }
    
    // Check if a proof was already submitted today
    const todayStart = new Date(currentDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(currentDate);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayProof = existingProofs
      .filter(p => p.isActive)
      .find(proof => {
        const proofDate = new Date(proof.createdAt);
        return proofDate >= todayStart && proofDate <= todayEnd;
      });
    
    if (todayProof) {
      return {
        canSubmitProof: true,
        existingProof: todayProof,
        reason: "You have already uploaded a file today. The new file will replace today's file."
      };
    }
    
    return {
      canSubmitProof: true,
      reason: "Daily proof submission possible"
    };
  }
  
  return {
    canSubmitProof: false,
    reason: "Unknown challenge cadence"
  };
}

/**
 * Calculates challenge statistics based on cadence
 */
export function calculateChallengeProgress(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  checkins: Checkin[] = [],
  proofs: Proof[] = []
): {
  totalDays: number;
  completedDays: number;
  progressPercentage: number;
} {
  
  if (challenge.cadence === "END_OF_CHALLENGE") {
    // For END_OF_CHALLENGE: Always only 1 possible streak, regardless of challenge duration
    const activeProofs = proofs.filter(p => p.isActive);
    const hasCompletedChallenge = activeProofs.length > 0 && checkins.length > 0;
    
    return {
      totalDays: 1, // Always only 1, regardless of how long the challenge runs
      completedDays: hasCompletedChallenge ? 1 : 0,
      progressPercentage: hasCompletedChallenge ? 100 : 0
    };
  }
  
  if (challenge.cadence === "DAILY") {
    const startDate = new Date(challenge.startAt);
    const endDate = new Date(challenge.endAt);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // For DAILY: Count unique check-in days
    const checkinDays = new Set();
    checkins.forEach(checkin => {
      const checkinDate = new Date(checkin.createdAt);
      const daysSinceStart = Math.floor((checkinDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart >= 0 && daysSinceStart < totalDays) {
        checkinDays.add(daysSinceStart);
      }
    });
    
    const completedDays = checkinDays.size;
    const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    return {
      totalDays,
      completedDays,
      progressPercentage
    };
  }
  
  return {
    totalDays: 0,
    completedDays: 0,
    progressPercentage: 0
  };
}

/**
 * Helper function: Checks if challenge is currently active
 */
export function isChallengeActive(
  challenge: Pick<Challenge, 'startAt' | 'endAt'>,
  currentDate: Date = new Date()
): boolean {
  const now = currentDate.getTime();
  const startTime = new Date(challenge.startAt).getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  return now >= startTime && now <= endTime;
}

/**
 * Helper function: Checks if challenge has ended
 */
export function isChallengeEnded(
  challenge: Pick<Challenge, 'endAt'>,
  currentDate: Date = new Date()
): boolean {
  const now = currentDate.getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  return now > endTime;
}

/**
 * Validates challenge creation/editing
 */
export function validateChallengeData(data: {
  startAt: Date;
  endAt: Date;
  cadence: Cadence;
}): ChallengeValidationResult {
  const startTime = data.startAt.getTime();
  const endTime = data.endAt.getTime();
  
  // End date must be after start date
  if (endTime <= startTime) {
    return {
      isValid: false,
      error: "End date must be after start date",
      errorCode: "INVALID_DATE_RANGE"
    };
  }
  
  // For DAILY: At least 1 day duration
  if (data.cadence === "DAILY") {
    const durationDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
    if (durationDays < 1) {
      return {
        isValid: false,
        error: "Daily challenge must last at least 1 day",
        errorCode: "DAILY_TOO_SHORT"
      };
    }
  }
  
  return { isValid: true };
}
