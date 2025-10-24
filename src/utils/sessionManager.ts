import { authService } from '@/services';

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenant_id: string;
  exp: number;
  iat?: number;
}

export interface SessionConfig {
  /** Session timeout in seconds (default: 3600 = 1 hour) */
  sessionTimeout: number;
  /** Idle timeout in seconds (default: 1800 = 30 minutes) */
  idleTimeout: number;
  /** Warning time before idle expiry in seconds (default: 300 = 5 minutes) */
  idleWarningTime: number;
  /** Check interval in milliseconds (default: 10000 = 10 seconds) */
  checkInterval: number;
}

class SessionManager {
  private tokenKey = 'crm_auth_token';
  private userKey = 'crm_user';
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private onSessionExpired?: () => void;
  private onIdleWarning?: (timeRemaining: number) => void;
  private onActivityDetected?: () => void;
  private lastActivityTime: number = Date.now();
  private isIdleWarningShown: boolean = false;
  
  private config: SessionConfig = {
    sessionTimeout: 3600, // 1 hour
    idleTimeout: 1800,    // 30 minutes
    idleWarningTime: 300, // 5 minutes before idle expiry
    checkInterval: 10000  // Check every 10 seconds
  };

  /**
   * Initialize session manager with custom config
   */
  initialize(config?: Partial<SessionConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.lastActivityTime = Date.now();
    this.isIdleWarningShown = false;
    this.setupActivityTracking();
  }

  /**
   * Set up activity tracking (mouse, keyboard, touch events)
   */
  private setupActivityTracking(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];
    
    const handleActivity = () => {
      const currentTime = Date.now();
      const timeSinceLastActivity = (currentTime - this.lastActivityTime) / 1000;
      
      // Only reset idle timer if enough time has passed to avoid spam
      if (timeSinceLastActivity > 5) {
        this.lastActivityTime = currentTime;
        this.isIdleWarningShown = false;
        
        // Notify about activity
        if (this.onActivityDetected) {
          this.onActivityDetected();
        }
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    });
  }

  /**
   * Decode JWT token without verification (for client-side expiry check)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('[SessionManager] Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || authService.getToken();
    if (!tokenToCheck) return true;

    const payload = this.decodeToken(tokenToCheck);
    if (!payload || !payload.exp) return true;

    // Check if token expires in the next 5 minutes (300 seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // 5 minutes buffer
    
    return payload.exp <= (currentTime + bufferTime);
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry(token?: string): number {
    const tokenToCheck = token || authService.getToken();
    if (!tokenToCheck) return 0;

    const payload = this.decodeToken(tokenToCheck);
    if (!payload || !payload.exp) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  }

  /**
   * Get idle time in seconds
   */
  getIdleTime(): number {
    return Math.floor((Date.now() - this.lastActivityTime) / 1000);
  }

  /**
   * Reset idle timer
   */
  resetIdleTimer(): void {
    this.lastActivityTime = Date.now();
    this.isIdleWarningShown = false;
  }

  /**
   * Start automatic session monitoring
   */
  startSessionMonitoring(
    onExpired: () => void,
    onIdleWarning?: (timeRemaining: number) => void,
    onActivityDetected?: () => void
  ): void {
    this.onSessionExpired = onExpired;
    this.onIdleWarning = onIdleWarning;
    this.onActivityDetected = onActivityDetected;
    
    // Clear existing intervals
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }

    // Check session validity
    this.sessionCheckInterval = setInterval(() => {
      this.checkSession();
    }, this.config.checkInterval);

    // Check idle state
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleState();
    }, this.config.checkInterval);

    // Initial checks
    this.checkSession();
    this.checkIdleState();
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    this.onSessionExpired = undefined;
    this.onIdleWarning = undefined;
    this.onActivityDetected = undefined;
  }

  /**
   * Check current session validity
   */
  private checkSession(): void {
    const token = authService.getToken();
    
    if (!token || this.isTokenExpired(token)) {
      this.handleSessionExpiry();
    }
  }

  /**
   * Check idle state
   */
  private checkIdleState(): void {
    const idleTime = this.getIdleTime();
    const timeUntilIdleExpiry = this.config.idleTimeout - idleTime;
    
    // If user is idle longer than idle timeout, expire session
    if (idleTime >= this.config.idleTimeout) {
      this.handleIdleExpiry();
      return;
    }

    // Show warning before idle expiry
    if (
      timeUntilIdleExpiry <= this.config.idleWarningTime &&
      !this.isIdleWarningShown &&
      this.onIdleWarning
    ) {
      this.isIdleWarningShown = true;
      this.onIdleWarning(timeUntilIdleExpiry);
    }
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(): void {
    console.log('[SessionManager] Session expired, logging out...');
    this.stopSessionMonitoring();
    this.clearSession();
    
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  /**
   * Handle idle expiry
   */
  private handleIdleExpiry(): void {
    console.log('[SessionManager] User idle timeout, logging out...');
    this.stopSessionMonitoring();
    this.clearSession();
    
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  /**
   * Extend session (called on user confirmation)
   */
  extendSession(): void {
    console.log('[SessionManager] Session extended');
    this.resetIdleTimer();
  }

  /**
   * Clear all session data
   */
  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.clear();
    
    // Clear any other auth-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('crm_') || key.startsWith('auth_'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Validate session on app start
   */
  validateSession(): boolean {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    
    if (!token || !user) {
      this.clearSession();
      return false;
    }
    
    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }
    
    return true;
  }

  /**
   * Get session info for debugging
   */
  getSessionInfo(): {
    isValid: boolean;
    timeUntilExpiry: number;
    idleTime: number;
    user: unknown;
    tokenPayload: JWTPayload | null;
  } {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    const payload = token ? this.decodeToken(token) : null;
    
    return {
      isValid: this.validateSession(),
      timeUntilExpiry: this.getTimeUntilExpiry(token || ''),
      idleTime: this.getIdleTime(),
      user,
      tokenPayload: payload
    };
  }

  /**
   * Get current config
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }
}

export const sessionManager = new SessionManager();