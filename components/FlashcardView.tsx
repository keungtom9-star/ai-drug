
import React, { useState, useEffect } from 'react';
import { Drug, Settings, AnkiRating } from '../types';
import { RefreshCw, Volume2, Sparkles, Flame, Star, Check, AlertCircle, ClipboardList, AlertTriangle, Stethoscope, BookOpen } from 'lucide-react';
import { getAIContent } from '../services/aiService';
import { marked } from 'marked';

interface FlashcardViewProps {
  drugs: Drug[];
  settings: Settings;
  onRate: (drug: Drug, rating: AnkiRating) => void;
  speak: (text: string, lang?: string) => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ drugs, settings, onRate, speak }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiCase, setAiCase] = useState<string>('');
  const [isLoadingCase, setIsLoadingCase] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
    setAiCase('');
  }, [index, drugs]);

  const currentDrug = drugs[index];

  if (!drugs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
        <div className="bg-emerald-50 p-6 rounded-full mb-4">
          <Check className="w-12 h-12 text-emerald-500" />
        </div>
        <p className="text-slate-900 font-black text-xl mb-2">Queue Clear!</p>
        <p className="text-slate-500 text-sm">You've finished your scheduled reviews.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm">Refresh List</button>
      </div>
    );
  }

  const handleRate = (rating: AnkiRating) => {
    onRate(currentDrug, rating);
    if (index < drugs.length - 1) setIndex(index + 1);
    else setIndex(0);
  };

  const handleGenerateCase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingCase(true);
    setAiCase('Preparing clinical scenario...');
    try {
      await getAIContent(currentDrug, settings, 'case', (text) => setAiCase(text));
    } catch (e) {
      setAiCase("Failed to simulate case.");
    } finally {
      setIsLoadingCase(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-2xl mx-auto w-full">
      {/* Top Status Bar */}
      <div className="flex justify-between items-center mb-3 px-2">
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Card {index + 1} of {drugs.length}</span>
        <div className="flex gap-2">
           <span className={`w-2 h-2 rounded-full ${isFlipped ? 'bg-indigo-600' : 'bg-slate-200'}`} />
           <span className={`w-2 h-2 rounded-full ${!isFlipped ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        </div>
      </div>

      {/* Card Body - Expands to fill space */}
      <div className="flex-1 relative perspective-1000 mb-4" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* FRONT */}
          <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] shadow-xl border border-indigo-50">
            <h2 className="text-4xl sm:text-5xl font-black text-indigo-950 text-center mb-4 leading-tight">{currentDrug.name}</h2>
            <div className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg mb-8">{currentDrug.class}</div>
            <button onClick={(e) => { e.stopPropagation(); speak(currentDrug.name); }} className="p-4 bg-slate-50 rounded-[1.5rem] text-indigo-600 shadow-sm"><Volume2 className="w-8 h-8" /></button>
            <p className="mt-12 text-slate-300 font-bold text-[10px] uppercase tracking-widest animate-pulse">Tap to reveal details</p>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 flex flex-col overflow-hidden">
             {/* Sticky Header inside card */}
             <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
               <h3 className="text-lg font-black text-indigo-900">{currentDrug.name}</h3>
               <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded-full border text-slate-400 uppercase">{currentDrug.system}</span>
             </div>
             {/* Internal Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
                <DetailBlock icon={<ClipboardList className="w-4 h-4 text-emerald-500" />} label="Indication" content={currentDrug.indication} />
                <DetailBlock icon={<AlertTriangle className="w-4 h-4 text-rose-500" />} label="Side Effects" content={currentDrug.SideEffects} />
                <DetailBlock icon={<Stethoscope className="w-4 h-4 text-indigo-600" />} label="Nursing" content={currentDrug.nursing} accent />
                
                <div className="pt-2">
                  {!aiCase ? (
                    <button onClick={handleGenerateCase} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 border border-indigo-100">
                      <Sparkles className="w-4 h-4" /> {isLoadingCase ? 'AI Processing...' : 'AI Clinical Case'}
                    </button>
                  ) : (
                    <div className="p-4 bg-indigo-50 rounded-2xl text-xs text-slate-700 leading-relaxed border border-indigo-100" dangerouslySetInnerHTML={{ __html: marked(aiCase) }} />
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* SRS Footer Buttons - Fixed height */}
      <div className={`flex-none bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 grid grid-cols-4 gap-2 transition-all duration-300 ${isFlipped ? 'opacity-100 scale-100' : 'opacity-30 scale-95 grayscale pointer-events-none'}`}>
        <AnkiBtn label="Again" sub="<1m" color="bg-rose-500" icon={<Flame className="w-4 h-4" />} onClick={() => handleRate('again')} />
        <AnkiBtn label="Hard" sub="2d" color="bg-orange-500" icon={<AlertCircle className="w-4 h-4" />} onClick={() => handleRate('hard')} />
        <AnkiBtn label="Good" sub="4d" color="bg-emerald-500" icon={<Check className="w-4 h-4" />} onClick={() => handleRate('good')} />
        <AnkiBtn label="Easy" sub="7d+" color="bg-indigo-600" icon={<Star className="w-4 h-4" />} onClick={() => handleRate('easy')} />
      </div>
    </div>
  );
};

const AnkiBtn = ({ label, sub, color, icon, onClick }: any) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="flex flex-col items-center justify-center py-2 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all">
    <div className={`p-3 rounded-xl text-white mb-1 shadow-md ${color}`}>{icon}</div>
    <span className="text-[11px] font-black text-slate-800">{label}</span>
    <span className="text-[8px] text-slate-400 font-bold uppercase">{sub}</span>
  </button>
);

const DetailBlock = ({ icon, label, content, accent }: any) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 mb-1">
      {icon} <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className={`text-sm leading-relaxed ${accent ? 'font-bold text-slate-900 border-l-4 border-indigo-400 pl-3 bg-slate-50 py-2 rounded-r-xl' : 'text-slate-600'}`}>{content}</p>
  </div>
);

export default FlashcardView;
