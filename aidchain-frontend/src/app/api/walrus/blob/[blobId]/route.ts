import { NextRequest, NextResponse } from 'next/server';
import { walrusClient } from '@/lib/walrus-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { blobId: string } }
) {
  try {
    const { blobId } = params;
    
    if (!blobId) {
      return NextResponse.json(
        { error: 'Blob ID is required' },
        { status: 400 }
      );
    }

    const blobData = await walrusClient.retrieveBlob(blobId);

    return new NextResponse(blobData, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year since blobs are immutable
      },
    });
  } catch (error) {
    console.error('Retrieve error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve blob from Walrus' },
      { status: 500 }
    );
  }
}