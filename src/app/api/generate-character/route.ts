import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { proxyReplicateUrl } from '@/utils/cdnProxy';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { characterName, description, prompt, style, aspectRatio, modelConfig, imageModelConfig } = await request.json();

    if (!characterName || !prompt) {
      return NextResponse.json(
        { error: 'Character name and prompt are required' },
        { status: 400 }
      );
    }

    // Generate character reference image with consistent style
    const fullPrompt = `${style} style character design: ${prompt}.
Full body character sheet, front view, clean white background,
professional character design, highly detailed, consistent style,
consistent proportions and height, accurate body measurements,
character turnaround reference, character model sheet`;

    console.log(`Generating character: ${characterName}`);

    // Use configured model or default to flux-schnell
    const modelId = modelConfig?.modelId || 'black-forest-labs/flux-schnell';
    // Try to get API key from: 1) modelConfig, 2) imageModelConfig (shared), 3) env
    const apiKey = modelConfig?.apiKey || imageModelConfig?.apiKey || process.env.REPLICATE_API_TOKEN;

    console.log(`Using model: ${modelId}`);
    console.log(`API key source: ${modelConfig?.apiKey ? 'modelConfig' : imageModelConfig?.apiKey ? 'imageModelConfig' : 'env'}`);

    const customReplicate = new Replicate({ auth: apiKey });

    const output = await customReplicate.run(
      modelId as any,
      {
        input: {
          prompt: fullPrompt,
          aspect_ratio: aspectRatio || '1:1',
          output_format: 'png',
          output_quality: 90,
        },
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    const proxiedUrl = proxyReplicateUrl(imageUrl as string);

    console.log(`Character generated: ${characterName}`);

    return NextResponse.json({
      characterName,
      imageUrl: proxiedUrl,
      description,
      prompt
    });
  } catch (error: any) {
    console.error('Character generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate character' },
      { status: 500 }
    );
  }
}
