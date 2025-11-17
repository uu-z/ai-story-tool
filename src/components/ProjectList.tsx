'use client';

import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { projectDB, StoredProject } from '@/lib/projectDB';
import { storyStore } from '@/stores/StoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import { getProjectStats } from '@/utils/projectIO';

interface ProjectListProps {
  onClose: () => void;
  currentProjectId: string | null;
  onProjectLoad: (projectId: string) => void;
}

const ProjectList = observer(({ onClose, currentProjectId, onProjectLoad }: ProjectListProps) => {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const allProjects = await projectDB.getAllProjects();
      setProjects(allProjects);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = async (project: StoredProject) => {
    try {
      // Load project data into stores
      storyStore.setStory(project.data.story);
      storyStore.setCurrentStep(project.data.currentStep);

      // Load settings if available
      if (project.data.settings) {
        // Merge settings without overwriting API keys
        settingsStore.updateGeneralSettings({
          defaultStyle: project.data.settings.defaultStyle,
          defaultAspectRatio: project.data.settings.defaultAspectRatio,
          enableAudio: project.data.settings.enableAudio,
        });

        if (project.data.settings.textModel) {
          settingsStore.updateTextModel({
            provider: project.data.settings.textModel.provider,
            modelId: project.data.settings.textModel.modelId,
            temperature: project.data.settings.textModel.temperature,
            maxTokens: project.data.settings.textModel.maxTokens,
          });
        }

        if (project.data.settings.imageModel) {
          settingsStore.updateImageModel({
            provider: project.data.settings.imageModel.provider,
            modelId: project.data.settings.imageModel.modelId,
          });
        }

        if (project.data.settings.videoModel) {
          settingsStore.updateVideoModel({
            provider: project.data.settings.videoModel.provider,
            modelId: project.data.settings.videoModel.modelId,
          });
        }
      }

      onProjectLoad(project.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to load project:', err);
      alert(`Failed to load project: ${err.message}`);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Confirm delete project "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await projectDB.deleteProject(projectId);
      await loadProjects();

      // If deleted project was current, clear it
      if (projectId === currentProjectId) {
        onProjectLoad('');
      }
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const newId = await projectDB.duplicateProject(projectId);
      await loadProjects();
      alert('✅ Project duplicated');
    } catch (err: any) {
      console.error('Failed to duplicate project:', err);
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">💾 Local Projects</h2>
            <p className="text-sm text-gray-400 mt-1">
              {projects.length} projects saved in browser
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="spinner mb-4"></div>
                <p className="text-gray-400">Loading projects...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg text-sm text-red-300">
              ❌ {error}
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No saved projects yet</p>
              <p className="text-sm text-gray-500">
                Save current project in project management, or new projects will be auto-saved
              </p>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => {
                const stats = getProjectStats(project.data.story);
                const isActive = project.id === currentProjectId;
                const projectSize = JSON.stringify(project).length;

                return (
                  <div
                    key={project.id}
                    className={`bg-gray-800 rounded-lg p-4 border-2 transition ${
                      isActive
                        ? 'border-yellow-500 bg-gray-800/80'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {project.name}
                          {isActive && (
                            <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                              Current
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Updated {formatDate(project.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>🎬</span>
                        <span>{stats.totalScenes} scenes / {stats.totalShots} shots</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>🎨</span>
                        <span>{stats.shotsWithImages} images</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>🎥</span>
                        <span>{stats.shotsWithVideos} videos</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>👥</span>
                        <span>{stats.characterCount} characters</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      Size: {formatSize(projectSize)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadProject(project)}
                        disabled={isActive}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition text-sm font-medium"
                      >
                        {isActive ? '✓ Loaded' : '📂 Open'}
                      </button>
                      <button
                        onClick={() => handleDuplicateProject(project.id)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
                        title="Duplicate project"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="px-3 py-2 bg-red-900 hover:bg-red-800 rounded-lg transition text-sm"
                        title="Delete project"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800 bg-gray-800/50">
          <div className="text-sm text-gray-400">
            💡 Projects are saved in browser IndexedDB, clearing browser data will cause loss
          </div>
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

export default ProjectList;
