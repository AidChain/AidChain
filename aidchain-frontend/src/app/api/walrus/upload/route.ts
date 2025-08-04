import { NextRequest, NextResponse } from 'next/server';
import { walrusClient } from '@/lib/walrus-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const epochs = parseInt(formData.get('epochs') as string) || 5;
    const deletable = formData.get('deletable') === 'true';
    const sendObjectTo = formData.get('sendObjectTo') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const result = await walrusClient.storeBlob(file, {
      epochs,
      deletable,
      sendObjectTo,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to Walrus' },
      { status: 500 }
    );
  }
}