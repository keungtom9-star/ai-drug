
export interface Drug {
  name: string;
  class: string;
  system: string;
  indication: string;
  SideEffects: string;
  nursing: string;
  id?: string;
}

export type MasteryLevel = 'Focus' | 'Learning' | 'Mastered';

export interface QuizStat {
  correct: number;
  attempts: number;
  weight: number;
  // SRS Fields
  interval: number; // in days
  easeFactor: number; // default 2.5
  nextReviewDate: string; // ISO string
  state: 'new' | 'learning' | 'review';
  lastRatedDate?: string;
}

export interface QuizStats {
  // Relaxed index signature to allow the _global metadata property alongside drug names
  [drugName: string]: any;
  _global?: {
    totalXP: number;
    highestStreak: number;
    currentLevel: number;
  };
}


export type AppMode = 'search' | 'flashcards' | 'quiz';

export type AILanguage = 'english' | 'cantonese' | 'lihkg';

// Simplified Engine Type
export type AIEngine = 'deepseek'; 

export interface Settings {
  aiLanguage: AILanguage;
  isMuted: boolean;
  preferredVoice: string;
  googleSheetUrl: string;
  googleScriptUrl: string;
  aiEngine: AIEngine;
  deepSeekApiKey: string; // Ensure this is the primary key field
  // SRS Limits
  newCardsPerDay: number;
  reviewsPerDay: number;
}

export type AnkiRating = 'again' | 'hard' | 'good' | 'easy';