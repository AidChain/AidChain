import { NextRequest, NextResponse } from 'next/server';
import { SealCredentialManager } from '@/lib/seal-credential-manager';

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      credentials,
      userAddress,
      credentialType,
      packageId,
    } = await request.json();

    // Validate required fields
    if (!userId || !credentials || !userAddress || !packageId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: userId, credentials, userAddress, packageId',
        },
        { status: 400 }
      );
    }

    console.log('🔍 API: Storing secure credentials:', {
      userId,
      userAddress,
      credentialType: credentialType || 'debit_card',
      packageId,
      credentialsKeys: Object.keys(credentials),
    });

    const credentialManager = new SealCredentialManager(packageId);

    // ✅ This now returns simplified SecureCredentialData (without sealEncryptedKey)
    const secureCredentialData = await credentialManager.storeSecureCredentials(
      userId,
      credentials,
      userAddress,
      credentialType || 'debit_card'
    );

    console.log('✅ API: Credentials stored successfully:', {
      walrusBlobId: secureCredentialData.walrusBlobId,
      policyId: secureCredentialData.policyId,
      packageId: secureCredentialData.packageId,
    });

    // ✅ Return the simplified credential data (no sealEncryptedKey field)
    return NextResponse.json({
      success: true,
      credentialData: {
        userId: secureCredentialData.userId,
        credentialType: secureCredentialData.credentialType,
        walrusBlobId: secureCredentialData.walrusBlobId,
        accessLevel: secureCredentialData.accessLevel,
        createdAt: secureCredentialData.createdAt,
        packageId: secureCredentialData.packageId,
        policyId: secureCredentialData.policyId,
      },
      message: 'Credentials encrypted with Seal and stored on Walrus successfully',
    });
  } catch (error) {
    console.error('❌ API: Store secure credentials error:', error);

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const isWalrusError = errorMessage.includes('Walrus') || errorMessage.includes('blob');
    const isSealError = errorMessage.includes('Seal') || errorMessage.includes('encrypt');
    const isSizeError = errorMessage.includes('too large') || errorMessage.includes('1MB');

    let statusCode = 500;
    let userFriendlyMessage = 'Failed to store secure credentials';

    if (isSizeError) {
      statusCode = 413; // Payload Too Large
      userFriendlyMessage = 'Credential data is too large for storage';
    } else if (isWalrusError) {
      userFriendlyMessage = 'Failed to store data on Walrus network';
    } else if (isSealError) {
      userFriendlyMessage = 'Failed to encrypt credentials with Seal';
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: statusCode }
    );
  }
}