import { authService } from '@/services';
import { sessionManager } from './sessionManager';
import { toast } from '@/hooks/use-toast';

export interface InterceptorCallbacks {
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  onTokenRefresh?: (newToken: string) => void;
}

interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: (value?: Response | Promise<Response>) => void;
  reject: (error?: Error | unknown) => void;
  config: RequestConfig;
}

class HttpInterceptor {
  private isRefreshing = false;
  private failedQueue: QueuedRequest[] = [];
  private callbacks: InterceptorCallbacks = {};
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = window.fetch;
  }

  /**
   * Initialize HTTP interceptor
   */
  init(callbacks: InterceptorCallbacks = {}): void {
    this.callbacks = callbacks;
    this.setupFetchInterceptor();
  }

  /**
   * Setup fetch interceptor
   */
  private setupFetchInterceptor(): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Add auth token to request
      const config = this.addAuthToken(input, init);
      
      try {
        const response = await this.originalFetch(config.url, config.init);
        
        // Handle auth errors
        if (response.status === 401) {
          return this.handle401Error(config, response);
        }
        
        if (response.status === 403) {
          this.handle403Error(response);
          return response;
        }
        
        return response;
      } catch (error) {
        this.handleNetworkError(error);
        throw error;
      }
    };
  }

  /**
   * Add auth token to request
   * 
   * Adds two sets of headers:
   * 1. Authorization: Bearer token (authentication)
   * 2. Impersonation headers if super admin is impersonating
   *    - X-Impersonation-Log-Id: ID of the impersonation session
   *    - X-Super-Admin-Id: ID of the super admin performing impersonation
   */
  private addAuthToken(input: RequestInfo | URL, init?: RequestInit): { url: string, init: RequestInit } {
    const url = typeof input === 'string' ? input : input.toString();
    const token = authService.getToken();
    
    const headers = new Headers(init?.headers);
    
    if (token && !sessionManager.isTokenExpired(token)) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Add impersonation headers if super admin is in impersonation mode
    try {
      const storedSession = sessionStorage.getItem('impersonation_session');
      if (storedSession) {
        const { session } = JSON.parse(storedSession);
        if (session && session.id && session.superUserId) {
          headers.set('X-Impersonation-Log-Id', session.id);
          headers.set('X-Super-Admin-Id', session.superUserId);
          
          console.debug('[HttpInterceptor] Adding impersonation headers to request', {
            url,
            impersonationLogId: session.id,
            superAdminId: session.superUserId,
          });
        }
      }
    } catch (error) {
      console.debug('[HttpInterceptor] Error reading impersonation session from storage:', error);
      // Continue without impersonation headers - not a fatal error
    }
    
    return {
      url,
      init: {
        ...init,
        headers
      }
    };
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private async handle401Error(config: { url: string, init: RequestInit }, response: Response): Promise<Response> {
    const requestConfig: RequestConfig = {
      url: config.url,
      method: config.init.method || 'GET',
      headers: this.headersToObject(config.init.headers),
      body: config.init.body as BodyInit | null,
      _retry: (config.init as Record<string, unknown>)._retry as boolean | undefined
    };

    // If already retried or no token, redirect to login
    if (requestConfig._retry || !authService.getToken()) {
      this.redirectToLogin('Session expired. Please log in again.');
      return response;
    }

    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, config: requestConfig });
      });
    }

    requestConfig._retry = true;
    this.isRefreshing = true;

    try {
      // Attempt to refresh token
      const newToken = await authService.refreshToken();
      
      // Update authorization header
      const headers = new Headers(config.init.headers);
      headers.set('Authorization', `Bearer ${newToken}`);
      
      // Process failed queue
      this.processQueue(null);
      
      // Notify callback
      if (this.callbacks.onTokenRefresh) {
        this.callbacks.onTokenRefresh(newToken);
      }
      
      // Retry original request
      const retryInit = {
        ...config.init,
        headers,
        _retry: true
      } as RequestInit;
      
      return this.originalFetch(config.url, retryInit);
    } catch (refreshError) {
      // Refresh failed, redirect to login
      this.processQueue(refreshError);
      this.redirectToLogin('Session expired. Please log in again.');
      return response;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle 403 Forbidden errors
   */
  private handle403Error(response: Response): void {
    const message = 'Access denied. You don\'t have permission to perform this action.';
    
    toast({
      title: 'Access Denied',
      description: message,
      variant: 'destructive',
    });

    // Notify callback
    if (this.callbacks.onForbidden) {
      this.callbacks.onForbidden();
    }
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: Error | unknown): void {
    const message = 'Network error. Please check your connection and try again.';
    
    toast({
      title: 'Connection Error',
      description: message,
      variant: 'destructive',
    });
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: Error | null): void {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        // Retry the request with new token
        const headers = new Headers();
        Object.entries(config.headers || {}).forEach(([key, value]) => {
          headers.set(key, value);
        });
        
        const token = authService.getToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        
        const retryInit: RequestInit = {
          method: config.method,
          headers,
          body: config.body
        };
        
        resolve(this.originalFetch(config.url, retryInit));
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Convert headers to object
   */
  private headersToObject(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else if (headers) {
      Object.assign(result, headers);
    }
    
    return result;
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(message?: string): void {
    // Clear session data
    sessionManager.clearSession();
    
    // Show toast message
    if (message) {
      toast({
        title: 'Authentication Required',
        description: message,
        variant: 'destructive',
      });
    }

    // Notify callback
    if (this.callbacks.onUnauthorized) {
      this.callbacks.onUnauthorized();
    } else {
      // Fallback: redirect to login
      window.location.href = '/login';
    }
  }

  /**
   * Manually trigger logout
   */
  logout(): void {
    this.redirectToLogin();
  }

  /**
   * Clean up interceptors
   */
  destroy(): void {
    // Restore original fetch
    window.fetch = this.originalFetch;
    
    // Clear callbacks and queue
    this.callbacks = {};
    this.failedQueue = [];
    this.isRefreshing = false;
  }
}

export const httpInterceptor = new HttpInterceptor();
