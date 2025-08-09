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
   * ✅ Simplified: Seal encrypt → Store directly on Walrus as text
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
      
      const formattedPackageId = this.packageId.startsWith('0x') ? this.packageId : `0x${this.packageId}`;
      
      console.log('🔍 Encrypting with Seal:', {
        threshold: SealCredentialManager.KEY_SERVER_THRESHOLD,
        packageId: formattedPackageId,
        id: policyId,
        dataLength: credentialData.length
      });

      // ✅ Step 1: Seal encryption (returns encrypted object + symmetric key)
      const { encryptedObject } = await this.sealClient.encrypt({
        threshold: SealCredentialManager.KEY_SERVER_THRESHOLD,
        packageId: formattedPackageId,
        id: policyId,
        data: new TextEncoder().encode(credentialData),
      });

      console.log('✅ Seal encryption successful');
      console.log('🔍 Encrypted object info:', {
        type: encryptedObject.constructor.name,
        length: encryptedObject.length,
        firstBytes: Array.from(encryptedObject.slice(0, 10))
      });

      // ✅ Step 2: Convert encrypted Uint8Array to base64 string (more space efficient)
      const encryptedObjectBase64 = btoa(String.fromCharCode(...encryptedObject));

      console.log('🔍 Storing on Walrus as base64 text:', {
        originalSize: encryptedObject.length,
        base64Length: encryptedObjectBase64.length,
        compressionRatio: `${((encryptedObject.length / encryptedObjectBase64.length) * 100).toFixed(1)}%`,
        base64Preview: encryptedObjectBase64.substring(0, 50) + '...'
      });

      // Check size limit (1MB = 1,048,576 bytes)
      if (encryptedObjectBase64.length > 1048576) {
        throw new Error(`Encrypted data too large: ${encryptedObjectBase64.length} bytes (max 1MB). Original: ${encryptedObject.length} bytes`);
      }

      // ✅ Step 3: Store base64 string directly on Walrus as text
      const walrusResult = await walrusClient.storeBlob(encryptedObjectBase64, {
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
   * ✅ Simplified: Fetch from Walrus → Seal decrypt
   */
  async retrieveSecureCredentials(
    credentialData: SecureCredentialData,
    userAddress: string,
    signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
  ): Promise<DebitCardCredentials | null> {
    try {
      console.log('🔍 Retrieving credentials with Enoki signing');
      console.log('🔍 Credential data:', {
        policyId: credentialData.policyId,
        walrusBlobId: credentialData.walrusBlobId
      });

      // ✅ Step 1: Create SessionKey using Enoki signing
      const sessionKey = await this.createSessionKeyWithZkLogin(userAddress, signPersonalMessage);

      // ✅ Step 2: Build the seal_approve transaction
      const tx = new Transaction();
      
      // Process policyId to bytes
      let policyIdBytes: Uint8Array;
      
      if (credentialData.policyId.startsWith('0x')) {
        policyIdBytes = fromHex(credentialData.policyId.slice(2));
      } else {
        try {
          policyIdBytes = fromHex(credentialData.policyId);
        } catch (hexError) {
          policyIdBytes = new TextEncoder().encode(credentialData.policyId);
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

      console.log('✅ Built seal_approve transaction');

      // ✅ Step 3: Fetch encrypted data from Walrus
      console.log('🔍 Fetching encrypted data from Walrus...');
      const encryptedDataBuffer = await walrusClient.retrieveBlob(credentialData.walrusBlobId);
      
      // Convert ArrayBuffer to string (hex format)
      const encryptedDataText = new TextDecoder().decode(encryptedDataBuffer);
      console.log('✅ Retrieved encrypted data from Walrus:', {
        textLength: encryptedDataText.length,
        textPreview: encryptedDataText.substring(0, 50) + '...'
      });

      // ✅ Step 4: Convert base64 string back to Uint8Array for Seal
      let encryptedObjectData: Uint8Array;

      try {
        // Convert base64 back to Uint8Array
        const binaryString = atob(encryptedDataText);
        encryptedObjectData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          encryptedObjectData[i] = binaryString.charCodeAt(i);
        }
        
        console.log('✅ Successfully parsed base64 to Uint8Array:', {
          base64Length: encryptedDataText.length,
          uint8ArrayLength: encryptedObjectData.length,
          firstBytes: Array.from(encryptedObjectData.slice(0, 10))
        });
      } catch (base64Error) {
        throw new Error(`Invalid base64 data from Walrus: ${base64Error}`);
      }

      // ✅ Step 5: Seal decrypt (returns original JSON data)
      console.log('🔍 Calling Seal decrypt...');
      const decryptedData = await this.sealClient.decrypt({
        data: encryptedObjectData,
        sessionKey,
        txBytes,
      });

      console.log('✅ Seal decryption successful:', {
        dataType: decryptedData.constructor.name,
        dataLength: decryptedData.length
      });

      // ✅ Step 6: Convert decrypted data back to JSON
      const decryptedText = new TextDecoder().decode(decryptedData);
      const credentials = JSON.parse(decryptedText) as DebitCardCredentials;

      console.log('✅ Final decryption successful');
      return credentials;

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

  // Helper methods
  private generatePolicyId(userId: string, credentialType: string): string {
    const timestamp = Date.now();
    const combined = `${userId}_${credentialType}_${timestamp}`;
    const encoded = new TextEncoder().encode(combined);
    
    // Convert to hex string, ensuring it starts with 0x
    const hexString = toHex(encoded);
    return hexString.startsWith('0x') ? hexString : `0x${hexString}`;
  }
}