// LS-108: Encrypted session store for securing session data at rest
import { Store } from 'express-session';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { encryptSessionData, decryptSessionData } from './encryption';

/**
 * LS-108: Custom encrypted session store
 * Wraps connect-pg-simple with transparent encryption/decryption
 */
class EncryptedSessionStore extends Store {
  private baseStore: any;

  constructor(options: any) {
    super();
    
    // Create the base PostgreSQL store
    const pgSession = connectPg(session);
    this.baseStore = new pgSession(options);
  }

  /**
   * Get session data and decrypt it
   * Handles both new encrypted format and legacy unencrypted sessions
   */
  get(sid: string, callback: (err?: any, session?: any) => void) {
    this.baseStore.get(sid, (err: any, storedSession: any) => {
      if (err) {
        return callback(err);
      }
      
      if (!storedSession) {
        return callback(null, null);
      }

      try {
        // Check if session uses our encryption format
        if (storedSession.__encrypted && storedSession.data) {
          // New encrypted format - decrypt the data blob
          const decryptedData = decryptSessionData(storedSession.data);
          const decryptedSession = {
            ...decryptedData,
            cookie: storedSession.cookie // Keep plaintext cookie
          };
          
          callback(null, decryptedSession);
        } else if (storedSession.__encrypted) {
          // Legacy encrypted format (field-by-field) - backwards compatibility
          const decryptedSession = {
            ...storedSession,
            passport: storedSession.passport ? decryptSessionData(storedSession.passport) : undefined,
            userId: storedSession.userId ? decryptSessionData(storedSession.userId) : undefined,
            cookie: storedSession.cookie
          };
          
          delete decryptedSession.__encrypted;
          callback(null, decryptedSession);
        } else {
          // Legacy unencrypted session (backwards compatibility)
          callback(null, storedSession);
        }
      } catch (error) {
        console.error('Session decryption failed:', error);
        // LS-108: Destroy corrupted encrypted sessions and force re-auth
        if (storedSession.__encrypted) {
          this.destroy(sid, () => {});
          callback(null, null); // Force login
        } else {
          callback(error);
        }
      }
    });
  }

  /**
   * Encrypt and store session data
   * LS-108: Encrypts entire session except cookie for complete protection
   */
  set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      // LS-108: Extract cookie and encrypt everything else
      const { cookie, ...sessionData } = session;
      
      const sessionToStore = {
        __encrypted: true,
        cookie: cookie, // Keep cookie plaintext for TTL calculations
        data: encryptSessionData(sessionData) // Encrypt all session data
      };
      
      this.baseStore.set(sid, sessionToStore, callback);
    } catch (error) {
      console.error('Session encryption failed:', error);
      if (callback) callback(error);
    }
  }

  /**
   * Destroy session
   */
  destroy(sid: string, callback?: (err?: any) => void) {
    this.baseStore.destroy(sid, callback);
  }

  /**
   * Touch session to update expiry
   * LS-108: Uses same encryption logic as set()
   */
  touch(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      // Use same encryption logic as set()
      const { cookie, ...sessionData } = session;
      
      const sessionToStore = {
        __encrypted: true,
        cookie: cookie,
        data: encryptSessionData(sessionData)
      };
      
      this.baseStore.touch(sid, sessionToStore, callback);
    } catch (error) {
      console.error('Session touch encryption failed:', error);
      if (callback) callback(error);
    }
  }

  /**
   * Get all session IDs
   */
  all(callback: (err?: any, sessions?: any) => void) {
    this.baseStore.all((err: any, encryptedSessions: any) => {
      if (err) {
        return callback(err);
      }

      try {
        // Decrypt all sessions
        const decryptedSessions: any = {};
        for (const [sid, encryptedSession] of Object.entries(encryptedSessions || {})) {
          try {
            if (typeof encryptedSession === 'string') {
              decryptedSessions[sid] = decryptSessionData(encryptedSession as string);
            } else {
              decryptedSessions[sid] = encryptedSession;
            }
          } catch (decryptError) {
            console.error(`Failed to decrypt session ${sid}:`, decryptError);
            // Skip corrupted sessions
          }
        }
        
        callback(null, decryptedSessions);
      } catch (error) {
        console.error('Bulk session decryption failed:', error);
        callback(error);
      }
    });
  }

  /**
   * Clear all sessions
   */
  clear(callback?: (err?: any) => void) {
    this.baseStore.clear(callback);
  }

  /**
   * Get session count
   */
  length(callback: (err?: any, length?: number) => void) {
    this.baseStore.length(callback);
  }
}

export { EncryptedSessionStore };
export default EncryptedSessionStore;