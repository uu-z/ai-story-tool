'use client';

import { observer } from 'mobx-react-lite';
import { storyStore } from '@/stores/StoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import Image from 'next/image';

const CharacterGenerator = observer(() => {
  const generateCharacterImage = async (index: number) => {
    const character = storyStore.story.characters[index];
    if (!character || !character.prompt) {
      alert('Character needs a visual description (prompt) to generate image');
      return;
    }

    try {
      storyStore.setGeneratingCharacter(index, true);

      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: character.name,
          description: character.description,
          prompt: character.prompt,
          style: storyStore.story.style,
          aspectRatio: '1:1',
          modelConfig: settingsStore.settings.characterImageModel,
          imageModelConfig: settingsStore.settings.imageModel, // Share API key from shot image model
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

      console.log(`Character ${character.name} generated successfully`);
    } catch (error: any) {
      console.error('Character generation error:', error);
      storyStore.setGeneratingCharacter(index, false);
      alert(`Failed to generate ${character.name}: ${error.message}`);
    }
  };

  const generateAllCharacters = async () => {
    for (let i = 0; i < storyStore.story.characters.length; i++) {
      const character = storyStore.story.characters[i];
      if (!character.referenceImageUrl && character.prompt) {
        await generateCharacterImage(i);
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  if (storyStore.story.characters.length === 0) {
    return null;
  }

  const hasUngenerated = storyStore.story.characters.some(
    c => c.prompt && !c.referenceImageUrl && !c.isGenerating
  );

  return (
    <div className="mb-6 p-6 bg-gray-900 rounded-lg border border-orange-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-orange-300">Character References</h3>
          <p className="text-sm text-gray-400 mt-1">
            Generate consistent character images for better shot quality
          </p>
        </div>
        {hasUngenerated && (
          <button
            onClick={generateAllCharacters}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition"
          >
            Generate All Characters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {storyStore.story.characters.map((character, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
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
                  {character.prompt && (
                    <button
                      onClick={() => generateCharacterImage(index)}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-orange-600/90 hover:bg-orange-700 rounded text-xs transition"
                      title="Regenerate character image"
                    >
                      🔄 Regenerate
                    </button>
                  )}
                </>
              ) : character.prompt ? (
                <button
                  onClick={() => generateCharacterImage(index)}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-sm rounded transition"
                >
                  Generate
                </button>
              ) : (
                <div className="text-center text-gray-500 text-xs p-2">
                  No visual description
                </div>
              )}
            </div>

            {/* Character Info */}
            <h4 className="font-semibold text-sm mb-1">{character.name}</h4>
            <p className="text-xs text-gray-400 line-clamp-2">
              {character.description}
            </p>

            {character.referenceImageUrl && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                <span>✓</span>
                <span>Reference Ready</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {storyStore.story.characters.every(c => c.referenceImageUrl) && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-300">
          ✓ All characters generated! Shots will use these references for consistency.
        </div>
      )}
    </div>
  );
});

export default CharacterGenerator;
