import { WalrusStoreResponse } from '@/types/walrus';

export class WalrusClient {
  private publisherUrl: string;
  private aggregatorUrl: string;

  constructor() {
    this.publisherUrl = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
    this.aggregatorUrl = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';
  }

  /**
   * Store a single blob on Walrus
   */
  async storeBlob(
    data: string | Buffer | File | Uint8Array, // ← Add Uint8Array support
    options: {
      epochs?: number;
      deletable?: boolean;
      sendObjectTo?: string;
    } = {}
  ): Promise<WalrusStoreResponse> {
    console.log('🔍 WalrusClient.storeBlob called with:', {
      dataType: data.constructor.name,
      dataSize: data instanceof File ? data.size : 
                Buffer.isBuffer(data) ? data.length :
                data instanceof Uint8Array ? data.length :
                typeof data === 'string' ? data.length : 'unknown'
    });

    const { epochs = 5, deletable = false, sendObjectTo } = options;
    
    const url = new URL(`${this.publisherUrl}/v1/blobs`);
    
    // Add query parameters
    if (epochs) url.searchParams.append('epochs', epochs.toString());
    if (deletable) url.searchParams.append('deletable', 'true');
    if (sendObjectTo) url.searchParams.append('send_object_to', sendObjectTo);

    // Convert Uint8Array to Buffer for better compatibility
    let bodyData: string | Buffer | File;
    let contentType: string;

    if (data instanceof File) {
      bodyData = data;
      contentType = data.type || 'application/octet-stream';
    } else if (data instanceof Uint8Array) {
      // Convert Uint8Array to Buffer
      bodyData = Buffer.from(data);
      contentType = 'application/octet-stream';
      console.log('🔧 Converted Uint8Array to Buffer:', {
        originalLength: data.length,
        bufferLength: bodyData.length
      });
    } else if (Buffer.isBuffer(data)) {
      bodyData = data;
      contentType = 'application/octet-stream';
    } else {
      // String data
      bodyData = data;
      contentType = 'text/plain';
    }

    console.log('🔍 Uploading to Walrus:', {
      url: url.toString(),
      contentType,
      bodyType: bodyData.constructor.name,
      bodySize: Buffer.isBuffer(bodyData) ? bodyData.length : 
               bodyData instanceof File ? bodyData.size : 
               bodyData.length
    });

    const response = await fetch(url.toString(), {
      method: 'PUT',
      body: bodyData,
      headers: {
        'Content-Type': contentType,
      },
    });

    console.log('🔍 Walrus response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      // Try to get error details
      let errorDetails = '';
      try {
        const errorText = await response.text();
        errorDetails = errorText ? ` - ${errorText}` : '';
      } catch (e) {
        // Ignore error parsing error
      }
      
      console.error('❌ Walrus upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorDetails
      });
      
      throw new Error(`Failed to store blob: ${response.status} ${response.statusText}${errorDetails}`);
    }

    const result = await response.json();
    console.log('✅ Walrus upload successful:', result);
    
    return result;
  }

  /**
   * Retrieve a blob by blob ID
   */
  async retrieveBlob(blobId: string): Promise<ArrayBuffer> {
    console.log('🔍 Retrieving blob:', blobId);
    
    const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve blob: ${response.status} ${response.statusText}`);
    }

    const result = await response.arrayBuffer();
    console.log('✅ Retrieved blob, size:', result.byteLength);
    
    return result;
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