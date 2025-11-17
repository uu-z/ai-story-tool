/**
 * Project Import/Export utilities
 * Handles saving and loading complete project state
 */

import { StoryData } from '@/stores/StoryStore';
import { Settings } from '@/stores/SettingsStore';
import { addIdsToStory } from './idGenerator';

export interface ProjectData {
  version: string;
  timestamp: number;
  story: StoryData;
  currentStep: 'input' | 'review' | 'storyboard' | 'edit';
  settings?: Partial<Settings>; // Optional: save user preferences
  metadata: {
    exportedAt: string;
    appVersion: string;
  };
}

/**
 * Export project to JSON file
 */
export async function exportProject(
  story: StoryData,
  currentStep: 'input' | 'review' | 'storyboard' | 'edit',
  settings?: Partial<Settings>
): Promise<void> {
  // Remove audioUrl from all shots to reduce file size
  const storyWithoutAudio = {
    ...story,
    scenes: story.scenes.map(scene => ({
      ...scene,
      shots: scene.shots.map(shot => {
        const { audioUrl, ...shotWithoutAudio } = shot;
        return shotWithoutAudio;
      })
    }))
  };

  const projectData: ProjectData = {
    version: '1.0.0',
    timestamp: Date.now(),
    story: storyWithoutAudio,
    currentStep,
    settings: settings ? {
      // Only export non-sensitive settings (no API keys)
      defaultStyle: settings.defaultStyle,
      defaultAspectRatio: settings.defaultAspectRatio,
      enableAudio: settings.enableAudio,
      textModel: settings.textModel ? {
        provider: settings.textModel.provider,
        modelId: settings.textModel.modelId,
        temperature: settings.textModel.temperature,
        maxTokens: settings.textModel.maxTokens,
        apiKey: '', // Don't export API keys
      } : undefined,
      imageModel: settings.imageModel ? {
        provider: settings.imageModel.provider,
        modelId: settings.imageModel.modelId,
        apiKey: '',
      } : undefined,
      characterImageModel: settings.characterImageModel ? {
        provider: settings.characterImageModel.provider,
        modelId: settings.characterImageModel.modelId,
        apiKey: '',
      } : undefined,
      videoModel: settings.videoModel ? {
        provider: settings.videoModel.provider,
        modelId: settings.videoModel.modelId,
        apiKey: '',
      } : undefined,
      voiceModel: settings.voiceModel ? {
        provider: settings.voiceModel.provider,
        voiceId: settings.voiceModel.voiceId,
        model: settings.voiceModel.model,
        speed: settings.voiceModel.speed,
        stability: settings.voiceModel.stability,
        similarityBoost: settings.voiceModel.similarityBoost,
        apiKey: '',
      } : undefined,
    } : undefined,
    metadata: {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
    },
  };

  const json = JSON.stringify(projectData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = `${story.title || 'untitled'}-${Date.now()}.open-story-video.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import project from JSON file
 */
export async function importProject(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;

        // Validate project data structure
        if (!data.version || !data.story) {
          throw new Error('Invalid project file format');
        }

        // Version compatibility check
        if (data.version !== '1.0.0') {
          console.warn(`Project version ${data.version} may not be fully compatible`);
        }

        // Validate required story fields
        if (!data.story.title && !data.story.synopsis) {
          throw new Error('Project must have at least a title or synopsis');
        }

        // Regenerate unique IDs for all scenes and shots to avoid conflicts
        const storyWithNewIds = addIdsToStory(data.story);
        data.story = storyWithNewIds as StoryData;

        resolve(data);
      } catch (error: any) {
        reject(new Error(`Failed to parse project file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate if a file is a valid project file
 */
export function isValidProjectFile(filename: string): boolean {
  return filename.endsWith('.open-story-video.json');
}

/**
 * Get project statistics for display
 */
export function getProjectStats(story: StoryData): {
  totalScenes: number;
  totalShots: number;
  shotsWithImages: number;
  shotsWithVideos: number;
  shotsWithAudio: number;
  characterCount: number;
  charactersWithImages: number;
} {
  const totalScenes = story.scenes.length;
  const totalShots = story.scenes.reduce((sum, scene) => sum + scene.shots.length, 0);
  const shotsWithImages = story.scenes.reduce(
    (sum, scene) => sum + scene.shots.filter(shot => shot.imageUrl).length,
    0
  );
  const shotsWithVideos = story.scenes.reduce(
    (sum, scene) => sum + scene.shots.filter(shot => shot.animationUrl).length,
    0
  );
  const shotsWithAudio = story.scenes.reduce(
    (sum, scene) => sum + scene.shots.filter(shot => shot.audioUrl).length,
    0
  );
  const characterCount = story.characters.length;
  const charactersWithImages = story.characters.filter(
    char => char.referenceImageUrl
  ).length;

  return {
    totalScenes,
    totalShots,
    shotsWithImages,
    shotsWithVideos,
    shotsWithAudio,
    characterCount,
    charactersWithImages,
  };
}
