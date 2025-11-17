'use client';

import { storyStore } from '@/stores/StoryStore';
import exampleStory from '../../example-story.json';

export default function ImportExample() {
  const loadExample = () => {
    if (
      storyStore.story.title &&
      !confirm('This will replace your current story. Continue?')
    ) {
      return;
    }

    storyStore.setStory(exampleStory as any);
    alert('Example story loaded! Click Submit to continue to Storyboard.');
  };

  return (
    <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-300">Quick Start</h3>
          <p className="text-sm text-blue-400 mt-1">
            Load "The Little Match Girl" example to test the workflow
          </p>
        </div>
        <button
          onClick={loadExample}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm font-medium"
        >
          Load Example Story
        </button>
      </div>
    </div>
  );
}
