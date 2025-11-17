import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { proxyReplicateUrl } from '@/utils/cdnProxy';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Generate scene image with character consistency
 * Uses character reference images to maintain consistency
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, style, aspectRatio, characterReferences, modelConfig } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build enhanced prompt with character descriptions
    let enhancedPrompt = `${style} style: ${prompt}`;

    // Check if we have character reference images
    const hasCharacterRefs = characterReferences && Object.keys(characterReferences).length > 0;
    const firstCharacterRef = hasCharacterRefs ? Object.values(characterReferences)[0] : null;
    const hasReferenceImage = firstCharacterRef && (firstCharacterRef as any).referenceImageUrl;

    // Use model from settings or fallback to default
    let modelId = modelConfig?.modelId || 'black-forest-labs/flux-schnell';

    console.log(`Generating image with character consistency using model: ${modelId}`);
    console.log(`Has character references: ${hasCharacterRefs}, Has reference image: ${hasReferenceImage}`);

    // If we have character reference images, use Ideogram Character for best consistency
    if (hasReferenceImage) {
      try {
        console.log('Using Ideogram Character for character consistency');

        // Build prompt for Ideogram Character
        if (hasCharacterRefs) {
          const characterDescs = Object.entries(characterReferences)
            .map(([name, ref]: [string, any]) => {
              return `${name}: ${ref.prompt || ref.description}`;
            })
            .join('. ');

          enhancedPrompt = `${style} style: ${prompt}. Characters: ${characterDescs}. Maintain character appearance and height consistency.`;
        }

        const output = await replicate.run(
          'ideogram-ai/ideogram-character:5e79783fdb5bb4b1bf267212e64bb28a60cd3bdde00fbf6a1be28df0f55cc4b7' as any,
          {
            input: {
              prompt: enhancedPrompt,
              character_reference_image: (firstCharacterRef as any).referenceImageUrl,
              aspect_ratio: aspectRatio || '16:9',
              style_type: style.toLowerCase().includes('realistic') ? 'Realistic' : 'Fiction',
              magic_prompt_option: 'On', // Enhance prompt for better results
            },
          }
        );

        const imageUrl = Array.isArray(output) ? output[0] : output;
        const proxiedUrl = proxyReplicateUrl(imageUrl as string);

        return NextResponse.json({
          imageUrl: proxiedUrl,
          modelUsed: 'ideogram-ai/ideogram-character',
        });
      } catch (ideogramError: any) {
        console.error('Ideogram Character failed, falling back to standard generation:', ideogramError.message);
        // Fall through to standard generation
      }
    }

    // Fallback: Standard text-to-image generation with enhanced prompt
    if (hasCharacterRefs) {
      const characterDescs = Object.entries(characterReferences)
        .map(([name, ref]: [string, any]) => {
          return `${name}: ${ref.prompt || ref.description}`;
        })
        .join('. ');

      enhancedPrompt = `${style} style: ${prompt}. Characters: ${characterDescs}.
Maintain consistent character appearance, facial features, clothing, and height throughout all scenes.`;
    }

    const output = await replicate.run(
      modelId as any,
      {
        input: {
          prompt: enhancedPrompt,
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
    console.error('Image generation with character error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
