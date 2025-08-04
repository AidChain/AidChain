import { NextRequest, NextResponse } from 'next/server';
import { walrusClient } from '@/lib/walrus-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const epochs = parseInt(formData.get('epochs') as string) || 5;
    const deletable = formData.get('deletable') === 'true';
    const sendObjectTo = formData.get('sendObjectTo') as string;

    // Extract files and their metadata
    const files: Array<{ identifier: string; file: File; tags?: Record<string, string> }> = [];
    const metadataString = formData.get('metadata') as string;
    const metadata = metadataString ? JSON.parse(metadataString) : {};

    // Process all form entries
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key !== 'metadata') {
        files.push({
          identifier: key,
          file: value,
          tags: metadata[key] || undefined,
        });
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const result = await walrusClient.storeQuilt(files, {
      epochs,
      deletable,
      sendObjectTo,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Quilt upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files to Walrus as quilt' },
      { status: 500 }
    );
  }
}