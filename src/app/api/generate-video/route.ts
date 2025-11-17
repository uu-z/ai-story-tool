import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { proxyReplicateUrl } from '@/utils/cdnProxy';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const DEFAULT_MODEL = 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438';

// Known working image-to-video models with their specific parameters
// Based on https://replicate.com/collections/image-to-video
const MODEL_CONFIGS: Record<string, any> = {
  'stability-ai/stable-video-diffusion': {
    input_image: true,
    params: {
      motion_bucket_id: 127,
      cond_aug: 0.02,
      video_length: "25_frames_with_svd_xt", // 25 frames for ~5 seconds
      sizing_strategy: 'maintain_aspect_ratio',
      frames_per_second: 6,
    }
  },
  'lightricks/ltx-video': {
    image: true,
    prompt_required: true,
    params: {
      prompt: 'Animate this image with smooth, natural camera motion',
      num_frames: 161, // 5 seconds at 32 fps (default fps for ltx-video)
      num_inference_steps: 30,
    }
  },
  'google/veo': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      aspect_ratio: '16:9',
      prompt: 'Animate this image with smooth, natural motion',
    }
  },
  'wan-video/wan': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion',
    }
  },
  'minimax/hailuo': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion',
    }
  },
  'minimax/video-01': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion',
    },
  },
  'bytedance/seedance': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion, cinematic camera movement',
    },
  },
  'bytedance/seedance-1-lite': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion, cinematic camera movement',
    },
  },
  'kwaivgi/kling': {
    image: true,
    prompt_required: true, // Kling needs both image and prompt
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion', // Default prompt
    }
  },
  'luma/ray': {
    image: true,
    prompt_required: true,
    params: {
      extend: false,
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion',
    }
  },
  'luma/modify-video': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion',
    },
  },
  'fofr/tooncrafter': {
    image: true,
    params: {
      duration: 5,
    },
  },
  'open-mmlab/pia': {
    image: true,
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion',
    },
  },
};

function getModelConfig(modelId: string) {
  // Try exact match first
  for (const [key, config] of Object.entries(MODEL_CONFIGS)) {
    if (modelId.includes(key)) {
      return config;
    }
  }

  // Default config for unknown models - ensure 5 second duration
  return {
    input_image: true,
    image: true, // Try both
    prompt_required: true,
    params: {
      duration: 5,
      prompt: 'Animate this image with smooth, natural motion',
      motion_bucket_id: 127,
      frames_per_second: 6,
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, modelConfig } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log(`Starting video generation with image URL: ${imageUrl.substring(0, 80)}...`);

    // Use model from settings or fallback to default
    let modelId = modelConfig?.modelId || DEFAULT_MODEL;

    console.log(`Generating video with model: ${modelId}`);

    // Get model-specific configuration
    const config = getModelConfig(modelId);

    // Build input object
    const input: any = { ...config.params };

    // Add image parameter based on model requirements
    if (config.input_image) {
      input.input_image = imageUrl;
    }
    if (config.image) {
      input.image = imageUrl;
    }

    // Some models need both image and prompt - ensure prompt is included
    // The prompt is already in config.params if defined

    try {
      // Try with configured model
      const output = await replicate.run(
        modelId as any,
        { input }
      );

      const proxiedUrl = proxyReplicateUrl(output as any);

      return NextResponse.json({
        videoUrl: proxiedUrl,
        modelUsed: modelId,
      });
    } catch (modelError: any) {
      console.error(`Error with model ${modelId}:`, modelError.message);

      // Check if error is due to expired image URL (404)
      const is404Error = modelError.message && (
        modelError.message.includes('404') ||
        modelError.message.includes('Not Found')
      );

      if (is404Error) {
        console.error('Image URL has expired (404 error)');
        return NextResponse.json(
          { error: 'Image URL has expired. Please go back to Storyboard and regenerate the image (click 🔄 Regenerate), then try again.' },
          { status: 400 }
        );
      }

      // If model fails and it's not the default, retry with default
      if (modelId !== DEFAULT_MODEL) {
        console.log(`Retrying with default model: ${DEFAULT_MODEL}`);

        try {
          const defaultConfig = getModelConfig(DEFAULT_MODEL);
          const defaultInput: any = { ...defaultConfig.params };

          // Add image parameter for fallback model
          if (defaultConfig.input_image) {
            defaultInput.input_image = imageUrl;
          }
          if (defaultConfig.image) {
            defaultInput.image = imageUrl;
          }

          const output = await replicate.run(
            DEFAULT_MODEL as any,
            { input: defaultInput }
          );

          const proxiedUrl = proxyReplicateUrl(output as any);

          return NextResponse.json({
            videoUrl: proxiedUrl,
            modelUsed: DEFAULT_MODEL,
            warning: `Original model failed, used fallback: ${DEFAULT_MODEL}`,
          });
        } catch (fallbackError: any) {
          // Check if fallback also failed due to 404
          const isFallback404 = fallbackError.message && (
            fallbackError.message.includes('404') ||
            fallbackError.message.includes('Not Found')
          );

          if (isFallback404) {
            return NextResponse.json(
              { error: 'Image URL has expired. Please go back to Storyboard and regenerate the image (click 🔄 Regenerate), then try again.' },
              { status: 400 }
            );
          }

          throw fallbackError;
        }
      } else {
        throw modelError;
      }
    }
  } catch (error: any) {
    console.error('Video generation error:', error);

    // One more check for 404 at top level
    const is404Error = error.message && (
      error.message.includes('404') ||
      error.message.includes('Not Found')
    );

    if (is404Error) {
      return NextResponse.json(
        { error: 'Image URL has expired. Please go back to Storyboard and regenerate the image (click 🔄 Regenerate), then try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
