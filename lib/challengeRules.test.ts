import { 
  validateCheckinRules, 
  validateProofRules, 
  calculateChallengeProgress,
  isChallengeActive,
  isChallengeEnded,
  validateChallengeData 
} from "@/lib/challengeRules";

import { getChallengeStatus, formatCadence, getChallengeRulesExplanation } from "@/lib/challengeStatus";

// Beispiel: DAILY Challenge
const dailyChallenge = {
  cadence: "DAILY" as const,
  startAt: new Date("2025-09-01"),
  endAt: new Date("2025-09-07") // 7 Tage Challenge
};

// Beispiel: END_OF_CHALLENGE Challenge
const endOfChallenge = {
  cadence: "END_OF_CHALLENGE" as const,
  startAt: new Date("2025-09-01"),
  endAt: new Date("2025-09-30") // Langzeit-Challenge mit Einmalabgabe
};

// Beispiel-Enrollment
const enrollment = { id: "enrollment-123" };

// Beispiel Check-ins (für DAILY)
const dailyCheckins = [
  { id: "1", createdAt: new Date("2025-09-01T10:00:00"), enrollmentId: enrollment.id, text: "Day 1", imageUrl: null, linkUrl: null },
  { id: "2", createdAt: new Date("2025-09-02T15:30:00"), enrollmentId: enrollment.id, text: null, imageUrl: "/image.jpg", linkUrl: null },
  { id: "3", createdAt: new Date("2025-09-04T09:00:00"), enrollmentId: enrollment.id, text: null, imageUrl: null, linkUrl: "https://example.com" }
];

// Beispiel Check-in (für END_OF_CHALLENGE)
const endCheckins = [
  { id: "1", createdAt: new Date("2025-10-01T18:00:00"), enrollmentId: enrollment.id, text: "Final submission", imageUrl: "/final.jpg", linkUrl: null }
];

// Beispiel Proofs
const proofs = [
  { id: "1", enrollmentId: enrollment.id, type: "PHOTO" as const, url: "/proof.jpg", text: null, version: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];

/**
 * Test-Funktionen für die Challenge-Regeln
 */
export function testChallengeRules() {
  console.log("=== CHALLENGE RULES TESTS ===\n");
  
  // Test 1: DAILY Challenge Validation
  console.log("1. DAILY Challenge - Mitten in der Challenge (2025-09-03):");
  const dailyValidation = validateCheckinRules(dailyChallenge, enrollment, dailyCheckins, new Date("2025-09-03T12:00:00"));
  console.log("  Can check-in:", dailyValidation.canCheckin);
  console.log("  Reason:", dailyValidation.reason);
  console.log();
  
  // Test 2: END_OF_CHALLENGE before end
  console.log("2. END_OF_CHALLENGE - Vor Ende der Challenge (2025-09-15):");
  const endValidationEarly = validateCheckinRules(endOfChallenge, enrollment, [], new Date("2025-09-15T12:00:00"));
  console.log("  Can check-in:", endValidationEarly.canCheckin);
  console.log("  Reason:", endValidationEarly.reason);
  console.log();
  
  // Test 3: END_OF_CHALLENGE after end
  console.log("3. END_OF_CHALLENGE - Nach Ende der Challenge (2025-10-01):");
  const endValidationAfter = validateCheckinRules(endOfChallenge, enrollment, [], new Date("2025-10-01T12:00:00"));
  console.log("  Can check-in:", endValidationAfter.canCheckin);
  console.log("  Reason:", endValidationAfter.reason);
  console.log();
  
  // Test 4: Challenge Progress Calculation
  console.log("4. Challenge Progress - DAILY (3 von 7 Tagen):");
  const dailyProgress = calculateChallengeProgress(dailyChallenge, dailyCheckins, proofs);
  console.log("  Total days:", dailyProgress.totalDays);
  console.log("  Completed days:", dailyProgress.completedDays);
  console.log("  Progress:", dailyProgress.progressPercentage + "%");
  console.log();
  
  console.log("5. Challenge Progress - END_OF_CHALLENGE (abgeschlossen):");
  const endProgress = calculateChallengeProgress(endOfChallenge, endCheckins, proofs);
  console.log("  Total days:", endProgress.totalDays);
  console.log("  Completed days:", endProgress.completedDays);
  console.log("  Progress:", endProgress.progressPercentage + "%");
  console.log();
  
  // Test 5: Challenge Status
  console.log("6. Challenge Status - DAILY (aktiv):");
  const dailyStatus = getChallengeStatus(dailyChallenge, new Date("2025-09-03"));
  console.log("  Status:", dailyStatus.status);
  console.log("  Message:", dailyStatus.message);
  console.log("  Can join:", dailyStatus.canJoin);
  console.log("  Can submit proof:", dailyStatus.canSubmitProof);
  console.log();
  
  console.log("7. Challenge Status - END_OF_CHALLENGE (beendet):");
  const endStatus = getChallengeStatus(endOfChallenge, new Date("2025-10-02"));
  console.log("  Status:", endStatus.status);
  console.log("  Message:", endStatus.message);
  console.log("  Can join:", endStatus.canJoin);
  console.log("  Can submit proof:", endStatus.canSubmitProof);
  console.log();
  
  // Test 6: Challenge Validation
  console.log("8. Challenge Validation Tests:");
  
  const validDaily = validateChallengeData({
    startAt: new Date("2025-09-01"),
    endAt: new Date("2025-09-07"),
    cadence: "DAILY"
  });
  console.log("  Valid DAILY challenge:", validDaily.isValid);
  
  const invalidRange = validateChallengeData({
    startAt: new Date("2025-09-07"),
    endAt: new Date("2025-09-01"), // End before start!
    cadence: "DAILY"
  });
  console.log("  Invalid date range:", invalidRange.isValid, "-", invalidRange.error);
  console.log();
  
  // Test 7: Rules Explanations
  console.log("9. Rules Explanations:");
  console.log("  DAILY:", getChallengeRulesExplanation("DAILY"));
  console.log("  END_OF_CHALLENGE:", getChallengeRulesExplanation("END_OF_CHALLENGE"));
  console.log();
  
  console.log("=== TESTS COMPLETED ===");
}

// Helper: Formatiert Cadence für bessere Lesbarkeit
export function formatChallengeType(cadence: "DAILY" | "END_OF_CHALLENGE"): string {
  return formatCadence(cadence);
}
