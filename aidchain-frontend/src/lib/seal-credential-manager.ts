import { SealClient, getAllowlistedKeyServers, SessionKey } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { walrusClient } from './walrus-client';
import { SecureCredentialData, DebitCardCredentials } from '@/types/credentials';

export class SealCredentialManager {
  private suiClient: SuiClient;
  private sealClient: SealClient;
  private packageId: string;
  
  private static readonly KEY_SERVER_THRESHOLD = 2;
  private static readonly SESSION_TTL_MINUTES = 30;

  constructor(packageId: string, network: 'testnet' | 'mainnet' = 'testnet') {
    this.packageId = packageId;
    this.suiClient = new SuiClient({ url: getFullnodeUrl(network) });
    
    const serverObjectIds = getAllowlistedKeyServers(network);
    
    this.sealClient = new SealClient({
      suiClient: this.suiClient,
      serverConfigs: serverObjectIds.map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false,
    });
  }

  /**
   * Encrypts and stores credentials using Seal + Walrus
   */
  async storeSecureCredentials(
    userId: string,
    credentials: DebitCardCredentials,
    userAddress: string,
    credentialType: 'debit_card' | 'identity' | 'bank_account' = 'debit_card'
  ): Promise<SecureCredentialData> {
    try {
      const policyId = this.generatePolicyId(userId, credentialType);
      const credentialData = JSON.stringify(credentials);
      const dataToEncrypt = new TextEncoder().encode(credentialData);
      
      const formattedPackageId = this.packageId.startsWith('0x') ? this.packageId : `0x${this.packageId}`;
      
      console.log('🔍 Encrypting with Seal:', {
        threshold: SealCredentialManager.KEY_SERVER_THRESHOLD,
        packageId: formattedPackageId,
        id: policyId,
        dataLength: dataToEncrypt.length
      });

      const { encryptedObject: sealEncryptedKey, key: symmetricKey } = await this.sealClient.encrypt({
        threshold: SealCredentialManager.KEY_SERVER_THRESHOLD,
        packageId: formattedPackageId,
        id: policyId,
        data: dataToEncrypt,
      });

      console.log('✅ Seal encryption successful');

      // Envelope encryption
      const envelopeEncryptedCredentials = await this.encryptWithSymmetricKey(
        credentialData, 
        symmetricKey
      );

      console.log('🔍 Storing envelope on Walrus, size:', envelopeEncryptedCredentials);

      // Check size limit (1MB = 1,048,576 bytes)
      if (envelopeEncryptedCredentials.length > 1048576) {
        throw new Error(`Encrypted data too large: ${envelopeEncryptedCredentials.length} bytes (max 1MB)`);
      }
      
      const walrusResult = await walrusClient.storeBlob(envelopeEncryptedCredentials, {
        epochs: 5,
        deletable: false
      });

      const walrusBlobId = walrusResult.newlyCreated?.blobObject.blobId || 
                          walrusResult.alreadyCertified?.blobId || '';
      
      if (!walrusBlobId) {
        throw new Error('No blob ID returned from Walrus');
      }

      console.log('✅ Walrus storage successful, blob ID:', walrusBlobId);

      return {
        userId,
        credentialType,
        walrusBlobId,
        sealEncryptedKey,
        accessLevel: 'user',
        createdAt: Date.now(),
        packageId: formattedPackageId,
        policyId
      };
    } catch (error) {
      console.error('Failed to store secure credentials:', error);
      throw error;
    }
  }

  /**
   * Creates a SessionKey programmatically using zkLogin keypair (no wallet popup!)
   */
  private async createSessionKeyWithZkLogin(
    userAddress: string,
    signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
  ): Promise<SessionKey> {
    try {
      const formattedPackageId = this.packageId.startsWith('0x') ? this.packageId : `0x${this.packageId}`;
      
      console.log('🔍 Creating SessionKey with Enoki wallet');

      const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: formattedPackageId,
        ttlMin: SealCredentialManager.SESSION_TTL_MINUTES,
        suiClient: this.suiClient
      });

      const message = sessionKey.getPersonalMessage();
      console.log('🔍 SessionKey personal message:', {
        messageType: typeof message,
        messageLength: message.length,
      });
      
      try {
        console.log('🔍 Signing with Enoki wallet...');
        
        // Use the dapp-kit signing function
        const { signature } = await signPersonalMessage(message);
        
        console.log('✅ Enoki wallet signed message successfully');
        
        // Set the signature
        sessionKey.setPersonalMessageSignature(signature);
        console.log('✅ SessionKey signature set successfully');
        
      } catch (signingError) {
        console.error('❌ Signing failed:', signingError);
        throw signingError;
      }
      
      console.log('✅ SessionKey created with Enoki wallet');
      return sessionKey;
    } catch (error) {
      console.error('❌ Failed to create SessionKey:', error);
      throw error;
    }
  }

  /**
   * Retrieves and decrypts credentials using zkLogin keypair
   */
  async retrieveSecureCredentials(
    credentialData: SecureCredentialData,
    userAddress: string,
    signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
  ): Promise<DebitCardCredentials | null> {
    try {
      console.log('🔍 Retrieving credentials with zkLogin keypair');
      console.log('🔍 Credential data:', {
        policyId: credentialData.policyId,
        walrusBlobId: credentialData.walrusBlobId,
        sealEncryptedKeyType: typeof credentialData.sealEncryptedKey,
        sealEncryptedKeyConstructor: credentialData.sealEncryptedKey?.constructor?.name,
        sealEncryptedKeyLength: credentialData.sealEncryptedKey?.length
      });

      // Step 1: Create SessionKey using Enoki signing
      const sessionKey = await this.createSessionKeyWithZkLogin(userAddress, signPersonalMessage);

      // Step 2: Build the seal_approve transaction
      const tx = new Transaction();
      
      // Fix: Ensure policyId is properly formatted as hex
      let policyIdBytes: Uint8Array;
      
      if (credentialData.policyId.startsWith('0x')) {
        // It's already a hex string
        policyIdBytes = fromHex(credentialData.policyId.slice(2));
      } else {
        // Check if it's base64 or another format and convert appropriately
        try {
          // Try to decode as hex first (without 0x prefix)
          policyIdBytes = fromHex(credentialData.policyId);
        } catch (hexError) {
          // If hex fails, try base64
          try {
            const base64Decoded = atob(credentialData.policyId);
            policyIdBytes = new TextEncoder().encode(base64Decoded);
          } catch (base64Error) {
            // If both fail, treat as plain text
            policyIdBytes = new TextEncoder().encode(credentialData.policyId);
          }
        }
      }

      console.log('🔍 Policy ID processing:', {
        originalPolicyId: credentialData.policyId,
        policyIdBytesLength: policyIdBytes.length,
        policyIdBytesPreview: Array.from(policyIdBytes.slice(0, 10))
      });

      tx.moveCall({
        target: `${this.packageId}::donation_pool::seal_approve`,
        arguments: [
          tx.pure.vector("u8", Array.from(policyIdBytes)), // Convert Uint8Array to regular array
          tx.object('0x6'), // Clock object
        ]
      });

      const txBytes = await tx.build({ 
        client: this.suiClient, 
        onlyTransactionKind: true 
      });

      console.log('✅ Built seal_approve transaction');

      // Step 3: Ensure sealEncryptedKey is in correct format
      const sealKey = credentialData.sealEncryptedKey;
      let sealEncryptedKeyData: Uint8Array;

      if (sealKey instanceof Uint8Array) {
        sealEncryptedKeyData = sealKey;
      } else if (typeof sealKey === 'string') {
        sealEncryptedKeyData = fromHex(sealKey);
      } else if (Array.isArray(sealKey)) {
        sealEncryptedKeyData = new Uint8Array(sealKey);
      } else {
        throw new Error(`Unsupported sealEncryptedKey format: ${typeof sealKey}`);
      }

      console.log('🔍 Formatted sealEncryptedKey:', {
        type: sealEncryptedKeyData.constructor.name,
        length: sealEncryptedKeyData.length,
        firstBytes: Array.from(sealEncryptedKeyData.slice(0, 10))
      });

      // Step 4: Decrypt using SessionKey with properly formatted data
      const decryptedSymmetricKey = await this.sealClient.decrypt({
        data: sealEncryptedKeyData,
        sessionKey,
        txBytes,
      });

      console.log('✅ Seal decryption successful');

      // Step 5: Retrieve from Walrus via API route
      const walrusResponse = await fetch(`/api/walrus/blob/${credentialData.walrusBlobId}`);
      
      if (!walrusResponse.ok) {
        throw new Error(`Failed to retrieve from Walrus: ${walrusResponse.status} ${walrusResponse.statusText}`);
      }

      const envelopeEncryptedData = await walrusResponse.arrayBuffer();

      console.log('✅ Retrieved envelope from Walrus, size:', envelopeEncryptedData.byteLength);

      // Step 6: Decrypt envelope
      const decryptedCredentialData = await this.decryptWithSymmetricKey(
        new Uint8Array(envelopeEncryptedData),
        decryptedSymmetricKey
      );

      return JSON.parse(decryptedCredentialData) as DebitCardCredentials;
    } catch (error) {
      console.error('Failed to retrieve secure credentials:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  // Helper methods (unchanged)
  private generatePolicyId(userId: string, credentialType: string): string {
    const timestamp = Date.now();
    const combined = `${userId}_${credentialType}_${timestamp}`;
    const encoded = new TextEncoder().encode(combined);
    
    // Convert to hex string, ensuring it starts with 0x
    const hexString = toHex(encoded);
    return hexString.startsWith('0x') ? hexString : `0x${hexString}`;
  }

  private async encryptWithSymmetricKey(data: string, key: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedData
    );

    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return result;
  }

  private async decryptWithSymmetricKey(encryptedData: Uint8Array, key: Uint8Array): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  }
}