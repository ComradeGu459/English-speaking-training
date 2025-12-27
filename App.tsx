import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, BookOpen, User, Settings, Sparkles, Clock, ChevronRight, PlayCircle, Plus } from 'lucide-react';
import { AppView, VideoContent, WordDefinition, Flashcard } from './types';
import { MOCK_VIDEOS, CATEGORIES } from './constants';
import VideoPlayer from './components/VideoPlayer';
import InteractiveTranscript from './components/InteractiveTranscript';

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [savedWords, setSavedWords] = useState<Flashcard[]>([]);
  
  // Video Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(320); // mock duration
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load a video
  const handleSelectVideo = (video: VideoContent) => {
    setSelectedVideo(video);
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentView(AppView.PLAYER);
    // Parse duration string "MM:SS" to seconds for the mock
    const [m, s] = video.duration.split(':').map(Number);
    setDuration(m * 60 + s);
  };

  // Video Timer Logic (Mock Playback)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.1; // 100ms updates
        });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  const handleSaveWord = (def: WordDefinition, subId: string) => {
    if (!selectedVideo) return;
    const newCard: Flashcard = {
      ...def,
      id: Date.now().toString(),
      sourceVideoId: selectedVideo.id,
      timestamp: currentTime
    };
    setSavedWords(prev => [newCard, ...prev]);
  };

  // Views
  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} />
            <span>AI Powered Learning</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Master English with <br/>YouTube Shadowing</h1>
          <p className="text-white/90 mb-6 max-w-lg">Import your favorite videos, get AI explanations, and practice speaking with real-time feedback.</p>
          <button className="bg-white text-rose-500 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-pink-50 transition-colors flex items-center gap-2">
            <Plus size={20} /> Import Video
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Learning Themes</h2>
          <button className="text-pink-500 text-sm font-medium hover:underline">View all</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {CATEGORIES.map((cat, i) => (
            <button key={i} className="px-6 py-3 bg-white border border-slate-100 rounded-xl whitespace-nowrap text-slate-600 font-medium hover:border-pink-200 hover:text-pink-500 hover:shadow-sm transition-all">
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_VIDEOS.map((video) => (
          <div 
            key={video.id} 
            onClick={() => handleSelectVideo(video)}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-slate-100 cursor-pointer"
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                {video.duration}
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <PlayCircle size={48} className="text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white
                  ${video.level === 'Beginner' ? 'bg-emerald-400' : video.level === 'Intermediate' ? 'bg-amber-400' : 'bg-rose-400'}
                `}>
                  {video.level}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                  {video.category}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 leading-snug mb-2 group-hover:text-pink-500 transition-colors line-clamp-2">
                {video.title}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{video.description}</p>
              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-3">
                <span className="flex items-center gap-1"><Clock size={12}/> {video.date}</span>
                <span>Click to practice</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlayer = () => {
    if (!selectedVideo) return null;
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-6 animate-in slide-in-from-right duration-500">
        {/* Left Column: Player & Info */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-[-10px]">
            <button onClick={() => setCurrentView(AppView.DASHBOARD)} className="hover:text-pink-500">Home</button>
            <ChevronRight size={14} />
            <span>{selectedVideo.category}</span>
          </div>
          
          <VideoPlayer 
            thumbnail={selectedVideo.thumbnail}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onSeek={(t) => setCurrentTime(t)}
          />

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{selectedVideo.title}</h1>
            <p className="text-slate-600 mb-4">{selectedVideo.description}</p>
            <div className="flex gap-4">
              <button className="flex-1 bg-pink-50 text-pink-600 py-2.5 rounded-xl font-medium hover:bg-pink-100 transition-colors flex items-center justify-center gap-2">
                <BookOpen size={18} /> Full Script
              </button>
              <button className="flex-1 bg-slate-50 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                <Sparkles size={18} /> AI Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Transcript */}
        <div className="lg:w-[450px] h-full">
           <InteractiveTranscript 
             subtitles={selectedVideo.subtitles}
             currentTime={currentTime}
             onSeek={(t) => {
               setCurrentTime(t);
               setIsPlaying(true);
             }}
             onSaveWord={handleSaveWord}
           />
        </div>
      </div>
    );
  };

  const renderFlashcards = () => (
    <div className="animate-in fade-in zoom-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Sparkles className="text-pink-500" />
        Vocabulary Collection
        <span className="text-sm font-normal text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">{savedWords.length} words</span>
      </h2>

      {savedWords.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">No words saved yet. Go watch a video and click on words!</p>
          <button onClick={() => setCurrentView(AppView.DASHBOARD)} className="mt-4 text-pink-500 font-medium hover:underline">Go to Dashboard</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedWords.map((card) => (
            <div key={card.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
               <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xl font-bold text-slate-800">{card.word}</h3>
                 <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{card.type}</span>
               </div>
               <div className="text-sm font-mono text-pink-500 mb-3">{card.ipa}</div>
               <div className="mb-4">
                 <p className="text-slate-700 font-medium mb-1">{card.meaning}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                 "{card.example}"
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-white border-r border-slate-100 flex flex-col items-center py-8 gap-8 fixed h-full z-20">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-pink-200">
          E
        </div>
        
        <div className="flex flex-col gap-6 w-full">
          <button 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className={`p-3 mx-auto rounded-xl transition-all relative group
              ${currentView === AppView.DASHBOARD ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
            `}
          >
            <LayoutGrid size={24} />
            {currentView === AppView.DASHBOARD && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full" />}
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Explore</span>
          </button>

          <button 
             onClick={() => setCurrentView(AppView.FLASHCARDS)}
             className={`p-3 mx-auto rounded-xl transition-all relative group
              ${currentView === AppView.FLASHCARDS ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
            `}
          >
            <BookOpen size={24} />
            {currentView === AppView.FLASHCARDS && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full" />}
             <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Flashcards</span>
          </button>

          <button className="p-3 mx-auto rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <User size={24} />
          </button>
        </div>

        <div className="mt-auto">
          <button className="p-3 mx-auto rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <Settings size={24} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pl-20 w-full min-h-screen">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          {currentView === AppView.DASHBOARD && renderDashboard()}
          {currentView === AppView.PLAYER && renderPlayer()}
          {currentView === AppView.FLASHCARDS && renderFlashcards()}
        </div>
      </main>
    </div>
  );
};

export default App;