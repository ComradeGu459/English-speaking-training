export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PLAYER = 'PLAYER',
  FLASHCARDS = 'FLASHCARDS',
  SETTINGS = 'SETTINGS'
}

export interface Subtitle {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  translation: string; // Chinese translation
  speaker?: string;
}

export interface VideoContent {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  date: string;
  description: string;
  subtitles: Subtitle[];
}

export interface WordDefinition {
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  type: string;
}

export interface Flashcard extends WordDefinition {
  id: string;
  sourceVideoId: string;
  timestamp: number;
}