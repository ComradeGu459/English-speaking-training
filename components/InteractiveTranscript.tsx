import React, { useEffect, useRef, useState } from 'react';
import { Subtitle, WordDefinition } from '../types';
import { Mic, Volume2, X, Bookmark, Play, Loader2, RotateCcw, MessageSquare, Edit3, Languages, Sparkles, Wand2, BookOpen, Repeat, AudioWaveform, CheckCircle2, TrendingUp, AlertCircle, StopCircle } from 'lucide-react';
import { AIService } from '../lib/ai/service';

interface InteractiveTranscriptProps {
  subtitles: Subtitle[];
  currentTime: number;
  onSeek: (time: number) => void;
  onSaveWord: (wordDef: WordDefinition, subtitleId: string) => void;
  onUpdateSubtitles?: (newSubtitles: Subtitle[]) => void;
  videoDuration?: number;
  isPlaying: boolean;
  playbackMode: 'continuous' | 'sentence';
}

const InteractiveTranscript: React.FC<InteractiveTranscriptProps> = ({ 
  subtitles, 
  currentTime, 
  onSeek,
  onSaveWord,
  onUpdateSubtitles,
  videoDuration = 300,
  isPlaying,
  playbackMode
}) => {
  // --- Active Subtitle Logic ---
  const activeSubtitleIndex = subtitles.findIndex((sub) => {
    const isTimeInWindow = currentTime >= sub.startTime && currentTime < sub.endTime;
    // Keep active if we paused right at the end (Sentence Mode)
    if (!isTimeInWindow && playbackMode === 'sentence' && !isPlaying) {
         return currentTime >= sub.endTime - 0.2 && currentTime <= sub.endTime + 0.1;
    }
    return isTimeInWindow;
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // --- State ---
  const [selectedWord, setSelectedWord] = useState<{ word: string, subId: string } | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loadingDef, setLoadingDef] = useState(false);
  
  // Recording & Assessment State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSubId, setRecordingSubId] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(15).fill(5));
  const [assessmentResult, setAssessmentResult] = useState<{ score: number, feedback: string } | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const [showTranslations, setShowTranslations] = useState(true);

  // --- Auto-Scroll Logic ---
  useEffect(() => {
    if (activeSubtitleIndex !== -1 && containerRef.current && !selectedWord && !isRecording) {
       const currentId = subtitles[activeSubtitleIndex]?.id;
       const currentNode = itemsRef.current.get(currentId);
       if (currentNode && containerRef.current) {
         const container = containerRef.current;
         const targetScrollTop = currentNode.offsetTop - (container.clientHeight / 2) + (currentNode.clientHeight / 2);
         container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
       }
    }
  }, [activeSubtitleIndex, selectedWord, subtitles, isRecording]);

  // --- Word Interaction ---
  const handleWordClick = async (word: string, subtitle: Subtitle, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanWord = word.replace(/[.,!?;:"()]/g, '');
    if (!cleanWord) return;
    
    setSelectedWord({ word: cleanWord, subId: subtitle.id });
    setLoadingDef(true);
    setDefinition(null);
    try {
      const def = await AIService.getWordDefinition(cleanWord, subtitle.text);
      setDefinition(def);
    } catch (error) {
      console.error("Failed to fetch definition", error);
    } finally {
      setLoadingDef(false);
    }
  };

  // --- Recording Logic ---
  const toggleRecording = (subId: string) => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording(subId);
    }
  };

  const startRecording = (subId: string) => {
    setIsRecording(true);
    setRecordingSubId(subId);
    setAssessmentResult(null);
    // In a real app, define MediaRecorder here. 
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsAssessing(true);
    
    // Simulate AI Assessment
    setTimeout(async () => {
        const score = Math.floor(Math.random() * 10) + 90; 
        const feedback = "Excellent intonation!";
        setAssessmentResult({ score, feedback });
        setIsAssessing(false);
    }, 1200);
  };

  // Simulate Audio Waveform Animation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
          setAudioLevels(prev => prev.map(() => Math.random() * 80 + 10));
      }, 80);
    } else {
        setAudioLevels(new Array(15).fill(5));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const closePopup = () => {
    setSelectedWord(null);
    setDefinition(null);
  };

  const formatTime = (time: number) => {
      const m = Math.floor(time / 60);
      const s = Math.floor(time % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white relative font-sans">
      
      {/* Floating Toggle */}
      <div className="absolute top-4 right-6 z-20">
           <button
              onClick={() => setShowTranslations(!showTranslations)}
              className={`p-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${showTranslations ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-400 border-slate-200'}`}
              title="Toggle Translation"
           >
              <Languages size={16} /> 
           </button>
      </div>

      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto w-full relative scroll-smooth no-scrollbar px-4 sm:px-6 py-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="py-[35vh]">
          {subtitles.map((sub, index) => {
            const isActive = index === activeSubtitleIndex;
            const isRecordingThis = isRecording && recordingSubId === sub.id;
            const hasScore = assessmentResult && recordingSubId === sub.id;

            return (
              <div 
                key={sub.id}
                ref={(el) => { if (el) itemsRef.current.set(sub.id, el); }}
                className={`
                  relative mb-6 transition-all duration-300 ease-out rounded-xl
                  ${isActive 
                     ? 'bg-[#FFFBF0] border-2 border-amber-200 shadow-lg shadow-amber-100/50 scale-[1.02] z-10' 
                     : 'bg-transparent border-2 border-transparent hover:bg-slate-50 opacity-60 hover:opacity-100'
                  }
                `}
                onClick={() => !isActive && onSeek(sub.startTime)}
              >
                <div className="p-5">
                    
                    {/* Time & Speaker */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded' : 'text-slate-400'}`}>
                            {formatTime(sub.startTime)}
                        </span>
                        {isActive && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                    </div>

                    {/* Main English Text */}
                    <p className={`
                        leading-relaxed transition-all duration-300 mb-2
                        ${isActive 
                        ? 'text-lg md:text-xl font-bold text-slate-800' 
                        : 'text-base font-medium text-slate-500'
                        }
                    `}>
                    {sub.text.split(' ').map((word, wIndex) => {
                        const clean = word.replace(/[^a-zA-Z]/g, '');
                        // Visual Rule: Underline words > 5 letters in Active Card
                        const isCore = clean.length > 5; 
                        
                        return (
                        <span 
                            key={wIndex}
                            onClick={(e) => isActive && handleWordClick(word, sub, e)}
                            className={`
                            inline-block mx-0.5 px-0.5 rounded transition-all
                            ${isActive 
                                ? 'cursor-pointer' 
                                : ''
                            }
                            ${isActive && isCore 
                                ? 'border-b-[3px] border-emerald-300/60 hover:border-emerald-500 hover:bg-emerald-50 text-slate-900' 
                                : 'border-b-2 border-transparent hover:bg-slate-100'
                            }
                            ${selectedWord?.word === clean && isActive ? 'bg-emerald-100 border-emerald-500' : ''}
                            `}
                        >
                            {word}{' '}
                        </span>
                        );
                    })}
                    </p>
                    
                    {/* Translation */}
                    <div className={`
                        overflow-hidden transition-all duration-300
                        ${(showTranslations || isActive) ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}
                    `}>
                        <div className={`text-sm md:text-base font-medium leading-relaxed ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                            {sub.translation}
                        </div>
                    </div>

                    {/* --- Active Toolbar (Bottom Right) --- */}
                    {isActive && (
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-200/40 animate-in fade-in slide-in-from-top-1">
                            
                            {/* Left: Waveform or Status */}
                            <div className="flex items-center gap-2 h-8 min-w-[100px]">
                                {isRecordingThis ? (
                                    <div className="flex items-end gap-0.5 h-full py-1">
                                        {audioLevels.map((h, i) => (
                                            <div key={i} className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(10, h)}%` }} />
                                        ))}
                                    </div>
                                ) : isAssessing ? (
                                     <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
                                         <Loader2 size={14} className="animate-spin" /> Assessing...
                                     </div>
                                ) : hasScore ? (
                                     <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-amber-100 shadow-sm">
                                         <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                                             {assessmentResult.score}
                                         </div>
                                         <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">{assessmentResult.feedback}</span>
                                     </div>
                                ) : (
                                    <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">Ready to Speak</span>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSeek(sub.startTime); }}
                                    className="p-2 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-amber-600 transition-all"
                                    title="Repeat Sentence"
                                >
                                    <RotateCcw size={18} strokeWidth={2.5} />
                                </button>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleRecording(sub.id); }}
                                    className={`p-2 rounded-full transition-all shadow-sm flex items-center gap-2
                                        ${isRecordingThis 
                                        ? 'bg-red-500 text-white shadow-red-200 animate-pulse' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                        }
                                    `}
                                    title="Shadowing Record"
                                >
                                    {isRecordingThis ? <StopCircle size={18} fill="currentColor" /> : <Mic size={18} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Definition Popup (Optimized) --- */}
      {selectedWord && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={closePopup}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 overflow-hidden ring-4 ring-slate-900/5" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 relative">
              <button onClick={closePopup} className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={18} /></button>
              
              <div className="mb-4">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Word Definition</span>
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{selectedWord.word}</h3>
                {definition?.ipa && <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{definition.ipa}</span>}
              </div>

              {loadingDef ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="animate-spin text-emerald-500" size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">Thinking...</span>
                </div>
              ) : definition ? (
                <div className="space-y-4">
                  <p className="text-lg text-slate-800 font-bold leading-snug">{definition.meaning}</p>
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                    <p className="text-slate-600 italic text-sm">"{definition.example}"</p>
                  </div>
                  <button onClick={() => { onSaveWord(definition, selectedWord.subId); closePopup(); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
                    <Bookmark size={18} /> Save Word
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Definition unavailable.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTranscript;