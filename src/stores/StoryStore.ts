import { makeAutoObservable } from 'mobx';

export interface Character {
  name: string;
  description: string;
  prompt?: string;
  referenceImageUrl?: string;  // Character reference image for consistency
  isGenerating?: boolean;       // Character image generation status
}

export interface Shot {
  id: string;
  subtitle: string;
  location: string;
  content: string;
  imageUrl?: string;
  isGenerating?: boolean;
  isAnimating?: boolean;
  animationUrl?: string;
  audioUrl?: string;
  isGeneratingAudio?: boolean;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  shots: Shot[];
}

export interface StoryData {
  title: string;
  synopsis: string;
  characters: Character[];
  scenes: Scene[];
  style?: string;
  aspectRatio?: string;
}

class StoryStore {
  story: StoryData = {
    title: '',
    synopsis: '',
    characters: [],
    scenes: [],
    style: '3D Cartoon',
    aspectRatio: '16:9',
  };

  currentStep: 'input' | 'review' | 'storyboard' | 'edit' = 'input';

  constructor() {
    makeAutoObservable(this);
  }

  setStory(story: Partial<StoryData>) {
    this.story = { ...this.story, ...story };
  }

  setCurrentStep(step: 'input' | 'review' | 'storyboard' | 'edit') {
    this.currentStep = step;
  }

  addCharacter(character: Character) {
    this.story.characters.push(character);
  }

  removeCharacter(index: number) {
    this.story.characters.splice(index, 1);
  }

  addScene(scene: Scene) {
    this.story.scenes.push(scene);
  }

  updateScene(sceneId: string, updates: Partial<Scene>) {
    const scene = this.story.scenes.find((s) => s.id === sceneId);
    if (scene) {
      Object.assign(scene, updates);
    }
  }

  updateShot(sceneId: string, shotId: string, updates: Partial<Shot>) {
    const scene = this.story.scenes.find((s) => s.id === sceneId);
    if (scene) {
      const shot = scene.shots.find((s) => s.id === shotId);
      if (shot) {
        Object.assign(shot, updates);
      }
    }
  }

  setGeneratingShot(sceneId: string, shotId: string, isGenerating: boolean) {
    this.updateShot(sceneId, shotId, { isGenerating });
  }

  setAnimatingShot(sceneId: string, shotId: string, isAnimating: boolean) {
    this.updateShot(sceneId, shotId, { isAnimating });
  }

  setGeneratingAudioShot(sceneId: string, shotId: string, isGeneratingAudio: boolean) {
    this.updateShot(sceneId, shotId, { isGeneratingAudio });
  }

  getAllShots(): Shot[] {
    return this.story.scenes.flatMap((scene) => scene.shots);
  }

  updateCharacter(index: number, updates: Partial<Character>) {
    if (this.story.characters[index]) {
      Object.assign(this.story.characters[index], updates);
    }
  }

  setGeneratingCharacter(index: number, isGenerating: boolean) {
    this.updateCharacter(index, { isGenerating });
  }

  getCharacterReferences(): Record<string, Character> {
    const refs: Record<string, Character> = {};
    this.story.characters.forEach(char => {
      if (char.referenceImageUrl) {
        refs[char.name] = char;
      }
    });
    return refs;
  }

  reset() {
    this.story = {
      title: '',
      synopsis: '',
      characters: [],
      scenes: [],
      style: '3D Cartoon',
      aspectRatio: '16:9',
    };
    this.currentStep = 'input';
  }
}

export const storyStore = new StoryStore();
