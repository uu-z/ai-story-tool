import { makeAutoObservable } from 'mobx';

export type ModelProvider = 'openrouter' | 'replicate' | 'openai' | 'elevenlabs';

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface VoiceConfig {
  provider: 'openai' | 'elevenlabs';
  apiKey: string;
  voiceId: string;
  model?: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
}

export interface SubtitleSettings {
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'top' | 'center' | 'bottom';
  outlineWidth: number;
  outlineColor: string;
}

export interface ExportSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution?: '480p' | '720p' | '1080p' | 'original';
  includeSubtitles: boolean;
}

export interface AdvancedSettings {
  parallelGenerationLimit: number;
  retryAttempts: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // in minutes
}

export interface Settings {
  // Text Generation Models
  textModel: ModelConfig;

  // Image Generation Models
  imageModel: ModelConfig;
  characterImageModel: ModelConfig;

  // Video Generation Models
  videoModel: ModelConfig;

  // Voice/Audio Generation
  voiceModel: VoiceConfig;

  // General Settings
  defaultStyle: string;
  defaultAspectRatio: string;
  enableAudio: boolean;

  // Subtitle Settings
  subtitleSettings: SubtitleSettings;

  // Export Settings
  exportSettings: ExportSettings;

  // Advanced Settings
  advancedSettings: AdvancedSettings;
}

const DEFAULT_SETTINGS: Settings = {
  textModel: {
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.1-405b-instruct',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 4000,
  },
  imageModel: {
    provider: 'replicate',
    modelId: 'tencent/hunyuan-image-3',
    apiKey: '',
  },
  characterImageModel: {
    provider: 'replicate',
    modelId: 'tencent/hunyuan-image-3',
    apiKey: '',
  },
  videoModel: {
    provider: 'replicate',
    modelId: 'bytedance/seedance-1-lite',
    apiKey: '',
  },
  voiceModel: {
    provider: 'openai',
    apiKey: '',
    voiceId: 'alloy',
    model: 'tts-1',
    speed: 1.0,
  },
  defaultStyle: '3D Cartoon',
  defaultAspectRatio: '16:9',
  enableAudio: true,
  subtitleSettings: {
    fontSize: 24,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.8,
    position: 'bottom',
    outlineWidth: 2,
    outlineColor: '#000000',
  },
  exportSettings: {
    quality: 'high',
    resolution: 'original',
    includeSubtitles: true,
  },
  advancedSettings: {
    parallelGenerationLimit: 3,
    retryAttempts: 2,
    autoSaveEnabled: false,
    autoSaveInterval: 5,
  },
};

class SettingsStore {
  settings: Settings = { ...DEFAULT_SETTINGS };
  isSettingsOpen = false;

  constructor() {
    makeAutoObservable(this);
    this.loadSettings();
  }

  // Load settings from localStorage
  loadSettings() {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('open-story-video-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }

  // Save settings to localStorage
  saveSettings() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('open-story-video-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  // Update text model config
  updateTextModel(updates: Partial<ModelConfig>) {
    this.settings.textModel = { ...this.settings.textModel, ...updates };
    this.saveSettings();
  }

  // Update image model config
  updateImageModel(updates: Partial<ModelConfig>) {
    this.settings.imageModel = { ...this.settings.imageModel, ...updates };
    this.saveSettings();
  }

  // Update character image model config
  updateCharacterImageModel(updates: Partial<ModelConfig>) {
    this.settings.characterImageModel = { ...this.settings.characterImageModel, ...updates };
    this.saveSettings();
  }

  // Update video model config
  updateVideoModel(updates: Partial<ModelConfig>) {
    this.settings.videoModel = { ...this.settings.videoModel, ...updates };
    this.saveSettings();
  }

  // Update voice model config
  updateVoiceModel(updates: Partial<VoiceConfig>) {
    this.settings.voiceModel = { ...this.settings.voiceModel, ...updates };
    this.saveSettings();
  }

  // Update general settings
  updateGeneralSettings(updates: { defaultStyle?: string; defaultAspectRatio?: string; enableAudio?: boolean }) {
    if (updates.defaultStyle) this.settings.defaultStyle = updates.defaultStyle;
    if (updates.defaultAspectRatio) this.settings.defaultAspectRatio = updates.defaultAspectRatio;
    if (updates.enableAudio !== undefined) this.settings.enableAudio = updates.enableAudio;
    this.saveSettings();
  }

  // Update subtitle settings
  updateSubtitleSettings(updates: Partial<SubtitleSettings>) {
    this.settings.subtitleSettings = { ...this.settings.subtitleSettings, ...updates };
    this.saveSettings();
  }

  // Update export settings
  updateExportSettings(updates: Partial<ExportSettings>) {
    this.settings.exportSettings = { ...this.settings.exportSettings, ...updates };
    this.saveSettings();
  }

  // Update advanced settings
  updateAdvancedSettings(updates: Partial<AdvancedSettings>) {
    this.settings.advancedSettings = { ...this.settings.advancedSettings, ...updates };
    this.saveSettings();
  }

  // Toggle settings panel
  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  // Reset to defaults
  resetToDefaults() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  // Get API key for specific model type
  getApiKey(modelType: 'text' | 'image' | 'characterImage' | 'video'): string {
    const modelMap = {
      text: this.settings.textModel,
      image: this.settings.imageModel,
      characterImage: this.settings.characterImageModel,
      video: this.settings.videoModel,
    };

    return modelMap[modelType].apiKey || process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || '';
  }

  // Validate settings
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if at least one API key is configured
    const hasTextKey = this.settings.textModel.apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    const hasImageKey = this.settings.imageModel.apiKey || process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN;

    if (!hasTextKey) {
      errors.push('Text model API key is missing');
    }
    if (!hasImageKey) {
      errors.push('Image model API key is missing');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const settingsStore = new SettingsStore();
