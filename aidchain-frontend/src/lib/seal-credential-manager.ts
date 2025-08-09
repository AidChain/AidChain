import { SealClient, SessionKey, getAllowlistedKeyServers } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { walrusClient } from './walrus-client';
import { SecureCredentialData, DebitCardCredentials } from '@/types/credentials';

export class SealCredentialManager {
  private suiClient: SuiClient;
  private sealClient: SealClient;
  private packageId: string;
  
  // Use testnet key servers for now
  private static readonly KEY_SERVER_THRESHOLD = 2;
  private static readonly SESSION_TTL_MINUTES = 30;

  constructor(packageId: string, network: 'testnet' | 'mainnet' = 'testnet') {
    this.packageId = packageId;
    this.suiClient = new SuiClient({ url: getFullnodeUrl(network) });
    
    // Get allowlisted key servers for the network
    const serverObjectIds = getAllowlistedKeyServers(network);
    
    this.sealClient = new SealClient({
      suiClient: this.suiClient,
      serverConfigs: serverObjectIds.map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false, // Set to true in production for added security
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
      
      // Ensure packageId is in correct format
      const formattedPackageId = this.packageId.startsWith('0x') ? this.packageId : `0x${this.packageId}`;
      
      console.log('🔍 Encrypting with Seal:', {
        threshold: SealCredentialManager.KEY_SERVER_THRESHOLD,
        packageId: formattedPackageId,
        id: policyId,
        dataLength: dataToEncrypt.length
      });

      // Fix: Use string parameters as per updated Seal SDK
      const { encryptedObject: sealEncryptedKey, key: symmetricKey } = await this.sealClient.encrypt({
        threshold: SealCredentialManager.KEY_SERVER_THRESHOLD,
        packageId: formattedPackageId, // String format (no fromHex conversion needed)
        id: policyId,                  // String format (no fromHex conversion needed)
        data: dataToEncrypt,           // Uint8Array
      });

      console.log('✅ Seal encryption successful, encrypted key length:', sealEncryptedKey.length);

      // Step 3: Encrypt the actual credentials with the symmetric key (envelope encryption)
      const envelopeEncryptedCredentials = await this.encryptWithSymmetricKey(
        credentialData, 
        symmetricKey
      );

      // Step 4: Store the envelope-encrypted credentials on Walrus as a single blob
      const credentialFile = new File(
        [envelopeEncryptedCredentials], 
        `sealed_credentials_${userId}_${Date.now()}.enc`,
        { type: 'application/octet-stream' }
      );

      console.log('🔍 Storing on Walrus as single blob:', {
        fileSize: credentialFile.size,
        fileName: credentialFile.name
      });

      // Use storeBlob
      const walrusResult = await walrusClient.storeBlob(credentialFile, {
        epochs: 200, // Long-term storage
        deletable: false
      });

      const walrusBlobId = walrusResult.newlyCreated?.blobObject.blobId || 
                          walrusResult.alreadyCertified?.blobId || '';
      
      console.log('✅ Walrus storage successful, blob ID:', walrusBlobId);

      // Step 5: Return credential metadata
      const secureCredentialData: SecureCredentialData = {
        userId,
        credentialType,
        walrusBlobId: walrusBlobId, // Keep same field name for compatibility, but it's now a blob ID
        sealEncryptedKey,
        accessLevel: 'user',
        createdAt: Date.now(),
        packageId: formattedPackageId,
        policyId
      };

      return secureCredentialData;
    } catch (error) {
      console.error('Failed to store secure credentials:', error);
      throw new Error(`Credential storage failed: ${error}`);
    }
  }

  /**
   * Retrieves and decrypts credentials using Seal + Walrus
   */
  async retrieveSecureCredentials(
    credentialData: SecureCredentialData,
    sessionKey: SessionKey
  ): Promise<DebitCardCredentials | null> {
    try {
      // Fix: Build transaction according to documentation
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::donation_pool::seal_approve`,
        arguments: [
          tx.pure.vector("u8", fromHex(credentialData.policyId)),
          tx.object('0x6'), // Clock object
        ]
      });

      // Build with correct options as per documentation
      const txBytes = await tx.build({ 
        client: this.suiClient, 
        onlyTransactionKind: true 
      });

      // Use correct decrypt method signature
      const decryptedSymmetricKey = await this.sealClient.decrypt({
        data: credentialData.sealEncryptedKey,
        sessionKey,
        txBytes,
      });

      // Step 3: Retrieve envelope-encrypted data from Walrus
      const envelopeEncryptedData = await walrusClient.retrieveBlob(credentialData.walrusBlobId);

      // Step 4: Decrypt the envelope using the symmetric key
      const decryptedCredentialData = await this.decryptWithSymmetricKey(
        new Uint8Array(envelopeEncryptedData),
        decryptedSymmetricKey
      );

      // Step 5: Parse and return credentials
      return JSON.parse(decryptedCredentialData) as DebitCardCredentials;
    } catch (error) {
      console.error('Failed to retrieve secure credentials:', error);
      return null;
    }
  }

  /**
   * Creates a session key for accessing credentials
   */
  async createSessionKey(
    userAddress: string,
    signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
  ): Promise<SessionKey> {
    try {
      const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: this.packageId,
        ttlMin: SealCredentialManager.SESSION_TTL_MINUTES,
        suiClient: this.suiClient
      });

      const message = sessionKey.getPersonalMessage();
      const { signature } = await signPersonalMessage(message);
      
      // Fix: Convert base64 signature to hex format that Seal expects
      try {
        // Try the signature as-is first
        sessionKey.setPersonalMessageSignature(signature);
      } catch (error) {
        // If that fails, try converting base64 to hex
        try {
          const binaryString = atob(signature);
          const hexSignature = Array.from(binaryString)
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
          sessionKey.setPersonalMessageSignature(hexSignature);
        } catch (conversionError) {
          // If conversion fails, try without the leading 'A' character (common base64 signature prefix)
          const cleanSignature = signature.startsWith('A') ? signature.slice(1) : signature;
          sessionKey.setPersonalMessageSignature(cleanSignature);
        }
      }

      return sessionKey;
    } catch (error) {
      console.error('Failed to create session key:', error);
      throw error;
    }
  }

  /**
   * Batch retrieve multiple credentials efficiently
   */
  async retrieveMultipleCredentials(
    credentialDataList: SecureCredentialData[],
    sessionKey: SessionKey
  ): Promise<DebitCardCredentials[]> {
    // Group by package ID (should all be the same in our case)
    const packageCredentials = credentialDataList.filter(
      cred => cred.packageId === this.packageId
    );

    if (packageCredentials.length === 0) return [];

    // Create batch transaction for all seal_approve calls
    const tx = new Transaction();
    packageCredentials.forEach(credData => {
      tx.moveCall({
        target: `${this.packageId}::donation_pool::seal_approve`,
        arguments: [
          tx.pure.vector("u8", fromHex(credData.policyId)),
          tx.object('0x6'), // Clock object
        ]
      });
    });

    const txBytes = await tx.build({ 
      client: this.suiClient, 
      onlyTransactionKind: true 
    });

    // Fetch all decryption keys at once
    await this.sealClient.fetchKeys({
      ids: packageCredentials.map(cred => cred.policyId),
      txBytes,
      sessionKey,
      threshold: SealCredentialManager.KEY_SERVER_THRESHOLD,
    });

    // Now decrypt each credential using cached keys
    const results: DebitCardCredentials[] = [];
    for (const credData of packageCredentials) {
      try {
        const credential = await this.retrieveSecureCredentials(credData, sessionKey);
        if (credential) results.push(credential);
      } catch (error) {
        console.error(`Failed to decrypt credential ${credData.policyId}:`, error);
      }
    }

    return results;
  }

  // Helper methods
  private generatePolicyId(userId: string, credentialType: string): string {
    const timestamp = Date.now();
    const combined = `${userId}_${credentialType}_${timestamp}`;
    return toHex(new TextEncoder().encode(combined));
  }

  private async encryptWithSymmetricKey(data: string, key: Uint8Array): Promise<Uint8Array> {
    // Use Web Crypto API for AES-GCM encryption
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key.slice(0, 32), // Use first 32 bytes for AES-256
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encodedData = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedData
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return result;
  }

  private async decryptWithSymmetricKey(encryptedData: Uint8Array, key: Uint8Array): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key.slice(0, 32), // Use first 32 bytes for AES-256
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = encryptedData.slice(0, 12); // First 12 bytes are IV
    const data = encryptedData.slice(12); // Rest is encrypted data

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  }
}