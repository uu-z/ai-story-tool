/**
 * OpenRouter API Integration
 * Support for various LLM models through OpenRouter
 * Model list updated with Top 50 popular models
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenRouter(
  apiKey: string,
  request: OpenRouterRequest
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '',
      'X-Title': 'Open AI Story Tool',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenRouter API request failed');
  }

  const data: OpenRouterResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenRouter');
  }

  return data.choices[0].message.content;
}

// Top 50 Popular OpenRouter Models
export const OPENROUTER_MODELS = {
  // === Top Tier - Best Quality ===

  // Google DeepMind
  'gemini-pro-1.5': {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    contextLength: 2000000,
    pricing: { prompt: 0.00000125, completion: 0.000005 },
    description: '2M context, best for long documents',
  },
  'gemini-flash-1.5': {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    provider: 'Google',
    contextLength: 1000000,
    pricing: { prompt: 0.000000075, completion: 0.0000003 },
    description: 'Ultra fast, 1M context',
  },
  'gemini-flash-1.5-8b': {
    id: 'google/gemini-flash-1.5-8b',
    name: 'Gemini Flash 1.5 8B',
    provider: 'Google',
    contextLength: 1000000,
    pricing: { prompt: 0.0000000375, completion: 0.00000015 },
    description: 'Smallest, fastest Gemini',
  },

  // Anthropic Claude
  'claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextLength: 200000,
    pricing: { prompt: 0.000003, completion: 0.000015 },
    description: 'Best overall, creative and analytical',
  },
  'claude-3.5-sonnet-20241022': {
    id: 'anthropic/claude-3.5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet (Latest)',
    provider: 'Anthropic',
    contextLength: 200000,
    pricing: { prompt: 0.000003, completion: 0.000015 },
    description: 'Latest version with improvements',
  },
  'claude-3.5-haiku': {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    contextLength: 200000,
    pricing: { prompt: 0.0000008, completion: 0.000004 },
    description: 'Fast and cheap Claude',
  },
  'claude-3-opus': {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    contextLength: 200000,
    pricing: { prompt: 0.000015, completion: 0.000075 },
    description: 'Most powerful Claude model',
  },
  'claude-3-sonnet': {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    contextLength: 200000,
    pricing: { prompt: 0.000003, completion: 0.000015 },
    description: 'Balanced performance',
  },
  'claude-3-haiku': {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    contextLength: 200000,
    pricing: { prompt: 0.00000025, completion: 0.00000125 },
    description: 'Fastest Claude',
  },

  // OpenAI GPT
  'gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextLength: 128000,
    pricing: { prompt: 0.0000025, completion: 0.00001 },
    description: 'Multimodal, fast and smart',
  },
  'gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    contextLength: 128000,
    pricing: { prompt: 0.00000015, completion: 0.0000006 },
    description: 'Affordable GPT-4 class',
  },
  'gpt-4-turbo': {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    contextLength: 128000,
    pricing: { prompt: 0.00001, completion: 0.00003 },
    description: 'Previous generation flagship',
  },
  'gpt-4': {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    contextLength: 8192,
    pricing: { prompt: 0.00003, completion: 0.00006 },
    description: 'Original GPT-4',
  },
  'gpt-3.5-turbo': {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    contextLength: 16385,
    pricing: { prompt: 0.0000005, completion: 0.0000015 },
    description: 'Fast and cheap',
  },
  'o1': {
    id: 'openai/o1',
    name: 'OpenAI o1',
    provider: 'OpenAI',
    contextLength: 200000,
    pricing: { prompt: 0.000015, completion: 0.00006 },
    description: 'Reasoning model, slow but smart',
  },
  'o1-mini': {
    id: 'openai/o1-mini',
    name: 'OpenAI o1-mini',
    provider: 'OpenAI',
    contextLength: 128000,
    pricing: { prompt: 0.000003, completion: 0.000012 },
    description: 'Faster reasoning model',
  },

  // Meta Llama
  'llama-3.3-70b': {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0.00000055, completion: 0.00000055 },
    description: 'Latest Llama, excellent value',
  },
  'llama-3.1-405b': {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0.000003, completion: 0.000003 },
    description: 'Largest open model',
  },
  'llama-3.1-70b': {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0.00000052, completion: 0.00000052 },
    description: 'Best value open model',
  },
  'llama-3.1-8b': {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0.00000006, completion: 0.00000006 },
    description: 'Tiny and fast',
  },
  'llama-3.2-90b-vision': {
    id: 'meta-llama/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0.0000009, completion: 0.0000009 },
    description: 'Multimodal Llama',
  },
  'llama-3.2-3b': {
    id: 'meta-llama/llama-3.2-3b-instruct',
    name: 'Llama 3.2 3B Instruct',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0.00000006, completion: 0.00000006 },
    description: 'Ultra lightweight',
  },
  'llama-3.2-1b': {
    id: 'meta-llama/llama-3.2-1b-instruct',
    name: 'Llama 3.2 1B Instruct',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0.00000004, completion: 0.00000004 },
    description: 'Smallest Llama',
  },

  // === Specialized Models ===

  // Mistral AI
  'mistral-large': {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    contextLength: 128000,
    pricing: { prompt: 0.000002, completion: 0.000006 },
    description: 'Flagship Mistral model',
  },
  'mistral-medium': {
    id: 'mistralai/mistral-medium',
    name: 'Mistral Medium',
    provider: 'Mistral',
    contextLength: 32000,
    pricing: { prompt: 0.0000027, completion: 0.0000081 },
    description: 'Balanced Mistral',
  },
  'mistral-small': {
    id: 'mistralai/mistral-small',
    name: 'Mistral Small',
    provider: 'Mistral',
    contextLength: 32000,
    pricing: { prompt: 0.000001, completion: 0.000003 },
    description: 'Compact Mistral',
  },
  'mistral-nemo': {
    id: 'mistralai/mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'Mistral',
    contextLength: 128000,
    pricing: { prompt: 0.0000003, completion: 0.0000003 },
    description: '12B efficient model',
  },
  'codestral': {
    id: 'mistralai/codestral',
    name: 'Codestral',
    provider: 'Mistral',
    contextLength: 32000,
    pricing: { prompt: 0.000001, completion: 0.000003 },
    description: 'Specialized for coding',
  },
  'pixtral-12b': {
    id: 'mistralai/pixtral-12b',
    name: 'Pixtral 12B',
    provider: 'Mistral',
    contextLength: 128000,
    pricing: { prompt: 0.00000015, completion: 0.00000015 },
    description: 'Multimodal 12B',
  },

  // DeepSeek
  'deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    contextLength: 64000,
    pricing: { prompt: 0.00000014, completion: 0.00000028 },
    description: 'Chinese model, very cheap',
  },
  'deepseek-coder': {
    id: 'deepseek/deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    contextLength: 64000,
    pricing: { prompt: 0.00000014, completion: 0.00000028 },
    description: 'Coding specialist',
  },

  // Cohere
  'command-r-plus': {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    contextLength: 128000,
    pricing: { prompt: 0.000003, completion: 0.000015 },
    description: 'RAG optimized',
  },
  'command-r': {
    id: 'cohere/command-r',
    name: 'Command R',
    provider: 'Cohere',
    contextLength: 128000,
    pricing: { prompt: 0.00000015, completion: 0.0000006 },
    description: 'Fast RAG model',
  },

  // Qwen
  'qwen-2.5-72b': {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'Qwen',
    contextLength: 128000,
    pricing: { prompt: 0.00000036, completion: 0.00000036 },
    description: 'Alibaba flagship',
  },
  'qwen-2.5-7b': {
    id: 'qwen/qwen-2.5-7b-instruct',
    name: 'Qwen 2.5 7B',
    provider: 'Qwen',
    contextLength: 128000,
    pricing: { prompt: 0.00000009, completion: 0.00000009 },
    description: 'Compact Chinese model',
  },
  'qwq-32b': {
    id: 'qwen/qwq-32b-preview',
    name: 'QwQ 32B Preview',
    provider: 'Qwen',
    contextLength: 32000,
    pricing: { prompt: 0.00000009, completion: 0.00000009 },
    description: 'Reasoning focused',
  },

  // xAI
  'grok-2': {
    id: 'x-ai/grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    contextLength: 32000,
    pricing: { prompt: 0.000002, completion: 0.00001 },
    description: 'Elon Musk AI',
  },
  'grok-2-vision': {
    id: 'x-ai/grok-2-vision',
    name: 'Grok 2 Vision',
    provider: 'xAI',
    contextLength: 8000,
    pricing: { prompt: 0.000002, completion: 0.00001 },
    description: 'Multimodal Grok',
  },

  // Perplexity
  'perplexity-sonar-pro': {
    id: 'perplexity/sonar-pro',
    name: 'Sonar Pro',
    provider: 'Perplexity',
    contextLength: 128000,
    pricing: { prompt: 0.000003, completion: 0.000015 },
    description: 'With search capabilities',
  },
  'perplexity-sonar': {
    id: 'perplexity/sonar',
    name: 'Sonar',
    provider: 'Perplexity',
    contextLength: 128000,
    pricing: { prompt: 0.000001, completion: 0.000001 },
    description: 'Fast with search',
  },

  // Other Notable Models
  'phi-4': {
    id: 'microsoft/phi-4',
    name: 'Phi-4',
    provider: 'Microsoft',
    contextLength: 16000,
    pricing: { prompt: 0.0000001, completion: 0.0000001 },
    description: 'Small but capable',
  },
  'nous-hermes-3': {
    id: 'nousresearch/hermes-3-llama-3.1-405b',
    name: 'Nous Hermes 3 405B',
    provider: 'Nous Research',
    contextLength: 128000,
    pricing: { prompt: 0.000003, completion: 0.000003 },
    description: 'Fine-tuned Llama',
  },
  'dolphin-mixtral': {
    id: 'cognitivecomputations/dolphin-mixtral-8x22b',
    name: 'Dolphin Mixtral 8x22B',
    provider: 'Cognitive Computations',
    contextLength: 64000,
    pricing: { prompt: 0.0000009, completion: 0.0000009 },
    description: 'Uncensored MoE',
  },
  'gemma-2-27b': {
    id: 'google/gemma-2-27b-it',
    name: 'Gemma 2 27B',
    provider: 'Google',
    contextLength: 8192,
    pricing: { prompt: 0.00000027, completion: 0.00000027 },
    description: 'Open Gemini variant',
  },
  'gemma-2-9b': {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma 2 9B',
    provider: 'Google',
    contextLength: 8192,
    pricing: { prompt: 0.00000008, completion: 0.00000008 },
    description: 'Compact Gemini variant',
  },

  // === Free Models ===
  'llama-3.1-8b-free': {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (Free)',
    provider: 'Meta',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
    description: 'Free tier with limits',
  },
  'gemini-flash-free': {
    id: 'google/gemini-flash-1.5-8b:free',
    name: 'Gemini Flash 8B (Free)',
    provider: 'Google',
    contextLength: 1000000,
    pricing: { prompt: 0, completion: 0 },
    description: 'Free with rate limits',
  },
  'phi-3-free': {
    id: 'microsoft/phi-3-medium-128k-instruct:free',
    name: 'Phi-3 Medium (Free)',
    provider: 'Microsoft',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
    description: 'Free compact model',
  },
};

export type OpenRouterModelKey = keyof typeof OPENROUTER_MODELS;

// Helper to get model categories
export const MODEL_CATEGORIES = {
  'Top Quality': [
    'claude-3.5-sonnet',
    'gpt-4o',
    'gemini-pro-1.5',
    'llama-3.1-405b',
    'claude-3-opus',
  ],
  'Best Value': [
    'llama-3.3-70b',
    'gemini-flash-1.5',
    'claude-3.5-haiku',
    'gpt-4o-mini',
    'llama-3.1-70b',
  ],
  'Fastest': [
    'gemini-flash-1.5-8b',
    'gpt-3.5-turbo',
    'llama-3.2-3b',
    'phi-4',
    'deepseek-chat',
  ],
  'Reasoning': [
    'o1',
    'o1-mini',
    'qwq-32b',
  ],
  'Free Tier': [
    'llama-3.1-8b-free',
    'gemini-flash-free',
    'phi-3-free',
  ],
};
