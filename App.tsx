import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, BookOpen, Settings, Sparkles, Mic, PlayCircle, Plus, X, Upload, Globe, Trash2, Save, Cpu, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Music, Loader2, AlertTriangle, FileVideo, Youtube, FileText, Bot, MonitorPlay, ChevronLeft, Search, Repeat, SkipForward, Filter, Clock, Languages, Volume2 } from 'lucide-react';
import { AppView, VideoContent, WordDefinition, Flashcard, Subtitle } from './types';
import { MOCK_VIDEOS, CATEGORIES } from './constants';
import VideoPlayer from './components/VideoPlayer';
import InteractiveTranscript from './components/InteractiveTranscript';
import { getSettings, saveSettings, UserSettings } from './lib/userSettings';
import { aiRouter } from './lib/ai/router';
import { ProviderType } from './lib/ai/types';

// ... (Constants and Helpers remain unchanged)
const DOUBAO_PRESET_VOICES = [
  { id: 'BV001_streaming', name: 'BV001 (Universal Female)' },
  { id: 'BV002_streaming', name: 'BV002 (Universal Male)' },
  { id: 'BV406_streaming', name: 'BV406 (Affectionate Female)' },
  { id: 'BV407_streaming', name: 'BV407 (Affectionate Male)' },
  { id: 'BV051_streaming', name: 'BV051 (Standard Male)' },
];

const GEMINI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (Preview)' },
  { id: 'gemini-2.5-flash-latest', name: 'Gemini 2.5 Flash (Stable)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' }
];

const DEEPSEEK_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek-V3.2 (Chat)' },
  { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoning)' }
];

// Helper to parse SRT time string "00:00:05,123" -> seconds
const parseSrtTime = (timeString: string): number => {
  if (!timeString) return 0;
  const parts = timeString.trim().replace(',', '.').split(':');
  if (parts.length < 3) return 0;
  const h = parseFloat(parts[0]);
  const m = parseFloat(parts[1]);
  const s = parseFloat(parts[2]);
  return h * 3600 + m * 60 + s;
};

// Helper to parse SRT content
const parseSrt = (data: string): Subtitle[] => {
    const subtitles: Subtitle[] = [];
    const blocks = data.trim().split(/\n\s*\n/);
    
    blocks.forEach((block, index) => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const timeLine = lines[1].includes('-->') ? lines[1] : lines[0].includes('-->') ? lines[0] : null;
            if (timeLine) {
                const [startStr, endStr] = timeLine.split('-->');
                const text = lines.slice(lines.indexOf(timeLine) + 1).join(' ').replace(/<[^>]*>/g, '');
                subtitles.push({
                    id: `sub-${index}`,
                    startTime: parseSrtTime(startStr),
                    endTime: parseSrtTime(endStr),
                    text: text,
                    translation: '',
                    speaker: 'Speaker'
                });
            }
        }
    });
    return subtitles;
};

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Content State
  const [videos, setVideos] = useState<VideoContent[]>(MOCK_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [savedWords, setSavedWords] = useState<Flashcard[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeLevel, setActiveLevel] = useState<string>('All');
  
  // Settings State
  const [settings, setSettingsState] = useState<UserSettings>(getSettings());
  const [expandedProvider, setExpandedProvider] = useState<string | null>('gemini');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'youtube' | 'local'>('youtube');
  const [importForm, setImportForm] = useState({ title: '', url: '', category: CATEGORIES[1] }); // Default to Daily Life
  
  // Local Import State
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [analysisProvider, setAnalysisProvider] = useState<ProviderType>('gemini');

  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Video Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(320);
  const [playbackMode, setPlaybackMode] = useState<'continuous' | 'sentence'>('sentence');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSettingsState(getSettings());
  }, []);

  // --- Time Memory Logic ---
  useEffect(() => {
    if (selectedVideo && currentTime > 0) {
      localStorage.setItem(`echo_progress_${selectedVideo.id}`, currentTime.toString());
    }
  }, [currentTime, selectedVideo]);

  const handleSaveSettings = () => {
    saveSettings(settings);
    aiRouter.refreshProviders();
    alert('Configuration Saved & Router Updated!');
  };

  const updateProvider = (key: keyof UserSettings['providers'], field: string, value: any) => {
    setSettingsState(prev => ({
      ...prev,
      providers: { ...prev.providers, [key]: { ...prev.providers[key], [field]: value } }
    }));
  };

  // --- Content Handlers ---
  const handleSelectVideo = (video: VideoContent) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    setCurrentView(AppView.PLAYER);
    
    // Restore progress
    const savedTime = localStorage.getItem(`echo_progress_${video.id}`);
    const startTime = savedTime ? parseFloat(savedTime) : 0;
    setCurrentTime(startTime);
    if (videoRef.current) {
        videoRef.current.currentTime = startTime;
    }
    
    if (video.videoUrl) {
       setDuration(0); 
    } else {
       const [m, s] = video.duration.split(':').map(Number);
       setDuration(m * 60 + s);
    }
  };

  const handleUpdateSubtitles = (newSubtitles: Subtitle[]) => {
      if (!selectedVideo) return;
      const updatedVideo = { ...selectedVideo, subtitles: newSubtitles };
      setSelectedVideo(updatedVideo);
      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? updatedVideo : v));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'subtitle') => {
    if (e.target.files && e.target.files[0]) {
        if (type === 'video') setLocalFile(e.target.files[0]);
        else setSubtitleFile(e.target.files[0]);
        setImportError(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportLoading(true);
    setAiAnalyzing(false);

    try {
        let newVideo: VideoContent;

        if (importTab === 'youtube') {
            const url = importForm.url.trim();
            if (!url) throw new Error("URL is required.");
            const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
            if (!isYoutube) throw new Error("Only YouTube URLs are supported currently.");

            await new Promise((resolve) => setTimeout(resolve, 1500));
            newVideo = {
                id: `imported-${Date.now()}`,
                title: importForm.title || "New Imported Video",
                thumbnail: `https://picsum.photos/seed/${Date.now()}/800/450`,
                duration: "05:00",
                level: "Intermediate",
                category: importForm.category,
                date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                description: `Imported content from ${url}. Automatically generated by EchoSpeak.`,
                subtitles: [
                   { id: '1', startTime: 0, endTime: 5, text: "This is a placeholder subtitle for the imported video.", translation: "这是导入视频的占位字幕。", speaker: "System" }
                ],
                progress: 0
            };
        } else {
            // --- Restored Local File Import Logic ---
            if (!localFile) throw new Error("Please select a video file.");
            setAiAnalyzing(true);
            const blobUrl = URL.createObjectURL(localFile);
            
            let parsedSubtitles: Subtitle[] = [];
            if (subtitleFile) {
                const text = await subtitleFile.text();
                parsedSubtitles = parseSrt(text);
            } else {
                parsedSubtitles = [
                    { id: '1', startTime: 0, endTime: 5, text: "No subtitles imported.", translation: "", speaker: "System" }
                ];
            }
            
            let aiMetadata = { title: localFile.name.replace(/\.[^/.]+$/, ""), description: "Local video import.", category: importForm.category };
            
            // Try to use AI to generate metadata if provider is active
            try {
                const prompt = `I am importing a video file named "${localFile.name}". User context note: "${importForm.title || 'None'}". Please generate: 1. A professional English title. 2. A concise 2-sentence description. 3. Best category from: ${CATEGORIES.join(', ')}. Return JSON: { "title": "...", "description": "...", "category": "..." }`;
                const res = await aiRouter.dispatch<{title: string, description: string, category: string}>('explanation', { prompt, jsonMode: true }, true, analysisProvider);
                if (res.data) aiMetadata = res.data;
            } catch (aiErr) { 
                console.warn("AI Metadata failed", aiErr); 
            }

            newVideo = {
                id: `local-${Date.now()}`,
                title: aiMetadata.title,
                thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80", // Placeholder for local video thumbnail
                duration: "00:00", // Will be updated by onLoadedMetadata
                level: "Intermediate",
                category: aiMetadata.category || importForm.category,
                date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                description: aiMetadata.description,
                subtitles: parsedSubtitles,
                videoUrl: blobUrl,
                progress: 0
            };
        }
        setVideos(prev => [newVideo, ...prev]);
        setIsImportModalOpen(false);
        setImportForm({ title: '', url: '', category: CATEGORIES[0] });
        setLocalFile(null);
        setSubtitleFile(null);
    } catch (err) {
        setImportError((err as Error).message);
    } finally {
        setImportLoading(false);
        setAiAnalyzing(false);
    }
  };

  // --- Video Playback Loop & Shortcuts (Same as before) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.play().catch(e => { console.warn(e); setIsPlaying(false); });
    else video.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        let t = 0;
        if (videoRef.current) {
            t = videoRef.current.currentTime;
        } else {
            t = currentTime + 0.1;
        }
        if (selectedVideo && playbackMode === 'sentence') {
            const activeSub = selectedVideo.subtitles.find(s => t >= s.startTime && t < s.endTime);
            if (activeSub && t >= activeSub.endTime - 0.15) {
                setIsPlaying(false);
                if (videoRef.current) videoRef.current.pause();
                t = activeSub.endTime; 
            }
        }
        setCurrentTime(t >= duration ? duration : t);
      }, 100);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, duration, playbackMode, selectedVideo, currentTime]);

  const handleSaveWord = (def: WordDefinition, subId: string) => {
    if (!selectedVideo) return;
    const newCard: Flashcard = { ...def, id: Date.now().toString(), sourceVideoId: selectedVideo.id, timestamp: currentTime };
    setSavedWords(prev => [newCard, ...prev]);
  };
  
  // ... (ProviderCard component omitted for brevity, logic identical to previous)
  const ProviderCard = ({ id, title, icon, enabled, onToggle, children }: any) => {
    const isExpanded = expandedProvider === id;
    return (
      <div className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${enabled ? 'border-indigo-100 shadow-lg shadow-indigo-100/50' : 'border-slate-100 opacity-60 grayscale-[0.8]'}`}>
        <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => setExpandedProvider(isExpanded ? null : id)}>
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg tracking-tight">{title}</h3>
              <div className="flex items-center gap-2 text-xs mt-1.5 font-medium">
                 <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></span>
                 <span className="text-slate-500">{enabled ? 'Active' : 'Disabled'}</span>
              </div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`transition-all hover:scale-110 active:scale-90 ${enabled ? 'text-indigo-600' : 'text-slate-300'}`}>
             {enabled ? <ToggleRight size={40} strokeWidth={1.5} /> : <ToggleLeft size={40} strokeWidth={1.5} />}
          </button>
        </div>
        {isExpanded && enabled && (
          <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="border-t border-slate-100 pt-6 space-y-5">{children}</div>
          </div>
        )}
      </div>
    );
  };
  // ...

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full shadow-lg shadow-pink-200 tracking-wider uppercase">Vlog Library</div>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Explore Materials</h1>
           </div>
           
           <div className="flex gap-3">
              <button onClick={() => setIsImportModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                 <Plus size={18} /> Import
              </button>
           </div>
        </div>
        
        {/* Filters */}
        <div className="space-y-4">
           <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={()=>setActiveCategory(cat)} 
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200/50'}`}
                >
                  {cat}
                </button>
              ))}
           </div>
           
           <div className="flex items-center gap-3 text-sm text-slate-500">
              <Filter size={14} />
              <span className="font-bold text-xs uppercase tracking-wider">Difficulty:</span>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                 <button 
                   key={lvl} 
                   onClick={() => setActiveLevel(lvl)}
                   className={`px-3 py-1 rounded-lg transition-colors font-medium ${activeLevel === lvl ? 'bg-indigo-50 text-indigo-600' : 'hover:text-slate-800'}`}
                 >
                    {lvl}
                 </button>
              ))}
           </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {videos
               .filter(v => activeCategory === 'All' || v.category === activeCategory)
               .filter(v => activeLevel === 'All' || v.level === activeLevel)
               .map((video) => (
               <div key={video.id} onClick={() => handleSelectVideo(video)} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col h-full">
                 
                 <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                   {video.videoUrl ? (
                       <video src={video.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" muted />
                   ) : (
                       <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   )}
                   
                   <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      {video.duration}
                   </div>

                   {video.progress === 100 && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <CheckCircle2 size={10} /> Completed
                      </div>
                   )}
                   
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <div className="bg-white/90 p-3 rounded-full text-indigo-600 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                          <PlayCircle size={24} fill="currentColor" />
                       </div>
                   </div>
                 </div>

                 <div className="p-4 flex flex-col flex-1">
                   <h3 className="font-bold text-slate-800 text-base leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{video.title}</h3>
                   
                   <div className="mt-auto pt-4 space-y-3">
                       <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                          <span>{video.date}</span>
                          <span className={`px-2 py-0.5 rounded-md ${video.level === 'Advanced' ? 'bg-red-50 text-red-600' : video.level === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{video.level}</span>
                       </div>

                       <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                              <span>Progress</span>
                              <span>{video.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${video.progress || 0}%` }} />
                          </div>
                       </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
    </div>
  );

  const renderPlayer = () => {
    if (!selectedVideo) return null;
    const isLocal = !!selectedVideo.videoUrl;

    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-6 animate-in slide-in-from-right duration-500 max-w-[1800px] mx-auto">
        
        {/* Left: Video Player */}
        <div className="flex-1 flex flex-col h-full min-h-0 bg-black rounded-[2rem] overflow-hidden relative shadow-2xl">
           <div className="absolute top-4 left-4 z-10">
              <button onClick={() => setCurrentView(AppView.DASHBOARD)} className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black/60 transition-colors flex items-center gap-2 border border-white/10">
                 <ChevronLeft size={16} /> Library
              </button>
           </div>

           <div className="flex-1 relative flex items-center justify-center bg-black">
             {isLocal ? (
                 <video 
                    ref={videoRef}
                    src={selectedVideo.videoUrl} 
                    className="w-full h-full object-contain"
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onClick={() => setIsPlaying(!isPlaying)}
                 />
             ) : (
                <div className="w-full h-full">
                    <VideoPlayer 
                        thumbnail={selectedVideo.thumbnail} 
                        isPlaying={isPlaying} 
                        currentTime={currentTime} 
                        duration={duration} 
                        onPlayPause={() => setIsPlaying(!isPlaying)} 
                        onSeek={(t) => setCurrentTime(t)} 
                    />
                </div>
             )}
           </div>
           
           <div className="bg-slate-900 text-white p-6 border-t border-white/10">
                <h1 className="text-xl font-bold mb-2">{selectedVideo.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5"><Clock size={14}/> {selectedVideo.duration}</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-slate-300">{selectedVideo.level}</span>
                </div>
           </div>
        </div>
        
        {/* Right: Interactive Transcript */}
        <div className="lg:w-[500px] xl:w-[600px] h-full flex-shrink-0 bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
           <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-white/80 backdrop-blur z-20">
               <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">
                       <Sparkles size={18} />
                   </div>
                   <div>
                     <span className="font-bold text-slate-800">动态字幕</span>
                     <span className="block text-[11px] text-slate-400 font-medium">中英对照 · 智能高亮</span>
                   </div>
               </div>
               
               <div className="flex items-center gap-2">
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                     <button 
                         onClick={() => setPlaybackMode('continuous')} 
                         className={`p-1.5 rounded-md transition-all ${playbackMode === 'continuous' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                         title="Continuous Play"
                      >
                         <PlayCircle size={16} />
                      </button>
                     <button 
                         onClick={() => setPlaybackMode('sentence')} 
                         className={`p-1.5 rounded-md transition-all ${playbackMode === 'sentence' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                         title="Sentence Mode"
                      >
                         <Repeat size={16} />
                      </button>
                 </div>
                 <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                   <Mic size={14} />
                   跟读练习
                 </div>
               </div>
           </div>

           <div className="flex-1 overflow-hidden relative">
               <InteractiveTranscript 
                    subtitles={selectedVideo.subtitles} 
                    currentTime={currentTime} 
                    onSeek={(t) => { 
                        setCurrentTime(t); 
                        if(isLocal && videoRef.current) videoRef.current.currentTime = t;
                        setIsPlaying(true); 
                    }} 
                    onSaveWord={handleSaveWord} 
                    onUpdateSubtitles={handleUpdateSubtitles}
                    videoDuration={duration}
                    isPlaying={isPlaying}
                    playbackMode={playbackMode}
               />
           </div>
        </div>
      </div>
    );
  };
  
  // ... (renderFlashcards, renderSettings, etc. identical to previous)
  const renderFlashcards = () => (
     <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
       <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3 tracking-tight">
          <BookOpen className="text-pink-500" size={32} /> 
          Saved Vocabulary
      </h2>
      
      {savedWords.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No words saved yet.</p>
              <p className="text-sm text-slate-300 mt-1">Click on words in the video transcript to save them.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedWords.map((card) => (
            <div key={card.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all relative group">
                <button onClick={(e) => {e.stopPropagation(); setSavedWords(prev => prev.filter(w => w.id !== card.id));}} className="absolute top-6 right-6 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={20} />
                </button>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">{card.type}</span>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{card.word}</h3>
                <span className="text-sm font-mono text-slate-400">{card.ipa}</span>
                <div className="my-4 h-px bg-slate-50" />
                <p className="text-slate-700 font-medium leading-relaxed">{card.meaning}</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-500 italic text-sm">"{card.example}"</p>
                </div>
            </div>
            ))}
        </div>
      )}
     </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto pb-32 animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center gap-4 mb-10">
         <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Settings size={24} />
         </div>
         <div>
             <h2 className="text-3xl font-bold text-slate-800 tracking-tight">AI Settings</h2>
             <p className="text-slate-500 mt-1">Configure your LLM providers for analysis, translation, and TTS.</p>
         </div>
      </div>
      
      <div className="space-y-6">
        {/* Gemini */}
        <ProviderCard 
          id="gemini" 
          title="Google Gemini" 
          icon={<Sparkles size={24} />} 
          enabled={settings.providers.gemini.enabled}
          onToggle={() => updateProvider('gemini', 'enabled', !settings.providers.gemini.enabled)}
        >
            <div className="grid gap-6">
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">API Key</label>
               <input 
                 type="password"
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                 value={settings.providers.gemini.apiKey}
                 onChange={(e) => updateProvider('gemini', 'apiKey', e.target.value)}
                 placeholder="sk-..."
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model Version</label>
               <div className="relative">
                   <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white appearance-none focus:ring-2 focus:ring-indigo-100 outline-none"
                      value={settings.providers.gemini.model}
                      onChange={(e) => updateProvider('gemini', 'model', e.target.value)}
                   >
                     {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
               </div>
            </div>
          </div>
        </ProviderCard>

        {/* DeepSeek */}
        <ProviderCard 
          id="deepseek" 
          title="DeepSeek" 
          icon={<Bot size={24} />} 
          enabled={settings.providers.deepseek.enabled}
          onToggle={() => updateProvider('deepseek', 'enabled', !settings.providers.deepseek.enabled)}
        >
            <div className="grid gap-6">
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">API Key</label>
               <input 
                 type="password"
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                 value={settings.providers.deepseek.apiKey}
                 onChange={(e) => updateProvider('deepseek', 'apiKey', e.target.value)}
                 placeholder="sk-..."
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model</label>
               <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white appearance-none focus:ring-2 focus:ring-indigo-100 outline-none"
                  value={settings.providers.deepseek.model}
                  onChange={(e) => updateProvider('deepseek', 'model', e.target.value)}
               >
                 {DEEPSEEK_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
               </select>
             </div>
          </div>
        </ProviderCard>

        {/* Qwen Text */}
        <ProviderCard 
          id="qwen" 
          title="Qwen (Text)" 
          icon={<Bot size={24} />} 
          enabled={settings.providers.qwenText.enabled}
          onToggle={() => updateProvider('qwenText', 'enabled', !settings.providers.qwenText.enabled)}
        >
            <div className="grid gap-6">
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">API Key (DashScope)</label>
               <input 
                 type="password"
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                 value={settings.providers.qwenText.apiKey}
                 onChange={(e) => updateProvider('qwenText', 'apiKey', e.target.value)}
                 placeholder="sk-..."
               />
             </div>
          </div>
        </ProviderCard>

        {/* Doubao TTS */}
        <ProviderCard 
          id="doubao" 
          title="Doubao (TTS Only)" 
          icon={<Volume2 size={24} />} 
          enabled={settings.providers.doubao.enabled}
          onToggle={() => updateProvider('doubao', 'enabled', !settings.providers.doubao.enabled)}
        >
            <div className="grid gap-6">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">App ID</label>
                   <input 
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm"
                     value={settings.providers.doubao.appId}
                     onChange={(e) => updateProvider('doubao', 'appId', e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access Token</label>
                   <input 
                     type="password"
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm"
                     value={settings.providers.doubao.accessToken}
                     onChange={(e) => updateProvider('doubao', 'accessToken', e.target.value)}
                   />
                 </div>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Voice</label>
               <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white appearance-none"
                  value={settings.providers.doubao.voiceType}
                  onChange={(e) => updateProvider('doubao', 'voiceType', e.target.value)}
               >
                 {DOUBAO_PRESET_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
               </select>
             </div>
          </div>
        </ProviderCard>

        {/* NewAPI */}
        <ProviderCard 
          id="newapi" 
          title="NewAPI (OpenAI Compat)" 
          icon={<Globe size={24} />} 
          enabled={settings.providers.newapi.enabled}
          onToggle={() => updateProvider('newapi', 'enabled', !settings.providers.newapi.enabled)}
        >
            <div className="grid gap-6">
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Base URL</label>
               <input 
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm"
                 value={settings.providers.newapi.baseUrl}
                 onChange={(e) => updateProvider('newapi', 'baseUrl', e.target.value)}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">API Key</label>
               <input 
                 type="password"
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm"
                 value={settings.providers.newapi.apiKey}
                 onChange={(e) => updateProvider('newapi', 'apiKey', e.target.value)}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model</label>
               <input 
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm"
                 value={settings.providers.newapi.model}
                 onChange={(e) => updateProvider('newapi', 'model', e.target.value)}
                 placeholder="gpt-3.5-turbo"
               />
             </div>
          </div>
        </ProviderCard>

      </div>
      <button 
        onClick={handleSaveSettings}
        className="fixed bottom-8 right-8 lg:right-1/2 lg:translate-x-[200px] bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-black hover:scale-105 transition-all flex items-center gap-3 z-30"
      >
        <Save size={20} /> Save Configuration
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans selection:bg-pink-100 selection:text-pink-600">
      
      {/* Modern Sidebar */}
      <nav className="hidden lg:flex w-20 bg-white border-r border-slate-200 flex-col items-center py-8 gap-8 fixed h-full z-40">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-pink-200 cursor-pointer" onClick={() => setCurrentView(AppView.DASHBOARD)}>E</div>
        <div className="flex flex-col gap-6 w-full px-2 mt-4">
           {[
               { view: AppView.DASHBOARD, icon: LayoutGrid, label: 'Library' },
               { view: AppView.FLASHCARDS, icon: BookOpen, label: 'Review' },
               { view: AppView.SETTINGS, icon: Settings, label: 'Config' }
           ].map(item => (
               <button 
                  key={item.view}
                  onClick={() => setCurrentView(item.view)} 
                  className={`p-3 rounded-xl transition-all duration-300 relative group flex justify-center ${currentView === item.view ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
               >
                  <item.icon size={22} strokeWidth={2} />
                  <span className="absolute left-full ml-3 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                  </span>
               </button>
           ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="lg:pl-20 w-full min-h-screen">
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          {currentView === AppView.DASHBOARD && renderDashboard()}
          {currentView === AppView.PLAYER && renderPlayer()}
          {currentView === AppView.FLASHCARDS && renderFlashcards()}
          {currentView === AppView.SETTINGS && renderSettings()}
        </div>
      </main>
      
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl p-8 w-full max-w-lg relative shadow-2xl overflow-y-auto max-h-[90vh]">
              <button onClick={()=>setIsImportModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
              
              <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Upload className="text-pink-500" size={24} /> Import Video
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Add content from YouTube or local files.</p>
              </div>

              <div className="flex p-1.5 mb-6 bg-slate-100 rounded-xl">
                   <button 
                     className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${importTab === 'youtube' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     onClick={() => setImportTab('youtube')}
                   >
                     <Youtube size={16} /> YouTube
                   </button>
                   <button 
                     className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${importTab === 'local' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     onClick={() => setImportTab('local')}
                   >
                     <FileVideo size={16} /> Local File
                   </button>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-5">
                  {importError && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex gap-3 items-start border border-red-100">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                            <span>{importError}</span>
                        </div>
                   )}

                  {importTab === 'youtube' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">YouTube URL</label>
                        <input 
                            value={importForm.url} 
                            onChange={e=>setImportForm({...importForm, url: e.target.value})} 
                            placeholder="https://youtube.com/watch?v=..." 
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-100 outline-none" 
                        />
                      </div>
                  ) : (
                      <div className="space-y-4">
                           <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-pink-300 hover:bg-pink-50/10 transition-colors relative cursor-pointer">
                                <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                {localFile ? (
                                   <div className="text-center">
                                      <FileVideo size={32} className="mx-auto text-pink-500 mb-2" />
                                      <p className="text-slate-800 font-bold text-sm truncate max-w-[200px]">{localFile.name}</p>
                                   </div>
                                ) : (
                                   <div className="text-center">
                                      <Upload size={24} className="mx-auto mb-2" />
                                      <p className="text-sm font-medium">Click to select video</p>
                                   </div>
                                )}
                           </div>
                           
                           <div className="flex gap-4">
                               <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subtitles (.srt)</label>
                                    <div className="relative">
                                        <input type="file" accept=".srt" id="subfile" onChange={(e) => handleFileChange(e, 'subtitle')} className="hidden" />
                                        <label htmlFor="subfile" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50">
                                            <FileText size={16} /> {subtitleFile ? "Selected" : "Upload"}
                                        </label>
                                    </div>
                               </div>
                               <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Analysis</label>
                                    <select 
                                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                                        value={analysisProvider}
                                        onChange={(e) => setAnalysisProvider(e.target.value as ProviderType)}
                                    >
                                        <option value="gemini">Gemini</option>
                                        <option value="deepseek">DeepSeek</option>
                                        <option value="qwen-text">Qwen</option>
                                    </select>
                               </div>
                           </div>
                      </div>
                  )}

                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                      <select 
                          value={importForm.category} 
                          onChange={e=>setImportForm({...importForm, category: e.target.value})} 
                          className="w-full p-4 rounded-xl border border-slate-200 bg-white outline-none"
                      >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>

                  <button 
                    type="submit" 
                    disabled={importLoading} 
                    className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                      {importLoading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                      {importLoading ? (aiAnalyzing ? "Analyzing Video..." : "Importing...") : "Start Import"}
                  </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
