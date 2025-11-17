'use client';

import { observer } from 'mobx-react-lite';
import { storyStore } from '@/stores/StoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import { useState, useRef } from 'react';
import { exportProject, importProject, isValidProjectFile, getProjectStats } from '@/utils/projectIO';
import { projectDB } from '@/lib/projectDB';
import ProjectList from './ProjectList';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string | null;
  onProjectIdChange: (id: string) => void;
}

const ProjectManager = observer(({ isOpen, onClose, currentProjectId, onProjectIdChange }: ProjectManagerProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  if (showProjectList) {
    return (
      <ProjectList
        onClose={() => setShowProjectList(false)}
        currentProjectId={currentProjectId}
        onProjectLoad={(id) => {
          onProjectIdChange(id);
          onClose();
        }}
      />
    );
  }

  const handleSaveLocal = async () => {
    try {
      const projectId = await projectDB.saveProject(
        storyStore.story,
        storyStore.currentStep,
        settingsStore.settings,
        currentProjectId || undefined
      );
      onProjectIdChange(projectId);
      alert('✅ Project saved to local storage!');
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`❌ Save failed: ${error.message}`);
    }
  };

  const handleExport = async () => {
    try {
      await exportProject(
        storyStore.story,
        storyStore.currentStep,
        settingsStore.settings
      );
      alert('✅ Project exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`❌ Export failed: ${error.message}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidProjectFile(file.name)) {
      setImportError('Please select a valid project file (.open-story-video.json)');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const projectData = await importProject(file);

      // Confirm before overwriting current project
      const stats = getProjectStats(projectData.story);
      const message = `Confirm import project?

Project Information:
• Title: ${projectData.story.title || 'Untitled'}
• Scenes: ${stats.totalScenes}
• Shots: ${stats.totalShots}
• Generated Images: ${stats.shotsWithImages}
• Generated Videos: ${stats.shotsWithVideos}
• Characters: ${stats.characterCount}

Current project will be overwritten, continue?`;

      if (!confirm(message)) {
        setIsImporting(false);
        return;
      }

      // Import project data
      storyStore.setStory(projectData.story);
      storyStore.setCurrentStep(projectData.currentStep);

      // Import settings (merge with existing, don't overwrite API keys)
      if (projectData.settings) {
        settingsStore.updateGeneralSettings({
          defaultStyle: projectData.settings.defaultStyle || settingsStore.settings.defaultStyle,
          defaultAspectRatio: projectData.settings.defaultAspectRatio || settingsStore.settings.defaultAspectRatio,
          enableAudio: projectData.settings.enableAudio ?? settingsStore.settings.enableAudio,
        });

        // Update model selections (but keep existing API keys)
        if (projectData.settings.textModel) {
          settingsStore.updateTextModel({
            provider: projectData.settings.textModel.provider,
            modelId: projectData.settings.textModel.modelId,
            temperature: projectData.settings.textModel.temperature,
            maxTokens: projectData.settings.textModel.maxTokens,
          });
        }

        if (projectData.settings.imageModel) {
          settingsStore.updateImageModel({
            provider: projectData.settings.imageModel.provider,
            modelId: projectData.settings.imageModel.modelId,
          });
        }

        if (projectData.settings.videoModel) {
          settingsStore.updateVideoModel({
            provider: projectData.settings.videoModel.provider,
            modelId: projectData.settings.videoModel.modelId,
          });
        }

        if (projectData.settings.voiceModel) {
          settingsStore.updateVoiceModel({
            provider: projectData.settings.voiceModel.provider,
            voiceId: projectData.settings.voiceModel.voiceId,
            model: projectData.settings.voiceModel.model,
            speed: projectData.settings.voiceModel.speed,
            stability: projectData.settings.voiceModel.stability,
            similarityBoost: projectData.settings.voiceModel.similarityBoost,
          });
        }
      }

      alert('✅ Project imported successfully!');
      onClose();
    } catch (error: any) {
      console.error('Import error:', error);
      setImportError(error.message);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const currentStats = getProjectStats(storyStore.story);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">📦 Project Management</h2>
            <p className="text-sm text-gray-400 mt-1">
              Import or export complete projects
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Project Stats */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Current Project</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Title</span>
                <span className="font-medium">{storyStore.story.title || 'Untitled'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Scenes/Shots</span>
                <span className="font-medium">{currentStats.totalScenes} / {currentStats.totalShots}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Generated Images</span>
                <span className="font-medium text-green-400">{currentStats.shotsWithImages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Generated Videos</span>
                <span className="font-medium text-blue-400">{currentStats.shotsWithVideos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">With Audio</span>
                <span className="font-medium text-purple-400">{currentStats.shotsWithAudio}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Characters</span>
                <span className="font-medium">{currentStats.characterCount} ({currentStats.charactersWithImages} with reference images)</span>
              </div>
            </div>
          </div>

          {/* Local Storage Section */}
          <div className="space-y-3">
            <h3 className="font-semibold">💾 Local Storage</h3>
            <p className="text-sm text-gray-400">
              Save projects in browser storage, supports multi-project management
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSaveLocal}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                💾 Save Locally
              </button>
              <button
                onClick={() => setShowProjectList(true)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                📂 Manage Projects
              </button>
            </div>
            <div className="text-xs text-blue-400 bg-blue-900/20 border border-blue-700/30 rounded p-3">
              ✨ Uses IndexedDB local storage, no internet required, supports quick project switching
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <h3 className="font-semibold">📥 Export/Import Files</h3>
            <p className="text-sm text-gray-400">
              Save projects as JSON files for sharing or backup
            </p>
            <button
              onClick={handleExport}
              className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              📥 Export as File
            </button>
            <div className="text-xs text-gray-500 bg-gray-800/50 rounded p-3">
              💡 Note: API Keys are not exported, need to reconfigure when importing
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <h3 className="font-semibold">Import Project</h3>
            <p className="text-sm text-gray-400">
              Restore projects from previously exported JSON files
            </p>

            {importError && (
              <div className="p-3 bg-red-900/20 border border-red-700/30 rounded text-sm text-red-300">
                ❌ {importError}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.open-story-video.json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {isImporting ? '⏳ Importing...' : '📤 Select Project File'}
            </button>

            <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
              ⚠️ Import will overwrite current project, make sure to save current work
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProjectManager;
