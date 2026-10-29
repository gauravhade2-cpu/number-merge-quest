import React from 'react';
import { Star, Trophy, RotateCcw, ArrowRight, Grid, Play, Undo2, X, ShieldCheck, Smartphone, CheckCircle, HelpCircle } from 'lucide-react';
import { LevelConfig, GameStats } from '../game/types';
import { sound } from '../utils/audio';

// ==========================================
// 1. VICTORY MODAL
// ==========================================
interface VictoryModalProps {
  level: LevelConfig;
  stats: GameStats;
  stars: number;
  movesRemaining: number;
  bestScore: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  stats,
  stars,
  movesRemaining,
  bestScore,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onLevelSelect,
}) => {
  const isNewBest = stats.score >= bestScore && stats.score > 0;
  const movesUsed = stats.movesUsed || Math.max(0, level.moves - movesRemaining);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Level ${level.id} Cleared`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#070410]/90 backdrop-blur-sm p-4 select-none overflow-y-auto pointer-events-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="w-full max-w-sm my-auto bg-gradient-to-b from-[#251347] via-[#1b0d36] to-[#100722] border-2 border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center shadow-2xl shadow-purple-950/90 animate-pop-in relative">
        {/* Glow backdrop behind stars */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Level Clear Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Level Clear</span>
        </div>

        {/* Level Title */}
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-1 tracking-wide">
          LEVEL {level.id}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-purple-200/80 mb-4 line-clamp-1">
          {level.objective.description}
        </p>

        {/* 3 Animated Stars */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {[1, 2, 3].map(s => {
            const isFilled = s <= stars;
            return (
              <div
                key={s}
                className={`transform transition-all ${
                  isFilled
                    ? 'animate-star text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]'
                    : 'text-purple-900/60'
                }`}
                style={{ animationDelay: `${s * 0.12}s` }}
              >
                <Star className="w-10 h-10 sm:w-12 sm:h-12 fill-current" />
              </div>
            );
          })}
        </div>

        {/* Stat Grid: Final Score, Best Score, Moves Used, Highest Tile */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-purple-950/70 border border-purple-500/20 mb-5 text-left">
          {/* Final Score */}
          <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/15 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              Final Score
            </span>
            <span className="font-display font-black text-xl text-amber-300 tabular-nums">
              {stats.score}
            </span>
          </div>

          {/* Best Score */}
          <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/15 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Best Score
              </span>
              {isNewBest && (
                <span className="text-[9px] font-black px-1 rounded bg-amber-400 text-amber-950 leading-tight">
                  NEW
                </span>
              )}
            </div>
            <span className="font-display font-black text-xl text-white tabular-nums">
              {Math.max(bestScore, stats.score)}
            </span>
          </div>

          {/* Moves Used */}
          <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/15 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              Moves Used
            </span>
            <span className="font-display font-bold text-base text-emerald-400 tabular-nums">
              {movesUsed} <span className="text-xs text-purple-300 font-normal">/ {level.moves}</span>
            </span>
          </div>

          {/* Highest Tile */}
          <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/15 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              Highest Tile
            </span>
            <span className="font-display font-bold text-base text-cyan-300 tabular-nums">
              {stats.highestTile}
            </span>
          </div>
        </div>

        {/* Action Buttons: Next Level, Replay, Level Selection */}
        <div className="flex flex-col gap-2.5">
          {/* Primary Next Level CTA */}
          {hasNextLevel ? (
            <button
              data-start="true"
              onClick={() => {
                sound.playSelect();
                onNextLevel();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-amber-950 font-display font-black text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <span>NEXT LEVEL</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-bold">
              👑 Quest Complete! You conquered all 50 levels!
            </div>
          )}

          {/* Secondary Buttons Row: Replay & Level Select */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                sound.playTap();
                onReplay();
              }}
              className="py-3 px-3 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 font-semibold text-xs sm:text-sm hover:bg-purple-800/60 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Replay</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                onLevelSelect();
              }}
              className="py-3 px-3 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 font-semibold text-xs sm:text-sm hover:bg-purple-800/60 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all min-h-[44px]"
            >
              <Grid className="w-4 h-4 text-purple-300 shrink-0" />
              <span>Level Select</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. GAME OVER MODAL
// ==========================================
interface GameOverModalProps {
  level: LevelConfig;
  stats: GameStats;
  canUndo: boolean;
  onRetry: () => void;
  onUndo: () => void;
  onLevelSelect: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  level,
  stats,
  canUndo,
  onRetry,
  onUndo,
  onLevelSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-none px-4 select-none animate-pop-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#2d122b] via-[#1e0a25] to-[#120617] border-2 border-rose-500/50 rounded-3xl p-6 text-center shadow-2xl shadow-rose-950/80">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-3">
          <RotateCcw className="w-8 h-8" />
        </div>

        <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-1 tracking-wide">
          OUT OF MOVES
        </h2>
        <p className="text-sm font-medium text-purple-200/80 mb-5">
          Objective: {level.objective.description}
        </p>

        {/* Progress summary */}
        <div className="bg-purple-950/60 border border-purple-500/20 rounded-2xl p-4 mb-6 flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-purple-300">Final Score:</span>
            <span className="font-display font-bold text-amber-300 text-lg tabular-nums">
              {stats.score}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-purple-300">Highest Tile:</span>
            <span className="font-display font-bold text-cyan-300 text-base tabular-nums">
              {stats.highestTile}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            data-start="true"
            onClick={() => {
              sound.playSelect();
              onRetry();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-amber-950 font-display font-black text-base shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>TRY AGAIN</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            {canUndo && (
              <button
                onClick={() => {
                  sound.playUndo();
                  onUndo();
                }}
                className="py-3 px-4 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 font-semibold text-xs hover:bg-purple-800/60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Undo2 className="w-4 h-4 text-emerald-400" />
                <span>Undo Move</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playTap();
                onLevelSelect();
              }}
              className={`py-3 px-4 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 font-semibold text-xs hover:bg-purple-800/60 flex items-center justify-center gap-1.5 cursor-pointer ${
                !canUndo ? 'col-span-2' : ''
              }`}
            >
              <Grid className="w-4 h-4 text-purple-300" />
              <span>Select Level</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. PAUSE MODAL
// ==========================================
interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  onTutorial: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onLevelSelect,
  onTutorial,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-none px-4 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#22133e] to-[#120722] border border-purple-500/40 rounded-3xl p-6 text-center shadow-2xl">
        <h2 className="font-display font-black text-2xl text-white mb-6 tracking-wide">
          GAME PAUSED
        </h2>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              sound.playSelect();
              onResume();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-400 text-amber-950 font-display font-bold text-base hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onRestart();
            }}
            className="w-full py-3 px-6 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-200 font-semibold text-sm hover:bg-purple-800/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Restart Level</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onLevelSelect();
            }}
            className="w-full py-3 px-6 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-200 font-semibold text-sm hover:bg-purple-800/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-purple-300" />
            <span>Level Select</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onTutorial();
            }}
            className="w-full py-3 px-6 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>How to Play Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. INTERACTIVE TUTORIAL MODAL
// ==========================================
interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-none px-4 select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-[#22133e] to-[#120722] border border-purple-500/40 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-500/20">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>How to Play</span>
          </h2>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-purple-900/40 text-purple-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm text-purple-200">
          {/* Step 1 */}
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/20 flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 font-display font-bold text-lg flex items-center justify-center shrink-0 shadow">
              2
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">1. Select a Tile</div>
              <div className="text-xs text-purple-300/80">
                Tap any numbered tile on the 5×5 grid. It will highlight with a bright selection ring.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/20 flex gap-3 items-center">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-amber-400 text-amber-950 font-display font-bold text-sm flex items-center justify-center shadow">
                2
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <div className="w-9 h-9 rounded-lg bg-amber-400 text-amber-950 font-display font-bold text-sm flex items-center justify-center ring-2 ring-emerald-400 shadow">
                2
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">2. Tap Adjacent Match</div>
              <div className="text-xs text-purple-300/80">
                Tap an orthogonally adjacent tile with the exact same number. Valid neighbors will glow green!
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/20 flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-orange-950 font-display font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
              4
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">3. Double Value & Gravity</div>
              <div className="text-xs text-purple-300/80">
                The tiles merge into double their value (2+2→4, 4+4→8, 8+8→16)! Gravity drops tiles down and new tiles spawn at the top.
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/20 flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl bg-stone-700 border border-stone-500 text-stone-200 font-bold text-xs flex flex-col items-center justify-center shrink-0">
              <span>ROCK</span>
              <span className="text-[9px] text-amber-400">2 HP</span>
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">4. Clear Obstacles</div>
              <div className="text-xs text-purple-300/80">
                Merges emit shockwaves! Any adjacent rocks crack and shatter, while frozen ice tiles melt to reveal free numbers.
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/20 flex gap-3 items-center">
            <Trophy className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-white mb-0.5">5. Complete Objectives</div>
              <div className="text-xs text-purple-300/80">
                Reach the target tile or score before you run out of moves. Use Undo and Hint whenever you get stuck!
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playSelect();
            onClose();
          }}
          className="w-full mt-4 py-3 rounded-2xl bg-amber-400 text-amber-950 font-display font-bold text-sm hover:bg-amber-300 transition-colors cursor-pointer"
        >
          GOT IT, LET'S PLAY!
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 5. PRIVACY NOTICE MODAL
// ==========================================
interface PrivacyModalProps {
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-none px-4 select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-[#22133e] to-[#120722] border border-purple-500/40 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-purple-500/20">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Privacy & Offline Notice</span>
          </h2>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1 rounded-full bg-purple-900/40 text-purple-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-purple-200/90 leading-relaxed">
          <p>
            <strong>Number Merge Quest</strong> is designed to respect player privacy and operate 100% offline.
          </p>
          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/20 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Local Storage Only:</strong> Your campaign progress, unlocked levels, star achievements, and sound preferences are stored solely on your local device (via browser localStorage).</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Zero Data Transmission:</strong> The game sends no telemetry, cookies, analytics, or personal identifiers over the internet.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No External APIs or Paid Services:</strong> All visuals, sound effects, and game logic run entirely on the client.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Google Play Ready:</strong> Conforms to Google Play Families Policy & GDPR/CCPA data minimization principles.</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full mt-4 py-2.5 rounded-xl bg-purple-900/60 border border-purple-500/30 text-purple-200 font-semibold text-xs hover:bg-purple-800/70 cursor-pointer"
        >
          Close Notice
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 6. ANDROID DEPLOYMENT GUIDE MODAL
// ==========================================
interface AndroidGuideModalProps {
  onClose: () => void;
}

export const AndroidGuideModal: React.FC<AndroidGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-none px-4 select-none">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#22133e] to-[#120722] border border-purple-500/40 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-purple-500/20">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>Android APK & Google Play Guide</span>
          </h2>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1 rounded-full bg-purple-900/40 text-purple-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-purple-200/90 leading-relaxed font-sans">
          <div className="p-3 rounded-2xl bg-purple-950/70 border border-purple-500/20">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
              <span>Method 1: Bubblewrap (Official Google TWA - Recommended)</span>
            </h4>
            <p className="text-purple-300/80 mb-2">
              Bubblewrap transforms this web app into a lightweight, native Android App Bundle (.aab) with hardware acceleration.
            </p>
            <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-300 overflow-x-auto select-all">
{`# 1. Install Google Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize project from your hosted URL
bubblewrap init --manifest=https://<your-url>/manifest.json

# 3. Build signed Android App Bundle (.aab)
bubblewrap build`}
            </pre>
          </div>

          <div className="p-3 rounded-2xl bg-purple-950/70 border border-purple-500/20">
            <h4 className="font-bold text-white text-sm mb-1">
              Method 2: Capacitor / Android Studio WebView
            </h4>
            <p className="text-purple-300/80 mb-2">
              Embed the production build directly into a native Android APK:
            </p>
            <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
{`# 1. Build web distribution
npm run build

# 2. Add Capacitor Android
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Number Merge Quest" com.quest.numbermerge
npx cap add android
npx cap copy

# 3. Open in Android Studio to test on phone or build signed release
npx cap open android`}
            </pre>
          </div>

          <div className="p-3 rounded-2xl bg-purple-950/70 border border-purple-500/20">
            <h4 className="font-bold text-white text-sm mb-1">
              Google Play Submission Checklist
            </h4>
            <ul className="list-disc list-inside space-y-1 text-purple-300/80">
              <li>App Icon: 512×512 PNG (32-bit color, no transparency)</li>
              <li>Feature Graphic: 1024×500 PNG/JPEG</li>
              <li>Target SDK: Android 14+ (API Level 34)</li>
              <li>Privacy Policy: Point URL to privacy declaration (no personal data collected)</li>
              <li>Content Rating: Suitable for All (ESRB Everyone / PEGI 3)</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full mt-4 py-2.5 rounded-xl bg-amber-400 text-amber-950 font-display font-bold text-xs hover:bg-amber-300 cursor-pointer"
        >
          Close Guide
        </button>
      </div>
    </div>
  );
};
