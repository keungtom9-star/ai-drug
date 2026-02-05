
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Drug, QuizStats, Settings, QuizStat } from '../types';
import { getAIContent } from '../services/aiService';
import { getQuizExplanation } from '../services/geminiService';
import { CheckCircle, XCircle, Sparkles, GraduationCap, ArrowRight, Volume2, Flame, Trophy, Timer, Star, AlertCircle, Loader2 } from 'lucide-react';
import { marked } from 'marked';

interface QuizViewProps {
  drugs: Drug[];
  stats: QuizStats;
  onUpdateStats: (stats: QuizStats) => void;
  settings: Settings;
  speak: (text: string, lang?: string) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ drugs, stats, onUpdateStats, settings, speak }) => {
  const [question, setQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  
  // Gamification State
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isBlitzActive, setIsBlitzActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const globalStats = stats._global || { totalXP: 0, highestStreak: 0, currentLevel: 1 };

  const generateQuestion = useCallback(async () => {
    if (drugs.length === 0) return;
    setIsLoadingQuestion(true);
    setIsBlitzActive(false);
    setTimeLeft(15);

    // Weighted selection
    const drugCandidates = drugs.map(d => ({ drug: d, weight: stats[d.name]?.weight || 10 }));
    const totalWeight = drugCandidates.reduce((acc, curr) => acc + curr.weight, 0);
    let random = Math.random() * totalWeight;
    let correctDrug: Drug = drugs[0];
    for (const cand of drugCandidates) {
      random -= cand.weight;
      if (random <= 0) { correctDrug = cand.drug; break; }
    }

    if (!correctDrug) {
      setIsLoadingQuestion(false);
      return;
    }

    // New Question Types: Now includes 'Clinical Case'
    const types = ['indication', 'class', 'name-from-indication', 'case'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let qText = '';
    let correctAnswer = correctDrug.name;
    let category = '';

    if (type === 'indication') {
      qText = `What is the primary indication for "${correctDrug.name}"?`;
      correctAnswer = correctDrug.indication;
      category = 'Pharmacology 101';
    } else if (type === 'class') {
      qText = `What is the drug class for "${correctDrug.name}"?`;
      correctAnswer = correctDrug.class;
      category = 'Classifications';
    } else if (type === 'name-from-indication') {
      qText = `Which drug is primarily indicated for "${correctDrug.indication}"?`;
      category = 'Clinical Matches';
    } else if (type === 'case') {
      category = 'Clinical Simulator (3x XP)';
      try {
        qText = await getAIContent(correctDrug, settings, 'quiz_scenario', () => {});
      } catch (e) {
        qText = `A patient requires medication for ${correctDrug.indication}. Which is most appropriate?`;
      }
    }

    const otherDrugs = drugs.filter(d => d.name !== correctDrug.name);
    const distractors = otherDrugs
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(d => {
        if (type === 'indication') return d.indication;
        if (type === 'class') return d.class;
        return d.name;
      });

    const options = [correctAnswer, ...distractors]
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort(() => Math.random() - 0.5);

    setQuestion({ q: qText, options, c: correctDrug, correctAnswerText: correctAnswer, type, category });
    setSelectedAnswer(null);
    setIsCorrect(null);
    setAiExplanation('');
    setIsLoadingQuestion(false);
    setIsBlitzActive(true);

    if (!settings.isMuted) {
      speak(qText);
    }
  }, [drugs, stats, settings, speak]);

  useEffect(() => {
    if (!question && drugs.length > 0) generateQuestion();
  }, [question, drugs, generateQuestion]);

  // Timer Effect
  useEffect(() => {
    if (isBlitzActive && timeLeft > 0 && !selectedAnswer) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !selectedAnswer) {
      handleAnswer('__TIMEOUT__');
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isBlitzActive, timeLeft, selectedAnswer]);

  const handleAnswer = (option: string) => {
    if (selectedAnswer || !question || !question.c) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedAnswer(option);
    const correct = option === question.correctAnswerText;
    setIsCorrect(correct);

    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);

    // Calculate XP
    let xpGain = 0;
    if (correct) {
      xpGain = question.type === 'case' ? 30 : 10;
      if (timeLeft > 10) xpGain += 5; // Speed bonus
      if (newStreak > 2) xpGain += 5; // Streak bonus
    }

    // Update Stats
    const currentStat: QuizStat = stats[question.c.name] || { 
      correct: 0, attempts: 0, weight: 10, interval: 0, easeFactor: 2.5, 
      nextReviewDate: new Date().toISOString(), state: 'new' 
    };

    const newGlobal = {
      totalXP: (globalStats.totalXP || 0) + xpGain,
      highestStreak: Math.max(globalStats.highestStreak || 0, newStreak),
      currentLevel: Math.floor(((globalStats.totalXP || 0) + xpGain) / 500) + 1
    };

    // Explicitly typing as QuizStats to satisfy TypeScript's index signature constraints
    const newStats: QuizStats = { 
      ...stats, 
      [question.c.name]: {
        ...currentStat,
        attempts: currentStat.attempts + 1,
        correct: currentStat.correct + (correct ? 1 : 0),
        weight: correct ? Math.max(1, currentStat.weight - 2) : currentStat.weight + 4
      },
      _global: newGlobal
    };

    onUpdateStats(newStats);
    if (correct) speak("Excellent work!", 'en');
    else if (option === '__TIMEOUT__') speak("Time is up!", 'en');
    else speak("Reviewing clinical rationale.", 'en');
  };

  const handleExplain = async () => {
    if (!question || !question.c) return;
    setIsExplaining(true);
    setAiExplanation('Consulting the Clinical Tutor...');
    try {
      await getQuizExplanation({ ...question, u: selectedAnswer }, settings.aiLanguage, (text) => setAiExplanation(text));
    } catch (e) { setAiExplanation("Explanation unavailable."); }
    finally { setIsExplaining(false); }
  };

  if (!drugs.length) return <div className="text-center p-12 text-slate-400 font-bold">Import drugs to start quiz.</div>;

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-24">
      {/* Gamified Header */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rank: Level {globalStats.currentLevel}</p>
              <p className="text-lg font-black text-indigo-950 leading-none">{globalStats.totalXP} XP</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all ${streak > 0 ? 'bg-orange-50 border-orange-200 text-orange-600 scale-110' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
              <Flame className={`w-4 h-4 ${streak > 2 ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-black">{streak}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all ${timeLeft < 5 ? 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
              <Timer className="w-4 h-4" />
              <span className="text-xs font-black">{timeLeft}s</span>
            </div>
          </div>
        </div>
        {/* Level Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(globalStats.totalXP % 500) / 5}%` }} />
        </div>
      </div>

      {/* Main Question Interface */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative">
        {isLoadingQuestion && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest animate-pulse">Generating Scenario...</p>
          </div>
        )}

        {/* Timer Progress Bar (Top of Card) */}
        {!selectedAnswer && isBlitzActive && (
          <div className="h-1.5 w-full bg-slate-100">
            <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${(timeLeft / 15) * 100}%` }} />
          </div>
        )}

        <div className="p-8">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 block">{question?.category}</span>
          <h2 className="text-xl font-black text-indigo-950 leading-tight">
            {question?.q || 'Waiting for next scenario...'}
          </h2>
        </div>
        
        <div className="p-6 space-y-3 pt-0">
          {question?.options.map((opt: string) => {
            const isSelected = selectedAnswer === opt;
            const isActuallyCorrect = question.correctAnswerText === opt;
            let btnClass = "bg-white border-2 border-slate-100 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.98]";
            if (selectedAnswer) {
              if (isActuallyCorrect) btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-lg shadow-emerald-100";
              else if (isSelected) btnClass = "bg-rose-50 border-rose-500 text-rose-800";
              else btnClass = "bg-slate-50 border-slate-100 text-slate-300 opacity-50";
            }

            return (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selectedAnswer} className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm transition-all flex justify-between items-center ${btnClass}`}>
                <span>{opt}</span>
                {selectedAnswer && isActuallyCorrect && <CheckCircle className="w-5 h-5" />}
                {selectedAnswer && isSelected && !isActuallyCorrect && <XCircle className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        {selectedAnswer && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
             {/* Result Badge */}
             <div className={`p-4 rounded-2xl flex items-center justify-between ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <div className="flex items-center gap-3">
                   {isCorrect ? <Star className="w-6 h-6 fill-current" /> : <AlertCircle className="w-6 h-6" />}
                   <div>
                     <p className="font-black text-sm uppercase">{isCorrect ? 'Outstanding!' : 'Review Needed'}</p>
                     <p className="text-[10px] font-bold opacity-80">{isCorrect ? `Perfect match! +XP gained.` : `The patient needed: ${question.correctAnswerText}`}</p>
                   </div>
                </div>
                {isCorrect && <div className="text-xl font-black">+{question?.type === 'case' ? 30 : 10}XP</div>}
             </div>

            {!aiExplanation ? (
              <button onClick={handleExplain} disabled={isExplaining} className="w-full py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all">
                <Sparkles className="w-4 h-4" /> {isExplaining ? 'Tutor Thinking...' : 'AI Rationale'}
              </button>
            ) : (
              <div className="bg-white border-2 border-indigo-100 p-5 rounded-2xl space-y-3 shadow-inner max-h-48 overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest"><GraduationCap className="w-4 h-4" /> Clinical Evidence</div>
                  <button onClick={() => speak(aiExplanation)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:scale-110 transition-transform"><Volume2 className="w-4 h-4" /></button>
                </div>
                <div className="text-xs prose prose-indigo leading-relaxed text-slate-700 font-medium" dangerouslySetInnerHTML={{ __html: marked(aiExplanation) }} />
              </div>
            )}

            <button onClick={generateQuestion} className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 group">
              Next Clinical Scenario
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
