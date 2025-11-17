import { NextResponse } from 'next/server';
import { modelCache } from '@/lib/modelCache';

export const runtime = 'edge';

const CACHE_KEY = 'openrouter_models';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: string;
    completion_tokens?: string;
  };
}

interface ProcessedModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricingPrompt: number;
  pricingCompletion: number;
  modality: string;
  maxTokens?: number;
}

async function fetchOpenRouterModels(): Promise<ProcessedModel[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch models from OpenRouter');
  }

  const data = await response.json();
  const models = data.data || [];

  // Filter and process models
  const processedModels = models
    .filter((model: OpenRouterModel) => {
      const id = model.id.toLowerCase();
      return (
        !id.includes('free') &&
        !id.includes('preview') &&
        !id.includes('extended') &&
        !id.includes(':free') &&
        model.pricing &&
        parseFloat(model.pricing.prompt) > 0
      );
    })
    .map((model: OpenRouterModel) => ({
      id: model.id,
      name: model.name,
      provider: model.id.split('/')[0],
      contextLength: model.context_length || 0,
      pricingPrompt: parseFloat(model.pricing.prompt),
      pricingCompletion: parseFloat(model.pricing.completion),
      modality: model.architecture?.modality || 'text',
      maxTokens: model.top_provider?.max_completion_tokens,
    }));

  return processedModels;
}

function categorizeModels(models: ProcessedModel[]) {
  // Sort by value score (balance of price and context)
  const sortedModels = [...models].sort((a, b) => {
    const scoreA = a.pricingPrompt * 1000000 + (100000 / a.contextLength);
    const scoreB = b.pricingPrompt * 1000000 + (100000 / b.contextLength);
    return scoreA - scoreB;
  });

  return {
    topQuality: sortedModels
      .filter((m) =>
        m.id.includes('claude-3') ||
        m.id.includes('gpt-4') ||
        (m.provider === 'google' && m.id.includes('gemini-exp')) ||
        (m.provider === 'google' && m.id.includes('gemini-2.0-flash-exp'))
      )
      .slice(0, 8),

    bestValue: sortedModels
      .filter((m) =>
        m.pricingPrompt < 0.000001 &&
        m.contextLength >= 32000 &&
        !m.id.includes('free')
      )
      .slice(0, 8),

    fastest: sortedModels
      .filter((m) =>
        m.pricingPrompt < 0.0000005 &&
        !m.id.includes('free')
      )
      .slice(0, 8),

    all: sortedModels.slice(0, 100),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check cache first
    if (!forceRefresh) {
      const cached = modelCache.get(CACHE_KEY);
      if (cached) {
        const age = modelCache.getAge(CACHE_KEY);
        return NextResponse.json({
          success: true,
          models: cached,
          cached: true,
          cacheAge: age,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Fetch fresh data
    const models = await fetchOpenRouterModels();
    const categorized = categorizeModels(models);

    // Cache the result
    modelCache.set(CACHE_KEY, categorized, CACHE_TTL);

    return NextResponse.json({
      success: true,
      models: categorized,
      cached: false,
      totalModels: models.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching OpenRouter models:', error);

    // Try to return cached data even if fetch fails
    const cached = modelCache.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        success: true,
        models: cached,
        cached: true,
        cacheAge: modelCache.getAge(CACHE_KEY),
        warning: 'Using cached data due to fetch error',
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
