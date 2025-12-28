import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SessionConfig } from '@/utils/sessionManager';

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionTimeout: 3600,
  idleTimeout: 1800,
  idleWarningTime: 300,
  checkInterval: 10000,
  leadConversionMinScore: 55
};

const SESSION_PRESETS = {
  development: {
    sessionTimeout: 28800,
    idleTimeout: 7200,
    idleWarningTime: 600,
    checkInterval: 30000,
    leadConversionMinScore: 55
  },
  
  production: {
    sessionTimeout: 3600,
    idleTimeout: 1800,
    idleWarningTime: 300,
    checkInterval: 10000,
    leadConversionMinScore: 55
  },
  
  highSecurity: {
    sessionTimeout: 1800,
    idleTimeout: 900,
    idleWarningTime: 180,
    checkInterval: 5000,
    leadConversionMinScore: 70
  },
  
  lowSecurity: {
    sessionTimeout: 86400,
    idleTimeout: 43200,
    idleWarningTime: 1800,
    checkInterval: 60000,
    leadConversionMinScore: 50
  }
};

type EnvironmentType = 'development' | 'production' | 'highSecurity' | 'lowSecurity';

interface SessionConfigContextType {
  config: SessionConfig;
  loadPreset: (preset: EnvironmentType) => void;
  setConfig: (config: Partial<SessionConfig>) => void;
  updateConfigValue: <K extends keyof SessionConfig>(key: K, value: SessionConfig[K]) => void;
  resetToDefault: () => void;
  validateConfig: () => boolean;
  getConfigAsString: () => string;
  onConfigChange: (listener: (config: SessionConfig) => void) => () => void;
}

const SessionConfigContext = createContext<SessionConfigContextType | undefined>(undefined);

interface SessionConfigProviderProps {
  children: React.ReactNode;
}

export function SessionConfigProvider({ children }: SessionConfigProviderProps) {
  const [config, setConfigState] = useState<SessionConfig>(DEFAULT_SESSION_CONFIG);
  const [listeners, setListeners] = useState<Set<(config: SessionConfig) => void>>(new Set());

  useEffect(() => {
    const env = import.meta.env.VITE_API_ENVIRONMENT || 'production';
    if (env === 'development') {
      setConfigState(SESSION_PRESETS.development);
    } else {
      setConfigState(SESSION_PRESETS.production);
    }
  }, []);

  const notifyListeners = useCallback((newConfig: SessionConfig) => {
    listeners.forEach(listener => {
      try {
        listener(newConfig);
      } catch (error) {
        console.error('[SessionConfigContext] Error in config listener:', error);
      }
    });
  }, [listeners]);

  const loadPreset = useCallback((preset: EnvironmentType) => {
    const presetConfig = SESSION_PRESETS[preset];
    setConfigState(presetConfig);
    notifyListeners(presetConfig);
    console.log(`[SessionConfigContext] Loaded ${preset} preset`, presetConfig);
  }, [notifyListeners]);

  const setConfig = useCallback((newPartialConfig: Partial<SessionConfig>) => {
    setConfigState(prevConfig => {
      const updatedConfig = { ...prevConfig, ...newPartialConfig };
      notifyListeners(updatedConfig);
      console.log('[SessionConfigContext] Configuration updated', updatedConfig);
      return updatedConfig;
    });
  }, [notifyListeners]);

  const updateConfigValue = useCallback(<K extends keyof SessionConfig>(key: K, value: SessionConfig[K]) => {
    setConfigState(prevConfig => {
      const updatedConfig = { ...prevConfig, [key]: value };
      notifyListeners(updatedConfig);
      console.log(`[SessionConfigContext] Updated ${key}: ${value}`);
      return updatedConfig;
    });
  }, [notifyListeners]);

  const resetToDefault = useCallback(() => {
    setConfigState(DEFAULT_SESSION_CONFIG);
    notifyListeners(DEFAULT_SESSION_CONFIG);
    console.log('[SessionConfigContext] Reset to default configuration');
  }, [notifyListeners]);

  const validateConfig = useCallback((): boolean => {
    const { sessionTimeout, idleTimeout, idleWarningTime, checkInterval } = config;
    
    if (sessionTimeout <= 0 || idleTimeout <= 0 || idleWarningTime <= 0 || checkInterval <= 0) {
      console.error('[SessionConfigContext] Invalid configuration: all values must be > 0');
      return false;
    }
    
    if (idleWarningTime >= idleTimeout) {
      console.error('[SessionConfigContext] Invalid configuration: warning time must be < idle timeout');
      return false;
    }
    
    if (idleTimeout >= sessionTimeout) {
      console.warn('[SessionConfigContext] Warning: idle timeout should be < session timeout');
    }
    
    return true;
  }, [config]);

  const getConfigAsString = useCallback((): string => {
    return `
Session Config:
  - Session Timeout: ${config.sessionTimeout}s (${Math.floor(config.sessionTimeout / 60)}m)
  - Idle Timeout: ${config.idleTimeout}s (${Math.floor(config.idleTimeout / 60)}m)
  - Idle Warning: ${config.idleWarningTime}s (${Math.floor(config.idleWarningTime / 60)}m before expiry)
  - Check Interval: ${config.checkInterval}ms
    `;
  }, [config]);

  const onConfigChange = useCallback((listener: (config: SessionConfig) => void) => {
    setListeners(prev => new Set(prev).add(listener));
    return () => {
      setListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(listener);
        return newSet;
      });
    };
  }, []);

  const value: SessionConfigContextType = {
    config,
    loadPreset,
    setConfig,
    updateConfigValue,
    resetToDefault,
    validateConfig,
    getConfigAsString,
    onConfigChange
  };

  return (
    <SessionConfigContext.Provider value={value}>
      {children}
    </SessionConfigContext.Provider>
  );
}

export function useSessionConfig() {
  const context = useContext(SessionConfigContext);
  if (context === undefined) {
    throw new Error('useSessionConfig must be used within a SessionConfigProvider');
  }
  return context;
}
