import { NextRequest, NextResponse } from 'next/server';

const FFMPEG_SERVICE_URL = process.env.FFMPEG_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const { videos, options } = await request.json();

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json(
        { error: 'Videos array is required' },
        { status: 400 }
      );
    }

    // Call FFmpeg service to concatenate videos
    const response = await fetch(`${FFMPEG_SERVICE_URL}/concat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videos, options }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to compose video');
    }

    // Get video buffer
    const videoBuffer = await response.arrayBuffer();

    // Return video file
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="story-${Date.now()}.mp4"`,
      },
    });
  } catch (error: any) {
    console.error('Video composition error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compose video' },
      { status: 500 }
    );
  }
}
