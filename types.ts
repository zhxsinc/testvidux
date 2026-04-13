export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  category: 'marketing' | 'social' | 'education' | 'entertainment';
}

export enum WorkflowStep {
  INPUT = 'INPUT',
  PLANNING = 'PLANNING',
  IMAGES = 'IMAGES',
  GENERATING_VIDEOS = 'GENERATING_VIDEOS',
  RESULT = 'RESULT',
}

export interface ScriptScene {
  sceneNumber: number;
  visual: string;
  audio: string;
  duration: number;
  imageUrl?: string;
  videoUrl?: string;
}

export interface GeneratedScript {
  title: string;
  language: string;
  suggestedAvatar: string;
  suggestedVoice: string;
  scenes: ScriptScene[];
}

// Augment window for AI Studio key selection
declare global {
  // We extend the existing AIStudio interface (defined in environment types)
  // to ensure these methods are typed, instead of redeclaring window.aistudio
  // which causes conflicts.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}