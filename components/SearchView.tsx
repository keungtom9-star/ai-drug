
import React, { useState, useMemo } from 'react';
import { Search, Plus, Volume2, Sparkles, Loader2, Edit3, Save, X, ClipboardList, AlertTriangle, Stethoscope, Info, FileText, Globe, BookOpen, Layers, Database } from 'lucide-react';
import { Drug, Settings } from '../types';
import { SYSTEM_SHORT_NAMES, SYSTEM_ICONS, SYSTEM_CATEGORIES } from '../constants';
import { searchGlobalDrug, getAIContent } from '../services/aiService';
import { marked } from 'marked';

interface SearchViewProps {
  allDrugs: Drug[];
  history: string[];
  onUpdateHistory: (history: string[]) => void;
  onSaveDrug: (drug: Drug) => void;
  settings: Settings;
  speak: (text: string, lang?: string) => void;
}

const SearchView: React.FC<SearchViewProps> = ({ allDrugs, history, onUpdateHistory, onSaveDrug, settings, speak }) => {
  const [query, setQuery] = useState('');
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [editModalData, setEditModalData] = useState<Drug | null>(null);
  
  // Modals
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [insightData, setInsightData] = useState<{ title: string; content: string; drugName: string } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const localMatches = useMemo(() => {
    if (!query.trim()) return [];
    if (query === 'All') return allDrugs;
    const terms = query.split(';').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    return allDrugs.filter(d => {
      if (!d) return false;
      const name = d.name?.toLowerCase() || '';
      const cls = d.class?.toLowerCase() || '';
      const sys = d.system?.toLowerCase() || '';
      return terms.some(term => name.includes(term) || cls.includes(term) || sys.includes(term));
    });
  }, [allDrugs, query]);

  const handleRefineRequest = async (drug: Drug) => {
    setRefiningId(drug.name);
    try {
      const jsonStr = await getAIContent(drug, settings, 'edit', () => {});
      const updatedDrug = JSON.parse(jsonStr || '{}') as Drug;
      if (updatedDrug.name) {
        setEditModalData(updatedDrug);
      } else {
        throw new Error("AI returned invalid JSON structure.");
      }
    } catch (e: any) { 
      alert(e.message || "AI Edit failed. Check API key in settings.");
    } finally { 
      setRefiningId(null); 
    }
  };

  const handleGlobalSearch = async () => {
    if (!query.trim()) return;
    setIsSearchingGlobal(true);
    try {
      const drug = await searchGlobalDrug(query, settings);
      if (drug.name) {
        setEditModalData(drug);
      } else {
        throw new Error("AI could not find clinical data for this drug.");
      }
    } catch (e: any) {
      alert(e.message || "Global AI search failed.");
    } finally {
      setIsSearchingGlobal(false);
    }
  };

  const handleGoogleHK = (drugName: string) => {
    const url = `https://www.google.com.hk/search?q=${encodeURIComponent(drugName + " 中文 藥物 香港 醫學")}`;
    window.open(url, '_blank');
  };

  const handleAIInsight = async (drug: Drug, type: 'explain' | 'cheatsheet') => {
    setIsInsightLoading(true);
    const title = type === 'explain' ? 'Pharmacology Deep-Dive' : 'Ward Bedside Cheatsheet';
    setInsightData({ title, content: 'Tutor is processing...', drugName: drug.name });
    setIsSelectionModalOpen(false);
    try {
      await getAIContent(drug, settings, type, (text) => {
        setInsightData(prev => prev ? { ...prev, content: text } : null);
      });
    } catch (e: any) {
      setInsightData(prev => prev ? { ...prev, content: e.message || "AI Error." } : null);
    } finally {
      setIsInsightLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 h-full overflow-y-auto scrollbar-hide px-2">
      {/* Search Bar Hub */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md py-4">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" value={query === 'All' ? '' : query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Drug, Class or System..."
              className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-12 pr-12 shadow-sm focus:border-indigo-500 outline-none text-lg font-bold"
            />
            {query && <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer p-0.5 hover:bg-slate-100 rounded-full" onClick={() => setQuery('')} />}
          </div>
          {localMatches.length > 1 && (
            <button onClick={() => setIsSelectionModalOpen(true)} className="px-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-indigo-700 transition-all border-2 border-indigo-400 flex-shrink-0 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => setQuery('All')} className={`col-span-full py-3 rounded-xl font-black text-xs border-2 transition-all ${query === 'All' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-indigo-600 hover:border-indigo-200'}`}>BROWSE ALL DRUGS</button>
        {SYSTEM_CATEGORIES.slice(0, 8).map(sys => (
          <button key={sys} onClick={() => setQuery(sys)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left min-w-0 ${query === sys ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
            <span className="text-xl flex-shrink-0">{SYSTEM_ICONS[sys.split(' ')[0]] || '💊'}</span>
            <span className="text-[9px] font-black text-slate-700 uppercase leading-tight truncate">{SYSTEM_SHORT_NAMES[sys]}</span>
          </button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localMatches.map((drug, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-[2rem] shadow-xl flex flex-col p-6 space-y-4 hover:border-indigo-300 transition-all group relative overflow-hidden">
            {/* Top Row: Name and Action Hub */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-indigo-950 leading-tight break-words whitespace-normal">
                  {drug.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg uppercase tracking-wider inline-block">
                    {drug.class}
                  </span>
                  <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg uppercase tracking-wider inline-block">
                    {SYSTEM_SHORT_NAMES[drug.system] || drug.system}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 flex-shrink-0 bg-slate-50/50 p-1 rounded-2xl">
                <button onClick={() => handleRefineRequest(drug)} disabled={refiningId === drug.name} className="p-2.5 text-amber-600 hover:bg-amber-100 rounded-xl transition-all active:scale-90" title="AI Refine">
                  {refiningId === drug.name ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit3 className="w-5 h-5" />}
                </button>
                <button onClick={() => handleGoogleHK(drug.name)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all active:scale-90" title="Google HK Search">
                  <Globe className="w-5 h-5" />
                </button>
                <button onClick={() => speak(drug.name)} className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all active:scale-90" title="Speak">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-4 flex-1">
              <ResultDetail label="Indication" content={drug.indication} icon={<ClipboardList className="w-3.5 h-3.5 text-emerald-500" />} />
              <ResultDetail label="Nursing Care" content={drug.nursing} icon={<Stethoscope className="w-3.5 h-3.5 text-indigo-500" />} accent />
            </div>

            {/* Bottom Insight Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-50">
               <button onClick={() => handleAIInsight(drug, 'explain')} className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-100">
                 <BookOpen className="w-3 h-3" /> Explain
               </button>
               <button onClick={() => handleAIInsight(drug, 'cheatsheet')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                 <FileText className="w-3 h-3" /> Cheat
               </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {query && localMatches.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-xl flex flex-col items-center">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Database className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-indigo-950 mb-3 break-words max-w-full px-4 italic">"{query}"</h3>
            <p className="text-slate-500 mb-8 font-medium max-w-sm">Not found in local bank. Start a global AI hunt or check Hong Kong medical records?</p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button 
                onClick={handleGlobalSearch} 
                disabled={isSearchingGlobal}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                {isSearchingGlobal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                AI Global Hunt
              </button>
              
              <button 
                onClick={() => handleGoogleHK(query)}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Globe className="w-5 h-5" />
                Google HK (ZH)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals remain similarly structured but with full visibility focus */}
      {editModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-amber-500 p-8 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className="w-7 h-7 flex-shrink-0" />
                <h2 className="text-2xl font-black truncate">Refinement Hub</h2>
              </div>
              <button onClick={() => setEditModalData(null)} className="p-2 hover:bg-white/20 rounded-full flex-shrink-0 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 bg-slate-50/50 scrollbar-hide flex-1">
              <EditableField label="Name" value={editModalData.name} onChange={(v) => setEditModalData({...editModalData, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <EditableField label="Class" value={editModalData.class} onChange={(v) => setEditModalData({...editModalData, class: v})} />
                <EditableField label="System" value={editModalData.system} onChange={(v) => setEditModalData({...editModalData, system: v})} />
              </div>
              <EditableField label="Indication" value={editModalData.indication} onChange={(v) => setEditModalData({...editModalData, indication: v})} />
              <EditableField label="Side Effects" value={editModalData.SideEffects} onChange={(v) => setEditModalData({...editModalData, SideEffects: v})} />
              <EditableField label="Nursing" value={editModalData.nursing} onChange={(v) => setEditModalData({...editModalData, nursing: v})} accent />
            </div>
            <div className="p-8 bg-white border-t flex gap-4 flex-shrink-0">
              <button onClick={() => setEditModalData(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black text-sm transition-all active:scale-95">Discard</button>
              <button 
                onClick={() => { onSaveDrug(editModalData); setEditModalData(null); }} 
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Save className="w-5 h-5" /> Update Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insight Modal */}
      {insightData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className={`p-7 text-white flex justify-between items-center flex-shrink-0 ${insightData.title.includes('Ward') ? 'bg-emerald-600' : 'bg-violet-600'}`}>
              <div className="flex items-center gap-3 min-w-0">
                {insightData.title.includes('Ward') ? <FileText className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                <h2 className="text-xl font-black truncate">{insightData.title}: {insightData.drugName}</h2>
              </div>
              <button onClick={() => setInsightData(null)} className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full"><X className="w-7 h-7" /></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-white prose prose-sm max-w-none text-slate-700 leading-relaxed scrollbar-hide" dangerouslySetInnerHTML={{ __html: marked(insightData.content) }} />
            <div className="p-5 bg-slate-50 border-t flex justify-between items-center flex-shrink-0">
              <button onClick={() => speak(insightData.content)} className="p-3 bg-white text-indigo-600 rounded-2xl border shadow-sm hover:bg-indigo-50 transition-all"><Volume2 className="w-6 h-6" /></button>
              <button onClick={() => setInsightData(null)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg">Done Reading</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultDetail = ({ label, content, icon, accent }: any) => (
  <div className="flex gap-3 items-start">
    <div className="mt-1 flex-shrink-0 bg-slate-50 p-1.5 rounded-lg border border-slate-100">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className={`text-[13px] leading-relaxed break-words whitespace-normal ${accent ? 'font-bold text-indigo-950 border-l-2 border-indigo-400 pl-3' : 'text-slate-600'}`}>
        {content}
      </p>
    </div>
  </div>
);

const EditableField = ({ label, value, onChange, accent }: any) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</p>
    <textarea 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      rows={2} 
      className={`w-full p-5 rounded-2xl border-2 text-sm outline-none focus:border-amber-400 transition-all resize-none scrollbar-hide ${accent ? 'bg-indigo-50 border-indigo-100 font-bold' : 'bg-white border-slate-100'}`} 
    />
  </div>
);

export default SearchView;
