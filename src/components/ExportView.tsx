'use client';

import { observer } from 'mobx-react-lite';
import { storyStore, Shot } from '@/stores/StoryStore';
import { useState } from 'react';
import Image from 'next/image';
import { composeVideos, downloadBlob } from '@/utils/videoComposer';
import VideoPreviewModal from './VideoPreviewModal';

type ExportMethod = 'docker' | 'browser';

const ExportView = observer(() => {
  const [selectedShots, setSelectedShots] = useState<Set<string>>(new Set());
  const [exportMethod, setExportMethod] = useState<ExportMethod>('browser');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewShot, setPreviewShot] = useState<Shot | null>(null);
  const [isPreviewingAll, setIsPreviewingAll] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const animatedShots = storyStore.getAllShots().filter(shot => shot.animationUrl);

  const toggleShotSelection = (shotId: string) => {
    const newSelected = new Set(selectedShots);
    if (newSelected.has(shotId)) {
      newSelected.delete(shotId);
    } else {
      newSelected.add(shotId);
    }
    setSelectedShots(newSelected);
  };

  const selectAllShots = () => {
    const allIds = animatedShots.map(shot => shot.id);
    setSelectedShots(new Set(allIds));
  };

  const getSelectedShots = (): Shot[] => {
    return animatedShots.filter(shot => selectedShots.has(shot.id));
  };

  const exportWithBrowser = async () => {
    setIsExporting(true);
    setExportError(null);
    setProgress(0);

    try {
      const shotsToExport = getSelectedShots();

      if (shotsToExport.length === 0) {
        throw new Error('No shots selected');
      }

      const videos = shotsToExport.map(shot => ({
        url: shot.animationUrl!,
        subtitle: shot.subtitle,
        audioUrl: shot.audioUrl,
      }));

      const blob = await composeVideos(videos, setProgress);

      downloadBlob(blob, `${storyStore.story.title || 'story'}-${Date.now()}.mp4`);

      setProgress(100);
      alert('Video exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      setExportError(error.message || 'Failed to export video');
    } finally {
      setIsExporting(false);
    }
  };

  const exportWithDocker = async () => {
    setIsExporting(true);
    setExportError(null);
    setProgress(0);

    try {
      const shotsToExport = getSelectedShots();

      if (shotsToExport.length === 0) {
        throw new Error('No shots selected');
      }

      const videos = shotsToExport.map(shot => ({
        url: shot.animationUrl!,
        subtitle: shot.subtitle,
        audioUrl: shot.audioUrl,
      }));

      const response = await fetch('/api/compose-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to compose video');
      }

      // Download the video
      const blob = await response.blob();
      downloadBlob(blob, `${storyStore.story.title || 'story'}-${Date.now()}.mp4`);

      setProgress(100);
      alert('Video exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      setExportError(error.message || 'Failed to export video');

      // Fallback to browser method
      if (error.message.includes('Failed to fetch')) {
        alert('Docker service unavailable. Falling back to browser export...');
        setExportMethod('browser');
        await exportWithBrowser();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (exportMethod === 'docker') {
      await exportWithDocker();
    } else {
      await exportWithBrowser();
    }
  };

  const previewAllSelected = async () => {
    setIsPreviewingAll(true);
    setProgress(0);
    setExportError(null);

    try {
      const shotsToPreview = getSelectedShots();

      if (shotsToPreview.length === 0) {
        throw new Error('No shots selected');
      }

      const videos = shotsToPreview.map(shot => ({
        url: shot.animationUrl!,
        subtitle: shot.subtitle,
        audioUrl: shot.audioUrl,
      }));

      // Compose videos with audio in browser
      const blob = await composeVideos(videos, setProgress);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      setProgress(100);
    } catch (error: any) {
      console.error('Preview error:', error);
      setExportError(error.message || 'Failed to generate preview');
    } finally {
      setIsPreviewingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{storyStore.story.title} - Export</h1>
          <p className="text-gray-400 mt-2">Select animated shots to export as a single video</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => storyStore.setCurrentStep('edit')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Back to Edit
          </button>
          <button
            onClick={selectAllShots}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
            disabled={animatedShots.length === 0}
          >
            Select All ({animatedShots.length})
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Export Options</h2>

        <div className="space-y-4">
          {/* Export Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Export Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="browser"
                  checked={exportMethod === 'browser'}
                  onChange={(e) => setExportMethod(e.target.value as ExportMethod)}
                  disabled={isExporting}
                  className="w-4 h-4"
                />
                <span>Browser (FFmpeg.wasm)</span>
                <span className="text-xs text-gray-400">- Slower, works without Docker</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="docker"
                  checked={exportMethod === 'docker'}
                  onChange={(e) => setExportMethod(e.target.value as ExportMethod)}
                  disabled={isExporting}
                  className="w-4 h-4"
                />
                <span>Docker Service</span>
                <span className="text-xs text-gray-400">- Faster, requires Docker</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={previewAllSelected}
              disabled={selectedShots.size === 0 || isPreviewingAll || isExporting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition text-lg"
            >
              {isPreviewingAll ? `Previewing... ${progress}%` : `Preview (${selectedShots.size} shots)`}
            </button>

            <button
              onClick={handleExport}
              disabled={selectedShots.size === 0 || isExporting || isPreviewingAll}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition text-lg"
            >
              {isExporting ? `Exporting... ${progress}%` : `Export Video (${selectedShots.size} shots)`}
            </button>

            {isExporting && (
              <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {exportError && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
              <p className="font-semibold">Export Error:</p>
              <p className="text-sm mt-1">{exportError}</p>
            </div>
          )}

          {exportMethod === 'docker' && (
            <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Docker Service Setup:</strong>
              </p>
              <code className="block mt-2 text-xs bg-gray-800 p-2 rounded">
                npm run docker:ffmpeg
              </code>
              <p className="text-xs text-gray-400 mt-2">
                The FFmpeg service will automatically fall back to browser mode if unavailable.
              </p>
            </div>
          )}

          {exportMethod === 'browser' && (
            <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-300">
                <strong>Note:</strong> Browser export uses ffmpeg.wasm which is slower but doesn't require any setup.
                First-time use may take longer to download the WASM files (~30MB).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shot Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {animatedShots.map((shot, index) => {
          const scene = storyStore.story.scenes.find(s =>
            s.shots.some(sh => sh.id === shot.id)
          );

          return (
            <div
              key={shot.id}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition ${
                selectedShots.has(shot.id) ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => toggleShotSelection(shot.id)}
            >
              <div className="aspect-video bg-gray-700 rounded mb-3 relative overflow-hidden">
                {shot.animationUrl ? (
                  <>
                    <video
                      src={shot.animationUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                    {selectedShots.has(shot.id) && (
                      <div className="absolute top-2 left-2 flex items-center gap-2 bg-yellow-500 text-black px-2 py-1 rounded font-bold text-sm">
                        <span>#{Array.from(selectedShots).indexOf(shot.id) + 1}</span>
                        ✓
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No animation
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Shot {index + 1}</h3>
                </div>
                <p className="text-xs text-gray-400">{shot.subtitle}</p>
                <p className="text-xs text-gray-500">{scene?.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {animatedShots.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No animated shots available. Go back to Edit to generate animations.</p>
        </div>
      )}

      {/* Preview Player */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold">🎬 Preview</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Final video with audio (Audio merged into video)
                </p>
              </div>
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div className="p-6">
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[600px]"
                />
              </div>

              {/* Info */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span>✅ {selectedShots.size} shots merged</span>
                  <span>🎙️ Audio included</span>
                </div>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewUrl;
                    a.download = `${storyStore.story.title || 'preview'}-${Date.now()}.mp4`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition"
                >
                  Download Preview
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-800 gap-3">
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Shot Preview Modal */}
      {previewShot && (
        <VideoPreviewModal
          videoUrl={previewShot.animationUrl!}
          audioUrl={previewShot.audioUrl}
          subtitle={previewShot.subtitle}
          onClose={() => setPreviewShot(null)}
        />
      )}
    </div>
  );
});

export default ExportView;
