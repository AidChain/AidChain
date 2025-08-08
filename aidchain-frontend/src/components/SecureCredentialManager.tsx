'use client'

import { useState, useEffect } from 'react';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import { SealCredentialManager } from '@/lib/seal-credential-manager';
import { SecureCredentialData, DebitCardCredentials } from '@/types/credentials';
import { SessionKey } from '@mysten/seal';

interface SecureCredentialManagerProps {
  packageId: string;
}

export default function SecureCredentialManager({ packageId }: SecureCredentialManagerProps) {
  const { userAddress, signPersonalMessage } = useZkLogin();
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
    if (!userAddress || !signPersonalMessage) return;

    try {
      setIsLoading(true);
      
      const session = await credentialManager.createSessionKey(
        userAddress,
        async (message: Uint8Array) => {
          const result = await signPersonalMessage(message);
          return { signature: result.signature };
        }
      );
      
      setSessionKey(session);
      
      // Store session creation timestamp and user info (non-sensitive data only)
      localStorage.setItem('sealSessionCreated', JSON.stringify({
        userAddress,
        createdAt: Date.now(),
        packageId
      }));
      
      console.log('✅ Session key created successfully (not stored for security)');
      
    } catch (error) {
      console.error('Failed to create session key:', error);
      alert('Failed to create session key. Please try again.');
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
        
        console.log('✅ Credentials stored successfully:', result.credentialData);
        alert('Credentials stored securely with Seal encryption!');
      } else {
        throw new Error(result.error || 'Storage failed');
      }
    } catch (error) {
      console.error('Failed to store credentials:', error);
      alert('Failed to store credentials. Please try again.');
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
      
      // Since we can't serialize SessionKey, we need to recreate it for API calls
      // or handle retrieval differently
      const response = await fetch('/api/credentials/retrieve-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialData,
          // Instead of sessionKey data, we'll handle this server-side differently
          userAddress,
          packageId
        })
      });

      const result = await response.json();
      if (result.success && result.credentials) {
        console.log('✅ Retrieved credentials:', result.credentials);
        
        // Display credentials in a secure way (masked for security)
        alert(`Retrieved card ending in ****${result.credentials.cardNumber.slice(-4)} from ${result.credentials.bankName}`);
      } else {
        throw new Error(result.error || 'Retrieval failed');
      }
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      alert('Failed to retrieve credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear session data when user changes
  useEffect(() => {
    const sessionInfo = localStorage.getItem('sealSessionCreated');
    if (sessionInfo) {
      try {
        const parsed = JSON.parse(sessionInfo);
        // If user changed or session is old (> 30 minutes), clear it
        if (parsed.userAddress !== userAddress || 
            Date.now() - parsed.createdAt > 30 * 60 * 1000) {
          localStorage.removeItem('sealSessionCreated');
          setSessionKey(null);
        }
      } catch (error) {
        localStorage.removeItem('sealSessionCreated');
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Session Key'}
          </button>
        )}
        {sessionKey && (
          <div className="text-green-400 text-sm">
            ✅ Session active - You can now store and retrieve credentials securely
          </div>
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
                  {isLoading ? 'Retrieving...' : 'Retrieve'}
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
          <li>• Session keys never stored locally</li>
        </ul>
      </div>
    </div>
  );
}