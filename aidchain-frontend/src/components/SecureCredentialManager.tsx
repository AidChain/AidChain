'use client'

import { useState } from 'react';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import { SealCredentialManager } from '@/lib/seal-credential-manager';
import { SecureCredentialData, DebitCardCredentials } from '@/types/credentials';

interface SecureCredentialManagerProps {
  packageId: string;
}

export default function SecureCredentialManager({ packageId }: SecureCredentialManagerProps) {
  const { userAddress, zkLoginService } = useZkLogin();
  const [credentialManager] = useState(() => new SealCredentialManager(packageId));
  const [storedCredentials, setStoredCredentials] = useState<SecureCredentialData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newCredentials, setNewCredentials] = useState<Partial<DebitCardCredentials>>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
    weeklyLimit: 1000000000,
    isActive: true,
    userId: userAddress || ''
  });

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
        
        // Reset form
        setNewCredentials({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          bankName: '',
          weeklyLimit: 1000000000,
          isActive: true,
          userId: userAddress
        });
        
        console.log('✅ Credentials stored successfully');
        alert('Credentials stored securely!');
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
    if (!zkLoginService.hasValidSession()) {
      alert('Please login first');
      return;
    }

    try {
      setIsLoading(true);
      
      const keypair = zkLoginService.getKeypair();
      if (!keypair) {
        throw new Error('No zkLogin keypair available');
      }

      // Use the new method that doesn't require SessionKey!
      const credentials = await credentialManager.retrieveSecureCredentials(
        credentialData,
        userAddress!,
        keypair
      );

      if (credentials) {
        console.log('✅ Retrieved credentials:', credentials);
        alert(`Retrieved card ending in ****${credentials.cardNumber.slice(-4)} from ${credentials.bankName}`);
      } else {
        throw new Error('Failed to decrypt credentials');
      }
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      alert('Failed to retrieve credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const retrieveAllCredentials = async () => {
    if (!zkLoginService.hasValidSession() || storedCredentials.length === 0) return;

    try {
      setIsLoading(true);
      
      const keypair = zkLoginService.getKeypair();
      if (!keypair) {
        throw new Error('No zkLogin keypair available');
      }

      // Batch retrieve all credentials!
      const allCredentials = await credentialManager.retrieveMultipleCredentialsWithZkLogin(
        storedCredentials,
        userAddress!,
        keypair
      );

      console.log('✅ Retrieved all credentials:', allCredentials);
      alert(`Successfully retrieved ${allCredentials.length} credential sets!`);
    } catch (error) {
      console.error('Failed to retrieve all credentials:', error);
      alert('Failed to retrieve credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
      
      {/* zkLogin Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70">zkLogin Status:</span>
          <span className="px-2 py-1 rounded text-sm bg-green-500/20 text-green-400">
            ✅ Authenticated - Instant Access
          </span>
        </div>
        <div className="text-green-400 text-sm">
          🚀 No SessionKey needed - Direct access with zkLogin private key!
        </div>
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
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-medium text-white">Stored Credentials</h4>
            <button
              onClick={retrieveAllCredentials}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Retrieving...' : 'Retrieve All ⚡'}
            </button>
          </div>
          
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
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Retrieving...' : 'Retrieve ⚡'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <h5 className="text-yellow-400 font-medium mb-2">🔒 Streamlined Security</h5>
        <ul className="text-yellow-300/80 text-sm space-y-1">
          <li>• Identity-Based Encryption via Seal</li>
          <li>• Decentralized storage on Walrus</li>
          <li>• Direct zkLogin authentication</li>
          <li>• <strong>Zero wallet popups!</strong> ⚡</li>
          <li>• <strong>Instant access</strong> with private key</li>
        </ul>
      </div>
    </div>
  );
}