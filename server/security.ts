import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const voiceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 voice submissions per minute
  message: { error: 'Voice processing rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS Configuration
export function corsHandler(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your production domain
    : ['http://localhost:5000', 'http://127.0.0.1:5000'];
  
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}

// Enhanced input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS vectors
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .replace(/vbscript:/gi, '') // Remove vbscript protocol
    .substring(0, 10000); // Limit length
}

// SQL Injection prevention for user inputs
export function sanitizeForDatabase(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments start
    .replace(/\*\//g, '') // Remove SQL block comments end
    .trim();
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Username validation
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

// Basic password validation
export function validatePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

// Enhanced password validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters');

  if (password.length >= 12) score += 1;
  else feedback.push('Consider using 12+ characters for better security');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }

  if (/123|abc|qwe|asd/i.test(password)) {
    score -= 1;
    feedback.push('Avoid common sequences');
  }

  const isValid = score >= 4;
  return { isValid, score, feedback };
}

// Account lockout tracking
const failedAttempts = new Map<string, { count: number; lockUntil: number }>();

export function checkAccountLockout(identifier: string): boolean {
  const attempts = failedAttempts.get(identifier);
  if (!attempts) return false;
  
  if (attempts.lockUntil > Date.now()) {
    return true; // Still locked
  }
  
  // Lock expired, reset
  failedAttempts.delete(identifier);
  return false;
}

export function recordFailedAttempt(identifier: string): void {
  const attempts = failedAttempts.get(identifier) || { count: 0, lockUntil: 0 };
  attempts.count += 1;
  
  if (attempts.count >= 5) {
    // Lock for 15 minutes after 5 failed attempts
    attempts.lockUntil = Date.now() + (15 * 60 * 1000);
  }
  
  failedAttempts.set(identifier, attempts);
}

export function clearFailedAttempts(identifier: string): void {
  failedAttempts.delete(identifier);
}

// Enhanced security headers
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
}

// Enhanced CSP
export function setupCSP(req: Request, res: Response, next: NextFunction) {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Vite in development
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' ws: wss: https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ];
  
  if (process.env.NODE_ENV === 'development') {
    cspDirectives.push("script-src-elem 'self' 'unsafe-inline'");
  }
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  next();
}

// Request size limiting
export function requestSizeLimit(maxSize: number = 1024 * 1024) { // 1MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({ error: 'Request payload too large' });
    }
    next();
  };
}

// Password hashing and verification
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // Increased salt rounds for better security
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Audit logging for security events
export function logSecurityEvent(event: string, details: any, req: Request) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  console.log(`[SECURITY] ${timestamp} - ${event}`, {
    ip,
    userAgent,
    ...details
  });
}

// Error sanitization for production
export function sanitizeError(error: any): { message: string; code?: string } {
  if (process.env.NODE_ENV === 'production') {
    // Generic error messages in production
    return { message: 'An error occurred. Please try again.' };
  }
  
  // Detailed errors in development
  return {
    message: error.message || 'An error occurred',
    code: error.code || 'UNKNOWN_ERROR'
  };
}