
import React, { useState } from 'react';
import { Settings, AILanguage, AIEngine } from '../types';
import { X, Save, Volume2, Globe, Database, Cpu, ShieldCheck, Zap, Speaker, Key, Link } from 'lucide-react';

interface SettingsPanelProps {
  settings: Settings;
  voices: SpeechSynthesisVoice[];
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, voices, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<Settings>({ ...settings });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 px-6 py-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6" />
            <h2 className="text-xl font-black tracking-tight text-white">Clinical Platform Config</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 scrollbar-hide bg-white">
          {/* Voice Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Speaker className="w-4 h-4" />
              <label className="text-[10px] font-black uppercase tracking-widest">Voice Synthesis</label>
            </div>
            <select 
              value={localSettings.preferredVoice}
              onChange={(e) => setLocalSettings({ ...localSettings, preferredVoice: e.target.value })}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-xs font-bold focus:border-indigo-500 outline-none"
            >
              <option value="">Default (Auto-select by language)</option>
              {voices.map(voice => <option key={voice.name + voice.lang} value={voice.name}>{voice.name} ({voice.lang})</option>)}
            </select>
          </section>

          {/* AI Engine & API Keys */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
              <label className="text-[10px] font-black uppercase tracking-widest">AI Intelligence</label>
            </div>
            <div className="flex gap-2">
              {(['gemini', 'deepseek'] as AIEngine[]).map(engine => (
                <button 
                  key={engine}
                  onClick={() => setLocalSettings({ ...localSettings, aiEngine: engine })}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black capitalize border-2 transition-all ${localSettings.aiEngine === engine ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  {engine}
                </button>
              ))}
            </div>
            {localSettings.aiEngine === 'deepseek' && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Key className="w-3 h-3" /> DeepSeek API Key</p>
                <input 
                  type="password" 
                  value={localSettings.deepSeekApiKey}
                  onChange={(e) => setLocalSettings({ ...localSettings, deepSeekApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </section>

          {/* Database Sync */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-indigo-600">
              <Database className="w-4 h-4" />
              <label className="text-[10px] font-black uppercase tracking-widest">Cloud Database Sync</label>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Link className="w-3 h-3" /> Sheet CSV URL</p>
                <input 
                  type="text" 
                  value={localSettings.googleSheetUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, googleSheetUrl: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-4 text-[10px] font-bold outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Script Exec URL</p>
                <input 
                  type="text" 
                  value={localSettings.googleScriptUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, googleScriptUrl: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-4 text-[10px] font-bold outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t flex gap-3">
          <button onClick={() => onSave(localSettings)} className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm hover:bg-indigo-700 shadow-xl flex items-center justify-center gap-2 transition-all">
            <Save className="w-5 h-5" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
