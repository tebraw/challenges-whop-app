/**
 * 🎯 WHOP ACCESS GUARDS
 * 
 * Helper functions for role mapping and access control
 */

export type WhopAccessLevel = "admin" | "customer" | "no_access";
export type AppRole = "ersteller" | "member" | "guest";

/**
 * Maps Whop access levels to app roles
 */
export function mapAccessToAppRole(level: WhopAccessLevel): AppRole {
  switch (level) {
    case "admin":
      return "ersteller";
    case "customer":
      return "member";
    case "no_access":
    default:
      return "guest";
  }
}

/**
 * Checks if a role has admin privileges
 */
export function isAdminRole(role: AppRole): boolean {
  return role === "ersteller";
}

/**
 * Checks if a role has member privileges
 */
export function isMemberRole(role: AppRole): boolean {
  return role === "member" || role === "ersteller";
}

/**
 * Gets readable role name
 */
export function getRoleName(role: AppRole): string {
  switch (role) {
    case "ersteller":
      return "Administrator";
    case "member":
      return "Member";
    case "guest":
      return "Guest";
    default:
      return "Unknown";
  }
}
