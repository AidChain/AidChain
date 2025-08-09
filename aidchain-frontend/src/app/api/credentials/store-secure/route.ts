import { NextRequest, NextResponse } from 'next/server';
import { SealCredentialManager } from '@/lib/seal-credential-manager';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      credentials, 
      userAddress, 
      credentialType,
      packageId 
    } = await request.json();

    if (!userId || !credentials || !userAddress || !packageId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const credentialManager = new SealCredentialManager(packageId);
    
    const secureCredentialData = await credentialManager.storeSecureCredentials(
      userId,
      credentials,
      userAddress,
      credentialType
    );

    return NextResponse.json({
      success: true,
      credentialData: {
        ...secureCredentialData,
        // Convert Uint8Array to base64 for JSON serialization
        sealEncryptedKey: Buffer.from(secureCredentialData.sealEncryptedKey).toString('base64')
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to store secure credentials' },
      { status: 500 }
    );
  }
}