import { Challenge, Cadence } from "@prisma/client";
import { isChallengeActive, isChallengeEnded } from "./challengeRules";

export interface ChallengeStatus {
  status: 'upcoming' | 'active' | 'ended';
  message: string;
  canJoin: boolean;
  canSubmitProof: boolean;
  badgeColor: 'blue' | 'green' | 'gray' | 'red';
}

/**
 * Bestimmt den Status einer Challenge und entsprechende UI-Nachrichten
 */
export function getChallengeStatus(
  challenge: Pick<Challenge, 'startAt' | 'endAt' | 'cadence'>,
  currentDate: Date = new Date()
): ChallengeStatus {
  const isActive = isChallengeActive(challenge, currentDate);
  const isEnded = isChallengeEnded(challenge, currentDate);
  
  // Challenge noch nicht gestartet
  if (!isActive && !isEnded) {
    return {
      status: 'upcoming',
      message: `Startet am ${new Date(challenge.startAt).toLocaleDateString()}`,
      canJoin: true, // Voranmeldung erlaubt
      canSubmitProof: false,
      badgeColor: 'blue'
    };
  }
  
  // Challenge läuft aktuell
  if (isActive && !isEnded) {
    return {
      status: 'active',
      message: challenge.cadence === 'END_OF_CHALLENGE' 
        ? `Running until ${new Date(challenge.endAt).toLocaleDateString()}`
        : 'Active - Participate daily',
      canJoin: true,
      canSubmitProof: true,
      badgeColor: 'green'
    };
  }
  
  // Challenge beendet
  if (isEnded) {
    const canStillSubmit = challenge.cadence === 'END_OF_CHALLENGE';
    return {
      status: 'ended',
      message: canStillSubmit 
        ? 'Ended - submission still possible'
        : `Beendet am ${new Date(challenge.endAt).toLocaleDateString()}`,
      canJoin: false,
      canSubmitProof: canStillSubmit,
      badgeColor: canStillSubmit ? 'blue' : 'gray'
    };
  }
  
  // Fallback
  return {
    status: 'ended',
    message: 'Status unbekannt',
    canJoin: false,
    canSubmitProof: false,
    badgeColor: 'gray'
  };
}

/**
 * Formatiert Cadence für Anzeige
 */
export function formatCadence(cadence: Cadence): string {
  switch (cadence) {
    case 'DAILY':
      return 'Daily';
    case 'END_OF_CHALLENGE':
      return 'Einmaliger Abschluss';
    default:
      return cadence;
  }
}

/**
 * Gibt eine benutzerfreundliche Erklärung der Challenge-Regeln zurück
 */
export function getChallengeRulesExplanation(cadence: Cadence): string {
  switch (cadence) {
    case 'DAILY':
      return 'Participate daily to maintain your streak. You can check in once per day.';
    case 'END_OF_CHALLENGE':
      return 'Submit your result once you have completed the challenge. Submission is possible until after the end of the challenge.';
    default:
      return 'Folge den spezifischen Regeln dieser Challenge.';
  }
}

/**
 * Berechnet die verbleibende Zeit bis zum Ende einer Challenge
 */
export function getTimeRemaining(endDate: Date | string, currentDate: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const end = new Date(endDate).getTime();
  const now = currentDate.getTime();
  const diff = end - now;
  
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true
    };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    days,
    hours,
    minutes,
    isExpired: false
  };
}

/**
 * Formatiert verbleibende Zeit für die Anzeige
 */
export function formatTimeRemaining(timeRemaining: ReturnType<typeof getTimeRemaining>): string {
  if (timeRemaining.isExpired) {
    return 'Abgelaufen';
  }
  
  if (timeRemaining.days > 0) {
    return `${timeRemaining.days} day${timeRemaining.days === 1 ? '' : 's'} remaining`;
  }
  
  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours} hour${timeRemaining.hours === 1 ? '' : 's'} remaining`;
  }
  
  return `${timeRemaining.minutes} minute${timeRemaining.minutes === 1 ? '' : 's'} remaining`;
}
