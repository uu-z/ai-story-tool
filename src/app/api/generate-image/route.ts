import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { proxyReplicateUrl } from '@/utils/cdnProxy';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, aspectRatio, modelConfig } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Use model from settings or fallback to default
    const modelId = modelConfig?.modelId || 'black-forest-labs/flux-schnell';

    console.log(`Generating image with model: ${modelId}`);

    // Using configured model for image generation
    const output = await replicate.run(
      modelId as any,
      {
        input: {
          prompt: `${style} style: ${prompt}`,
          aspect_ratio: aspectRatio || '16:9',
          output_format: 'png',
          output_quality: 80,
        },
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    const proxiedUrl = proxyReplicateUrl(imageUrl as string);

    return NextResponse.json({
      imageUrl: proxiedUrl,
      modelUsed: modelId,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
