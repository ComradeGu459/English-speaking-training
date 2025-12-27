import React, { useEffect, useRef, useState } from 'react';
import { Subtitle, WordDefinition } from '../types';
import { Mic, Repeat, Volume2, X, Bookmark, Play, Loader2, RotateCcw, MessageSquare, Edit3, ChevronDown } from 'lucide-react';
import { AIService } from '../lib/ai/service';

interface InteractiveTranscriptProps {
  subtitles: Subtitle[];
  currentTime: number;
  onSeek: (time: number) => void;
  onSaveWord: (wordDef: WordDefinition, subtitleId: string) => void;
}

const InteractiveTranscript: React.FC<InteractiveTranscriptProps> = ({ 
  subtitles, 
  currentTime, 
  onSeek,
  onSaveWord
}) => {
  const activeSubtitleIndex = subtitles.findIndex(
    (sub) => currentTime >= sub.startTime && currentTime < sub.endTime
  );
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedWord, setSelectedWord] = useState<{ word: string, subId: string, rect: DOMRect } | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loadingDef, setLoadingDef] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(5).fill(10));
  
  // Sentence Level AI State
  const [activeAnalysis, setActiveAnalysis] = useState<{
    subId: string;
    type: 'explain' | 'rewrite' | null;
    data: any | null;
    loading: boolean;
  }>({ subId: '', type: null, data: null, loading: false });

  // Auto-scroll to active subtitle
  useEffect(() => {
    if (activeSubtitleIndex !== -1 && scrollRef.current) {
      const activeEl = scrollRef.current.children[activeSubtitleIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSubtitleIndex]);

  const handleWordClick = async (word: string, subtitle: Subtitle, e: React.MouseEvent) => {
    const cleanWord = word.replace(/[.,!?;:"()]/g, '');
    if (!cleanWord) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({ word: cleanWord, subId: subtitle.id, rect });
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

  const handleSentenceAction = async (sub: Subtitle, type: 'explain' | 'rewrite') => {
    if (activeAnalysis.subId === sub.id && activeAnalysis.type === type && activeAnalysis.data) return;
    
    setActiveAnalysis({ subId: sub.id, type, data: null, loading: true });
    
    try {
      let result;
      if (type === 'explain') {
        result = await AIService.explainSentence(sub.text);
      } else {
        result = await AIService.rewriteSentence(sub.text);
      }
      setActiveAnalysis({ subId: sub.id, type, data: result, loading: false });
    } catch (e) {
      setActiveAnalysis(prev => ({ ...prev, loading: false, data: { error: "Analysis failed" } }));
    }
  };

  const closePopup = () => {
    setSelectedWord(null);
    setDefinition(null);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => setAudioLevel(prev => prev.map(() => Math.random() * 20 + 5)), 100);
    } else {
      setAudioLevel(new Array(5).fill(4));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="font-bold text-slate-800">Dynamic Subtitles</h2>
        <div className="flex gap-2">
          <button className="p-1.5 text-slate-400 hover:text-pink-500 transition-colors">
            <Repeat size={18} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 transcript-scroll">
        {subtitles.map((sub, index) => {
          const isActive = index === activeSubtitleIndex;
          const isAnalysisActive = activeAnalysis.subId === sub.id;

          return (
            <div 
              key={sub.id} 
              className={`transition-all duration-300 rounded-xl p-3 cursor-pointer group
                ${isActive ? 'bg-amber-50 border border-amber-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-medium ${isActive ? 'text-amber-500' : 'text-slate-400'}`}>
                  {new Date(sub.startTime * 1000).toISOString().substr(14, 5)}
                </span>
                {isActive && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSeek(sub.startTime); }} 
                    className="p-1.5 bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              <div className={`text-lg leading-relaxed mb-2 font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                {sub.text.split(' ').map((word, wIndex) => (
                  <span 
                    key={wIndex}
                    onClick={(e) => handleWordClick(word, sub, e)}
                    className="hover:text-pink-600 hover:bg-pink-50 rounded px-0.5 transition-colors cursor-pointer inline-block"
                  >
                    {word}{' '}
                  </span>
                ))}
              </div>

              <div className={`text-sm ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                {sub.translation}
              </div>

              {isActive && (
                <div className="mt-3 flex gap-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleSentenceAction(sub, 'explain'); }}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                       ${isAnalysisActive && activeAnalysis.type === 'explain' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
                     `}
                   >
                     <MessageSquare size={14} /> Explain
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleSentenceAction(sub, 'rewrite'); }}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                       ${isAnalysisActive && activeAnalysis.type === 'rewrite' ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
                     `}
                   >
                     <Edit3 size={14} /> Rewrite
                   </button>
                </div>
              )}

              {/* Analysis Result Display */}
              {isAnalysisActive && (
                <div className="mt-3 bg-white rounded-lg border border-slate-100 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  {activeAnalysis.loading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : activeAnalysis.data ? (
                    <div className="text-sm">
                      {activeAnalysis.type === 'explain' && (
                        <div className="space-y-2">
                          <p className="font-medium text-indigo-900">{activeAnalysis.data.explanation}</p>
                          <div className="flex flex-wrap gap-2">
                            {activeAnalysis.data.grammarPoints?.map((p: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">{p}</span>
                            ))}
                          </div>
                          <p className="text-slate-500 italic text-xs">Tone: {activeAnalysis.data.nuance}</p>
                        </div>
                      )}
                      {activeAnalysis.type === 'rewrite' && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="text-xs font-bold text-slate-400 uppercase">Formal</span>
                             <p className="text-slate-700">{activeAnalysis.data.formal}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="text-xs font-bold text-slate-400 uppercase">Casual</span>
                             <p className="text-slate-700">{activeAnalysis.data.casual}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {isActive && (
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200">
                      <Play size={14} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => setIsRecording(!isRecording)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white recording-pulse' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}
                    >
                      <Mic size={14} />
                    </button>
                    {isRecording && (
                       <div className="flex items-end gap-0.5 h-4">
                         {audioLevel.map((h, i) => (
                           <div key={i} className="w-1 bg-red-400 rounded-t" style={{ height: `${h}px`, transition: 'height 0.1s' }} />
                         ))}
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedWord && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-50 flex items-center justify-center p-4" onClick={closePopup}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedWord.word}</h3>
                  {definition?.ipa && <span className="text-slate-500 text-sm font-mono mt-1 block">{definition.ipa}</span>}
                </div>
                <button onClick={closePopup} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              {loadingDef ? (
                <div className="py-8 flex flex-col items-center justify-center text-pink-500 gap-2">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-xs font-medium">Asking AI (Cached)...</span>
                </div>
              ) : definition ? (
                <div className="space-y-4">
                  <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-wider block mb-1">Meaning</span>
                    <p className="text-slate-800 font-medium">{definition.meaning}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Example</span>
                    <p className="text-slate-600 italic text-sm border-l-2 border-slate-200 pl-3">"{definition.example}"</p>
                  </div>
                  <button onClick={() => { onSaveWord(definition, selectedWord.subId); closePopup(); }} className="w-full mt-2 bg-slate-900 text-white py-2.5 rounded-xl font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"><Bookmark size={16} /> Save to Flashcards</button>
                </div>
              ) : (
                <div className="text-red-500 text-center py-4">Failed to load.<p className="text-xs text-slate-400 mt-2">Check Settings for API Keys.</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTranscript;
