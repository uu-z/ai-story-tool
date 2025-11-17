'use client';

import { observer } from 'mobx-react-lite';
import { settingsStore } from '@/stores/SettingsStore';
import { useState } from 'react';
import { TOP_TEXT_MODELS, TOP_IMAGE_MODELS, TOP_VIDEO_MODELS } from '@/config/models';

const SettingsPanel = observer(() => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video' | 'audio' | 'general' | 'subtitle' | 'export' | 'advanced'>('text');

  if (!settingsStore.isSettingsOpen) return null;

  const handleClose = () => {
    settingsStore.toggleSettings();
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      settingsStore.resetToDefaults();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">⚙️ Settings</h2>
            <p className="text-sm text-gray-400 mt-1">Configure AI models and preferences</p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-6 overflow-x-auto">
          {[
            { key: 'text', label: '🤖 Text Models', icon: '' },
            { key: 'image', label: '🎨 Image Models', icon: '' },
            { key: 'video', label: '🎬 Video Models', icon: '' },
            { key: 'audio', label: '🎙️ Audio/Voice', icon: '' },
            { key: 'subtitle', label: '💬 Subtitles', icon: '' },
            { key: 'export', label: '📤 Export', icon: '' },
            { key: 'advanced', label: '🔧 Advanced', icon: '' },
            { key: 'general', label: '⚡ General', icon: '' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 font-medium transition border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'text' && <TextModelSettings />}
          {activeTab === 'image' && <ImageModelSettings />}
          {activeTab === 'video' && <VideoModelSettings />}
          {activeTab === 'audio' && <AudioSettings />}
          {activeTab === 'subtitle' && <SubtitleSettings />}
          {activeTab === 'export' && <ExportSettings />}
          {activeTab === 'advanced' && <AdvancedSettings />}
          {activeTab === 'general' && <GeneralSettings />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800 bg-gray-800/50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
});

// Text Model Settings Tab
const TextModelSettings = observer(() => {
  const { textModel } = settingsStore.settings;

  // Categorized model lists from hardcoded config
  const RECOMMENDED_TEXT_MODELS = {
    'Top Quality': TOP_TEXT_MODELS.topQuality,
    'Best Value': TOP_TEXT_MODELS.bestValue,
    'Fastest': TOP_TEXT_MODELS.fastest,
    'Free': TOP_TEXT_MODELS.free,
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold">Story Generation Model</h3>
          <p className="text-sm text-gray-400 mt-1">
            Selected top text generation models (Updated 2025-01-05)
          </p>
        </div>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium mb-2">Provider</label>
        <select
          value={textModel.provider}
          onChange={(e) =>
            settingsStore.updateTextModel({ provider: e.target.value as any })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
        >
          <option value="openrouter">OpenRouter (Curated popular models)</option>
        </select>
      </div>

      {/* Model Selection - Categorized */}
      <div>
        <label className="block text-sm font-medium mb-2">Model (Grouped by category)</label>
        <select
          value={textModel.modelId}
          onChange={(e) => settingsStore.updateTextModel({ modelId: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
        >
          {Object.entries(RECOMMENDED_TEXT_MODELS).map(([category, modelList]) => (
            <optgroup key={category} label={`━━━ ${category} ━━━`}>
              {modelList.map((model: any) => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing.prompt * 1000).toFixed(3)}/1K tok • {model.description}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">
          💡 Recommended: Claude Haiku 4.5 (Fast) | Claude 3.5 Sonnet (Top Quality) | Gemini 2.5 Pro (Free)
        </p>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium mb-2">
          OpenRouter API Key
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs text-blue-400 hover:underline"
          >
            Get Key →
          </a>
        </label>
        <input
          type="password"
          value={textModel.apiKey}
          onChange={(e) => settingsStore.updateTextModel({ apiKey: e.target.value })}
          placeholder="sk-or-..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your API key is stored locally and never sent to our servers
        </p>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Temperature: {textModel.temperature?.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={textModel.temperature || 0.7}
          onChange={(e) =>
            settingsStore.updateTextModel({ temperature: parseFloat(e.target.value) })
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Deterministic</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <label className="block text-sm font-medium mb-2">Max Tokens</label>
        <input
          type="number"
          value={textModel.maxTokens || 4000}
          onChange={(e) =>
            settingsStore.updateTextModel({ maxTokens: parseInt(e.target.value) })
          }
          min="1000"
          max="32000"
          step="1000"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
        />
      </div>
    </div>
  );
});

// Image Model Settings Tab
const ImageModelSettings = observer(() => {
  const { imageModel, characterImageModel } = settingsStore.settings;

  return (
    <div className="space-y-8">
      {/* Shot Image Model */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold">Shot Image Generation</h3>
          <p className="text-sm text-gray-400">
            Selected top Replicate image models (Updated 2025-01-05)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select
            value={imageModel.provider}
            onChange={(e) =>
              settingsStore.updateImageModel({ provider: e.target.value as any })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <option value="replicate">Replicate (Curated popular models)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Model (Sorted by popularity - {TOP_IMAGE_MODELS.length} models)
          </label>
          <select
            value={imageModel.modelId}
            onChange={(e) => settingsStore.updateImageModel({ modelId: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
            size={8}
          >
            {TOP_IMAGE_MODELS.map((model: any) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.quality} - {model.speed} - {model.cost} ({(model.runs / 1000000).toFixed(1)}M runs)
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            💡 Recommended: FLUX 1.1 Pro (Ultimate quality) | FLUX Schnell (Fast & cheap) | Recraft V3 (Text rendering)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Replicate API Key
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-xs text-blue-400 hover:underline"
            >
              Get Key →
            </a>
          </label>
          <input
            type="password"
            value={imageModel.apiKey}
            onChange={(e) => settingsStore.updateImageModel({ apiKey: e.target.value })}
            placeholder="r8_..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          />
        </div>
      </div>

      {/* Character Image Model */}
      <div className="space-y-4 pt-8 border-t border-gray-800">
        <div>
          <h3 className="text-lg font-bold">Character Reference Generation</h3>
          <p className="text-sm text-gray-400">
            Character reference image generation models (usually choose fast, high-quality models)
          </p>
          <p className="text-xs text-blue-400 mt-1">
            💡 API Key shared with the shot image model above
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select
            value={characterImageModel.provider}
            onChange={(e) =>
              settingsStore.updateCharacterImageModel({ provider: e.target.value as any })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <option value="replicate">Replicate (Curated popular models)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Model (Shared list with shot images)
          </label>
          <select
            value={characterImageModel.modelId}
            onChange={(e) => settingsStore.updateCharacterImageModel({ modelId: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
            size={8}
          >
            {TOP_IMAGE_MODELS.map((model: any) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.quality} - {model.speed} - {model.cost} ({(model.runs / 1000000).toFixed(1)}M runs)
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            💡 Recommended for character references: FLUX Schnell (Fast) | FLUX 1.1 Pro (High quality) | Ideogram V3 (Detailed)
          </p>
        </div>
      </div>
    </div>
  );
});

// Video Model Settings Tab
const VideoModelSettings = observer(() => {
  const { videoModel } = settingsStore.settings;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold">Video Animation Model</h3>
          <p className="text-sm text-gray-400 mt-1">
            Selected top Replicate image-to-video models (Updated 2025-01-05)
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Provider</label>
        <select
          value={videoModel.provider}
          onChange={(e) =>
            settingsStore.updateVideoModel({ provider: e.target.value as any })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="replicate">Replicate (Curated popular models)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Model (Sorted by popularity - {TOP_VIDEO_MODELS.length} models)
        </label>
        <select
          value={videoModel.modelId}
          onChange={(e) => settingsStore.updateVideoModel({ modelId: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          size={10}
        >
          {TOP_VIDEO_MODELS.map((model: any) => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.quality} - {model.speed} - {model.cost} ({(model.runs / 1000000).toFixed(1)}M runs)
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">
          💡 Recommended: Kling v2.1 (Popular) | LTX Video (Ultra-fast 10s) | Veo 3.1 (Highest quality) | Stable Video (Stable)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Replicate API Key
          <a
            href="https://replicate.com/account/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs text-blue-400 hover:underline"
          >
            Get Key →
          </a>
        </label>
        <input
          type="password"
          value={videoModel.apiKey}
          onChange={(e) => settingsStore.updateVideoModel({ apiKey: e.target.value })}
          placeholder="r8_..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        />
      </div>
    </div>
  );
});

// Audio Settings Tab
const AudioSettings = observer(() => {
  const { voiceModel } = settingsStore.settings;

  const OPENAI_VOICES = [
    { id: 'alloy', name: 'Alloy (Neutral)' },
    { id: 'echo', name: 'Echo (Male)' },
    { id: 'fable', name: 'Fable (British Male)' },
    { id: 'onyx', name: 'Onyx (Deep Male)' },
    { id: 'nova', name: 'Nova (Female)' },
    { id: 'shimmer', name: 'Shimmer (Soft Female)' },
  ];

  const ELEVENLABS_VOICES = [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Friendly Female)' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Calm Female)' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Strong Female)' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Well-Rounded Male)' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Crisp Male)' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Deep Male)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">Text-to-Speech Configuration</h3>
        <p className="text-sm text-gray-400 mb-4">
          Configure voice generation for shot narration
        </p>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium mb-2">TTS Provider</label>
        <select
          value={voiceModel.provider}
          onChange={(e) =>
            settingsStore.updateVoiceModel({ provider: e.target.value as any })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
        >
          <option value="openai">OpenAI TTS</option>
          <option value="elevenlabs">ElevenLabs</option>
        </select>
      </div>

      {/* OpenAI Settings */}
      {voiceModel.provider === 'openai' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Voice</label>
            <select
              value={voiceModel.voiceId}
              onChange={(e) => settingsStore.updateVoiceModel({ voiceId: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              {OPENAI_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              value={voiceModel.model || 'tts-1'}
              onChange={(e) => settingsStore.updateVoiceModel({ model: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="tts-1">TTS-1 (Faster)</option>
              <option value="tts-1-hd">TTS-1 HD (Higher Quality)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Speed: {voiceModel.speed?.toFixed(2) || '1.00'}
            </label>
            <input
              type="range"
              min="0.25"
              max="4.0"
              step="0.25"
              value={voiceModel.speed || 1.0}
              onChange={(e) =>
                settingsStore.updateVoiceModel({ speed: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.25x</span>
              <span>1.0x (Normal)</span>
              <span>4.0x</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              OpenAI API Key
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs text-blue-400 hover:underline"
              >
                Get Key →
              </a>
            </label>
            <input
              type="password"
              value={voiceModel.apiKey}
              onChange={(e) => settingsStore.updateVoiceModel({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>
        </>
      )}

      {/* ElevenLabs Settings */}
      {voiceModel.provider === 'elevenlabs' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Voice</label>
            <select
              value={voiceModel.voiceId}
              onChange={(e) => settingsStore.updateVoiceModel({ voiceId: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              {ELEVENLABS_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Or enter a custom voice ID from ElevenLabs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Stability: {voiceModel.stability?.toFixed(2) || '0.50'}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceModel.stability || 0.5}
              onChange={(e) =>
                settingsStore.updateVoiceModel({ stability: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower = more varied, Higher = more consistent
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Similarity Boost: {voiceModel.similarityBoost?.toFixed(2) || '0.75'}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceModel.similarityBoost || 0.75}
              onChange={(e) =>
                settingsStore.updateVoiceModel({ similarityBoost: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              How closely to follow the original voice
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              ElevenLabs API Key
              <a
                href="https://elevenlabs.io/api"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs text-blue-400 hover:underline"
              >
                Get Key →
              </a>
            </label>
            <input
              type="password"
              value={voiceModel.apiKey}
              onChange={(e) => settingsStore.updateVoiceModel({ apiKey: e.target.value })}
              placeholder="sk_..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>
        </>
      )}

      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm">
        <strong>💡 Cost Comparison:</strong>
        <ul className="mt-2 space-y-1 text-blue-300">
          <li>• OpenAI TTS-1: $0.015 / 1K characters (~$0.003 per shot)</li>
          <li>• OpenAI TTS-1 HD: $0.030 / 1K characters (~$0.006 per shot)</li>
          <li>• ElevenLabs: Free tier 10K chars/month, then paid plans</li>
        </ul>
      </div>
    </div>
  );
});

// Subtitle Settings Tab
const SubtitleSettings = observer(() => {
  const { subtitleSettings } = settingsStore.settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">Subtitle Styling</h3>
        <p className="text-sm text-gray-400 mb-4">
          Customize how subtitles appear in preview and exported videos
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Font Size</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="12"
            max="48"
            value={subtitleSettings.fontSize}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ fontSize: parseInt(e.target.value) })
            }
            className="flex-1"
          />
          <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded w-16 text-center">
            {subtitleSettings.fontSize}px
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Font Color</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={subtitleSettings.fontColor}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ fontColor: e.target.value })
            }
            className="w-20 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={subtitleSettings.fontColor}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ fontColor: e.target.value })
            }
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono"
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Background Color</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={subtitleSettings.backgroundColor}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ backgroundColor: e.target.value })
            }
            className="w-20 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={subtitleSettings.backgroundColor}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ backgroundColor: e.target.value })
            }
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Background Opacity</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={subtitleSettings.backgroundOpacity}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ backgroundOpacity: parseFloat(e.target.value) })
            }
            className="flex-1"
          />
          <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded w-16 text-center">
            {(subtitleSettings.backgroundOpacity * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Subtitle Position</label>
        <select
          value={subtitleSettings.position}
          onChange={(e) =>
            settingsStore.updateSubtitleSettings({ position: e.target.value as any })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Outline Width</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="5"
            value={subtitleSettings.outlineWidth}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ outlineWidth: parseInt(e.target.value) })
            }
            className="flex-1"
          />
          <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded w-16 text-center">
            {subtitleSettings.outlineWidth}px
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Outline Color</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={subtitleSettings.outlineColor}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ outlineColor: e.target.value })
            }
            className="w-20 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={subtitleSettings.outlineColor}
            onChange={(e) =>
              settingsStore.updateSubtitleSettings({ outlineColor: e.target.value })
            }
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-bold mb-3">Preview</h4>
        <div
          className="relative bg-gray-900 rounded aspect-video flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <div
            className={`px-6 py-3 rounded-lg text-center max-w-3xl absolute ${
              subtitleSettings.position === 'top' ? 'top-8' :
              subtitleSettings.position === 'center' ? 'top-1/2 -translate-y-1/2' :
              'bottom-8'
            }`}
            style={{
              backgroundColor: subtitleSettings.backgroundColor,
              opacity: subtitleSettings.backgroundOpacity,
            }}
          >
            <p
              className="font-medium leading-relaxed"
              style={{
                fontSize: `${subtitleSettings.fontSize}px`,
                color: subtitleSettings.fontColor,
                textShadow: `${subtitleSettings.outlineWidth}px ${subtitleSettings.outlineWidth}px ${subtitleSettings.outlineWidth * 2}px ${subtitleSettings.outlineColor}`,
              }}
            >
              This is a subtitle preview
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Export Settings Tab
const ExportSettings = observer(() => {
  const { exportSettings } = settingsStore.settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">Video Export Settings</h3>
        <p className="text-sm text-gray-400 mb-4">
          Configure quality and format options for exported videos
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Video Quality</label>
        <select
          value={exportSettings.quality}
          onChange={(e) =>
            settingsStore.updateExportSettings({ quality: e.target.value as any })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="low">Low (Fast, smaller files)</option>
          <option value="medium">Medium (Balanced)</option>
          <option value="high">High (Recommended)</option>
          <option value="ultra">Ultra (Slow, larger files)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          {exportSettings.quality === 'low' && 'CRF 28 - Fast encoding for previews'}
          {exportSettings.quality === 'medium' && 'CRF 23 - Good balance between quality and file size'}
          {exportSettings.quality === 'high' && 'CRF 20 - High quality, recommended for final output'}
          {exportSettings.quality === 'ultra' && 'CRF 18 - Near lossless quality'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Video Resolution</label>
        <select
          value={exportSettings.resolution || 'original'}
          onChange={(e) =>
            settingsStore.updateExportSettings({ resolution: e.target.value as any })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="original">Original (Recommended)</option>
          <option value="1080p">1080p (1920x1080)</option>
          <option value="720p">720p (1280x720)</option>
          <option value="480p">480p (854x480)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Lower resolution reduces file size but decreases quality
        </p>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <div>
            <p className="font-medium">Include Subtitles by Default</p>
            <p className="text-sm text-gray-400 mt-1">
              Burn subtitles into video by default when exporting
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={exportSettings.includeSubtitles}
              onChange={(e) =>
                settingsStore.updateExportSettings({ includeSubtitles: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
          </label>
        </div>
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm">
        <strong>💡 Tips:</strong>
        <ul className="mt-2 space-y-1 text-blue-300">
          <li>• High quality is best for final published videos</li>
          <li>• Medium quality offers good balance for most cases</li>
          <li>• Lowering resolution significantly reduces file size</li>
          <li>• Burned subtitles become permanent part of the video</li>
        </ul>
      </div>
    </div>
  );
});

// Advanced Settings Tab
const AdvancedSettings = observer(() => {
  const { advancedSettings } = settingsStore.settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">Advanced Settings</h3>
        <p className="text-sm text-gray-400 mb-4">
          Configure advanced application behavior options
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Parallel Generation Limit
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="10"
            value={advancedSettings.parallelGenerationLimit}
            onChange={(e) =>
              settingsStore.updateAdvancedSettings({
                parallelGenerationLimit: parseInt(e.target.value)
              })
            }
            className="flex-1"
          />
          <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded w-16 text-center">
            {advancedSettings.parallelGenerationLimit}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Maximum number of shots to generate simultaneously. Higher values are faster but use more resources
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Retry Attempts
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="5"
            value={advancedSettings.retryAttempts}
            onChange={(e) =>
              settingsStore.updateAdvancedSettings({
                retryAttempts: parseInt(e.target.value)
              })
            }
            className="flex-1"
          />
          <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded w-16 text-center">
            {advancedSettings.retryAttempts}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Number of automatic retries when generation fails. 0 means no retries
        </p>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-4">
          <div>
            <p className="font-medium">Enable Auto-Save</p>
            <p className="text-sm text-gray-400 mt-1">
              Automatically save project to browser storage periodically
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={advancedSettings.autoSaveEnabled}
              onChange={(e) =>
                settingsStore.updateAdvancedSettings({ autoSaveEnabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
          </label>
        </div>

        {advancedSettings.autoSaveEnabled && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Auto-Save Interval (minutes)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="30"
                value={advancedSettings.autoSaveInterval}
                onChange={(e) =>
                  settingsStore.updateAdvancedSettings({
                    autoSaveInterval: parseInt(e.target.value)
                  })
                }
                className="flex-1"
              />
              <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded w-16 text-center">
                {advancedSettings.autoSaveInterval}m
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-sm">
        <strong>⚠️ Warning:</strong>
        <ul className="mt-2 space-y-1 text-yellow-300">
          <li>• Higher parallel limits may trigger API rate limits</li>
          <li>• Auto-save uses browser storage with limited capacity</li>
          <li>• Changing these settings may affect application performance</li>
        </ul>
      </div>
    </div>
  );
});

// General Settings Tab
const GeneralSettings = observer(() => {
  const { defaultStyle, defaultAspectRatio, enableAudio } = settingsStore.settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">Default Values</h3>
        <p className="text-sm text-gray-400 mb-4">
          Set default values for new stories
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Default Visual Style</label>
        <select
          value={defaultStyle}
          onChange={(e) =>
            settingsStore.updateGeneralSettings({ defaultStyle: e.target.value })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="3D Cartoon">3D Cartoon</option>
          <option value="Anime">Anime</option>
          <option value="Realistic">Realistic</option>
          <option value="Pixar Style">Pixar Style</option>
          <option value="Oil Painting">Oil Painting</option>
          <option value="Watercolor">Watercolor</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Default Aspect Ratio</label>
        <select
          value={defaultAspectRatio}
          onChange={(e) =>
            settingsStore.updateGeneralSettings({ defaultAspectRatio: e.target.value })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="9:16">9:16 (Vertical)</option>
          <option value="1:1">1:1 (Square)</option>
          <option value="4:3">4:3 (Standard)</option>
        </select>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <h3 className="text-lg font-bold mb-4">Audio/Voice Features</h3>
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <div>
            <p className="font-medium">Enable Audio Generation</p>
            <p className="text-sm text-gray-400 mt-1">
              Generate voice narration for shot subtitles using TTS
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableAudio}
              onChange={(e) =>
                settingsStore.updateGeneralSettings({ enableAudio: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <h3 className="text-lg font-bold mb-4">API Key Security</h3>
        <div className="p-4 bg-gray-800 rounded-lg text-sm space-y-2">
          <p className="text-gray-300">
            ✓ All API keys are stored locally in your browser's localStorage
          </p>
          <p className="text-gray-300">
            ✓ Keys are never sent to our servers
          </p>
          <p className="text-gray-300">
            ✓ Keys are only used directly with OpenRouter and Replicate APIs
          </p>
          <p className="text-gray-400 mt-4">
            Clear your browser data to remove all stored keys.
          </p>
        </div>
      </div>
    </div>
  );
});

export default SettingsPanel;
