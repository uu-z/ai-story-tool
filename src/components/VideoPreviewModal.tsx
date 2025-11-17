'use client';

import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { settingsStore } from '@/stores/SettingsStore';

interface VideoPreviewModalProps {
  videoUrl: string;
  audioUrl?: string;
  subtitle?: string;
  onClose: () => void;
}

const VideoPreviewModal = observer(({
  videoUrl,
  audioUrl,
  subtitle,
  onClose,
}: VideoPreviewModalProps) => {
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // For preview, never merge - just play video directly
    // Audio will be played separately via HTML5 audio element
    setMergedUrl(videoUrl);

    return () => {
      // Cleanup blob URL
      if (mergedUrl && mergedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mergedUrl);
      }
    };
  }, [videoUrl, audioUrl]);

  // Sync audio playback with video
  useEffect(() => {
    const video = containerRef.current;
    const audio = audioRef.current;

    if (!video || !audio || !audioUrl) return;

    const syncAudio = () => {
      if (video.paused) {
        audio.pause();
      } else {
        audio.play();
      }
    };

    const syncTime = () => {
      // Keep audio in sync with video time
      if (Math.abs(audio.currentTime - video.currentTime) > 0.3) {
        audio.currentTime = video.currentTime;
      }
    };

    video.addEventListener('play', syncAudio);
    video.addEventListener('pause', syncAudio);
    video.addEventListener('timeupdate', syncTime);
    video.addEventListener('seeked', syncTime);

    return () => {
      video.removeEventListener('play', syncAudio);
      video.removeEventListener('pause', syncAudio);
      video.removeEventListener('timeupdate', syncTime);
      video.removeEventListener('seeked', syncTime);
    };
  }, [mergedUrl, audioUrl]);


  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">🎬 Quick Preview</h2>
            <p className="text-xs text-gray-400 mt-1">⚡ Fast preview mode - subtitle shown as overlay</p>
            {subtitle && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-blue-400 font-semibold">📝 Subtitle Preview:</p>
                <p className="text-sm text-gray-300 bg-gray-800 px-3 py-2 rounded">{subtitle}</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mergedUrl && (
            <div className="space-y-4">
              {/* Video Player with Floating Subtitle */}
              <div className="bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={containerRef}
                  src={mergedUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[500px]"
                />
                {/* Hidden audio element for sync playback */}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="auto"
                  />
                )}
                {/* Floating Subtitle Overlay */}
                {subtitle && (
                  <div className={`absolute left-0 right-0 flex justify-center px-4 pointer-events-none ${
                    settingsStore.settings.subtitleSettings.position === 'top' ? 'top-8' :
                    settingsStore.settings.subtitleSettings.position === 'center' ? 'top-1/2 -translate-y-1/2' :
                    'bottom-12'
                  }`}>
                    <div
                      className="px-6 py-3 rounded-lg text-center max-w-3xl backdrop-blur-sm"
                      style={{
                        backgroundColor: settingsStore.settings.subtitleSettings.backgroundColor,
                        opacity: settingsStore.settings.subtitleSettings.backgroundOpacity,
                      }}
                    >
                      <p
                        className="font-medium leading-relaxed"
                        style={{
                          fontSize: `${settingsStore.settings.subtitleSettings.fontSize}px`,
                          color: settingsStore.settings.subtitleSettings.fontColor,
                          textShadow: `${settingsStore.settings.subtitleSettings.outlineWidth}px ${settingsStore.settings.subtitleSettings.outlineWidth}px ${settingsStore.settings.subtitleSettings.outlineWidth * 2}px ${settingsStore.settings.subtitleSettings.outlineColor}`,
                        }}
                      >
                        {subtitle}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  {audioUrl && (
                    <span className="flex items-center gap-1">
                      🎙️ Audio synced
                    </span>
                  )}
                  {!audioUrl && (
                    <span className="flex items-center gap-1">
                      🔇 No audio
                    </span>
                  )}
                  {subtitle && (
                    <span className="flex items-center gap-1">
                      📝 Subtitle overlay
                    </span>
                  )}
                  <span className="text-xs text-blue-400">
                    💡 Export to embed subtitle
                  </span>
                </div>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = mergedUrl;
                    a.download = `preview-${Date.now()}.mp4`;
                    a.click();
                  }}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded transition"
                >
                  Download Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-800 gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

export default VideoPreviewModal;
