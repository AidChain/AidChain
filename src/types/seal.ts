import { SessionKey } from '@mysten/seal';

export interface SealKeyServerConfig {
  objectId: string;
  weight: number;
  apiKeyName?: string;
  apiKey?: string;
  url?: string;
  verified?: boolean;
}

export interface SealClientConfig {
  serverConfigs: SealKeyServerConfig[];
  verifyKeyServers: boolean;
  threshold: number;
  network: 'testnet' | 'mainnet' | 'devnet';
}

export interface SealEncryptionRequest {
  threshold: number;
  packageId: Uint8Array;
  id: Uint8Array;
  data: Uint8Array;
}

export interface SealEncryptionResult {
  encryptedObject: Uint8Array;
  symmetricKey: Uint8Array;
  policyId: string;
  keyServerIds: string[];
}

export interface SealDecryptionRequest {
  data: Uint8Array;
  sessionKey: SessionKey;
  txBytes: Uint8Array;
}

export interface SealSessionKeyConfig {
  address: string;
  packageId: Uint8Array;
  ttlMin: number;
  mvr_name?: string;
}

export interface SealAccessPolicy {
  packageId: string;
  moduleName: string;
  functionName: string;
  policyId: string;
  description: string;
  parameters: SealPolicyParameter[];
  accessLevel: 'user' | 'admin' | 'emergency';
  timeRestrictions?: {
    validFrom?: number;
    validUntil?: number;
    businessHoursOnly?: boolean;
  };
}

export interface SealPolicyParameter {
  name: string;
  type: 'u8' | 'u64' | 'vector<u8>' | 'address' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface SealKeyServerInfo {
  objectId: string;
  name: string;
  url: string;
  publicKey: string;
  version: string;
  status: 'active' | 'inactive' | 'maintenance';
  location?: string;
  operator: string;
  trustScore?: number;
  lastHealthCheck?: number;
}

export interface SealThresholdConfig {
  total: number;
  threshold: number;
  servers: SealKeyServerInfo[];
  description: string;
  securityLevel: 'low' | 'medium' | 'high' | 'ultra';
}

export interface SealDecryptionCache {
  policyId: string;
  decryptionKey: Uint8Array;
  cachedAt: number;
  ttl: number;
  accessCount: number;
}

export interface SealBatchDecryptionRequest {
  ids: string[];
  txBytes: Uint8Array;
  sessionKey: SessionKey;
  threshold: number;
}

export interface SealBatchDecryptionResult {
  results: Map<string, Uint8Array>;
  errors: Map<string, string>;
  cached: string[];
  fetched: string[];
}

export interface SealErrorInfo {
  code: 'INVALID_PARAMETER' | 'ACCESS_DENIED' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'CACHE_MISS';
  message: string;
  policyId?: string;
  serverUrl?: string;
  timestamp: number;
}

export interface SealAuditEvent {
  eventType: 'encryption' | 'decryption' | 'key_fetch' | 'session_create' | 'access_denied';
  policyId: string;
  userId: string;
  timestamp: number;
  serverIds: string[];
  success: boolean;
  errorInfo?: SealErrorInfo;
  metadata?: Record<string, any>;
}

export interface SealPerformanceMetrics {
  encryptionTime: number;
  decryptionTime: number;
  keyFetchTime: number;
  cacheHitRate: number;
  serverResponseTimes: Map<string, number>;
  errorRate: number;
  totalOperations: number;
}

export interface SealSecurityConfig {
  requireUserConfirmation: boolean;
  sessionTimeoutMin: number;
  maxConcurrentSessions: number;
  enableAuditLogging: boolean;
  enablePerformanceMetrics: boolean;
  rateLimiting: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  emergencyAccess: {
    enabled: boolean;
    unlockDelayHours: number;
    requiredApprovals: number;
  };
}

export type SealOperationResult<T> = {
  success: true;
  data: T;
  metrics?: SealPerformanceMetrics;
} | {
  success: false;
  error: SealErrorInfo;
  retryable: boolean;
};