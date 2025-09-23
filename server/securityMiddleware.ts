// LS-108: Security middleware for enhanced protection
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// LS-108: CSRF tokens now stored in session, no global state needed

/**
 * LS-108: Security headers middleware
 * Implements critical security headers for data protection
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy - Prevents XSS attacks
  // LS-108: Environment-specific CSP - strict for production
  const isProduction = process.env.NODE_ENV === 'production';
  const cspPolicy = isProduction
    ? "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
      "font-src 'self' fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self' wss:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self';"
    : "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
      "font-src 'self' fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self' ws: wss:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self';";
  
  res.setHeader('Content-Security-Policy', cspPolicy);

  // HTTP Strict Transport Security - Forces HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Frame-Options - Prevents clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - Prevents MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer Policy - Controls referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // X-XSS-Protection - XSS filter for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions Policy - Controls browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  next();
}

/**
 * LS-108: CSRF protection middleware
 * Generates and validates CSRF tokens for state-changing operations
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Ensure session is created for CSRF token tracking
  if (!req.session) {
    return res.status(500).json({ message: 'Session not initialized' });
  }
  
  const sessionId = (req.session as any).id || req.sessionID;
  
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    // For safe methods, generate new CSRF token and store in session
    const token = crypto.randomBytes(32).toString('hex');
    (req.session as any).csrfToken = token;
    (req.session as any).csrfExpires = Date.now() + (30 * 60 * 1000); // 30 minutes
    res.locals.csrfToken = token;
    
    return next();
  }

  // For state-changing methods, validate CSRF token from session
  const submittedToken = req.body.csrfToken || req.headers['x-csrf-token'];
  const storedToken = (req.session as any).csrfToken;
  const storedExpires = (req.session as any).csrfExpires;

  if (!storedToken || !submittedToken) {
    return res.status(403).json({ 
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  if (Date.now() > storedExpires) {
    delete (req.session as any).csrfToken;
    delete (req.session as any).csrfExpires;
    return res.status(403).json({ 
      message: 'CSRF token expired',
      code: 'CSRF_TOKEN_EXPIRED'
    });
  }

  if (submittedToken !== storedToken) {
    return res.status(403).json({ 
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  // Token is valid, generate new one for next request
  const newToken = crypto.randomBytes(32).toString('hex');
  const newExpires = Date.now() + (30 * 60 * 1000);
  (req.session as any).csrfToken = newToken;
  (req.session as any).csrfExpires = newExpires;
  res.locals.csrfToken = newToken;

  next();
}

/**
 * LS-108: Rate limiting for sensitive endpoints
 * More robust than basic rate limiter for critical operations
 */
class SecurityRateLimiter {
  private attempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();
  private blockedIPs = new Set<string>();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private blockDurationMs: number = 60 * 60 * 1000 // 1 hour
  ) {
    // Clean old attempts every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  middleware = (req: Request, res: Response, next: NextFunction) => {
    const clientId = this.getClientId(req);
    
    if (this.blockedIPs.has(clientId)) {
      return res.status(429).json({
        message: 'Too many attempts. IP temporarily blocked.',
        code: 'IP_BLOCKED'
      });
    }

    const attempt = this.attempts.get(clientId);
    const now = Date.now();

    if (!attempt) {
      this.attempts.set(clientId, { count: 1, lastAttempt: now, blocked: false });
      return next();
    }

    // Reset if window expired
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(clientId, { count: 1, lastAttempt: now, blocked: false });
      return next();
    }

    // Increment attempt count
    attempt.count++;
    attempt.lastAttempt = now;

    if (attempt.count > this.maxAttempts) {
      attempt.blocked = true;
      this.blockedIPs.add(clientId);
      
      // Unblock after duration
      setTimeout(() => {
        this.blockedIPs.delete(clientId);
        this.attempts.delete(clientId);
      }, this.blockDurationMs);

      return res.status(429).json({
        message: `Too many attempts. Try again in ${Math.ceil(this.blockDurationMs / 60000)} minutes.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    next();
  };

  private getClientId(req: Request): string {
    // Use session ID if available, fallback to IP
    const sessionId = (req.session as any)?.id || req.sessionID;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return sessionId || ip;
  }

  private cleanup() {
    const now = Date.now();
    Array.from(this.attempts.entries()).forEach(([clientId, attempt]) => {
      if (now - attempt.lastAttempt > this.windowMs && !attempt.blocked) {
        this.attempts.delete(clientId);
      }
    });
  }
}

// Create rate limiters for different endpoints
export const loginRateLimit = new SecurityRateLimiter(5, 15 * 60 * 1000, 60 * 60 * 1000); // 5 attempts, 15min window, 1hr block
export const adminRateLimit = new SecurityRateLimiter(10, 10 * 60 * 1000, 30 * 60 * 1000); // 10 attempts, 10min window, 30min block
export const uploadRateLimit = new SecurityRateLimiter(20, 60 * 1000, 5 * 60 * 1000); // 20 attempts, 1min window, 5min block

/**
 * LS-108: Input sanitization middleware
 * Validates and sanitizes user input to prevent injection attacks
 */
export function inputSanitization(req: Request, res: Response, next: NextFunction) {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip potentially dangerous keys
    if (key.startsWith('_') || key.includes('__proto__') || key.includes('constructor')) {
      continue;
    }

    if (typeof value === 'string') {
      // Basic sanitization - remove dangerous patterns
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: urls
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove on* event handlers
        .trim();
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export default {
  securityHeaders,
  csrfProtection,
  loginRateLimit,
  adminRateLimit,
  uploadRateLimit,
  inputSanitization
};