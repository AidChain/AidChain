'use client'

import { useState, useEffect } from 'react';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import { SealCredentialManager, SecureCredentialData, DebitCardCredentials } from '@/lib/seal-credential-manager';
import { SessionKey } from '@mysten/seal';
import { AuditLogger } from '@/lib/audit-logger';

interface SecureCredentialManagerProps {
  packageId: string;
}

export default function SecureCredentialManager({ packageId }: SecureCredentialManagerProps) {
  const { userAddress, suiAddress } = useZkLogin();
  const [credentialManager] = useState(() => new SealCredentialManager(packageId));
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [storedCredentials, setStoredCredentials] = useState<SecureCredentialData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newCredentials, setNewCredentials] = useState<Partial<DebitCardCredentials>>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
    weeklyLimit: 1000000000, // 1 SUI in MIST
    isActive: true,
    userId: userAddress || ''
  });

  const createSessionKey = async () => {
    if (!userAddress) return;

    try {
      setIsLoading(true);
      
      const session = await credentialManager.createSessionKey(
        userAddress,
        async (message: Uint8Array) => {
          // Get the signature from your zkLogin implementation
          const { signature } = await signPersonalMessage(message);
          return { signature };
        }
      );
      
      setSessionKey(session);
      localStorage.setItem('sealSessionKey', session.export());
      
      // Log successful session creation
      await AuditLogger.logCredentialAccess(
        userAddress,
        'session_create',
        'session_key',
        true,
        { packageId }
      );
      
    } catch (error) {
      console.error('Failed to create session key:', error);
      
      // Log failed session creation
      await AuditLogger.logCredentialAccess(
        userAddress || 'unknown',
        'session_create',
        'session_key',
        false,
        { packageId },
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const storeCredentials = async () => {
    if (!userAddress || !newCredentials.cardNumber) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/credentials/store-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userAddress,
          credentials: { ...newCredentials, userId: userAddress } as DebitCardCredentials,
          userAddress,
          credentialType: 'debit_card',
          packageId
        })
      });

      const result = await response.json();
      if (result.success) {
        setStoredCredentials(prev => [...prev, result.credentialData]);
        setNewCredentials({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          bankName: '',
          weeklyLimit: 1000000000,
          isActive: true,
          userId: userAddress
        });
        
        // Log successful credential storage
        await AuditLogger.logCredentialAccess(
          userAddress,
          'store',
          result.credentialData.policyId,
          true,
          { credentialType: 'debit_card' }
        );
      } else {
        throw new Error(result.error || 'Storage failed');
      }
    } catch (error) {
      console.error('Failed to store credentials:', error);
      
      // Log failed credential storage
      await AuditLogger.logCredentialAccess(
        userAddress,
        'store',
        'unknown',
        false,
        { credentialType: 'debit_card' },
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retrieveCredentials = async (credentialData: SecureCredentialData) => {
    if (!sessionKey) {
      alert('Please create a session key first');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/credentials/retrieve-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialData,
          sessionKeyData: sessionKey.export(),
          packageId
        })
      });

      const result = await response.json();
      if (result.success && result.credentials) {
        console.log('Retrieved credentials:', result.credentials);
        // Display credentials securely (consider masking sensitive data)
      }
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to restore session key from storage
    const storedSessionKey = localStorage.getItem('sealSessionKey');
    if (storedSessionKey && userAddress) {
      try {
        const session = SessionKey.fromExportedData(storedSessionKey);
        setSessionKey(session);
      } catch (error) {
        console.error('Failed to restore session key:', error);
        localStorage.removeItem('sealSessionKey');
      }
    }
  }, [userAddress]);

  if (!userAddress) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <p className="text-white/70">Please connect your wallet to manage credentials</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-4 text-white">Secure Credential Management</h3>
      
      {/* Session Key Management */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70">Session Key Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${sessionKey ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {sessionKey ? 'Active' : 'Inactive'}
          </span>
        </div>
        {!sessionKey && (
          <button
            onClick={createSessionKey}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
          >
            {isLoading ? 'Creating...' : 'Create Session Key'}
          </button>
        )}
      </div>

      {/* Store New Credentials */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 text-white">Store New Debit Card</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Card Number"
            value={newCredentials.cardNumber}
            onChange={(e) => setNewCredentials({...newCredentials, cardNumber: e.target.value})}
            className="p-3 bg-white/10 rounded-lg text-white placeholder-white/50"
          />
          <input
            type="text"
            placeholder="MM/YY"
            value={newCredentials.expiryDate}
            onChange={(e) => setNewCredentials({...newCredentials, expiryDate: e.target.value})}
            className="p-3 bg-white/10 rounded-lg text-white placeholder-white/50"
          />
          <input
            type="text"
            placeholder="CVV"
            value={newCredentials.cvv}
            onChange={(e) => setNewCredentials({...newCredentials, cvv: e.target.value})}
            className="p-3 bg-white/10 rounded-lg text-white placeholder-white/50"
          />
          <input
            type="text"
            placeholder="Bank Name"
            value={newCredentials.bankName}
            onChange={(e) => setNewCredentials({...newCredentials, bankName: e.target.value})}
            className="p-3 bg-white/10 rounded-lg text-white placeholder-white/50"
          />
        </div>
        <button
          onClick={storeCredentials}
          disabled={isLoading || !newCredentials.cardNumber}
          className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-3 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Storing...' : 'Store Credentials Securely'}
        </button>
      </div>

      {/* Stored Credentials */}
      {storedCredentials.length > 0 && (
        <div>
          <h4 className="text-lg font-medium mb-3 text-white">Stored Credentials</h4>
          <div className="space-y-2">
            {storedCredentials.map((cred, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <span className="text-white font-medium">{cred.credentialType}</span>
                  <span className="text-white/50 ml-2 text-sm">
                    {new Date(cred.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => retrieveCredentials(cred)}
                  disabled={!sessionKey || isLoading}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  Retrieve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <h5 className="text-yellow-400 font-medium mb-2">🔒 Security Features</h5>
        <ul className="text-yellow-300/80 text-sm space-y-1">
          <li>• Encrypted with Seal (Identity-Based Encryption)</li>
          <li>• Stored on decentralized Walrus network</li>
          <li>• Access controlled by on-chain policies</li>
          <li>• Threshold encryption (2-of-N key servers)</li>
          <li>• Envelope encryption for large data</li>
        </ul>
      </div>
    </div>
  );
}