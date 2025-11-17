'use client';

import { observer } from 'mobx-react-lite';
import { storyStore } from '@/stores/StoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import { useState } from 'react';
import Image from 'next/image';

const CharacterConfirmation = observer(() => {
  const [generatingAll, setGeneratingAll] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const generateCharacterImage = async (index: number) => {
    const character = storyStore.story.characters[index];
    if (!character || !character.prompt) {
      return;
    }

    try {
      storyStore.setGeneratingCharacter(index, true);

      const { characterImageModel } = settingsStore.settings;

      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: character.name,
          description: character.description,
          prompt: character.prompt,
          style: storyStore.story.style,
          aspectRatio: '1:1',
          modelConfig: characterImageModel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate character');
      }

      const data = await response.json();

      storyStore.updateCharacter(index, {
        referenceImageUrl: data.imageUrl,
        isGenerating: false,
      });
    } catch (error: any) {
      console.error('Character generation error:', error);
      storyStore.setGeneratingCharacter(index, false);
      alert(`Failed to generate ${character.name}: ${error.message}`);
    }
  };

  const generateAllCharacters = async () => {
    setGeneratingAll(true);
    const total = storyStore.story.characters.length;
    setProgress({ current: 0, total });

    for (let i = 0; i < storyStore.story.characters.length; i++) {
      await generateCharacterImage(i);
      setProgress({ current: i + 1, total });

      // Small delay between requests
      if (i < storyStore.story.characters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setGeneratingAll(false);
    setProgress({ current: 0, total: 0 });
  };

  const regenerateCharacter = async (index: number) => {
    await generateCharacterImage(index);
  };

  const confirmAndContinue = () => {
    const hasUngenerated = storyStore.story.characters.some(
      c => !c.referenceImageUrl
    );

    if (hasUngenerated) {
      if (!confirm('Some characters have not been generated. Continue without generating them?')) {
        return;
      }
    }

    storyStore.setCurrentStep('storyboard');
  };

  const skipCharacters = () => {
    if (confirm('Skip character generation? You can still generate them later in the Storyboard step.')) {
      storyStore.setCurrentStep('storyboard');
    }
  };

  const allGenerated = storyStore.story.characters.every(c => c.referenceImageUrl);
  const someGenerating = storyStore.story.characters.some(c => c.isGenerating);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Review and Generate Characters</h1>
        <p className="text-gray-400">
          Review the AI-generated characters for your story. Generate reference images to ensure consistency across all shots.
        </p>
      </div>

      {/* Story Info */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-2">{storyStore.story.title}</h2>
        <p className="text-sm text-gray-400">{storyStore.story.synopsis}</p>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="px-2 py-1 bg-purple-900/30 border border-purple-700 rounded">
            {storyStore.story.style}
          </span>
          <span className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded">
            {storyStore.story.aspectRatio}
          </span>
          <span className="px-2 py-1 bg-green-900/30 border border-green-700 rounded">
            {storyStore.story.scenes.length} scenes
          </span>
          <span className="px-2 py-1 bg-orange-900/30 border border-orange-700 rounded">
            {storyStore.getAllShots().length} shots
          </span>
        </div>
      </div>

      {/* Characters Section */}
      <div className="mb-6 p-6 bg-gray-900 rounded-lg border border-orange-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-orange-300">
              Characters ({storyStore.story.characters.length})
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Generate consistent character images for better shot quality
            </p>
          </div>
          {!allGenerated && !someGenerating && (
            <button
              onClick={generateAllCharacters}
              disabled={generatingAll}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-2"
            >
              {generatingAll ? (
                <>
                  <div className="spinner w-4 h-4 border-2"></div>
                  Generating All...
                </>
              ) : (
                <>✨ Generate All Characters</>
              )}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {generatingAll && progress.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Generating characters...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Characters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {storyStore.story.characters.map((character, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-600 transition"
            >
              {/* Character Image */}
              <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                {character.isGenerating ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="spinner"></div>
                    <p className="text-xs text-gray-400">Generating...</p>
                  </div>
                ) : character.referenceImageUrl ? (
                  <>
                    <Image
                      src={character.referenceImageUrl}
                      alt={character.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      ✓
                    </div>

                    {/* Regenerate button on hover */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                      <button
                        onClick={() => regenerateCharacter(index)}
                        disabled={generatingAll}
                        className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-sm rounded transition disabled:opacity-50"
                      >
                        🔄 Regenerate
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => generateCharacterImage(index)}
                    disabled={generatingAll}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-sm rounded transition"
                  >
                    Generate
                  </button>
                )}
              </div>

              {/* Character Info */}
              <h4 className="font-semibold text-sm mb-1">{character.name}</h4>
              <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                {character.description}
              </p>

              {/* Visual Prompt */}
              {character.prompt && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-400">
                    Visual details
                  </summary>
                  <p className="mt-1 pl-2 border-l-2 border-gray-700">
                    {character.prompt}
                  </p>
                </details>
              )}

              {character.referenceImageUrl && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                  <span>✓</span>
                  <span>Ready</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status Messages */}
        {allGenerated && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-300">
            ✓ All characters generated! Ready to create storyboard shots.
          </div>
        )}

        {!allGenerated && !someGenerating && !generatingAll && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-sm text-yellow-300">
            💡 Tip: Generated character references help maintain visual consistency across all shots.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={skipCharacters}
          disabled={someGenerating || generatingAll}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition"
        >
          Skip for Now
        </button>

        <div className="flex items-center gap-3">
          {!allGenerated && (
            <span className="text-sm text-gray-400">
              {storyStore.story.characters.filter(c => c.referenceImageUrl).length} / {storyStore.story.characters.length} generated
            </span>
          )}

          <button
            onClick={confirmAndContinue}
            disabled={someGenerating || generatingAll}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            {allGenerated ? (
              <>
                ✓ Continue to Storyboard
              </>
            ) : (
              <>
                Continue to Storyboard →
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CharacterConfirmation;
