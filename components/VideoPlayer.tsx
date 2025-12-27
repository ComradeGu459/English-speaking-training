import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  thumbnail: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  duration: number; // total seconds (simulated)
  onSeek: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  thumbnail, 
  isPlaying, 
  onPlayPause, 
  currentTime, 
  duration,
  onSeek
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Video Screen Area */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg group">
        <img 
          src={thumbnail} 
          alt="Video content" 
          className="w-full h-full object-cover opacity-90"
        />
        
        {/* Overlay Play Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all">
            <button 
              onClick={onPlayPause}
              className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all border border-white/50"
            >
              <Play fill="white" className="text-white ml-1" size={32} />
            </button>
          </div>
        )}

        {/* Bottom Gradient for Controls visibility */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white flex flex-col gap-2 z-10">
          {/* Progress Bar */}
          <div 
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer group-hover:h-2 transition-all"
          >
            <div 
              className="h-full bg-pink-500 rounded-full relative" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onPlayPause} className="hover:text-pink-400 transition-colors">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/60">/</span>
                <span className="text-white/60">{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="hover:text-pink-400 transition-colors">
                <Volume2 size={20} />
              </button>
              <button className="bg-white/20 px-2 py-0.5 rounded text-xs font-semibold hover:bg-white/30 transition-colors">
                1.0x
              </button>
              <button className="hover:text-pink-400 transition-colors">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
