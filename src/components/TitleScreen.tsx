import React, { useEffect } from 'react';
import { Play, Grid, HelpCircle, ShieldCheck, Smartphone, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenTutorial: () => void;
  onOpenPrivacy: () => void;
  onOpenAndroidGuide: () => void;
  highestUnlockedLevel: number;
  totalStars: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenTutorial,
  onOpenPrivacy,
  onOpenAndroidGuide,
  highestUnlockedLevel,
  totalStars,
}) => {
  const [muted, setMuted] = React.useState(sound.getMuted());

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) sound.playTap();
  };

  // Keyboard shortcut: Space or Enter starts game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.playSelect();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between items-center px-4 py-6 bg-gradient-to-b from-[#130b24] via-[#1a0f35] to-[#0c0717] text-white overflow-hidden select-none">
      {/* Decorative ambient background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Toolbar */}
      <div className="w-full max-w-md flex justify-between items-center z-10 pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-xs font-semibold text-purple-200">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{totalStars} / 150 Stars</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-800/50 transition-colors"
            title={muted ? 'Unmute' : 'Mute'}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Showcase Centerpiece with Inline SVG Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto z-10 max-w-sm w-full">
        {/* Floating preview tile showcase */}
        <div className="flex gap-2.5 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center font-display font-bold text-amber-950 text-lg shadow-lg shadow-amber-500/20 transform -rotate-6 animate-pulse">
            2
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center font-display font-bold text-orange-950 text-lg shadow-lg shadow-orange-500/20 transform rotate-3">
            4
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-display font-bold text-emerald-950 text-xl shadow-lg shadow-emerald-500/30 transform -rotate-3 scale-110">
            8
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center font-display font-bold text-teal-950 text-lg shadow-lg shadow-cyan-500/20 transform rotate-6">
            16
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-display font-bold text-white text-lg shadow-lg shadow-purple-500/30 transform -rotate-6">
            64
          </div>
        </div>

        {/* Custom SVG Game Logo Lockup */}
        <div className="relative mb-3">
          <svg viewBox="0 0 400 100" className="w-72 sm:w-80 h-auto filter drop-shadow-[0_8px_20px_rgba(147,51,234,0.4)]">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f3e8ff" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <text
              x="200"
              y="38"
              textAnchor="middle"
              className="font-display font-extrabold text-[28px] tracking-wider fill-[url(#titleGrad)]"
              style={{ letterSpacing: '4px' }}
            >
              NUMBER MERGE
            </text>
            <text
              x="200"
              y="85"
              textAnchor="middle"
              className="font-display font-black text-[46px] tracking-widest fill-[url(#accentGrad)]"
              style={{ letterSpacing: '8px' }}
            >
              QUEST
            </text>
          </svg>
        </div>

        <p className="text-purple-300/80 text-sm font-medium mb-8">
          Match & merge adjacent numbers across 50 campaign levels
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-3.5 w-full">
          <button
            data-start="true"
            onClick={() => {
              sound.playSelect();
              onStartGame();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-amber-950 font-display font-bold text-lg shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>PLAY {highestUnlockedLevel > 1 ? `LEVEL ${highestUnlockedLevel}` : 'CAMPAIGN'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onOpenLevelSelect();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-purple-900/60 border border-purple-500/40 text-purple-100 font-display font-semibold text-base hover:bg-purple-800/70 hover:border-purple-400/60 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Grid className="w-5 h-5 text-purple-300" />
            <span>SELECT LEVEL (50 LEVELS)</span>
          </button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                sound.playTap();
                onOpenTutorial();
              }}
              className="py-2.5 px-3 rounded-xl bg-purple-950/50 border border-purple-500/20 text-purple-200 text-xs font-semibold hover:bg-purple-900/40 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>How to Play</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                onOpenAndroidGuide();
              }}
              className="py-2.5 px-3 rounded-xl bg-purple-950/50 border border-purple-500/20 text-purple-200 text-xs font-semibold hover:bg-purple-900/40 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android Packaging</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Control Hint Line */}
      <div className="w-full max-w-md flex flex-col items-center gap-2 z-10 pb-1">
        <button
          onClick={() => {
            sound.playTap();
            onOpenPrivacy();
          }}
          className="text-xs text-purple-400/70 hover:text-purple-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Offline & Privacy Notice (100% On-Device)</span>
        </button>

        <p className="text-[11px] text-purple-400/40 tracking-wider">
          Space / Enter to Start · Touch or Click Adjacent Tiles
        </p>
      </div>
    </div>
  );
};
