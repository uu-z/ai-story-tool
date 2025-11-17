'use client';

import { observer } from 'mobx-react-lite';
import { storyStore, Shot } from '@/stores/StoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import VideoPreviewModal from './VideoPreviewModal';
import { composeVideos, downloadBlob, QUALITY_PRESETS } from '@/utils/videoComposer';
import { extendAudioToTargetDuration } from '@/utils/audioExtender';

const EditView = observer(() => {
  const [selectedForAnimation, setSelectedForAnimation] = useState<Set<string>>(new Set());
  const [animatingAll, setAnimatingAll] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [previewShot, setPreviewShot] = useState<{ shot: Shot; sceneTitle: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  // Initialize from settings store
  const [includeSubtitles, setIncludeSubtitles] = useState(settingsStore.settings.exportSettings.includeSubtitles);

  // Sync includeSubtitles with settings store
  useEffect(() => {
    setIncludeSubtitles(settingsStore.settings.exportSettings.includeSubtitles);
  }, [settingsStore.settings.exportSettings.includeSubtitles]);

  // Reset stuck animation states on component mount
  useEffect(() => {
    console.log('EditView mounted - resetting stuck animation states');
    storyStore.story.scenes.forEach(scene => {
      scene.shots.forEach(shot => {
        // Reset isAnimating if shot doesn't have animation URL
        if (shot.isAnimating && !shot.animationUrl) {
          console.log(`Resetting stuck animation state for shot ${shot.id}`);
          storyStore.setAnimatingShot(scene.id, shot.id, false);
        }
        // Reset isGeneratingAudio if shot doesn't have audio URL
        if (shot.isGeneratingAudio && !shot.audioUrl) {
          console.log(`Resetting stuck audio generation state for shot ${shot.id}`);
          storyStore.setGeneratingAudioShot(scene.id, shot.id, false);
        }
      });
    });
  }, []); // Run only once on mount

  const generateAudio = async (sceneId: string, shot: Shot) => {
    if (!settingsStore.settings.enableAudio || !shot.subtitle) return;

    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Audio generation failed:', errorData.error);
        storyStore.setGeneratingAudioShot(sceneId, shot.id, false);
        return; // Don't block video generation if audio fails
      }

      // Get base64 audio data URL for persistence during export
      const data = await response.json();
      let audioUrl = data.audioUrl;

      // Extend audio to 5 seconds to match video duration
      audioUrl = await extendAudioToTargetDuration(audioUrl, 5);

      storyStore.updateShot(sceneId, shot.id, {
        audioUrl,
        isGeneratingAudio: false,
      });
    } catch (error) {
      console.error('Failed to generate audio:', error);
      storyStore.setGeneratingAudioShot(sceneId, shot.id, false);
      // Don't alert - audio is optional
    }
  };

  const animateShot = async (sceneId: string, shot: Shot) => {
    if (!shot.imageUrl) return;

    try {
      storyStore.setAnimatingShot(sceneId, shot.id, true);

      // Generate video
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: shot.imageUrl,
          modelConfig: settingsStore.settings.videoModel,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      storyStore.updateShot(sceneId, shot.id, {
        animationUrl: data.videoUrl,
        isAnimating: false,
      });

      // Auto-generate audio if enabled (don't wait for it)
      if (settingsStore.settings.enableAudio && shot.subtitle && !shot.audioUrl) {
        generateAudio(sceneId, shot).catch(err => {
          console.warn('Background audio generation failed:', err);
        });
      }

      // Remove from selection after successful animation
      const newSelected = new Set(selectedForAnimation);
      newSelected.delete(shot.id);
      setSelectedForAnimation(newSelected);
    } catch (error: any) {
      console.error('Failed to animate shot:', error);
      storyStore.setAnimatingShot(sceneId, shot.id, false);

      // Check if error is about expired image
      const errorMessage = error.message || 'Failed to generate animation';
      if (errorMessage.includes('not accessible') || errorMessage.includes('expired')) {
        alert('⚠️ Image URL has expired\n\nThe image URL has expired. Please:\n1. Go back to Storyboard\n2. Regenerate this image (click 🔄 Regenerate)\n3. Return here to create the video\n\nReplicate\'s image URLs expire after some time.');
      } else {
        alert(`Failed to generate animation: ${errorMessage}`);
      }
    }
  };

  const animateSelected = async () => {
    setAnimatingAll(true);

    // Collect all shots that need animation
    const shotsToAnimate: Array<{ sceneId: string; shot: Shot }> = [];
    for (const scene of storyStore.story.scenes) {
      for (const shot of scene.shots) {
        if (selectedForAnimation.has(shot.id) && !shot.isAnimating && !shot.animationUrl) {
          shotsToAnimate.push({ sceneId: scene.id, shot });
        }
      }
    }

    setProgress({ current: 0, total: shotsToAnimate.length });

    // Generate with concurrency limit (3 at a time for video - more resource intensive)
    const concurrency = 3;
    let completed = 0;

    for (let i = 0; i < shotsToAnimate.length; i += concurrency) {
      const batch = shotsToAnimate.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async ({ sceneId, shot }) => {
          await animateShot(sceneId, shot);
          completed++;
          setProgress({ current: completed, total: shotsToAnimate.length });
        })
      );

      // Longer delay between video batches
      if (i + concurrency < shotsToAnimate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setAnimatingAll(false);
    setProgress({ current: 0, total: 0 });
  };

  const toggleSelection = (shotId: string) => {
    const newSelected = new Set(selectedForAnimation);
    if (newSelected.has(shotId)) {
      newSelected.delete(shotId);
    } else {
      newSelected.add(shotId);
    }
    setSelectedForAnimation(newSelected);
  };

  const selectAll = () => {
    const shotsWithImages = storyStore.getAllShots()
      .filter(shot => shot.imageUrl && !shot.animationUrl)
      .map(shot => shot.id);
    setSelectedForAnimation(new Set(shotsWithImages));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const animatedShots = storyStore.getAllShots().filter(shot => shot.animationUrl);

      if (animatedShots.length === 0) {
        alert('Please generate video animations first');
        return;
      }

      const videos = animatedShots.map(shot => ({
        url: shot.animationUrl!,
        subtitle: settingsStore.settings.exportSettings.includeSubtitles ? shot.subtitle : undefined,
        audioUrl: shot.audioUrl,
      }));

      console.log('Exporting with settings:', {
        includeSubtitles: settingsStore.settings.exportSettings.includeSubtitles,
        videosWithSubtitles: videos.filter(v => v.subtitle).length,
        totalVideos: videos.length
      });

      // Get quality settings from store
      const quality = QUALITY_PRESETS[settingsStore.settings.exportSettings.quality];

      const blob = await composeVideos(videos, setExportProgress, quality);
      downloadBlob(blob, `${storyStore.story.title || 'story'}-${Date.now()}.mp4`);

      alert('Video exported successfully! 🎉');
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const allShots = storyStore.getAllShots().filter(shot => shot.imageUrl);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{storyStore.story.title} - Animation</h1>
          <p className="text-gray-400 mt-2">
            Select shots to animate
            {settingsStore.settings.enableAudio && (
              <span className="ml-2 text-green-400">• Audio will auto-generate</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => storyStore.setCurrentStep('storyboard')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Back to Storyboard
          </button>
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            Select All
          </button>
          <button
            onClick={animateSelected}
            disabled={selectedForAnimation.size === 0 || animatingAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
          >
            {animatingAll ? `Animating... (${progress.current}/${progress.total})` : `Animate (${selectedForAnimation.size})`}
          </button>
          {allShots.some(s => s.animationUrl) && (
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition"
            >
              📥 Export Video
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allShots.map((shot) => {
          const scene = storyStore.story.scenes.find(s =>
            s.shots.some(sh => sh.id === shot.id)
          );
          if (!scene) return null;

          return (
            <div
              key={shot.id}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition ${
                selectedForAnimation.has(shot.id) ? 'ring-2 ring-yellow-500' : ''
              } ${shot.animationUrl ? 'opacity-75' : ''}`}
              onClick={() => !shot.animationUrl && !shot.isAnimating && toggleSelection(shot.id)}
            >
              <div className="aspect-video bg-gray-700 rounded mb-3 relative overflow-hidden">
                {shot.isAnimating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="spinner mb-2"></div>
                    <p className="text-sm text-gray-400">Generating animation...</p>
                  </div>
                ) : shot.animationUrl ? (
                  <>
                    <video
                      src={shot.animationUrl}
                      controls
                      loop
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        animateShot(scene.id, shot);
                      }}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600/90 hover:bg-blue-700 rounded text-xs transition flex items-center gap-1"
                      title="Regenerate video animation"
                    >
                      🔄 Regenerate
                    </button>
                  </>
                ) : (
                  <>
                    <Image
                      src={shot.imageUrl!}
                      alt={shot.subtitle}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {selectedForAnimation.has(shot.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                        ✓
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{shot.subtitle}</h3>
                  <div className="flex gap-1 items-center">
                    {shot.animationUrl && (
                      <span className="text-xs bg-green-600 px-2 py-1 rounded">✓ Video</span>
                    )}
                    {shot.audioUrl && (
                      <>
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded">🎙️ Audio</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const audio = new Audio(shot.audioUrl);
                            audio.play();
                          }}
                          className="w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center transition text-xs"
                          title="Play audio"
                        >
                          ▶
                        </button>
                      </>
                    )}
                    {shot.isGeneratingAudio && (
                      <span className="text-xs bg-yellow-600 px-2 py-1 rounded animate-pulse">⏳ Audio...</span>
                    )}
                  </div>
                </div>

                {/* Preview Button - Show when video is ready */}
                {shot.animationUrl && (
                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewShot({ shot, sceneTitle: scene.title });
                      }}
                      className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      🎬 Preview {shot.audioUrl ? 'with Audio & Subtitle' : 'with Subtitle'}
                    </button>

                    {/* Regenerate Audio Button */}
                    {settingsStore.settings.enableAudio && shot.subtitle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateAudio(scene.id, shot);
                        }}
                        disabled={shot.isGeneratingAudio}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {shot.isGeneratingAudio ? '⏳ Generating...' : shot.audioUrl ? '🔄 Regenerate Audio' : '🎙️ Generate Audio'}
                      </button>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-400">{shot.location}</p>
              </div>
            </div>
          );
        })}
      </div>

      {allShots.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No shots with images available. Go back to storyboard to generate images.</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewShot && (
        <VideoPreviewModal
          videoUrl={previewShot.shot.animationUrl!}
          audioUrl={previewShot.shot.audioUrl}
          subtitle={previewShot.shot.subtitle}
          onClose={() => setPreviewShot(null)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">📥 Export Video</h2>
              <p className="text-sm text-gray-400 mt-1">
                Combine all animated clips into a complete video
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Story Title</span>
                    <span className="text-sm font-semibold">
                      {storyStore.story.title}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Animated Clips</span>
                    <span className="text-lg font-bold text-yellow-500">
                      {allShots.filter(s => s.animationUrl).length} / {allShots.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">With Audio</span>
                    <span className="text-sm font-semibold text-blue-400">
                      {allShots.filter(s => s.animationUrl && s.audioUrl).length} clips
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">With Subtitles</span>
                    <span className="text-sm font-semibold text-green-400">
                      {allShots.filter(s => s.animationUrl && s.subtitle).length} clips
                    </span>
                  </div>
                </div>

                {/* Subtitle Option */}
                <div className="border-t border-gray-700 pt-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex-1">
                      <div className="text-sm font-medium group-hover:text-white transition">
                        Embed subtitles in video
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Permanently burn subtitles into the video frame
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={includeSubtitles}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIncludeSubtitles(checked);
                          // Also update the settings store
                          settingsStore.updateExportSettings({
                            includeSubtitles: checked,
                          });
                        }}
                        className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 focus:ring-offset-gray-900"
                      />
                    </div>
                  </label>
                </div>

                {settingsStore.settings.enableAudio && (
                  <div className="text-xs text-blue-400 bg-blue-900/20 border border-blue-700/30 rounded p-2">
                    💡 Clip audio will be automatically merged into the final video
                  </div>
                )}
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Composing...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || allShots.filter(s => s.animationUrl).length === 0}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                {isExporting ? 'Composing...' : 'Start Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default EditView;
