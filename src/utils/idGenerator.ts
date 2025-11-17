/**
 * Utility for generating unique IDs for scenes and shots
 */

/**
 * Generate a unique ID using timestamp and random string
 * Format: prefix-timestamp-random
 * Example: scene-1234567890123-a1b2c3
 */
function generateUniqueId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique scene ID
 */
export function generateSceneId(): string {
  return generateUniqueId('scene');
}

/**
 * Generate a unique shot ID
 */
export function generateShotId(): string {
  return generateUniqueId('shot');
}

/**
 * Add unique IDs to a story object (scenes and shots)
 * Only generates new IDs if they don't already exist
 */
export function addIdsToStory(story: any): any {
  return {
    ...story,
    scenes: story.scenes?.map((scene: any) => ({
      ...scene,
      id: scene.id || generateSceneId(), // Keep existing ID if present
      shots: scene.shots?.map((shot: any) => ({
        ...shot,
        id: shot.id || generateShotId(), // Keep existing ID if present
      })) || [],
    })) || [],
  };
}
