import React, { useState } from 'react';
import { ArrowLeft, Lock, Star, Trophy, RotateCcw, AlertTriangle } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { UserProgress } from '../utils/storage';
import { sound } from '../utils/audio';

interface LevelSelectProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBackToMenu: () => void;
  onResetProgress: () => void;
}

type TabType = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export const LevelSelect: React.FC<LevelSelectProps> = ({
  progress,
  onSelectLevel,
  onBackToMenu,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('Easy');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const tabs: { label: TabType; range: [number, number]; desc: string }[] = [
    { label: 'Easy', range: [1, 10], desc: 'Levels 1–10' },
    { label: 'Medium', range: [11, 25], desc: 'Levels 11–25' },
    { label: 'Hard', range: [26, 40], desc: 'Levels 26–40' },
    { label: 'Expert', range: [41, 50], desc: 'Levels 41–50' },
  ];

  const currentTabConfig = tabs.find(t => t.label === activeTab)!;
  const filteredLevels = LEVELS.filter(
    lvl => lvl.id >= currentTabConfig.range[0] && lvl.id <= currentTabConfig.range[1]
  );

  const totalStars = Object.values(progress.levelStars).reduce((sum, s) => sum + s, 0);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col bg-gradient-to-b from-[#130b24] via-[#1a0f35] to-[#0c0717] text-white select-none">
      {/* Top Bar */}
      <div className="w-full max-w-2xl mx-auto px-4 py-4 flex items-center justify-between border-b border-purple-500/20">
        <button
          onClick={() => {
            sound.playTap();
            onBackToMenu();
          }}
          className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-800/50 flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/50 border border-purple-500/30 text-xs font-semibold text-purple-200">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{totalStars} / 150 ⭐</span>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            setShowResetConfirm(true);
          }}
          className="p-2 rounded-xl bg-purple-900/30 hover:bg-rose-900/40 border border-purple-500/20 hover:border-rose-500/40 text-purple-300 hover:text-rose-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          title="Reset Progress"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Difficulty Tabs */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-3 pb-2">
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-purple-950/60 border border-purple-500/25">
          {tabs.map(tab => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  sound.playTap();
                  setActiveTab(tab.label);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/20 scale-[1.02]'
                    : 'text-purple-300/80 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-normal ${isActive ? 'text-amber-900' : 'text-purple-400/60'}`}>
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Levels Grid */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-3 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pb-8">
          {filteredLevels.map(lvl => {
            const isUnlocked = lvl.id <= progress.highestUnlockedLevel;
            const stars = progress.levelStars[lvl.id] || 0;
            const bestScore = progress.levelScores[lvl.id] || 0;
            const isCurrent = lvl.id === progress.highestUnlockedLevel;

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playSelect();
                    onSelectLevel(lvl.id);
                  }
                }}
                className={`relative p-3 rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer text-left min-h-[110px] ${
                  isUnlocked
                    ? isCurrent
                      ? 'bg-gradient-to-b from-purple-800/80 to-purple-950/90 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-purple-900/40 hover:scale-[1.03]'
                      : 'bg-purple-900/40 border-purple-500/30 hover:bg-purple-800/50 hover:border-purple-400/50 hover:scale-[1.02]'
                    : 'bg-purple-950/20 border-purple-900/30 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Level Number & Status */}
                <div className="w-full flex justify-between items-start">
                  <span className="font-display font-extrabold text-lg text-white">
                    {lvl.id}
                  </span>
                  {!isUnlocked ? (
                    <Lock className="w-4 h-4 text-purple-400/50" />
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 uppercase tracking-wider">
                      Next
                    </span>
                  ) : null}
                </div>

                {/* Objective Short Name */}
                <div className="w-full my-1.5">
                  <div className="text-[11px] font-medium text-purple-200 line-clamp-1">
                    {lvl.objective.description}
                  </div>
                  {bestScore > 0 && (
                    <div className="text-[10px] text-purple-400/80 font-mono">
                      Best: {bestScore}
                    </div>
                  )}
                </div>

                {/* Stars earned */}
                <div className="w-full flex items-center justify-center gap-1 pt-1 border-t border-purple-500/15">
                  {[1, 2, 3].map(s => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= stars
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-purple-900/40 text-purple-600/40'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="max-w-sm w-full bg-gradient-to-b from-[#22133e] to-[#140b25] border border-purple-500/40 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">Reset All Progress?</h3>
            <p className="text-sm text-purple-200/80 mb-6">
              This will clear all 50 level unlocks, earned stars, and high scores. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  sound.playTap();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 text-sm font-semibold hover:bg-purple-800/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sound.playTap();
                  onResetProgress();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
