import { NextRequest, NextResponse } from 'next/server';
import { walrusClient } from '@/lib/walrus-client';
import { BeneficiaryData } from '@/types/walrus';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract beneficiary data
    const beneficiaryData: BeneficiaryData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      weeklyLimit: parseInt(formData.get('weeklyLimit') as string),
      description: formData.get('description') as string,
      documents: [],
    };

    // Extract files
    const files: Array<{ identifier: string; file: File; tags?: Record<string, string> }> = [];
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push({
          identifier: key,
          file: value,
          tags: {
            beneficiary: beneficiaryData.name,
            address: beneficiaryData.address,
            documentType: key,
          },
        });
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one document is required' },
        { status: 400 }
      );
    }

    // Store documents as a quilt on Walrus
    const quiltResult = await walrusClient.storeQuilt(files, {
      epochs: 50, // Store for longer period for beneficiary documents
      deletable: false, // Keep documents permanent for verification
    });

    // Create the encrypted data hash for the smart contract
    const encryptedDataHash = Buffer.from(quiltResult.blobStoreResult.newlyCreated?.blobObject.blobId || '', 'base64');

    return NextResponse.json({
      success: true,
      data: {
        beneficiaryData,
        walrusQuiltId: quiltResult.blobStoreResult.newlyCreated?.blobObject.blobId,
        encryptedDataHash: Array.from(encryptedDataHash), // Convert to u8 array for Move
        quiltPatches: quiltResult.storedQuiltBlobs,
        cost: quiltResult.blobStoreResult.newlyCreated?.cost,
      },
    });
  } catch (error) {
    console.error('Beneficiary creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create beneficiary and store documents' },
      { status: 500 }
    );
  }
}