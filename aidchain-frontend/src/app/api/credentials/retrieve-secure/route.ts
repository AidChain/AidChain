import { NextRequest, NextResponse } from 'next/server';
import { SealCredentialManager } from '@/lib/seal-credential-manager';
import { SessionKey } from '@mysten/seal';

export async function POST(request: NextRequest) {
  try {
    const { 
      credentialData, 
      sessionKeyData,
      packageId 
    } = await request.json();

    if (!credentialData || !sessionKeyData || !packageId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const credentialManager = new SealCredentialManager(packageId);
    
    // Reconstruct session key from stored data
    const sessionKey = SessionKey.fromExportedData(sessionKeyData);
    
    // Convert base64 back to Uint8Array
    const credentialDataWithTypedArray = {
      ...credentialData,
      sealEncryptedKey: new Uint8Array(Buffer.from(credentialData.sealEncryptedKey, 'base64'))
    };
    
    const credentials = await credentialManager.retrieveSecureCredentials(
      credentialDataWithTypedArray,
      sessionKey
    );

    if (!credentials) {
      return NextResponse.json(
        { error: 'Failed to decrypt credentials' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      credentials
    });
  } catch (error) {
    console.error('Secure credential retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve secure credentials' },
      { status: 500 }
    );
  }
}