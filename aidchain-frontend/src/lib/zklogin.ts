import { 
  generateNonce, 
  generateRandomness, 
  getZkLoginSignature,
  jwtToAddress 
} from '@mysten/sui/zklogin';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { toBase64, fromBase64 } from '@mysten/sui/utils';
import { EnokiService } from './enoki';

interface ZkLoginState {
  ephemeralKeyPair: Ed25519Keypair;
  randomness: string;
  maxEpoch: number;
  userSalt: string;
  jwt: string;
  zkLoginUserAddress: string;
}

interface SerializedKeyPair {
  privateKeyBase64: string;
  publicKey: number[];
}

export class ZkLoginService {
  private client: SuiClient;
  private state: ZkLoginState | null = null;
  private enokiService: EnokiService;

  constructor(client: SuiClient) {
    this.client = client;
    this.enokiService = new EnokiService();
  }

  // Initialize zkLogin flow
  async initializeZkLogin(): Promise<{ loginUrl: string; state: any }> {
    // Generate ephemeral key pair
    const ephemeralKeyPair = new Ed25519Keypair();
    
    // Get nonce from Enoki API
    const ephemeralPublicKey = toBase64(ephemeralKeyPair.getPublicKey().toSuiBytes());
    const nonceResponse = await this.enokiService.generateNonce(ephemeralPublicKey);
    
    const { nonce, randomness, maxEpoch } = nonceResponse.data;

    // Store state - properly serialize the keypair
    const loginState = {
      ephemeralKeyPair: this.serializeKeyPair(ephemeralKeyPair),
      randomness,
      maxEpoch,
      nonce
    };

    // Create Google OAuth URL
    const googleAuthUrl = this.createGoogleAuthUrl(nonce);

    return {
      loginUrl: googleAuthUrl,
      state: loginState
    };
  }

  // Serialize keypair for storage
  private serializeKeyPair(keyPair: Ed25519Keypair): SerializedKeyPair {
    const secretKey = keyPair.getSecretKey();
    const publicKey = keyPair.getPublicKey().toSuiBytes();
    
    return {
      privateKeyBase64: secretKey,
      publicKey: Array.from(publicKey)
    };
  }

  // Deserialize keypair from storage
  private deserializeKeyPair(serialized: SerializedKeyPair): Ed25519Keypair {
    // Decode base64 and extract 32-byte private key
    const fullSecretKey = fromBase64(serialized.privateKeyBase64);
    const privateKey = fullSecretKey.slice(0, 32);
    
    return Ed25519Keypair.fromSecretKey(privateKey);
  }

  // Create Google OAuth URL
  private createGoogleAuthUrl(nonce: string): string {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
      response_type: 'id_token',
      scope: 'openid',
      nonce: nonce,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Complete zkLogin after OAuth callback - now using Enoki
  async completeZkLogin(
    jwt: string,
    loginState: any
  ): Promise<ZkLoginState> {
    // Restore ephemeral keypair
    const ephemeralKeyPair = this.deserializeKeyPair(loginState.ephemeralKeyPair);

    // Get address and salt from Enoki API
    const zkLoginResponse = await this.enokiService.getZkLoginAddress(jwt);
    const { salt, address: zkLoginUserAddress } = zkLoginResponse.data;

    const state: ZkLoginState = {
      ephemeralKeyPair,
      randomness: loginState.randomness,
      maxEpoch: loginState.maxEpoch,
      userSalt: salt,
      jwt,
      zkLoginUserAddress
    };

    this.state = state;
    return state;
  }

  // Generate randomness for zkLogin
  generateRandomness(): string {
    return generateRandomness();
  }

  // Helper method to get current epoch + buffer for maxEpoch
  async getCurrentMaxEpoch(epochBuffer: number = 10): Promise<number> {
    try {
      const systemState = await this.client.getLatestSuiSystemState();
      return parseInt(systemState.epoch) + epochBuffer;
    } catch (error) {
      console.error('Failed to get current epoch:', error);
      return 1000;
    }
  }

  // Method for Enoki API integration with ZKP and sponsored transactions
  async signAndExecuteTransactionWithEnoki(transaction: Transaction): Promise<any> {
    if (!this.state) {
      throw new Error('zkLogin not initialized');
    }

    try {
      // Get ephemeral public key
      const ephemeralPublicKey = toBase64(this.state.ephemeralKeyPair.getPublicKey().toSuiBytes());
      
      // Create ZK proof via Enoki
      const zkProofResponse = await this.enokiService.createZkProof(
        this.state.jwt,
        ephemeralPublicKey,
        this.state.maxEpoch,
        this.state.randomness
      );

      // Build the transaction bytes
      const txBytes = await transaction.build({ client: this.client });
      
      // Sign the transaction with ephemeral keypair
      const ephemeralSignature = await this.state.ephemeralKeyPair.signTransaction(txBytes);
      
      // Get zkLogin signature with Enoki-provided ZK proof
      const zkLoginSignature = await getZkLoginSignature({
        inputs: zkProofResponse.data,
        maxEpoch: this.state.maxEpoch,
        userSignature: ephemeralSignature.bytes,
      });

      // Execute transaction
      const result = await this.client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: zkLoginSignature,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      return result;
    } catch (error) {
      console.error('Enoki zkLogin transaction execution failed:', error);
      throw error;
    }
  }

  // Create and execute sponsored transaction via Enoki
  async createSponsoredTransaction(transaction: Transaction): Promise<any> {
    if (!this.state) {
      throw new Error('zkLogin not initialized');
    }

    try {
      // Build transaction bytes for sponsoring
      const txBytes = await transaction.build({ 
        client: this.client,
        onlyTransactionKind: true 
      });
      
      // Create sponsored transaction via Enoki
      const sponsorResponse = await this.enokiService.createSponsoredTransaction(
        this.state.jwt,
        toBase64(txBytes),
        this.state.zkLoginUserAddress,
        ['0x2::coin::transfer'] // Add your allowed move call targets
      );

      // Sign the sponsored transaction
      const sponsoredTxBytes = fromBase64(sponsorResponse.data.bytes);
      const signature = await this.state.ephemeralKeyPair.signTransaction(sponsoredTxBytes);

      // Execute the sponsored transaction
      const result = await this.enokiService.executeSponsoredTransaction(
        sponsorResponse.data.digest,
        signature.signature
      );

      return result;
    } catch (error) {
      console.error('Sponsored transaction failed:', error);
      throw error;
    }
  }

  getAddress(): string | null {
    return this.state?.zkLoginUserAddress || null;
  }

  isAuthenticated(): boolean {
    return !!this.state;
  }

  // Get current state for debugging
  getState(): ZkLoginState | null {
    return this.state;
  }

  // Get JWT for Enoki API
  getJWT(): string | null {
    return this.state?.jwt || null;
  }

  // Get randomness for Enoki API
  getRandomness(): string | null {
    return this.state?.randomness || null;
  }
}