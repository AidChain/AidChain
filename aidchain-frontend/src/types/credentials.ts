export interface SecureCredentialData {
  userId: string;
  credentialType: string;
  walrusBlobId: string;
  accessLevel: string;
  createdAt: number;
  packageId: string;
  policyId: string;
}

export interface DebitCardCredentials {
  userId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  bankName: string;
  weeklyLimit: number;
  isActive: boolean;
}

export interface IdentityCredentials {
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  expiryDate: string;
  issuingAuthority: string;
  userId: string;
}

export interface BankAccountCredentials {
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  accountHolderName: string;
  userId: string;
}

export interface CredentialMetadata {
  id: string;
  type: 'debit_card' | 'identity' | 'bank_account';
  title: string;
  description?: string;
  createdAt: number;
  lastAccessedAt?: number;
  accessCount: number;
  isActive: boolean;
}

export interface CredentialAccessRequest {
  credentialId: string;
  requestedBy: string;
  requestReason: string;
  requestedAt: number;
  approvedBy?: string;
  approvedAt?: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
}

export interface CredentialAuditLog {
  id: string;
  credentialId: string;
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'access_denied';
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  walrusLogId?: string; // Reference to audit log stored on Walrus
}

export interface CredentialStorageConfig {
  encryptionMethod: 'seal' | 'symmetric' | 'hybrid';
  keyServerThreshold: number;
  keyServerIds: string[];
  walrusConfig: {
    epochs: number;
    deletable: boolean;
  };
  accessPolicyId: string;
  emergencyRecoveryConfig?: {
    unlockTimeDelay: number; // milliseconds
    recoveryContacts: string[];
  };
}

export type CredentialType = DebitCardCredentials | IdentityCredentials | BankAccountCredentials;

export interface CredentialValidationError {
  field: string;
  message: string;
  code: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  errors: CredentialValidationError[];
}