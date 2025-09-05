import { Cadence, Challenge, Enrollment, Checkin, Proof } from "@prisma/client";

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
 * Validiert, ob ein Check-in basierend auf der Challenge-Cadence erlaubt ist
 */
export function validateCheckinRules(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  enrollment: Pick<Enrollment, 'id'>,
  existingCheckins: Checkin[] = [],
  currentDate: Date = new Date()
): CheckinConstraints {
  
  // Grundlegende Zeitvalidierung
  const now = currentDate.getTime();
  const startTime = new Date(challenge.startAt).getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  // Challenge noch nicht gestartet
  if (now < startTime) {
    return {
      canCheckin: false,
      reason: "Challenge hat noch nicht begonnen"
    };
  }
  
  // Challenge bereits beendet
  if (now > endTime) {
    return {
      canCheckin: false,
      reason: "Challenge ist bereits beendet"
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
    reason: "Unbekannte Challenge-Cadence"
  };
}

/**
 * Validierung für END_OF_CHALLENGE Cadence
 */
function validateEndOfChallengeCheckin(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  existingCheckins: Checkin[],
  currentDate: Date
): CheckinConstraints {
  const now = currentDate.getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  // Für END_OF_CHALLENGE: Check-in nur nach Ende der Challenge erlaubt
  if (now < endTime) {
    return {
      canCheckin: false,
      reason: "Check-in is only possible after the challenge ends"
    };
  }
  
  // Es gibt bereits einen Check-in - kann ersetzt werden
  if (existingCheckins.length > 0) {
    return {
      canCheckin: true,
      existingTodayCheckin: existingCheckins[0],
      reason: "Bestehender Check-in wird ersetzt"
    };
  }
  
  return {
    canCheckin: true,
    reason: "Check-in possible after challenge ends"
  };
}

/**
 * Validierung für DAILY Cadence
 */
function validateDailyCheckin(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  existingCheckins: Checkin[],
  currentDate: Date
): CheckinConstraints {
  // Prüfe, ob heute bereits ein Check-in existiert
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
      reason: "Heutiger Check-in kann bearbeitet werden"
    };
  }
  
  return {
    canCheckin: true,
    reason: "Daily check-in possible"
  };
}

/**
 * Validiert Proof-Einreichung basierend auf Challenge-Regeln
 */
export function validateProofRules(
  challenge: Pick<Challenge, 'cadence' | 'startAt' | 'endAt'>,
  enrollment: Pick<Enrollment, 'id'>,
  existingProofs: Proof[] = [],
  currentDate: Date = new Date()
): ProofConstraints {
  
  // Grundlegende Zeitvalidierung
  const now = currentDate.getTime();
  const startTime = new Date(challenge.startAt).getTime();
  const endTime = new Date(challenge.endAt).getTime();
  
  // Challenge noch nicht gestartet
  if (now < startTime) {
    return {
      canSubmitProof: false,
      reason: "Challenge hat noch nicht begonnen"
    };
  }
  
  if (challenge.cadence === "END_OF_CHALLENGE") {
    // Für END_OF_CHALLENGE: Nur eine Datei insgesamt erlaubt, die letzte ersetzt alle vorherigen
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
    // Für DAILY: Proof kann täglich eingereicht werden, solange Challenge läuft
    if (now > endTime) {
      return {
        canSubmitProof: false,
        reason: "Challenge ist bereits beendet"
      };
    }
    
    // Prüfe, ob heute bereits ein Proof eingereicht wurde
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
    reason: "Unbekannte Challenge-Cadence"
  };
}

/**
 * Berechnet Challenge-Statistiken basierend auf Cadence
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
    // Für END_OF_CHALLENGE: Immer nur 1 möglicher Streak, unabhängig von der Challenge-Dauer
    const activeProofs = proofs.filter(p => p.isActive);
    const hasCompletedChallenge = activeProofs.length > 0 && checkins.length > 0;
    
    return {
      totalDays: 1, // Immer nur 1, egal wie lange die Challenge läuft
      completedDays: hasCompletedChallenge ? 1 : 0,
      progressPercentage: hasCompletedChallenge ? 100 : 0
    };
  }
  
  if (challenge.cadence === "DAILY") {
    const startDate = new Date(challenge.startAt);
    const endDate = new Date(challenge.endAt);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Für DAILY: Zähle einzigartige Check-in-Tage
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
 * Hilfsfunktion: Überprüft ob Challenge aktuell aktiv ist
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
 * Hilfsfunktion: Überprüft ob Challenge beendet ist
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
 * Validiert Challenge-Erstellung/Bearbeitung
 */
export function validateChallengeData(data: {
  startAt: Date;
  endAt: Date;
  cadence: Cadence;
}): ChallengeValidationResult {
  const startTime = data.startAt.getTime();
  const endTime = data.endAt.getTime();
  
  // End-Datum muss nach Start-Datum liegen
  if (endTime <= startTime) {
    return {
      isValid: false,
      error: "End date must be after start date",
      errorCode: "INVALID_DATE_RANGE"
    };
  }
  
  // Für DAILY: Mindestens 1 Tag Dauer
  if (data.cadence === "DAILY") {
    const durationDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
    if (durationDays < 1) {
      return {
        isValid: false,
        error: "Daily Challenge muss mindestens 1 Tag dauern",
        errorCode: "DAILY_TOO_SHORT"
      };
    }
  }
  
  return { isValid: true };
}
