import { walrusClient } from './walrus-client';

export interface AuditLogEntry {
  timestamp: number;
  userId: string;
  action: 'store' | 'retrieve' | 'session_create' | 'access_denied';
  resourceId: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  private static async hashSensitiveData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async logCredentialAccess(
    userId: string,
    action: 'store' | 'retrieve' | 'session_create' | 'access_denied',
    resourceId: string,
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Hash sensitive information
      const hashedUserId = await this.hashSensitiveData(userId);
      const hashedResourceId = await this.hashSensitiveData(resourceId);

      const auditLog: AuditLogEntry = {
        timestamp: Date.now(),
        userId: hashedUserId,
        action,
        resourceId: hashedResourceId,
        metadata: metadata ? await this.sanitizeMetadata(metadata) : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        success,
        errorMessage
      };

      // Store audit log on Walrus for immutable record
      await walrusClient.storeQuilt([{
        identifier: `audit_${hashedUserId}_${Date.now()}`,
        file: new Blob([JSON.stringify(auditLog)], { type: 'application/json' }),
        tags: {
          type: 'audit_log',
          action,
          timestamp: Date.now().toString(),
          privacy: 'hashed'
        }
      }], {
        epochs: 1000, // Very long-term storage
        deletable: false
      });
    } catch (error) {
      // Don't throw - logging should never break the main flow
      console.error('Failed to store audit log:', error);
    }
  }

  private static async sanitizeMetadata(metadata: Record<string, any>): Promise<Record<string, any>> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Skip sensitive fields
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        // Hash long strings that might contain sensitive data
        sanitized[key] = await this.hashSensitiveData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}