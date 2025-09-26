// LS-98: Local authentication system with email/password
import bcrypt from "bcryptjs";
import crypto from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import nodemailer from "nodemailer";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
// LS-108: Import audit logger for security monitoring
import AuditLogger from "./auditLogger";
import { loginRateLimit as securityLoginRateLimit, csrfProtection } from "./securityMiddleware";
// LS-108: Import encrypted session store
import EncryptedSessionStore from "./encryptedSessionStore";

// Session configuration with 30-minute timeout for LS-98
export function getSession() {
  // LS-108: Fix TTL units - connect-pg-simple expects seconds, not milliseconds
  const sessionTtlSeconds = 30 * 60; // 30 minutes in seconds (1800s)
  
  // LS-108: Use encrypted session store for data protection at rest
  const sessionStore = new EncryptedSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtlSeconds, // Fixed: pass seconds instead of milliseconds
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on each request
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax', // LS-108: CSRF protection
      maxAge: 30 * 60 * 1000, // LS-108: Fix cookie TTL - 30 minutes in milliseconds
    },
  });
}

// Email configuration for password recovery
function getEmailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email configuration missing. Password recovery will not work.");
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password using bcrypt
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate secure random token for password reset
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send password recovery email
export async function sendPasswordResetEmail(email: string, resetToken: string, baseUrl?: string): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return false;
  }

  // Use provided baseUrl or detect from environment
  const base = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
  const resetUrl = `${base}/reset-password?token=${resetToken}`;
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Recuperación de Contraseña - Evity",
      html: `
        <h2>Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en Evity.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Restablecer Contraseña</a></p>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        <br>
        <p>Equipo de Evity</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
}

// LS-122: Internationalized email templates for welcome confirmation emails
export const getEmailTemplate = (language: string, verificationUrl: string, userName: string) => {
  if (language === 'en') {
    return {
      subject: "Email Verification - Welcome to Evity",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50; text-align: center;">Welcome to Evity!</h2>
          <p>Hello ${userName},</p>
          <p><strong>Congratulations! Your account has been successfully created.</strong></p>
          <p>Thank you for joining Evity, the future of longevity science. To complete your registration and activate your account, please verify your email address.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify My Email</a>
          </p>
          <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with Evity, you can safely ignore this email.</p>
          <br>
          <p style="text-align: center; font-style: italic; color: #666;">Welcome to the future of longevity!</p>
          <p style="text-align: center; color: #666;">The Evity Team</p>
        </div>
      `,
    };
  } else {
    // Default to Spanish
    return {
      subject: "Verificación de Email - Bienvenido a Evity",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50; text-align: center;">¡Bienvenido a Evity!</h2>
          <p>Hola ${userName},</p>
          <p><strong>¡Felicitaciones! Tu cuenta ha sido creada exitosamente.</strong></p>
          <p>Gracias por unirte a Evity, el futuro de la ciencia de la longevidad. Para completar tu registro y activar tu cuenta, necesitas verificar tu dirección de email.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verificar Mi Email</a>
          </p>
          <p><strong>Importante:</strong> Este enlace de verificación expirará en 24 horas.</p>
          <p>Si no creaste una cuenta en Evity, puedes ignorar este email.</p>
          <br>
          <p style="text-align: center; font-style: italic; color: #666;">¡Bienvenido al futuro de la longevidad!</p>
          <p style="text-align: center; color: #666;">Equipo de Evity</p>
        </div>
      `,
    };
  }
};

// Helper function to detect user's preferred language from Accept-Language header
function detectLanguageFromAcceptLanguage(acceptLanguage?: string): string {
  if (!acceptLanguage) return 'es'; // Default to Spanish
  
  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);
  
  // Check for English preference
  for (const lang of languages) {
    if (lang.code.startsWith('en')) {
      return 'en';
    }
  }
  
  // Default to Spanish if no English preference found
  return 'es';
}

// LS-99 & LS-122: Enhanced email verification functionality with internationalization
export async function sendEmailVerification(email: string, verificationToken: string, baseUrl?: string, acceptLanguage?: string, userName?: string): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return false;
  }

  // Use provided baseUrl or detect from environment
  const base = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
  const verificationUrl = `${base}/verify-email?token=${verificationToken}`;
  
  // Detect language preference
  const language = detectLanguageFromAcceptLanguage(acceptLanguage);
  
  // Get email template in the appropriate language
  const template = getEmailTemplate(language, verificationUrl, userName || '');
  
  try {
    console.log(`[LS-122] Sending email with template language: ${language}`);
    console.log(`[LS-122] Email template subject: ${template.subject}`);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: template.subject,
      html: template.html,
    });
    console.log(`[LS-122] Email sent successfully via SMTP to: ${email}`);
    return true;
  } catch (error) {
    console.error("[LS-122] Error sending email verification:", error);
    console.error("[LS-122] SMTP configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? 'configured' : 'missing',
      pass: process.env.SMTP_PASS ? 'configured' : 'missing'
    });
    return false;
  }
}


// Set up local authentication system
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());


  // Login endpoint with rate limiting and CSRF protection
  // Apply CSRF protection directly to this critical endpoint
  app.post("/api/login", securityLoginRateLimit.middleware, csrfProtection, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email y contraseña son requeridos",
          field: !email ? "email" : "password"
        });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        // LS-108: Log failed login attempt with explicit email
        await AuditLogger.log({
          userEmail: email.toLowerCase(),
          action: 'LOGIN',
          outcome: 'FAILURE',
          riskLevel: 'MEDIUM',
          details: { reason: 'User not found' },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          sessionId: (req.session as any)?.id || req.sessionID
        });
        return res.status(401).json({ 
          message: "Credenciales inválidas",
          field: "email"
        });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        // LS-108: Log failed login attempt with explicit email
        await AuditLogger.log({
          userId: user.id,
          userEmail: user.email,
          action: 'LOGIN',
          outcome: 'FAILURE',
          riskLevel: 'MEDIUM',
          details: { reason: 'Invalid password' },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          sessionId: (req.session as any)?.id || req.sessionID
        });
        return res.status(401).json({ 
          message: "Credenciales inválidas",
          field: "password"
        });
      }

      // Update last login time
      await storage.updateUserLastLogin(user.id);

      // Create session (LS-108: Remove email for security)
      (req.session as any).userId = user.id;

      // LS-108: Log successful login with explicit email
      await AuditLogger.log({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN',
        outcome: 'SUCCESS',
        riskLevel: 'LOW',
        details: { loginSuccess: true },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: (req.session as any)?.id || req.sessionID
      });

      res.json({ 
        message: "Inicio de sesión exitoso",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Register endpoint with CSRF protection
  app.post("/api/register", csrfProtection, async (req, res) => {
    try {
      const { email, password, firstName, lastName, gender, phoneNumber } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          message: "Todos los campos obligatorios son requeridos",
          fields: {
            email: !email,
            password: !password,
            firstName: !firstName,
            lastName: !lastName,
          }
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({ 
          message: "Ya existe una cuenta con este email",
          field: "email"
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender || null,
        phoneNumber: phoneNumber || null, // LS-110: Phone number
        isEmailVerified: "false",
      });

      // LS-99: Send email verification
      const verificationToken = generateResetToken(); // Reuse the secure token generator
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.setEmailVerificationToken(newUser.id, verificationToken, verificationExpires);
      
      // Get the base URL from the request
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      // LS-122: Send internationalized welcome email with user's preferred language
      const acceptLanguage = req.headers['accept-language'];
      const userName = `${newUser.firstName} ${newUser.lastName}`;
      console.log(`[LS-122] Attempting to send verification email to ${newUser.email} with language: ${acceptLanguage}`);
      const emailSent = await sendEmailVerification(newUser.email, verificationToken, baseUrl, acceptLanguage, userName);
      
      if (!emailSent) {
        console.error("[LS-122] Failed to send verification email, but user was created");
      } else {
        console.log(`[LS-122] Verification email sent successfully to ${newUser.email}`);
      }

      // Create session
      (req.session as any).userId = newUser.id;
      (req.session as any).userEmail = newUser.email;

      res.status(201).json({ 
        message: "Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          gender: newUser.gender,
          phoneNumber: newUser.phoneNumber, // LS-110: Phone number in response
          profileImageUrl: newUser.profileImageUrl,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // LS-122: Resend email verification endpoint
  app.post("/api/auth/resend-verification", csrfProtection, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (user.isEmailVerified === "true") {
        return res.status(400).json({ message: "El email ya está verificado" });
      }

      // Generate new verification token
      const verificationToken = generateResetToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.setEmailVerificationToken(user.id, verificationToken, verificationExpires);
      
      // Get the base URL from the request
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      // Send email with user's preferred language
      const acceptLanguage = req.headers['accept-language'];
      const userName = `${user.firstName} ${user.lastName}`;
      console.log(`[LS-122] Resending verification email to ${user.email} with language: ${acceptLanguage}`);
      const emailSent = await sendEmailVerification(user.email, verificationToken, baseUrl, acceptLanguage, userName);
      
      if (!emailSent) {
        console.error("[LS-122] Failed to resend verification email");
        return res.status(500).json({ message: "Error al enviar el correo de verificación" });
      }

      console.log(`[LS-122] Verification email resent successfully to ${user.email}`);
      res.status(200).json({ message: "Correo de verificación enviado" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Password reset request endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          message: "Email es requerido",
          field: "email"
        });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          message: "Si el email existe, recibirás instrucciones de recuperación"
        });
      }

      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);
      
      // Get the base URL from the request
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      const emailSent = await sendPasswordResetEmail(user.email, resetToken, baseUrl);
      
      if (!emailSent) {
        console.error("Failed to send password reset email");
      }

      res.json({ 
        message: "Si el email existe, recibirás instrucciones de recuperación"
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Password reset endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ 
          message: "Token y nueva contraseña son requeridos"
        });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ 
          message: "Token inválido o expirado"
        });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.clearPasswordResetToken(user.id);

      res.json({ 
        message: "Contraseña actualizada exitosamente"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // LS-99: Email verification endpoint
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          message: "Token de verificación es requerido"
        });
      }

      const user = await storage.getUserByEmailVerificationToken(token);
      if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        return res.status(400).json({ 
          message: "Token de verificación inválido o expirado"
        });
      }

      // Verify the email
      await storage.verifyEmail(user.id);

      res.json({ 
        message: "Email verificado exitosamente. Tu cuenta está ahora activada."
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        phoneNumber: user.phoneNumber, // LS-110: Include phone number
        profileImageUrl: user.profileImageUrl,
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.isAdmin,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Logout endpoint with CSRF protection - LS-98: Redirect to profile after authentication
  app.post("/api/logout", csrfProtection, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error cerrando sesión" });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  // Legacy logout GET endpoint disabled for security - use POST /api/logout instead
  app.get("/api/logout", (req, res) => {
    res.status(405).json({ 
      message: "Use POST method for logout to prevent CSRF attacks",
      code: "METHOD_NOT_ALLOWED",
      redirect: "/" 
    });
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      }
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({ message: "Error de autenticación" });
  }
};

// Admin middleware - LS-98: Enhanced admin check
export const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    // Check if user has admin privileges
    if (user.isAdmin !== "true") {
      console.log(`ADMIN ACCESS DENIED: User ${user.email} (isAdmin: ${user.isAdmin}) attempted to access admin endpoints`);
      // LS-108: Log admin access denial with explicit email
      await AuditLogger.log({
        userId: user.id,
        userEmail: user.email,
        action: 'ADMIN_ACCESS',
        outcome: 'FAILURE',
        riskLevel: 'HIGH',
        details: { reason: 'Insufficient privileges', userRole: user.isAdmin, endpoint: req.path },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: (req.session as any)?.id || req.sessionID
      });
      return res.status(403).json({ message: "Acceso denegado: Se requieren privilegios de administrador" });
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      }
    };

    console.log(`ADMIN ACCESS GRANTED: User ${user.email} accessing admin endpoint`);
    // LS-108: Log successful admin access with explicit email
    await AuditLogger.log({
      userId: user.id,
      userEmail: user.email,
      action: 'ADMIN_ACCESS',
      outcome: 'SUCCESS',
      riskLevel: 'HIGH',
      details: { endpoint: req.path, method: req.method },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: (req.session as any)?.id || req.sessionID
    });
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Error de autenticación" });
  }
};