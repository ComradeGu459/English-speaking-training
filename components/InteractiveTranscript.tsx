import React, { useEffect, useRef, useState } from 'react';
import { Subtitle, WordDefinition } from '../types';
import { Mic, Repeat, Volume2, X, Bookmark, Play, Loader2, RotateCcw } from 'lucide-react';
import { getWordDefinition } from '../services/geminiService';

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

  // Auto-scroll to active subtitle
  useEffect(() => {
    if (activeSubtitleIndex !== -1 && scrollRef.current) {
      const activeEl = scrollRef.current.children[activeSubtitleIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSubtitleIndex]);

  // Handle click on a word
  const handleWordClick = async (word: string, subtitle: Subtitle, e: React.MouseEvent) => {
    // Basic cleanup of punctuation
    const cleanWord = word.replace(/[.,!?;:"()]/g, '');
    if (!cleanWord) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({ word: cleanWord, subId: subtitle.id, rect });
    setLoadingDef(true);
    setDefinition(null);

    const def = await getWordDefinition(cleanWord, subtitle.text);
    setDefinition(def);
    setLoadingDef(false);
  };

  // Close popup logic
  const closePopup = () => {
    setSelectedWord(null);
    setDefinition(null);
  };

  // Simulate Recording Animation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioLevel(prev => prev.map(() => Math.random() * 20 + 5));
      }, 100);
    } else {
      setAudioLevel(new Array(5).fill(4));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="font-bold text-slate-800">Dynamic Subtitles</h2>
        <div className="flex gap-2">
          <button className="p-1.5 text-slate-400 hover:text-pink-500 transition-colors">
            <Repeat size={18} />
          </button>
        </div>
      </div>

      {/* Transcript List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 transcript-scroll">
        {subtitles.map((sub, index) => {
          const isActive = index === activeSubtitleIndex;
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
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSeek(sub.startTime); }} 
                      className="p-1.5 bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* English Text with clickable words */}
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

              {/* Translation */}
              <div className={`text-sm ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                {sub.translation}
              </div>

              {/* Shadowing Controls (Only visible when active) */}
              {isActive && (
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
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
                  <span className="text-xs text-amber-600 font-medium px-2 py-1 bg-amber-100 rounded-md">
                    Shadowing Mode
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Word Definition Popover */}
      {selectedWord && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-50 flex items-center justify-center p-4" onClick={closePopup}>
          <div 
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedWord.word}</h3>
                  {definition?.ipa && <span className="text-slate-500 text-sm font-mono mt-1 block">{definition.ipa}</span>}
                </div>
                <button onClick={closePopup} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              {loadingDef ? (
                <div className="py-8 flex flex-col items-center justify-center text-pink-500 gap-2">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-xs font-medium">Asking AI...</span>
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
                  
                  <button 
                    onClick={() => {
                        onSaveWord(definition, selectedWord.subId);
                        closePopup();
                    }}
                    className="w-full mt-2 bg-slate-900 text-white py-2.5 rounded-xl font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Bookmark size={16} />
                    Save to Flashcards
                  </button>
                </div>
              ) : (
                <div className="text-red-500 text-center py-4">Failed to load definition.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTranscript;