
import React from 'react';
import { QuizStats, MasteryLevel } from '../types';
import { X, BarChart3, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProgressModalProps {
  stats: QuizStats;
  onClose: () => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ stats, onClose }) => {
  const drugNames = Object.keys(stats);
  
  const masteryGroups = drugNames.reduce((acc, name) => {
    const s = stats[name];
    const pct = s.attempts === 0 ? 0 : (s.correct / s.attempts) * 100;
    
    let level: MasteryLevel = 'Focus';
    if (pct >= 80 && s.attempts >= 3) level = 'Mastered';
    else if (pct >= 50) level = 'Learning';
    
    acc[level].push({ name, stats: s, pct });
    return acc;
  }, { Focus: [], Learning: [], Mastered: [] } as Record<MasteryLevel, any[]>);

  const totalAttempts = drugNames.reduce((sum, n) => sum + stats[n].attempts, 0);
  const totalCorrect = drugNames.reduce((sum, n) => sum + stats[n].correct, 0);
  const avgSuccess = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h2 className="text-xl font-black tracking-tight text-white">Knowledge Bank</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Summary */}
        <div className="p-6 bg-emerald-50 grid grid-cols-2 gap-4 border-b border-emerald-100">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Studies</p>
            <p className="text-2xl font-black text-slate-800 tracking-tighter">{totalAttempts}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Avg Accuracy</p>
            <p className="text-2xl font-black text-slate-800 tracking-tighter">{avgSuccess}%</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <MasterySection 
            title="Mastered" 
            items={masteryGroups.Mastered} 
            color="emerald" 
            icon={<CheckCircle2 className="w-4 h-4" />} 
          />
          <MasterySection 
            title="Learning" 
            items={masteryGroups.Learning} 
            color="amber" 
            icon={<TrendingUp className="w-4 h-4" />} 
          />
          <MasterySection 
            title="Needs Focus" 
            items={masteryGroups.Focus} 
            color="rose" 
            icon={<AlertCircle className="w-4 h-4" />} 
          />

          {drugNames.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-bold">
              No study data recorded yet.
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const MasterySection: React.FC<{ title: string, items: any[], color: string, icon: React.ReactNode }> = ({ title, items, color, icon }) => {
  if (items.length === 0) return null;

  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    rose: "text-rose-600 bg-rose-50 border-rose-200",
  };

  const progressClasses: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border w-fit ${colorClasses[color]}`}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        <span className="text-xs font-bold opacity-60">({items.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {items.map(item => (
          <div key={item.name} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">{item.name}</p>
              <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${progressClasses[color]}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
            <div className="text-right ml-4">
              <p className="text-xs font-black text-slate-800">{item.pct}%</p>
              <p className="text-[10px] font-bold text-slate-400">{item.stats.correct}/{item.stats.attempts}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgressModal;
