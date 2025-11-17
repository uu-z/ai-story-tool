import { NextResponse } from 'next/server';
import { modelCache } from '@/lib/modelCache';

export const runtime = 'edge';

export async function GET() {
  try {
    const stats = modelCache.getStats();

    return NextResponse.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      modelCache.clear(key);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for key: ${key}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      modelCache.clear();
      return NextResponse.json({
        success: true,
        message: 'All cache cleared',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
