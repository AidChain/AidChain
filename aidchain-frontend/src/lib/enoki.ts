interface EnokiZkLoginResponse {
  data: {
    salt: string;
    address: string;
    publicKey: string;
  };
}

interface EnokiZkpResponse {
  data: {
    proofPoints: any;
    issBase64Details: any;
    headerBase64: string;
    addressSeed: string;
  };
}

interface EnokiNonceResponse {
  data: {
    nonce: string;
    randomness: string;
    epoch: number;
    maxEpoch: number;
    estimatedExpiration: number;
  };
}

export class EnokiService {
  private apiKey: string;
  private baseUrl = 'https://api.enoki.mystenlabs.com/v1';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY!;
    if (!this.apiKey) {
      throw new Error('ENOKI_API_KEY is required');
    }
  }

  // Get zkLogin address and salt from JWT
  async getZkLoginAddress(jwt: string): Promise<EnokiZkLoginResponse> {
    const response = await fetch(`${this.baseUrl}/zklogin`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'zklogin-jwt': jwt,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Enoki zkLogin address request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Generate nonce via Enoki API
  async generateNonce(ephemeralPublicKey: string, additionalEpochs: number = 2): Promise<EnokiNonceResponse> {
    const response = await fetch(`${this.baseUrl}/zklogin/nonce`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: 'testnet',
        ephemeralPublicKey,
        additionalEpochs,
      }),
    });

    if (!response.ok) {
      throw new Error(`Enoki nonce generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Create ZK proof
  async createZkProof(
    jwt: string,
    ephemeralPublicKey: string,
    maxEpoch: number,
    randomness: string
  ): Promise<EnokiZkpResponse> {
    const response = await fetch(`${this.baseUrl}/zklogin/zkp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'zklogin-jwt': jwt,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: 'testnet',
        ephemeralPublicKey,
        maxEpoch,
        randomness,
      }),
    });

    if (!response.ok) {
      throw new Error(`Enoki ZK proof generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Create sponsored transaction
  async createSponsoredTransaction(
    jwt: string,
    transactionBlockKindBytes: string,
    sender: string,
    allowedMoveCallTargets?: string[]
  ): Promise<{ data: { digest: string; bytes: string } }> {
    const response = await fetch(`${this.baseUrl}/transaction-blocks/sponsor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'zklogin-jwt': jwt,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: 'testnet',
        transactionBlockKindBytes,
        sender,
        allowedMoveCallTargets: allowedMoveCallTargets || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Enoki sponsored transaction creation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Execute sponsored transaction
  async executeSponsoredTransaction(
    digest: string,
    signature: string
  ): Promise<{ data: { digest: string } }> {
    const response = await fetch(`${this.baseUrl}/transaction-blocks/sponsor/${digest}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Enoki sponsored transaction execution failed: ${response.statusText}`);
    }

    return response.json();
  }
}