// LS-96-7: Rate limiting middleware for medical document operations
// Protects against abuse and ensures fair usage of sensitive medical data endpoints

import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter for medical document operations
 * In production, this should use Redis or similar distributed cache
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.requests = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime };
    }

    // Increment count
    entry.count++;
    this.requests.set(identifier, entry);
    return { allowed: true };
  }

  private cleanup() {
    const now = Date.now();
    this.requests.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    });
  }
}

/**
 * Rate limiter instances for different operations
 */
const uploadLimiter = new RateLimiter(
  15 * 60 * 1000, // 15 minutes window
  10 // max 10 uploads per 15 minutes per user
);

const downloadLimiter = new RateLimiter(
  5 * 60 * 1000, // 5 minutes window  
  30 // max 30 downloads per 5 minutes per user
);

const previewLimiter = new RateLimiter(
  1 * 60 * 1000, // 1 minute window
  50 // max 50 previews per minute per user
);

/**
 * Creates a rate limiting middleware for specific operations
 */
function createRateLimitMiddleware(
  limiter: RateLimiter,
  operation: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = user.claims.sub;
    const result = limiter.isAllowed(userId);

    if (!result.allowed) {
      const resetTimeSeconds = Math.ceil((result.resetTime! - Date.now()) / 1000);
      
      // Log rate limit violation for security monitoring
      console.warn(`SECURITY: Rate limit exceeded for ${operation} - User: ${userId}, Reset in: ${resetTimeSeconds}s`);
      
      return res.status(429).json({
        message: `Too many ${operation} requests`,
        retryAfter: resetTimeSeconds,
        type: "RATE_LIMIT_EXCEEDED"
      });
    }

    next();
  };
}

/**
 * Rate limiting middlewares for medical document operations
 */
export const uploadRateLimit = createRateLimitMiddleware(uploadLimiter, "upload");
export const downloadRateLimit = createRateLimitMiddleware(downloadLimiter, "download");
export const previewRateLimit = createRateLimitMiddleware(previewLimiter, "preview");

/**
 * General rate limiter for API endpoints (less restrictive)
 */
const generalLimiter = new RateLimiter(
  1 * 60 * 1000, // 1 minute window
  100 // max 100 requests per minute per user
);

export const generalRateLimit = createRateLimitMiddleware(generalLimiter, "API request");

/**
 * Rate limiting utility for checking current status (for debugging)
 */
export function getRateLimitStatus(userId: string) {
  return {
    upload: uploadLimiter.isAllowed(userId),
    download: downloadLimiter.isAllowed(userId),
    preview: previewLimiter.isAllowed(userId)
  };
}