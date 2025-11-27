/**
 * IP Tracking Utilities for Frontend Applications
 * 
 * Provides IP address detection and tracking for audit logging.
 * 
 * LIMITATION: Browser JavaScript cannot reliably detect the actual client IP address
 * due to security restrictions and network topology. This module provides:
 * 
 * 1. Client-side fallback for basic IP detection
 * 2. Server-side integration recommendations  
 * 3. Proper documentation of limitations
 * 
 * For production environments, implement server-side IP tracking using the
 * server-side implementation documented below.
 */

interface IPDetectionResult {
  ip_address: string;
  source: 'client' | 'server' | 'unknown';
  user_agent: string;
  detected_at: string;
  note: string;
  browser_info?: {
    language: string;
    platform: string;
    cookie_enabled: boolean;
    on_line: boolean;
    screen_resolution: string;
    timezone: string;
  };
}

/**
 * Client-side IP detection (limited reliability)
 * 
 * NOTE: This method has significant limitations and should not be used
 * for security-critical applications. The real IP should be captured
 * server-side for proper audit logging.
 */
export async function detectClientIP(): Promise<IPDetectionResult> {
  const userAgent = navigator.userAgent || 'unknown';
  
  try {
    // Method 1: Try to get IP from WebRTC STUN servers
    // This may work in some cases but is not reliable
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    return new Promise((resolve) => {
      pc.createDataChannel('');
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        
        pc.onicecandidate = (ice) => {
          if (ice.candidate) {
            const match = ice.candidate.candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
            if (match) {
              pc.close();
              resolve({
                ip_address: match[1],
                source: 'client',
                user_agent: userAgent,
                detected_at: new Date().toISOString(),
                note: 'Detected via WebRTC (may be local NAT IP, not public IP)'
              });
            }
          }
          pc.close();
          resolve({
            ip_address: 'client-unknown',
            source: 'client',
            user_agent: userAgent,
            detected_at: new Date().toISOString(),
            note: 'Could not detect IP via WebRTC'
          });
        };
      });
    });
  } catch (error) {
    return {
      ip_address: 'client-unknown',
      source: 'client',
      user_agent: userAgent,
      detected_at: new Date().toISOString(),
      note: `WebRTC IP detection failed: ${error}`
    };
  }
}

/**
 * Get IP info for audit logging (client-side compatible)
 */
export async function getAuditIPInfo(): Promise<IPDetectionResult> {
  const result = await detectClientIP();
  
  return {
    ...result,
    browser_info: {
      language: navigator.language,
      platform: navigator.platform,
      cookie_enabled: navigator.cookieEnabled,
      on_line: navigator.onLine,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };
}

/**
 * Server-side IP detection implementation (Node.js/Express)
 * 
 * Add this middleware to your Express server:
 * 
 * ```javascript
 * import { extractClientIP, ipTrackingMiddleware } from './ipTracking';
 * 
 * app.use(ipTrackingMiddleware);
 * 
 * // Then in your audit logging
 * app.post('/api/action', (req, res) => {
 *   const ipInfo = getIPInfo(req);
 *   // Use ipInfo.ip_address in your audit log
 * });
 * ```
 */

// Server-side IP extraction
export function extractClientIP(req: { headers?: Record<string, string>, connection?: { remoteAddress?: string }, socket?: { remoteAddress?: string } }): string {
  // Check various headers that might contain the real IP
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
    return ips[0];
  }

  // Check X-Real-IP header (nginx proxy)
  const realIP = req.headers?.['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers?.['cf-connecting-ip'];
  if (cfIP) {
    return cfIP;
  }

  // Fallback to direct connection IP
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  
  // Handle IPv6 localhost addresses
  if (remoteAddress?.startsWith('::ffff:')) {
    return remoteAddress.replace('::ffff:', '');
  }
  
  if (remoteAddress?.startsWith('::1')) {
    return '127.0.0.1';
  }

  return remoteAddress || 'server-unknown';
}

/**
 * Express middleware to add client IP to request object
 */
export function ipTrackingMiddleware(req: { headers?: Record<string, string>, connection?: { remoteAddress?: string }, socket?: { remoteAddress?: string } }, res: { setHeader: (name: string, value: string) => void }, next: () => void) {
  const clientIP = extractClientIP(req);
  
  // Add to request for use in audit logging
  (req as any).clientIP = clientIP;
  
  // Add to response headers for debugging
  res.setHeader('X-Client-IP', clientIP);
  
  next();
}

/**
 * Get IP info for audit logging (server-side)
 */
export function getIPInfo(req: { headers?: Record<string, string>, connection?: { remoteAddress?: string }, socket?: { remoteAddress?: string } }) {
  const clientIP = extractClientIP(req);
  
  return {
    ip_address: clientIP,
    user_agent: req.headers?.['user-agent'] || 'unknown',
    forwarded_for: req.headers?.['x-forwarded-for'] || null,
    real_ip: req.headers?.['x-real-ip'] || null,
    cf_ip: req.headers?.['cf-connecting-ip'] || null,
    connection_ip: req.connection?.remoteAddress || req.socket?.remoteAddress || null
  };
}

/**
 * Sanitize IP address for logging (remove potential PII)
 */
export function sanitizeIP(ip: string): string {
  if (!ip || ip === 'unknown' || ip === 'server-unknown' || ip === 'client-unknown') {
    return ip;
  }
  
  // For IPv4, mask the last octet for privacy
  const ipv4Match = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}$/);
  if (ipv4Match) {
    return `${ipv4Match[1]}xxx`;
  }
  
  // For IPv6, mask the last group
  const ipv6Match = ip.match(/^(.+:)(.+:.+)$/);
  if (ipv6Match) {
    return `${ipv6Match[1]}xxxx`;
  }
  
  return ip;
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === 'server-unknown' || ip === 'client-unknown') return false;
  
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}