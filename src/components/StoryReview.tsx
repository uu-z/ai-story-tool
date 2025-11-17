'use client';

import { observer } from 'mobx-react-lite';
import { storyStore } from '@/stores/StoryStore';
import { useState } from 'react';

const StoryReview = observer(() => {
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editingShot, setEditingShot] = useState<string | null>(null);

  const handleApprove = () => {
    storyStore.setCurrentStep('storyboard');
  };

  const handleRegenerate = () => {
    if (confirm('Regenerate story? Current content will be overwritten.')) {
      storyStore.reset();
    }
  };

  const updateShot = (sceneId: string, shotId: string, field: string, value: string) => {
    storyStore.updateShot(sceneId, shotId, { [field]: value });
  };

  const updateScene = (sceneId: string, field: string, value: string) => {
    storyStore.updateScene(sceneId, { [field]: value });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📝 Story Review</h1>
        <p className="text-gray-400">
          Please review the AI-generated story script. You can edit directly, then click "Confirm to Storyboard" when ready
        </p>
      </div>

      {/* Story Info */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Story Title</label>
          <input
            type="text"
            value={storyStore.story.title}
            onChange={(e) => storyStore.setStory({ title: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Story Synopsis</label>
          <textarea
            value={storyStore.story.synopsis}
            onChange={(e) => storyStore.setStory({ synopsis: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Visual Style</label>
            <select
              value={storyStore.story.style}
              onChange={(e) => storyStore.setStory({ style: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
            >
              <option value="3D Cartoon">3D Cartoon</option>
              <option value="Anime">Anime</option>
              <option value="Realistic">Realistic</option>
              <option value="Pixar Style">Pixar Style</option>
              <option value="Oil Painting">Oil Painting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <select
              value={storyStore.story.aspectRatio}
              onChange={(e) => storyStore.setStory({ aspectRatio: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3 (Standard)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Characters */}
      {storyStore.story.characters.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Character Settings</h2>
          <div className="space-y-4">
            {storyStore.story.characters.map((character, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Character Name</label>
                    <input
                      type="text"
                      value={character.name}
                      onChange={(e) =>
                        storyStore.updateCharacter(index, { name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Character Description</label>
                    <input
                      type="text"
                      value={character.description}
                      onChange={(e) =>
                        storyStore.updateCharacter(index, { description: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-2">Visual Description (for character image generation)</label>
                  <textarea
                    value={character.prompt || ''}
                    onChange={(e) =>
                      storyStore.updateCharacter(index, { prompt: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenes */}
      <div className="space-y-6 mb-6">
        {storyStore.story.scenes.map((scene) => (
          <div key={scene.id} className="bg-gray-900 rounded-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Scene Title</label>
              <input
                type="text"
                value={scene.title}
                onChange={(e) => updateScene(scene.id, 'title', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Scene Description</label>
              <textarea
                value={scene.description}
                onChange={(e) => updateScene(scene.id, 'description', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
              />
            </div>

            {/* Shots */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">Shots ({scene.shots.length})</h3>
              {scene.shots.map((shot) => (
                <div
                  key={shot.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-400">
                        Shot Subtitle
                      </label>
                      <input
                        type="text"
                        value={shot.subtitle}
                        onChange={(e) =>
                          updateShot(scene.id, shot.id, 'subtitle', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1 text-gray-400">
                        Scene Location
                      </label>
                      <input
                        type="text"
                        value={shot.location}
                        onChange={(e) =>
                          updateShot(scene.id, shot.id, 'location', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Shot Content Description
                    </label>
                    <textarea
                      value={shot.content}
                      onChange={(e) =>
                        updateShot(scene.id, shot.id, 'content', e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center sticky bottom-6 z-10">
        <button
          onClick={handleRegenerate}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-semibold flex items-center gap-2"
        >
          🔄 Regenerate Story
        </button>
        <button
          onClick={handleApprove}
          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition font-semibold flex items-center gap-2 shadow-lg"
        >
          ✅ Confirm to Storyboard
        </button>
      </div>
    </div>
  );
});

export default StoryReview;
