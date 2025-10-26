import { whopSdk } from './whop-sdk-unified';

/**
 * Fetch real username from Whop API using whopUserId
 */
export async function getRealWhopUsername(whopUserId: string): Promise<string> {
  try {
    const user = await whopSdk.users.getUser({ userId: whopUserId });
    
    if (user && user.username) {
      return user.username;
    }
    
    // Fallback to user's name if username not available
    if (user && user.name) {
      return user.name;
    }
    
    // Ultimate fallback
    return `User ${whopUserId.slice(-6)}`;
  } catch (error) {
    console.warn(`Failed to fetch username for ${whopUserId}:`, error);
    return `User ${whopUserId.slice(-6)}`;
  }
}

/**
 * Fetch multiple real usernames in batch
 */
export async function getBatchRealWhopUsernames(whopUserIds: string[]): Promise<Map<string, string>> {
  const usernames = new Map<string, string>();
  
  // Process in parallel for better performance
  const promises = whopUserIds.map(async (whopUserId) => {
    const username = await getRealWhopUsername(whopUserId);
    usernames.set(whopUserId, username);
  });
  
  await Promise.all(promises);
  return usernames;
}

/**
 * Get user display name prioritizing real username over database name
 */
export function getUserDisplayName(
  databaseName: string | null, 
  email: string | null, 
  whopUsername: string | null
): string {
  // Priority order: real Whop username > database name > email prefix > fallback
  if (whopUsername) return whopUsername;
  if (databaseName && !databaseName.startsWith('User ')) return databaseName;
  if (email) return email.split('@')[0];
  return 'Unknown User';
}
