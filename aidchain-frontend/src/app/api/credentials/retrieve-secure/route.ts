import { NextRequest, NextResponse } from 'next/server';
import { SealCredentialManager } from '@/lib/seal-credential-manager';

export async function POST(request: NextRequest) {
  try {
    const { 
      credentialData, 
      userAddress,
      zkLoginKeypair,
      packageId 
    } = await request.json();

    if (!credentialData || !userAddress || !zkLoginKeypair || !packageId) {
      return NextResponse.json(
        { error: 'Missing required fields: credentialData, userAddress, zkLoginKeypair, packageId' },
        { status: 400 }
      );
    }

    const credentialManager = new SealCredentialManager(packageId);
    
    // Fix: Use the correct method signature with 3 parameters
    const credentials = await credentialManager.retrieveSecureCredentials(
      credentialData,
      userAddress,
      zkLoginKeypair
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