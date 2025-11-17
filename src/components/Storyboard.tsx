'use client';

import { observer } from 'mobx-react-lite';
import { storyStore, Shot } from '@/stores/StoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import CharacterGenerator from './CharacterGenerator';

const Storyboard = observer(() => {
  const [generatingAll, setGeneratingAll] = useState(false);
  const [selectedShots, setSelectedShots] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Reset stuck generation states on component mount
  useEffect(() => {
    console.log('Storyboard mounted - resetting stuck generation states');
    storyStore.story.scenes.forEach(scene => {
      scene.shots.forEach(shot => {
        // Reset isGenerating if shot doesn't have image URL
        if (shot.isGenerating && !shot.imageUrl) {
          console.log(`Resetting stuck generation state for shot ${shot.id}`);
          storyStore.setGeneratingShot(scene.id, shot.id, false);
        }
      });
    });
    // Reset character generation states
    storyStore.story.characters.forEach((char, index) => {
      if (char.isGenerating && !char.referenceImageUrl) {
        console.log(`Resetting stuck generation state for character ${char.name}`);
        storyStore.setGeneratingCharacter(index, false);
      }
    });
  }, []); // Run only once on mount

  const generateImage = async (sceneId: string, shot: Shot) => {
    try {
      storyStore.setGeneratingShot(sceneId, shot.id, true);

      // Check if we have character references
      const characterReferences = storyStore.getCharacterReferences();
      const hasCharacterRefs = Object.keys(characterReferences).length > 0;

      // Use character-aware API if references exist
      const apiEndpoint = hasCharacterRefs
        ? '/api/generate-image-with-character'
        : '/api/generate-image';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${shot.location}. ${shot.content}`,
          style: storyStore.story.style,
          aspectRatio: storyStore.story.aspectRatio,
          characterReferences: hasCharacterRefs ? characterReferences : undefined,
          modelConfig: settingsStore.settings.imageModel,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      storyStore.updateShot(sceneId, shot.id, {
        imageUrl: data.imageUrl,
        isGenerating: false,
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
      storyStore.setGeneratingShot(sceneId, shot.id, false);
      alert('Failed to generate image. Check console for details.');
    }
  };

  const generateAllImages = async () => {
    setGeneratingAll(true);

    // Collect all shots that need generation
    const shotsToGenerate: Array<{ sceneId: string; shot: Shot }> = [];
    for (const scene of storyStore.story.scenes) {
      for (const shot of scene.shots) {
        if (!shot.imageUrl && !shot.isGenerating) {
          shotsToGenerate.push({ sceneId: scene.id, shot });
        }
      }
    }

    setProgress({ current: 0, total: shotsToGenerate.length });

    // Generate with concurrency limit (5 at a time to avoid rate limits)
    const concurrency = 5;
    let completed = 0;

    for (let i = 0; i < shotsToGenerate.length; i += concurrency) {
      const batch = shotsToGenerate.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async ({ sceneId, shot }) => {
          await generateImage(sceneId, shot);
          completed++;
          setProgress({ current: completed, total: shotsToGenerate.length });
        })
      );

      // Small delay between batches to be safe
      if (i + concurrency < shotsToGenerate.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setGeneratingAll(false);
    setProgress({ current: 0, total: 0 });
  };

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
    const allShotIds = storyStore.getAllShots()
      .filter(shot => shot.imageUrl)
      .map(shot => shot.id);
    setSelectedShots(new Set(allShotIds));
  };

  const goToEdit = () => {
    if (selectedShots.size === 0) {
      alert('Please select at least one shot to animate');
      return;
    }
    storyStore.setCurrentStep('edit');
  };

  const allShots = storyStore.getAllShots();
  const hasImages = allShots.some(shot => shot.imageUrl);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{storyStore.story.title}</h1>
          <p className="text-gray-400 mt-2">{storyStore.story.synopsis}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => storyStore.setCurrentStep('review')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Back to Review
          </button>
          <button
            onClick={generateAllImages}
            disabled={generatingAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
          >
            {generatingAll ? `Generating... (${progress.current}/${progress.total})` : 'Generate All Images'}
          </button>
          {hasImages && (
            <>
              <button
                onClick={selectAllShots}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
              >
                Select All
              </button>
              <button
                onClick={goToEdit}
                disabled={selectedShots.size === 0}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition"
              >
                Next ({selectedShots.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Character Reference Generator */}
      <CharacterGenerator />

      <div className="space-y-8">
        {storyStore.story.scenes.map((scene) => (
          <div key={scene.id} className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-2">{scene.title}</h2>
            <p className="text-gray-400 mb-4">{scene.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scene.shots.map((shot) => (
                <div
                  key={shot.id}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition ${
                    selectedShots.has(shot.id) ? 'ring-2 ring-yellow-500' : ''
                  }`}
                  onClick={() => shot.imageUrl && toggleShotSelection(shot.id)}
                >
                  <div className="aspect-video bg-gray-700 rounded mb-3 flex items-center justify-center overflow-hidden relative">
                    {shot.isGenerating ? (
                      <div className="spinner"></div>
                    ) : shot.imageUrl ? (
                      <>
                        <Image
                          src={shot.imageUrl}
                          alt={shot.subtitle}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {selectedShots.has(shot.id) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                            ✓
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateImage(scene.id, shot);
                          }}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600/90 hover:bg-blue-700 rounded text-xs transition flex items-center gap-1"
                          title="Regenerate image"
                        >
                          🔄 Regenerate
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateImage(scene.id, shot);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                      >
                        Generate Image
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{shot.subtitle}</h3>
                  <p className="text-sm text-gray-400 mb-1">{shot.location}</p>
                  <p className="text-sm text-gray-300">{shot.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Storyboard;
