
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AppMode, 
  Drug, 
  QuizStats, 
  Settings, 
  AnkiRating,
  QuizStat
} from './types';
import { 
  SYSTEM_CATEGORIES, 
  DEFAULT_DRUGS 
} from './constants';
import { 
  loadStats, 
  saveStats, 
  loadSettings, 
  saveSettings, 
  loadHistory, 
  saveHistory 
} from './services/storageService';
import { 
  Search, 
  BookOpen, 
  GraduationCap, 
  Settings as SettingsIcon, 
  BarChart3, 
  Volume2, 
  Database,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Sub-components
import QuizView from './components/QuizView';
import FlashcardView from './components/FlashcardView';
import SearchView from './components/SearchView';
import SettingsPanel from './components/SettingsPanel';
import ProgressModal from './components/ProgressModal';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('search');
  const [drugs, setDrugs] = useState<Drug[]>(DEFAULT_DRUGS);
  const [stats, setStats] = useState<QuizStats>(loadStats());
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [history, setHistory] = useState<string[]>(loadHistory());
  const [systemFilter, setSystemFilter] = useState<string>('All');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Load Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Fullscreen Logic
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // CSV Parsing
  const parseCSV = (csvText: string): Drug[] => {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') { currentField += '"'; i++; }
      else if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { currentLine.push(currentField.trim()); currentField = ''; }
      else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (currentField || currentLine.length > 0) {
          currentLine.push(currentField.trim());
          lines.push(currentLine);
          currentLine = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') i++;
      } else { currentField += char; }
    }
    if (currentField || currentLine.length > 0) { currentLine.push(currentField.trim()); lines.push(currentLine); }
    if (lines.length < 2) return [];
    const headers = lines[0].map(h => h.toLowerCase().trim());
    return lines.slice(1).map(row => {
      const drug: any = {};
      headers.forEach((header, index) => {
        let key = header;
        if (header.includes('side')) key = 'SideEffects';
        if (header.includes('nurse') || header.includes('nursing')) key = 'nursing';
        if (header.includes('indica')) key = 'indication';
        drug[key] = row[index] || '';
      });
      return drug as Drug;
    }).filter(d => d && d.name);
  };

  const fetchSheetData = useCallback(async () => {
    if (!settings.googleSheetUrl) return;
    setIsLoadingSheet(true);
    try {
      const response = await fetch(settings.googleSheetUrl);
      const csvText = await response.text();
      const parsedDrugs = parseCSV(csvText);
      if (parsedDrugs.length > 0) setDrugs(parsedDrugs);
    } catch (error) { console.error(error); } finally { setIsLoadingSheet(false); }
  }, [settings.googleSheetUrl]);

  const syncDrugToScript = async (newDrug: Drug) => {
    if (!settings.googleScriptUrl || !newDrug || !newDrug.name) return;
    setSyncStatus('syncing');
    try {
      await fetch(settings.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDrug),
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
      fetchSheetData();
    } catch (error) { setSyncStatus('error'); setTimeout(() => setSyncStatus('idle'), 3000); }
  };

  useEffect(() => { fetchSheetData(); }, [fetchSheetData]);

  const srsCategories = useMemo(() => {
    const now = new Date();
    const categories = { new: [] as Drug[], learning: [] as Drug[], due: [] as Drug[], all: [] as Drug[] };
    drugs.forEach(drug => {
      if (!drug || !drug.name) return;
      const s = stats[drug.name];
      if (!s || s.attempts === 0 || s.state === 'new') categories.new.push(drug);
      else if (s.state === 'learning') categories.learning.push(drug);
      else if (s.state === 'review') {
        const nextDate = new Date(s.nextReviewDate);
        if (nextDate <= now) categories.due.push(drug);
      }
      categories.all.push(drug);
    });
    return categories;
  }, [drugs, stats]);

  const flashcardQueue = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newStartedToday = Object.values(stats).filter(s => s && s.lastRatedDate === todayStr && s.attempts === 1).length;
    const newLimit = Math.max(0, settings.newCardsPerDay - newStartedToday);
    const reviews = srsCategories.due.slice(0, settings.reviewsPerDay);
    const learning = srsCategories.learning;
    const news = srsCategories.new.slice(0, newLimit);
    return [...learning, ...reviews, ...news];
  }, [srsCategories, settings, stats]);

  const handleAnkiRate = (drug: Drug, rating: AnkiRating) => {
    if (!drug || !drug.name) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentStat: QuizStat = stats[drug.name] || { 
      correct: 0, attempts: 0, weight: 10, interval: 0, easeFactor: 2.5,
      nextReviewDate: now.toISOString(), state: 'new'
    };
    const newStats = { ...stats };
    let { interval, easeFactor, state, attempts, correct } = currentStat;
    attempts++;
    if (rating === 'again') {
      state = 'learning'; interval = 0; easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
      correct++;
      if (state === 'new' || state === 'learning') {
        state = 'review'; interval = rating === 'easy' ? 4 : 1;
      } else {
        if (rating === 'hard') { interval = Math.max(1, Math.floor(interval * 1.2)); easeFactor = Math.max(1.3, easeFactor - 0.15); }
        else if (rating === 'good') { interval = Math.max(1, Math.floor(interval * easeFactor)); }
        else if (rating === 'easy') { interval = Math.max(1, Math.floor(interval * easeFactor * 1.3)); easeFactor += 0.15; }
      }
    }
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    newStats[drug.name] = { ...currentStat, attempts, correct, state, interval, easeFactor, nextReviewDate: nextReview.toISOString(), lastRatedDate: todayStr };
    setStats(newStats);
    saveStats(newStats);
  };

  const speak = useCallback((text: string) => {
    if (!text || settings.isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find selected voice
    const selectedVoice = voices.find(v => v.name === settings.preferredVoice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // Fallback logic
      if (settings.aiLanguage !== 'english') utterance.lang = 'zh-HK';
      else utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.speak(utterance);
  }, [settings, voices]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 overflow-hidden font-sans safe-pt safe-pb">
      <header className="flex-none bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h1 className="text-lg font-black tracking-tight">AI Drug Tutor</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsProgressOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><BarChart3 className="w-5 h-5" /></button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><SettingsIcon className="w-5 h-5" /></button>
        </div>
      </header>

      <nav className="flex-none bg-white border-b flex justify-around shadow-sm z-30">
        <Tab icon={<Search />} label="Search" active={mode === 'search'} onClick={() => setMode('search')} />
        <Tab icon={<BookOpen />} label="Anki" active={mode === 'flashcards'} onClick={() => setMode('flashcards')} />
        <Tab icon={<GraduationCap />} label="Quiz" active={mode === 'quiz'} onClick={() => setMode('quiz')} />
      </nav>

      {mode === 'quiz' && (
        <div className="flex-none bg-slate-100 px-4 py-1.5 flex gap-2 border-b overflow-x-auto scrollbar-hide">
          <select value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)} className="text-[10px] font-black bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none">
            <option value="All">All Systems</option>
            {SYSTEM_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        {mode === 'search' && (
          <div className="h-full overflow-y-auto p-4 scroll-smooth scrollbar-hide">
            <SearchView allDrugs={drugs} history={history} settings={settings} onUpdateHistory={(h) => {setHistory(h); saveHistory(h);}} onSaveDrug={syncDrugToScript} speak={speak} />
          </div>
        )}
        {mode === 'flashcards' && (
          <div className="h-full flex flex-col p-4">
            <FlashcardView drugs={flashcardQueue} settings={settings} onRate={handleAnkiRate} speak={speak} />
          </div>
        )}
        {mode === 'quiz' && (
          <div className="h-full overflow-y-auto p-4 scrollbar-hide">
            <QuizView drugs={drugs.filter(d => d && (systemFilter === 'All' || d.system === systemFilter))} stats={stats} onUpdateStats={(s) => {setStats(s); saveStats(s);}} settings={settings} speak={speak} />
          </div>
        )}
      </main>

      {isSettingsOpen && <SettingsPanel voices={voices} settings={settings} onSave={(s) => {setSettings(s); saveSettings(s); setIsSettingsOpen(false);}} onClose={() => setIsSettingsOpen(false)} />}
      {isProgressOpen && <ProgressModal stats={stats} onClose={() => setIsProgressOpen(false)} />}
    </div>
  );
};

const Tab = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center py-2.5 border-b-2 transition-all ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
    {React.cloneElement(icon, { className: 'w-5 h-5 mb-0.5' })}
    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
  </button>
);

export default App;
