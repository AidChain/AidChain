export interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      registeredEpoch: number;
      blobId: string;
      size: number;
      encodingType: string;
      certifiedEpoch: number | null;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
      deletable: boolean;
    };
    resourceOperation: {
      registerFromScratch: {
        encodedLength: number;
        epochsAhead: number;
      };
    };
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

export interface WalrusQuiltResponse {
  blobStoreResult: WalrusStoreResponse;
  storedQuiltBlobs: Array<{
    identifier: string;
    quiltPatchId: string;
  }>;
}

export interface BeneficiaryData {
  name: string;
  address: string;
  weeklyLimit: number;
  documents: File[];
  description: string;
}

export interface DonationCardData {
  title: string;
  description: string;
  targetAddress?: string;
  targetName: string;
  goalAmount: number;
  heroImage?: File;
}