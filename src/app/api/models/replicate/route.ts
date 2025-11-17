import { NextResponse } from 'next/server';
import { modelCache } from '@/lib/modelCache';

export const runtime = 'edge';

const CACHE_KEY_PREFIX = 'replicate_models';
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

interface ReplicateAPIModel {
  url: string;
  owner: string;
  name: string;
  description: string;
  visibility: string;
  github_url: string | null;
  paper_url: string | null;
  license_url: string | null;
  run_count: number;
  cover_image_url: string | null;
  default_example: any;
  latest_version: {
    id: string;
    created_at: string;
    cog_version: string;
    openapi_schema: any;
  } | null;
}

interface ProcessedModel {
  id: string;
  owner: string;
  name: string;
  description: string;
  category: 'image' | 'video' | 'audio' | 'text' | 'other';
  runs: number;
  url: string;
}

async function fetchAllReplicateModels(): Promise<ReplicateAPIModel[]> {
  const allModels: ReplicateAPIModel[] = [];
  let nextCursor: string | null = null;
  const maxPages = 20; // Limit to prevent infinite loops
  let pageCount = 0;

  try {
    do {
      const url: string = nextCursor
        ? `https://api.replicate.com/v1/models?cursor=${nextCursor}`
        : 'https://api.replicate.com/v1/models';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Replicate API error:', response.status, response.statusText);
        break;
      }

      const data = await response.json();

      if (data.results && Array.isArray(data.results)) {
        allModels.push(...data.results);
      }

      nextCursor = data.next;
      pageCount++;

      // Break if we've reached max pages or no more results
      if (!nextCursor || pageCount >= maxPages) {
        break;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (nextCursor);

    console.log(`Fetched ${allModels.length} models from Replicate`);
    return allModels;
  } catch (error) {
    console.error('Error fetching Replicate models:', error);
    return allModels; // Return what we got so far
  }
}

function categorizeModel(model: ReplicateAPIModel): 'image' | 'video' | 'audio' | 'text' | 'other' {
  const name = model.name.toLowerCase();
  const desc = (model.description || '').toLowerCase();
  const combined = `${name} ${desc}`;

  // Video generation models (check first to avoid image-to-video being classified as image)
  if (
    combined.includes('video') ||
    combined.includes('image-to-video') ||
    combined.includes('img2vid') ||
    combined.includes('i2v') ||
    combined.includes('animate') ||
    combined.includes('animation') ||
    combined.includes('motion') ||
    combined.includes('movie') ||
    name.includes('vid') ||
    name.includes('svd') ||
    name.includes('mochi') ||
    name.includes('ltx') ||
    name.includes('hunyuan') ||
    name.includes('kling') ||
    name.includes('runway') ||
    combined.includes('luma') ||
    combined.includes('pika')
  ) {
    return 'video';
  }

  // Audio models (check before text to avoid TTS being classified as text)
  if (
    combined.includes('audio') ||
    combined.includes('speech') ||
    combined.includes('voice') ||
    combined.includes('music') ||
    combined.includes('sound') ||
    combined.includes('tts') ||
    combined.includes('whisper') ||
    combined.includes('elevenlabs')
  ) {
    return 'audio';
  }

  // Text/LLM models
  if (
    combined.includes('llm') ||
    combined.includes('gpt') ||
    combined.includes('llama') ||
    combined.includes('mistral') ||
    combined.includes('gemma') ||
    combined.includes('qwen') ||
    combined.includes('language model') ||
    (combined.includes('text') && !combined.includes('text-to-image'))
  ) {
    return 'text';
  }

  // Image generation models (check last)
  if (
    combined.includes('text-to-image') ||
    combined.includes('txt2img') ||
    combined.includes('flux') ||
    combined.includes('sdxl') ||
    combined.includes('stable-diffusion') ||
    combined.includes('dalle') ||
    combined.includes('midjourney') ||
    combined.includes('recraft') ||
    combined.includes('ideogram') ||
    name.includes('img') ||
    name.includes('image') ||
    name.includes('picture') ||
    name.includes('photo') ||
    combined.includes('imagen') ||
    combined.includes('firefly')
  ) {
    return 'image';
  }

  return 'other';
}

function processModels(models: ReplicateAPIModel[]): {
  image: ProcessedModel[];
  video: ProcessedModel[];
} {
  const processed: ProcessedModel[] = models.map(model => ({
    id: `${model.owner}/${model.name}`,
    owner: model.owner,
    name: model.name,
    description: model.description || 'No description',
    category: categorizeModel(model),
    runs: model.run_count || 0,
    url: model.url,
  }));

  // Filter and sort by popularity
  const imageModels = processed
    .filter(m => m.category === 'image')
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 50); // Top 50 image models

  // Official image-to-video models from Replicate collection
  // https://replicate.com/collections/image-to-video
  const OFFICIAL_I2V_MODELS = [
    'google/veo-3.1-fast', 'google/veo-3.1', 'google/veo-3',
    'wan-video/wan-2.5-i2v-fast', 'wan-video/wan-2.5-i2v',
    'wavespeedai/wan-2.1-i2v-480p', 'wavespeedai/wan-2.1-i2v-720p',
    'minimax/hailuo-2.3', 'minimax/hailuo-2.3-fast', 'minimax/hailuo-02', 'minimax/video-01',
    'bytedance/seedance-1-pro-fast', 'bytedance/seedance-1-pro', 'bytedance/seedance-1-lite',
    'kwaivgi/kling-v2.5-turbo-pro', 'kwaivgi/kling-v2.1',
    'luma/modify-video', 'luma/ray-2-720p', 'luma/ray',
    'lightricks/ltx-video',
    'stability-ai/stable-video-diffusion',
    'fofr/tooncrafter',
    'open-mmlab/pia',
  ];

  // Filter video models - only keep official image-to-video models
  const videoModels = processed
    .filter(m => {
      // Check if it's in the official list
      return OFFICIAL_I2V_MODELS.some(officialId => m.id.includes(officialId));
    })
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 30); // Top 30 image-to-video models

  console.log(`Categorized models: ${imageModels.length} images, ${videoModels.length} videos`);
  console.log('Top 5 video models:', videoModels.slice(0, 5).map(m => `${m.id} (${m.runs} runs)`));

  return {
    image: imageModels,
    video: videoModels,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'image' | 'video' | null;
    const forceRefresh = searchParams.get('refresh') === 'true';

    const cacheKey = `${CACHE_KEY_PREFIX}_all`;

    // Check cache first
    if (!forceRefresh) {
      const cached = modelCache.get(cacheKey);
      if (cached) {
        const age = modelCache.getAge(cacheKey);

        let result: any;
        if (category === 'image') {
          result = (cached as any).image;
        } else if (category === 'video') {
          result = (cached as any).video;
        } else {
          result = cached;
        }

        return NextResponse.json({
          success: true,
          models: result,
          cached: true,
          cacheAge: age,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if API token is available
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'REPLICATE_API_TOKEN not configured',
        note: 'Please set REPLICATE_API_TOKEN in environment variables',
      }, { status: 500 });
    }

    // Fetch fresh data
    const allModels = await fetchAllReplicateModels();

    if (allModels.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No models fetched from Replicate',
      }, { status: 500 });
    }

    const categorized = processModels(allModels);

    // Cache the result
    modelCache.set(cacheKey, categorized, CACHE_TTL);

    let result;
    if (category === 'image') {
      result = categorized.image;
    } else if (category === 'video') {
      result = categorized.video;
    } else {
      result = categorized;
    }

    return NextResponse.json({
      success: true,
      models: result,
      cached: false,
      totalFetched: allModels.length,
      imageModels: categorized.image.length,
      videoModels: categorized.video.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in Replicate models API:', error);

    // Try to return cached data
    const cacheKey = `${CACHE_KEY_PREFIX}_all`;
    const cached = modelCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        models: cached,
        cached: true,
        cacheAge: modelCache.getAge(cacheKey),
        warning: 'Using cached data due to error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch models',
      },
      { status: 500 }
    );
  }
}
