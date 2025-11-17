/**
 * IndexedDB wrapper for local project storage
 * Allows saving multiple projects locally
 */

import { StoryData } from '@/stores/StoryStore';
import { ProjectData } from '@/utils/projectIO';

const DB_NAME = 'AIStoryTool';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

export interface StoredProject {
  id: string;
  name: string;
  data: ProjectData;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Optional base64 thumbnail
}

class ProjectDB {
  private db: IDBDatabase | null = null;

  /**
   * Initialize database connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Create indexes for faster queries
          objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          objectStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure DB is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Serialize data to make it IndexedDB-safe
   * Removes functions, circular references, and other non-cloneable objects
   */
  private serializeData<T>(data: T): T {
    try {
      // Use JSON stringify/parse to create a deep clone and remove non-cloneable objects
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.error('Failed to serialize data:', error);
      throw new Error('Data contains non-serializable objects');
    }
  }

  /**
   * Save a project to IndexedDB
   */
  async saveProject(
    story: StoryData,
    currentStep: 'input' | 'review' | 'storyboard' | 'edit',
    settings?: any,
    projectId?: string
  ): Promise<string> {
    const db = await this.ensureDB();
    const id = projectId || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // Serialize data to ensure it's IndexedDB-safe
    const cleanStory = this.serializeData(story);
    const cleanSettings = settings ? this.serializeData(settings) : undefined;

    const projectData: ProjectData = {
      version: '1.0.0',
      timestamp: now,
      story: cleanStory,
      currentStep,
      settings: cleanSettings,
      metadata: {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
      },
    };

    const storedProject: StoredProject = {
      id,
      name: cleanStory.title || 'Untitled Project',
      data: projectData,
      createdAt: projectId ? (await this.getProject(projectId))?.createdAt || now : now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(storedProject);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = (event) => {
        console.error('IndexedDB put error:', event);
        reject(new Error('Failed to save project to IndexedDB'));
      };
    });
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<StoredProject | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get project'));
      };
    });
  }

  /**
   * Get all projects, sorted by last updated
   */
  async getAllProjects(): Promise<StoredProject[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev'); // Sort by updatedAt DESC

      const projects: StoredProject[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          projects.push(cursor.value);
          cursor.continue();
        } else {
          resolve(projects);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to get projects'));
      };
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete project'));
      };
    });
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(id: string): Promise<string> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error('Project not found');
    }

    const newId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const duplicatedProject: StoredProject = {
      ...project,
      id: newId,
      name: `${project.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(duplicatedProject);

      request.onsuccess = () => {
        resolve(newId);
      };

      request.onerror = () => {
        reject(new Error('Failed to duplicate project'));
      };
    });
  }

  /**
   * Clear all projects (with confirmation)
   */
  async clearAllProjects(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear projects'));
      };
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalProjects: number;
    totalSize: number; // Approximate size in bytes
  }> {
    const projects = await this.getAllProjects();
    const totalSize = JSON.stringify(projects).length;

    return {
      totalProjects: projects.length,
      totalSize,
    };
  }
}

// Singleton instance
export const projectDB = new ProjectDB();
