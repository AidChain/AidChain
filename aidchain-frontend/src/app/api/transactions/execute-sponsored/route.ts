import { NextRequest, NextResponse } from 'next/server';
import { enokiBackend } from '@/lib/enoki-backend';

export async function POST(request: NextRequest) {
  try {
    const { digest, signature } = await request.json();

    if (!digest || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: digest, signature' },
        { status: 400 }
      );
    }

    console.log('🔍 Executing sponsored transaction:', { digest });

    const result = await enokiBackend.executeSponsoredTransaction({
      digest,
      signature
    });

    console.log('✅ Sponsored transaction executed:', result);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('❌ Sponsored transaction execution failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute sponsored transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}