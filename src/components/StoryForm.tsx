"use client";

import { observer } from "mobx-react-lite";
import AIStoryGenerator from "./AIStoryGenerator";

const StoryForm = observer(() => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2"> AI Story Tool</h1>
      <p className="text-gray-400 mb-6">
        Load the example story to test subtitle and export features
      </p>

      <AIStoryGenerator />
    </div>
  );
});

export default StoryForm;
