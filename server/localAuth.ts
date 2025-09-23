// LS-98: Local authentication system with email/password
import bcrypt from "bcryptjs";
import crypto from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import nodemailer from "nodemailer";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Session configuration with 30-minute timeout for LS-98
export function getSession() {
  const sessionTtl = 30 * 60 * 1000; // 30 minutes as required by LS-98
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
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
      maxAge: sessionTtl,
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

// LS-99: Email verification functionality
export async function sendEmailVerification(email: string, verificationToken: string, baseUrl?: string): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return false;
  }

  // Use provided baseUrl or detect from environment
  const base = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
  const verificationUrl = `${base}/verify-email?token=${verificationToken}`;
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Verificación de Email - Evity",
      html: `
        <h2>¡Bienvenido a Evity!</h2>
        <p>Gracias por registrarte en Evity. Para activar tu cuenta, necesitas verificar tu email.</p>
        <p>Haz clic en el siguiente enlace para verificar tu email:</p>
        <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verificar Email</a></p>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no te registraste en Evity, puedes ignorar este email.</p>
        <br>
        <p>¡Bienvenido al futuro de la longevidad!</p>
        <p>Equipo de Evity</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending email verification:", error);
    return false;
  }
}

// LS-105: Newsletter confirmation functionality
export async function sendNewsletterConfirmation(email: string, confirmationToken: string, baseUrl?: string): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return false;
  }

  // Use provided baseUrl or detect from environment
  const base = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
  const confirmationUrl = `${base}/api/newsletter/confirm/${confirmationToken}`;
  
  try {
    await transporter.sendMail({
      from: `"Evity - Longevidad y Bienestar" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Confirma tu suscripción al Newsletter de Evity",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center;">
            <h1>Evity</h1>
            <p>Longevidad y Bienestar</p>
          </div>
          <div style="padding: 30px;">
            <h2>¡Gracias por suscribirte!</h2>
            <p>Has dado el primer paso hacia una vida más larga y saludable. Para completar tu suscripción al newsletter de Evity, confirma tu email haciendo clic en el botón de abajo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="background-color: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Confirmar Suscripción
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>¿Qué recibirás en nuestro newsletter?</h3>
              <ul style="color: #666;">
                <li>📚 Investigaciones semanales resumidas sobre longevidad</li>
                <li>💡 Consejos prácticos personalizados para vivir más</li>
                <li>🔬 Acceso temprano a nuevas herramientas y recursos</li>
                <li>🎯 Contenido exclusivo sobre bienestar y anti-envejecimiento</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px;">Si no te suscribiste a nuestro newsletter, puedes ignorar este email.</p>
            
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin-top: 30px;">
              <p style="margin: 0; color: #0066cc; font-weight: bold;">
                💡 ¿Sabías que las personas que siguen rutinas de longevidad pueden agregar hasta 10 años saludables a su vida?
              </p>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Evity. Transformando la forma en que envejecemos.</p>
            <p>Si tienes problemas con el botón, copia y pega este enlace: ${confirmationUrl}</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending newsletter confirmation:", error);
    return false;
  }
}

// Set up local authentication system
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login endpoint
  app.post("/api/login", async (req, res) => {
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
        return res.status(401).json({ 
          message: "Credenciales inválidas",
          field: "email"
        });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: "Credenciales inválidas",
          field: "password"
        });
      }

      // Update last login time
      await storage.updateUserLastLogin(user.id);

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).userEmail = user.email;

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

  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, gender } = req.body;
      
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
      
      const emailSent = await sendEmailVerification(newUser.email, verificationToken, baseUrl);
      
      if (!emailSent) {
        console.error("Failed to send verification email, but user was created");
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
          profileImageUrl: newUser.profileImageUrl,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
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

  // Logout endpoint - LS-98: Redirect to profile after authentication
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error cerrando sesión" });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  // Legacy logout GET endpoint for backward compatibility
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
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
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Error de autenticación" });
  }
};