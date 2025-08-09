import { EnokiClient } from '@mysten/enoki';

export class EnokiBackendService {
  private client: EnokiClient;

  constructor() {
    // Note: This should be used only in API routes with ENOKI_SECRET_KEY
    // For client-side, we use the dapp-kit integration
    this.client = new EnokiClient({
      apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!, // Private key for backend
    });
  }

  async createSponsoredTransaction(params: {
    network: 'testnet' | 'mainnet';
    transactionKindBytes: string;
    sender: string;
    allowedMoveCallTargets?: string[];
    allowedAddresses?: string[];
  }) {
    return this.client.createSponsoredTransaction(params);
  }

  async executeSponsoredTransaction(params: {
    digest: string;
    signature: string;
  }) {
    return this.client.executeSponsoredTransaction(params);
  }
}

export const enokiBackend = new EnokiBackendService();