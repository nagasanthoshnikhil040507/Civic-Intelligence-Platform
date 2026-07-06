/**
 * Placeholder for Token/Session Blacklist
 * Future implementation will use Redis:
 * redis.setex(`blacklist:${sessionId}`, tokenExpiry, 'true')
 */
export class TokenBlacklist {
  private static blacklistedSessions = new Set<string>();

  static async blacklistSession(sessionId: string, expiryTimeSeconds: number): Promise<void> {
    this.blacklistedSessions.add(sessionId);
  }

  static async isBlacklisted(sessionId: string): Promise<boolean> {
    return this.blacklistedSessions.has(sessionId);
  }
}
