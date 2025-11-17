"use client";

import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { storyStore } from "@/stores/StoryStore";
import { settingsStore } from "@/stores/SettingsStore";
import { projectDB } from "@/lib/projectDB";
import StoryForm from "@/components/StoryForm";
import CharacterConfirmation from "@/components/CharacterConfirmation";
import StoryReview from "@/components/StoryReview";
import Storyboard from "@/components/Storyboard";
import EditView from "@/components/EditView";
import ExportView from "@/components/ExportView";
import SettingsPanel from "@/components/SettingsPanel";
import ProjectManager from "@/components/ProjectManager";

const HomePage = observer(() => {
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save function with debounce
  const autoSave = async () => {
    if (!storyStore.story.title) return;
    if (isSaving) return; // Prevent concurrent saves

    setIsSaving(true);
    try {
      const projectId = await projectDB.saveProject(
        storyStore.story,
        storyStore.currentStep,
        settingsStore.settings,
        currentProjectId || undefined
      );
      if (!currentProjectId) {
        setCurrentProjectId(projectId);
      }
      setLastSaved(new Date());
      console.log("✅ Auto-saved at", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save on story changes (debounced)
  useEffect(() => {
    if (!storyStore.story.title) return;

    const timeoutId = setTimeout(() => {
      autoSave();
    }, 3000); // Save 3 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [storyStore.story, storyStore.currentStep, currentProjectId]);

  // Initial DB setup
  useEffect(() => {
    projectDB.init().catch(console.error);
  }, []);

  const renderStep = () => {
    switch (storyStore.currentStep) {
      case "input":
        return <StoryForm />;
      case "review":
        return <StoryReview />;
      case "storyboard":
        return <Storyboard />;
      case "edit":
        return <EditView />;
      default:
        return <StoryForm />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">AI Story Tool</h1>
            {storyStore.story.title && (
              <div className="flex items-center gap-2 text-xs">
                {isSaving ? (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <span className="animate-spin">⏳</span> Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="text-green-400 flex items-center gap-1">
                    ✅ Saved {formatTimeSince(lastSaved)}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {storyStore.story.title && (
              <div className="flex gap-2">
                <StepIndicator
                  step={1}
                  label="Storyboard"
                  active={storyStore.currentStep === "storyboard"}
                  completed={storyStore.getAllShots().some((s) => s.imageUrl)}
                />
                <StepIndicator
                  step={2}
                  label="Animation"
                  active={storyStore.currentStep === "edit"}
                  completed={storyStore
                    .getAllShots()
                    .some((s) => s.animationUrl)}
                />
                <StepIndicator
                  step={3}
                  label="Export"
                  active={false}
                  completed={false}
                />
              </div>
            )}

            <button
              onClick={() => setShowProjectManager(true)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
              title="Project Management"
            >
              <span>📦</span>
              <span className="hidden md:inline">Project</span>
            </button>

            <button
              onClick={() => settingsStore.toggleSettings()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
              title="Settings"
            >
              <span>⚙️</span>
              <span className="hidden md:inline">Settings</span>
            </button>

            {storyStore.story.title && (
              <button
                onClick={() => {
                  if (
                    confirm("Start new story? Current project will be cleared.")
                  ) {
                    storyStore.reset();
                  }
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                🔄 New Story
              </button>
            )}
          </div>
        </div>
      </header>

      <main>{renderStep()}</main>

      {/* Settings Panel */}
      <SettingsPanel />

      {/* Project Manager */}
      <ProjectManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
        currentProjectId={currentProjectId}
        onProjectIdChange={setCurrentProjectId}
      />
    </div>
  );
});

const StepIndicator = ({
  step,
  label,
  active,
  completed,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
          active
            ? "bg-yellow-500 text-black"
            : completed
            ? "bg-green-600 text-white"
            : "bg-gray-700 text-gray-400"
        }`}
      >
        {completed && !active ? "✓" : step}
      </div>
      <span
        className={`text-sm font-medium ${
          active
            ? "text-yellow-500"
            : completed
            ? "text-green-500"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

// Helper function to format time since last save
function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default HomePage;
