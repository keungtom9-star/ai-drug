
import { QuizStats, Settings, Drug } from '../types';

const STATS_KEY = 'drug_tutor_quiz_stats_v2';
const SETTINGS_KEY = 'drug_tutor_settings_v2';
const HISTORY_KEY = 'drug_tutor_history_v2';

export const saveStats = (stats: QuizStats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const loadStats = (): QuizStats => {
  const saved = localStorage.getItem(STATS_KEY);
  return saved ? JSON.parse(saved) : {};
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): Settings => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : {
    aiLanguage: 'lihkg',
    isMuted: false,
    activeProvider: 'gemini',
    preferredVoice: '',
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhyG6Wkv36DnsJBQ1V2MqJFm9T7iguC0rYxKqc-jhNaDoN7Wweu9lo6KzES-l76YRFP2PQgMf7APIt/pub?gid=1128575640&single=true&output=csv',
    googleScriptUrl: 'https://script.google.com/macros/s/AKfycbxyNPyjbVXDMTQxFPxEuuCDTNNf-iVFfqedfNbh-kgn6Tk9rSIFEfIaLWXxXZoNOVnWug/exec',
    aiEngine: 'gemini',
    deepSeekApiKey: '',
    newCardsPerDay: 5,
    reviewsPerDay: 20
  };
};

export const saveHistory = (history: string[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const loadHistory = (): string[] => {
  const saved = localStorage.getItem(HISTORY_KEY);
  return saved ? JSON.parse(saved) : [];
};
