/**
 * Simple in-memory rate limiter for API endpoints
 * Tracks requests per IP address with sliding window
 */

interface RateLimitEntry {
  requests: number[];
  windowStart: number;
}

export class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60 * 1000) { // 10 requests per minute default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if IP address is within rate limit
   * Returns { allowed: boolean, remaining: number, resetTime: number }
   */
  checkLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create entry for this IP
    let entry = this.requests.get(ip);
    if (!entry) {
      entry = { requests: [], windowStart: now };
      this.requests.set(ip, entry);
    }

    // Remove requests outside the current window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    const currentRequests = entry.requests.length;
    const allowed = currentRequests < this.maxRequests;

    if (allowed) {
      // Add current request timestamp
      entry.requests.push(now);
    }

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, this.maxRequests - entry.requests.length);
    const oldestRequest = entry.requests[0] || now;
    const resetTime = oldestRequest + this.windowMs;

    return {
      allowed,
      remaining,
      resetTime
    };
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup(): number {
    const now = Date.now();
    const cutoff = now - this.windowMs * 2; // Keep entries for 2x window size
    let removedCount = 0;

    for (const [ip, entry] of this.requests.entries()) {
      // Remove entries with no recent requests
      if (entry.requests.length === 0 || Math.max(...entry.requests) < cutoff) {
        this.requests.delete(ip);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    totalIPs: number;
    maxRequests: number;
    windowMs: number;
    activeIPs: Array<{ ip: string; requests: number; lastRequest: number }>;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const activeIPs = Array.from(this.requests.entries())
      .map(([ip, entry]) => {
        const recentRequests = entry.requests.filter(timestamp => timestamp > windowStart);
        return {
          ip: ip.replace(/\d+/g, 'xxx'), // Anonymize IPs for logging
          requests: recentRequests.length,
          lastRequest: Math.max(...entry.requests, 0)
        };
      })
      .filter(entry => entry.requests > 0);

    return {
      totalIPs: this.requests.size,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      activeIPs
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter(10, 60 * 1000); // 10 requests per minute
