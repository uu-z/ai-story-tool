'use client';

import { observer } from 'mobx-react-lite';
import { storyStore, Shot } from '@/stores/StoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import { useState } from 'react';

const AudioGenerator = observer(() => {
  const [generatingAll, setGeneratingAll] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const generateAudio = async (sceneId: string, shot: Shot) => {
    try {
      const scene = storyStore.story.scenes.find(s => s.id === sceneId);
      if (!scene) return;

      storyStore.setGeneratingAudioShot(sceneId, shot.id, true);

      const { voiceModel } = settingsStore.settings;

      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: shot.subtitle,
          voiceConfig: voiceModel,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      storyStore.updateShot(sceneId, shot.id, {
        audioUrl: data.audioUrl,
        isGeneratingAudio: false,
      });
    } catch (error) {
      console.error('Failed to generate audio:', error);
      storyStore.setGeneratingAudioShot(sceneId, shot.id, false);
      alert('Failed to generate audio. Check console for details.');
    }
  };

  const generateAllAudio = async () => {
    if (!settingsStore.settings.enableAudio) {
      alert('Audio generation is disabled. Enable it in Settings → General.');
      return;
    }

    setGeneratingAll(true);

    // Collect all shots that need audio
    const shotsToGenerate: Array<{ sceneId: string; shot: Shot }> = [];
    for (const scene of storyStore.story.scenes) {
      for (const shot of scene.shots) {
        if (!shot.audioUrl && !shot.isGeneratingAudio && shot.subtitle) {
          shotsToGenerate.push({ sceneId: scene.id, shot });
        }
      }
    }

    setProgress({ current: 0, total: shotsToGenerate.length });

    // Generate with concurrency limit (10 at a time - API calls are fast)
    const concurrency = 10;
    let completed = 0;

    for (let i = 0; i < shotsToGenerate.length; i += concurrency) {
      const batch = shotsToGenerate.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async ({ sceneId, shot }) => {
          await generateAudio(sceneId, shot);
          completed++;
          setProgress({ current: completed, total: shotsToGenerate.length });
        })
      );

      // Small delay between batches
      if (i + concurrency < shotsToGenerate.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setGeneratingAll(false);
    setProgress({ current: 0, total: 0 });
  };

  const allShots = storyStore.getAllShots();
  const shotsWithSubtitles = allShots.filter(s => s.subtitle);
  const shotsWithAudio = allShots.filter(s => s.audioUrl);

  if (!settingsStore.settings.enableAudio) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">🎙️ Audio Generation (Disabled)</h2>
            <p className="text-sm text-gray-400">
              Enable audio in Settings → General to generate voice narration for your shots.
            </p>
          </div>
          <button
            onClick={() => settingsStore.toggleSettings()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-1">🎙️ Audio Generation</h2>
          <p className="text-sm text-gray-400">
            Generate voice narration using {settingsStore.settings.voiceModel.provider === 'openai' ? 'OpenAI TTS' : 'ElevenLabs'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateAllAudio}
            disabled={generatingAll || shotsWithSubtitles.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
          >
            {generatingAll ? (
              <>
                <div className="spinner-small"></div>
                Generating... ({progress.current}/{progress.total})
              </>
            ) : (
              `Generate All Audio (${shotsWithSubtitles.length})`
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {generatingAll && (
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">{shotsWithSubtitles.length}</div>
          <div className="text-gray-400">Total Shots</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{shotsWithAudio.length}</div>
          <div className="text-gray-400">With Audio</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-400">
            {shotsWithSubtitles.length - shotsWithAudio.length}
          </div>
          <div className="text-gray-400">Pending</div>
        </div>
      </div>

      {/* Individual Shot Audio Controls */}
      {shotsWithAudio.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Generated Audio Files:</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {storyStore.story.scenes.map((scene) =>
              scene.shots
                .filter(shot => shot.audioUrl)
                .map((shot) => (
                  <div key={shot.id} className="flex items-center justify-between bg-gray-800 rounded p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{shot.subtitle}</p>
                      <p className="text-xs text-gray-500">{scene.title}</p>
                    </div>
                    <audio
                      src={shot.audioUrl}
                      controls
                      className="ml-4"
                      style={{ height: '32px', maxWidth: '200px' }}
                    />
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default AudioGenerator;
