import React from 'react';
import { Pause, RotateCcw, Undo2, Lightbulb, Volume2, VolumeX, HelpCircle, Target } from 'lucide-react';
import { LevelConfig, GameStats } from '../game/types';
import { sound } from '../utils/audio';

interface HUDProps {
  level: LevelConfig;
  stats: GameStats;
  movesRemaining: number;
  canUndo: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onHint: () => void;
  onPause: () => void;
  onHelp: () => void;
  bestScore: number;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  stats,
  movesRemaining,
  canUndo,
  onUndo,
  onRestart,
  onHint,
  onPause,
  onHelp,
  bestScore,
}) => {
  const [muted, setMuted] = React.useState(sound.getMuted());

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) sound.playTap();
  };

  // Compute progress toward objective
  let progressFraction = 0;
  let progressLabel = '';

  const obj = level.objective;
  if (obj.type === 'reach_tile' && obj.targetTile) {
    progressFraction = Math.min(1, Math.log2(Math.max(2, stats.highestTile)) / Math.log2(obj.targetTile));
    progressLabel = `${stats.highestTile} / ${obj.targetTile}`;
  } else if (obj.type === 'target_score' && obj.targetScore) {
    progressFraction = Math.min(1, stats.score / obj.targetScore);
    progressLabel = `${stats.score} / ${obj.targetScore}`;
  } else if (obj.type === 'clear_obstacles') {
    // Initial obstacles in level
    let totalObs = 0;
    for (const row of level.initialBoard) {
      for (const val of row) {
        if (val < 0) totalObs++;
      }
    }
    const cleared = Math.max(0, totalObs - stats.obstaclesRemaining);
    progressFraction = totalObs > 0 ? Math.min(1, cleared / totalObs) : 1;
    progressLabel = `${cleared} / ${totalObs} Cleared`;
  } else if (obj.type === 'collect_tiles' && obj.targetCount) {
    progressFraction = Math.min(1, stats.collectedTargetCount / obj.targetCount);
    progressLabel = `${stats.collectedTargetCount} / ${obj.targetCount}`;
  } else if (obj.type === 'reach_tile_and_score' && obj.targetTile && obj.targetScore) {
    const tileFrac = Math.min(1, Math.log2(Math.max(2, stats.highestTile)) / Math.log2(obj.targetTile));
    const scoreFrac = Math.min(1, stats.score / obj.targetScore);
    progressFraction = (tileFrac + scoreFrac) / 2;
    progressLabel = `${stats.highestTile} (Tile) · ${stats.score} (Pts)`;
  }

  const isLowMoves = movesRemaining <= 5;

  return (
    <div className="w-full max-w-[390px] mx-auto flex flex-col gap-2 select-none">
      {/* Top Controls & Level Title */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => {
            sound.playTap();
            onPause();
          }}
          className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-800/50 transition-colors cursor-pointer"
          title="Pause Game"
          aria-label="Pause Game"
        >
          <Pause className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-sm tracking-wide text-white">
              LEVEL {level.id}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              level.tier === 'Easy' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              level.tier === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              level.tier === 'Hard' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
              'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              {level.tier}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-800/50 transition-colors cursor-pointer"
            title={muted ? 'Unmute' : 'Mute'}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Objective Card & Progress Bar */}
      <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-950/70 border border-purple-500/25 shadow-lg">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 text-purple-200 font-semibold">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>{level.objective.description}</span>
          </div>
          <span className="text-[11px] font-mono text-purple-300 font-bold">
            {progressLabel}
          </span>
        </div>

        {/* Progress bar track */}
        <div className="w-full h-2 rounded-full bg-purple-950/80 border border-purple-800/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
            style={{ width: `${Math.max(4, Math.round(progressFraction * 100))}%` }}
          />
        </div>
      </div>

      {/* Metrics Row: Moves Left + Score */}
      <div className="grid grid-cols-2 gap-2">
        {/* Moves Counter */}
        <div className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-colors ${
          isLowMoves
            ? 'bg-rose-950/40 border-rose-500/50 animate-pulse'
            : 'bg-purple-950/50 border-purple-500/20'
        }`}>
          <span className="text-[10px] font-bold text-purple-300/80 uppercase tracking-wider">
            MOVES LEFT
          </span>
          <span className={`font-display font-black text-2xl tabular-nums leading-tight ${
            isLowMoves ? 'text-rose-400' : 'text-white'
          }`}>
            {movesRemaining}
          </span>
        </div>

        {/* Score Counter */}
        <div className="p-2 rounded-2xl bg-purple-950/50 border border-purple-500/20 flex flex-col items-center justify-center">
          <div className="w-full flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-purple-300/80 uppercase tracking-wider">
              SCORE
            </span>
            {bestScore > 0 && (
              <span className="text-[9px] font-mono text-amber-300/80">
                BEST: {bestScore}
              </span>
            )}
          </div>
          <span className="font-display font-black text-2xl text-amber-300 tabular-nums leading-tight">
            {stats.score}
          </span>
        </div>
      </div>

      {/* Bottom In-Game Toolbar */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Undo button */}
        <button
          onClick={() => {
            sound.playUndo();
            onUndo();
          }}
          disabled={!canUndo}
          className={`py-2 px-1 rounded-2xl border flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all cursor-pointer ${
            canUndo
              ? 'bg-purple-900/40 border-purple-500/40 text-purple-200 hover:bg-purple-800/60 hover:text-white'
              : 'bg-purple-950/20 border-purple-900/30 text-purple-500/40 cursor-not-allowed opacity-50'
          }`}
          title="Undo Last Move"
        >
          <Undo2 className="w-4 h-4" />
          <span className="text-[10px]">Undo</span>
        </button>

        {/* Hint button */}
        <button
          onClick={() => {
            sound.playHint();
            onHint();
          }}
          className="py-2 px-1 rounded-2xl bg-purple-900/40 border border-purple-500/40 text-purple-200 hover:bg-purple-800/60 hover:text-white flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all cursor-pointer"
          title="Show Hint"
        >
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px]">Hint</span>
        </button>

        {/* Restart button */}
        <button
          onClick={() => {
            sound.playTap();
            onRestart();
          }}
          className="py-2 px-1 rounded-2xl bg-purple-900/40 border border-purple-500/40 text-purple-200 hover:bg-purple-800/60 hover:text-white flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all cursor-pointer"
          title="Restart Level"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px]">Restart</span>
        </button>

        {/* Help button */}
        <button
          onClick={() => {
            sound.playTap();
            onHelp();
          }}
          className="py-2 px-1 rounded-2xl bg-purple-900/40 border border-purple-500/40 text-purple-200 hover:bg-purple-800/60 hover:text-white flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all cursor-pointer"
          title="How to Play"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px]">Guide</span>
        </button>
      </div>
    </div>
  );
};
