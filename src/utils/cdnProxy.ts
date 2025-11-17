/**
 * Proxy Replicate URLs through BunnyCDN for permanent caching
 * This prevents files from expiring and improves loading performance
 *
 * BunnyCDN Image Optimization: https://docs.bunny.net/docs/stream-image-processing
 */

const REPLICATE_DELIVERY_DOMAIN = 'replicate.delivery';
const CDN_PROXY_DOMAIN = 'replicateproxy.b-cdn.net';

// Default optimization settings for different use cases
const DEFAULT_OPTIMIZATION = {
  thumbnail: { width: 400, quality: 75 },
  preview: { width: 800, quality: 80 },
  full: { width: 1920, quality: 85 },
};

/**
 * Convert a Replicate delivery URL to use BunnyCDN proxy
 * @param url - Original Replicate URL
 * @param options - Optional optimization parameters
 * @returns Proxied URL through BunnyCDN with automatic optimizations
 */
export function proxyReplicateUrl(
  url: string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    autoOptimize?: boolean; // Default true - auto apply webp/compression
  }
): string | undefined {
  if (!url) return undefined;

  try {
    // Check if URL contains replicate.delivery
    if (url.includes(REPLICATE_DELIVERY_DOMAIN)) {
      // Replace domain with CDN proxy
      let proxiedUrl = url.replace(REPLICATE_DELIVERY_DOMAIN, CDN_PROXY_DOMAIN);

      // Check if URL is a video file (skip optimization for videos)
      const isVideo = /\.(mp4|webm|mov)$/i.test(proxiedUrl);

      if (!isVideo) {
        // Auto-optimize images by default
        const shouldOptimize = options?.autoOptimize !== false;

        if (shouldOptimize || options?.width || options?.quality) {
          const params = new URLSearchParams();

          // BunnyCDN Image Optimization Parameters
          // Reference: https://docs.bunny.net/docs/stream-image-processing

          // Resize width
          if (options?.width) {
            params.append('width', options.width.toString());
          }

          // Resize height
          if (options?.height) {
            params.append('height', options.height.toString());
          }

          // Quality (1-100, default 80)
          const quality = options?.quality || (shouldOptimize ? 80 : undefined);
          if (quality) {
            params.append('quality', quality.toString());
          }

          // Auto WebP conversion for better compression
          if (shouldOptimize) {
            params.append('format', 'webp');
          }

          // Aspect ratio fit mode (maintain original aspect ratio)
          if (options?.width || options?.height) {
            params.append('aspect_ratio', '16:9');
          }

          // Add optimization params to URL
          if (params.toString()) {
            proxiedUrl += `?${params.toString()}`;
          }
        }
      }

      console.log(`Proxied URL: ${url.substring(0, 50)}... -> ${proxiedUrl.substring(0, 70)}...`);
      return proxiedUrl;
    }

    // Return original URL if not from Replicate
    return url;
  } catch (error) {
    console.error('Failed to proxy URL:', error);
    return url;
  }
}

/**
 * Batch convert multiple URLs
 * @param urls - Array of URLs
 * @returns Array of proxied URLs
 */
export function proxyReplicateUrls(urls: (string | null | undefined)[]): (string | undefined)[] {
  return urls.map(proxyReplicateUrl as any);
}

/**
 * Get optimized thumbnail URL for faster loading in lists/grids
 * @param url - Original URL
 * @param width - Thumbnail width (default: 400px)
 * @returns Optimized thumbnail URL with WebP and compression
 */
export function getThumbnailUrl(url: string | null | undefined, width: number = 400): string | undefined {
  return proxyReplicateUrl(url, {
    width,
    quality: 75,
    autoOptimize: true,
  });
}

/**
 * Get preview quality URL for modal/lightbox display
 * @param url - Original URL
 * @param width - Preview width (default: 1200px)
 * @returns Optimized preview URL
 */
export function getPreviewUrl(url: string | null | undefined, width: number = 1200): string | undefined {
  return proxyReplicateUrl(url, {
    width,
    quality: 85,
    autoOptimize: true,
  });
}

/**
 * Get original quality URL (still converts to WebP for compression)
 * @param url - Original URL
 * @returns Original size with WebP compression
 */
export function getOriginalUrl(url: string | null | undefined): string | undefined {
  return proxyReplicateUrl(url, {
    quality: 90,
    autoOptimize: true,
  });
}

/**
 * Migrate a story object to use CDN proxy URLs
 * Converts all imageUrl, animationUrl, audioUrl, and referenceImageUrl
 * @param story - Story object
 * @returns Story object with proxied URLs
 */
export function migrateStoryToCDN(story: any): any {
  if (!story) return story;

  const migratedStory = { ...story };

  // Convert character reference images
  if (migratedStory.characters) {
    migratedStory.characters = migratedStory.characters.map((char: any) => ({
      ...char,
      referenceImageUrl: char.referenceImageUrl ? proxyReplicateUrl(char.referenceImageUrl) : char.referenceImageUrl,
    }));
  }

  // Convert scene shots
  if (migratedStory.scenes) {
    migratedStory.scenes = migratedStory.scenes.map((scene: any) => ({
      ...scene,
      shots: scene.shots?.map((shot: any) => ({
        ...shot,
        imageUrl: shot.imageUrl ? proxyReplicateUrl(shot.imageUrl) : shot.imageUrl,
        animationUrl: shot.animationUrl ? proxyReplicateUrl(shot.animationUrl) : shot.animationUrl,
        // audioUrl is not from Replicate, so we don't proxy it
      })) || [],
    }));
  }

  return migratedStory;
}
