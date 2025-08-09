import { WalrusStoreResponse } from '@/types/walrus';

export class WalrusClient {
  private publisherUrl: string;
  private aggregatorUrl: string;

  constructor() {
    this.publisherUrl = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
    this.aggregatorUrl = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';
  }

  /**
   * Store a single blob on Walrus
   */
  async storeBlob(
    data: string | Buffer | File, 
    options: {
      epochs?: number;
      deletable?: boolean;
      sendObjectTo?: string;
    } = {}
  ): Promise<WalrusStoreResponse> {
    const { epochs = 5, deletable = false, sendObjectTo } = options;
    
    const url = new URL(`${this.publisherUrl}/v1/blobs`);
    
    // Add query parameters
    if (epochs) url.searchParams.append('epochs', epochs.toString());
    if (deletable) url.searchParams.append('deletable', 'true');
    if (sendObjectTo) url.searchParams.append('send_object_to', sendObjectTo);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      body: data,
      headers: {
        'Content-Type': data instanceof File ? data.type : 'application/octet-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to store blob: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Retrieve a blob by blob ID
   */
  async retrieveBlob(blobId: string): Promise<ArrayBuffer> {
    const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve blob: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Retrieve a blob by Sui object ID
   */
  async retrieveBlobByObjectId(objectId: string): Promise<ArrayBuffer> {
    const response = await fetch(`${this.aggregatorUrl}/v1/blobs/by-object-id/${objectId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve blob by object ID: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }
}

export const walrusClient = new WalrusClient();