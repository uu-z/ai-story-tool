import { NextRequest, NextResponse } from 'next/server';

const FFMPEG_SERVICE_URL = process.env.FFMPEG_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, audioUrl, volume } = await request.json();

    if (!videoUrl || !audioUrl) {
      return NextResponse.json(
        { error: 'videoUrl and audioUrl are required' },
        { status: 400 }
      );
    }

    // Call FFmpeg service to add audio
    const response = await fetch(`${FFMPEG_SERVICE_URL}/add-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl, audioUrl, volume }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add audio');
    }

    // Get video buffer
    const videoBuffer = await response.arrayBuffer();

    // Return video file
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="video-with-audio-${Date.now()}.mp4"`,
      },
    });
  } catch (error: any) {
    console.error('Audio mixing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add audio' },
      { status: 500 }
    );
  }
}
