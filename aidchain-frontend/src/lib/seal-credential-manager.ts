import { SealClient, getAllowlistedKeyServers, SessionKey } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { walrusClient } from './walrus-client';
import { SecureCredentialData, DebitCardCredentials } from '@/types/credentials';
import { sign } from 'crypto';

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
    zkLoginKeypair: any
  ): Promise<SessionKey> {
    try {
      const formattedPackageId = this.packageId.startsWith('0x') ? this.packageId : `0x${this.packageId}`;
      
      console.log('🔍 Creating SessionKey with zkLogin keypair');
      console.log('🔍 zkLoginKeypair type:', typeof zkLoginKeypair);
      console.log('🔍 zkLoginKeypair methods:', Object.getOwnPropertyNames(zkLoginKeypair));

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
        messagePreview: Array.from(message.slice(0, 20))
      });
      
      // Add try-catch around the signing operation
      try {
        console.log('🔍 About to call zkLoginKeypair.signPersonalMessage...');
        
        // Sign with zkLogin keypair (no wallet popup!)
        const signResult = await zkLoginKeypair.signPersonalMessage(message);
        
        console.log('🔍 zkLogin keypair signed message successfully:', {
          signResult,
          signatureType: typeof signResult?.signature,
          signatureLength: signResult?.signature?.length
        });
        
        // Set the signature
        console.log('🔍 About to call sessionKey.setPersonalMessageSignature...');
        sessionKey.setPersonalMessageSignature(signResult.signature);
        console.log('✅ SessionKey signature set successfully');
        
      } catch (signingError) {
        console.error('❌ Signing failed:', signingError);
        throw signingError;
      }
      
      console.log('✅ SessionKey created automatically with zkLogin');
      return sessionKey;
    } catch (error) {
      console.error('❌ Failed to create SessionKey with zkLogin:', error);
      throw error;
    }
  }

  /**
   * Retrieves and decrypts credentials using zkLogin keypair
   */
  async retrieveSecureCredentials(
    credentialData: SecureCredentialData,
    userAddress: string,
    zkLoginKeypair: any
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

      // Step 1: Create SessionKey programmatically (no wallet popup!)
      const sessionKey = await this.createSessionKeyWithZkLogin(userAddress, zkLoginKeypair);

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

  /**
   * Batch retrieve multiple credentials efficiently with zkLogin
   * Optimized to reuse SessionKey across multiple decryptions
   */
  async retrieveMultipleCredentialsWithZkLogin(
    credentialDataList: SecureCredentialData[],
    userAddress: string,
    zkLoginKeypair: any
  ): Promise<DebitCardCredentials[]> {
    console.log(`🔍 Batch retrieving ${credentialDataList.length} credentials`);

    try {
      // Create SessionKey once for all operations (optimization!)
      const sessionKey = await this.createSessionKeyWithZkLogin(userAddress, zkLoginKeypair);
      console.log('✅ SessionKey created for batch retrieval', sessionKey);
      
      const results: DebitCardCredentials[] = [];
      
      // Process in parallel for better performance
      const promises = credentialDataList.map(async (credData) => {
        try {
          // Build transaction for this credential
          const tx = new Transaction();
          
          // Fix: Same policyId handling as above
          let policyIdBytes: Uint8Array;
          
          if (credData.policyId.startsWith('0x')) {
            policyIdBytes = fromHex(credData.policyId.slice(2));
          } else {
            try {
              policyIdBytes = fromHex(credData.policyId);
            } catch (hexError) {
              try {
                const base64Decoded = atob(credData.policyId);
                policyIdBytes = new TextEncoder().encode(base64Decoded);
              } catch (base64Error) {
                policyIdBytes = new TextEncoder().encode(credData.policyId);
              }
            }
          }

          tx.moveCall({
            target: `${this.packageId}::donation_pool::seal_approve`,
            arguments: [
              tx.pure.vector("u8", Array.from(policyIdBytes)),
              tx.object('0x6'),
            ]
          });

          const txBytes = await tx.build({ 
            client: this.suiClient, 
            onlyTransactionKind: true 
          });

          // Decrypt with shared SessionKey
          const decryptedSymmetricKey = await this.sealClient.decrypt({
            data: credData.sealEncryptedKey,
            sessionKey, // Reuse same SessionKey!
            txBytes,
          });

          // Retrieve and decrypt envelope
          const envelopeEncryptedData = await walrusClient.retrieveBlob(credData.walrusBlobId);
          const decryptedCredentialData = await this.decryptWithSymmetricKey(
            new Uint8Array(envelopeEncryptedData),
            decryptedSymmetricKey
          );

          return JSON.parse(decryptedCredentialData) as DebitCardCredentials;
        } catch (error) {
          console.error('Failed to decrypt individual credential:', error);
          return null;
        }
      });

      const decryptedCredentials = await Promise.allSettled(promises);

      decryptedCredentials.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else {
          console.warn(`Failed to decrypt credential ${index}:`, result);
        }
      });

      console.log(`✅ Successfully retrieved ${results.length}/${credentialDataList.length} credentials`);
      return results;
    } catch (error) {
      console.error('Failed to batch retrieve credentials:', error);
      return [];
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