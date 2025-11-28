import { SessionConfig } from '@/utils/sessionManager';

/**
 * Default session configuration for enterprise deployments
 */
const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionTimeout: 3600,      // 1 hour - total session duration
  idleTimeout: 1800,         // 30 minutes - idle timeout
  idleWarningTime: 300,      // 5 minutes - warning before idle expiry
  checkInterval: 10000       // 10 seconds - interval for checking session state
};

/**
 * Preset configurations for different environments
 */
export const SESSION_PRESETS = {
  development: {
    sessionTimeout: 28800,   // 8 hours
    idleTimeout: 7200,       // 2 hours
    idleWarningTime: 600,    // 10 minutes
    checkInterval: 30000     // 30 seconds
  },
  
  production: {
    sessionTimeout: 3600,    // 1 hour
    idleTimeout: 1800,       // 30 minutes
    idleWarningTime: 300,    // 5 minutes
    checkInterval: 10000     // 10 seconds
  },
  
  highSecurity: {
    sessionTimeout: 1800,    // 30 minutes
    idleTimeout: 900,        // 15 minutes
    idleWarningTime: 180,    // 3 minutes
    checkInterval: 5000      // 5 seconds
  },
  
  lowSecurity: {
    sessionTimeout: 86400,   // 24 hours
    idleTimeout: 43200,      // 12 hours
    idleWarningTime: 1800,   // 30 minutes
    checkInterval: 60000     // 1 minute
  }
};

type EnvironmentType = 'development' | 'production' | 'highSecurity' | 'lowSecurity';

/**
 * Session Configuration Service
 * 
 * Manages session configuration with support for:
 * - Environment-based presets
 * - Custom overrides
 * - Tenant-specific configuration
 * - Dynamic configuration updates
 */
class MockSessionConfigService {
  private config: SessionConfig = DEFAULT_SESSION_CONFIG;
  private configListeners: Set<(config: SessionConfig) => void> = new Set();

  /**
   * Initialize config from environment
   */
  initializeFromEnvironment(): void {
    const env = import.meta.env.VITE_API_ENVIRONMENT || 'production';
    
    if (env === 'development') {
      this.setConfig(SESSION_PRESETS.development);
    } else {
      this.setConfig(SESSION_PRESETS.production);
    }
  }

  /**
   * Load preset configuration
   */
  loadPreset(preset: EnvironmentType): void {
    const presetConfig = SESSION_PRESETS[preset];
    this.setConfig(presetConfig);
    console.log(`[SessionConfigService] Loaded ${preset} preset`, presetConfig);
  }

  /**
   * Set custom configuration
   */
  setConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
    this.notifyListeners();
    console.log('[SessionConfigService] Configuration updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Update specific config value
   */
  updateConfigValue<K extends keyof SessionConfig>(key: K, value: SessionConfig[K]): void {
    this.config[key] = value;
    this.notifyListeners();
    console.log(`[SessionConfigService] Updated ${key}: ${value}`);
  }

  /**
   * Reset to default configuration
   */
  resetToDefault(): void {
    this.config = { ...DEFAULT_SESSION_CONFIG };
    this.notifyListeners();
    console.log('[SessionConfigService] Reset to default configuration');
  }

  /**
   * Get configuration as formatted string for logging
   */
  getConfigAsString(): string {
    const config = this.config;
    return `
Session Config:
  - Session Timeout: ${config.sessionTimeout}s (${Math.floor(config.sessionTimeout / 60)}m)
  - Idle Timeout: ${config.idleTimeout}s (${Math.floor(config.idleTimeout / 60)}m)
  - Idle Warning: ${config.idleWarningTime}s (${Math.floor(config.idleWarningTime / 60)}m before expiry)
  - Check Interval: ${config.checkInterval}ms
    `;
  }

  /**
   * Subscribe to config changes
   */
  onConfigChange(listener: (config: SessionConfig) => void): () => void {
    this.configListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.configListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of config changes
   */
  private notifyListeners(): void {
    this.configListeners.forEach(listener => {
      try {
        listener(this.getConfig());
      } catch (error) {
        console.error('[SessionConfigService] Error in config listener:', error);
      }
    });
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    const { sessionTimeout, idleTimeout, idleWarningTime, checkInterval } = this.config;
    
    if (sessionTimeout <= 0 || idleTimeout <= 0 || idleWarningTime <= 0 || checkInterval <= 0) {
      console.error('[SessionConfigService] Invalid configuration: all values must be > 0');
      return false;
    }
    
    if (idleWarningTime >= idleTimeout) {
      console.error('[SessionConfigService] Invalid configuration: warning time must be < idle timeout');
      return false;
    }
    
    if (idleTimeout >= sessionTimeout) {
      console.warn('[SessionConfigService] Warning: idle timeout should be < session timeout');
    }
    
    return true;
  }
}

export const mockSessionConfigService = new MockSessionConfigService();

// Initialize from environment on import
mockSessionConfigService.initializeFromEnvironment();