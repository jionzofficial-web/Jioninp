import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';

export async function GET() {
  try {
    // Try to get authentication parameters to verify credentials
    const authParams = imagekit.getAuthenticationParameters();

    // Also try to list files to verify API access (limit 1)
    const files = await new Promise((resolve, reject) => {
      imagekit.listFiles({
        limit: 1,
      }, function (error, result) {
        if (error) reject(error);
        else resolve(result);
      });
    });

    return NextResponse.json({
      status: 'success',
      message: 'ImageKit connected successfully',
      authParams: { ...authParams, signature: '***' }, // Hide signature for security
      filesFound: files.length
    });
  } catch (error) {
    console.error('ImageKit connection error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'ImageKit connection failed',
      error: error.message
    }, { status: 500 });
  }
}
