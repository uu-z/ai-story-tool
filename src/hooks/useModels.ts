import { useState, useEffect, useCallback } from 'react';

interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricingPrompt: number;
  pricingCompletion: number;
  modality: string;
  maxTokens?: number;
}

interface ReplicateModel {
  id: string;
  owner: string;
  name: string;
  description: string;
  category: string;
  runs: number;
  url: string;
  speed?: string;
  quality?: string;
  cost?: string;
  resolution?: string;
  features?: string[];
}

interface OpenRouterModels {
  topQuality: OpenRouterModel[];
  bestValue: OpenRouterModel[];
  fastest: OpenRouterModel[];
  all: OpenRouterModel[];
}

interface ReplicateModels {
  image: ReplicateModel[];
  video: ReplicateModel[];
}

interface UseModelsReturn<T> {
  models: T | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
  cacheAge: number | null;
  refresh: () => Promise<void>;
}

export function useOpenRouterModels(): UseModelsReturn<OpenRouterModels> {
  const [models, setModels] = useState<OpenRouterModels | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const fetchModels = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = forceRefresh
        ? '/api/models/openrouter?refresh=true'
        : '/api/models/openrouter';

      const res = await fetch(url);

      if (!res.ok) throw new Error('Failed to fetch OpenRouter models');

      const data = await res.json();

      if (data.success) {
        setModels(data.models);
        setCached(data.cached || false);
        setCacheAge(data.cacheAge || null);
      } else {
        throw new Error(data.error || 'Failed to load models');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchModels(true);
  }, [fetchModels]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, cached, cacheAge, refresh };
}

export function useReplicateModels(
  category?: 'image' | 'video' | 'all'
): UseModelsReturn<ReplicateModels | ReplicateModel[]> {
  const [models, setModels] = useState<ReplicateModels | ReplicateModel[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const fetchModels = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (category && category !== 'all') {
          params.set('category', category);
        }
        if (forceRefresh) {
          params.set('refresh', 'true');
        }

        const url = `/api/models/replicate${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('Failed to fetch Replicate models');

        const data = await res.json();

        if (data.success) {
          setModels(data.models);
          setCached(data.cached || false);
          setCacheAge(data.cacheAge || null);
        } else {
          throw new Error(data.error || 'Failed to load models');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [category]
  );

  const refresh = useCallback(async () => {
    await fetchModels(true);
  }, [fetchModels]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, cached, cacheAge, refresh };
}

// Hook to get cache statistics
export function useCacheStats() {
  const [stats, setStats] = useState<{ size: number; keys: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/models/cache');
      if (!res.ok) throw new Error('Failed to fetch cache stats');

      const data = await res.json();
      if (data.success) {
        setStats(data.cache);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async (key?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = key ? `/api/models/cache?key=${key}` : '/api/models/cache';
      const res = await fetch(url, { method: 'DELETE' });

      if (!res.ok) throw new Error('Failed to clear cache');

      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, fetchStats, clearCache };
}
