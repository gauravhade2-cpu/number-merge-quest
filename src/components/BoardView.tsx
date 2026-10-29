import React from 'react';
import { Board, Cell } from '../game/types';
import { getTileVisual, isAdjacent } from '../game/rules';
import { ShieldAlert, Snowflake } from 'lucide-react';

interface BoardViewProps {
  board: Board;
  selectedPos: [number, number] | null;
  hintPair: [[number, number], [number, number]] | null;
  onTileClick: (r: number, c: number) => void;
  floatingScore: { r: number; c: number; score: number; key: number } | null;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  selectedPos,
  hintPair,
  onTileClick,
  floatingScore,
}) => {
  return (
    <div className="relative w-full max-w-[380px] aspect-square mx-auto p-2.5 rounded-3xl bg-[#160d2e]/90 border border-purple-500/30 shadow-2xl shadow-purple-950/60 select-none">
      <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-2">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selectedPos?.[0] === r && selectedPos?.[1] === c;
            const isHint =
              hintPair &&
              ((hintPair[0][0] === r && hintPair[0][1] === c) ||
                (hintPair[1][0] === r && hintPair[1][1] === c));

            // Is this cell an adjacent matching candidate for the currently selected cell?
            const isAdjacentMatching =
              selectedPos &&
              cell &&
              cell.type === 'number' &&
              isAdjacent(selectedPos[0], selectedPos[1], r, c) &&
              board[selectedPos[0]][selectedPos[1]]?.value === cell.value;

            return (
              <div
                key={`${r}-${c}`}
                className="relative w-full h-full flex items-center justify-center"
              >
                {cell ? (
                  <TileItem
                    cell={cell}
                    r={r}
                    c={c}
                    isSelected={Boolean(isSelected)}
                    isAdjacentMatching={Boolean(isAdjacentMatching)}
                    isHint={Boolean(isHint)}
                    onClick={() => onTileClick(r, c)}
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-purple-950/30 border border-purple-900/20" />
                )}

                {/* Floating score animation when merge happens at (r, c) */}
                {floatingScore && floatingScore.r === r && floatingScore.c === c && (
                  <div
                    key={floatingScore.key}
                    className="absolute pointer-events-none z-30 font-display font-black text-amber-300 text-lg sm:text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-float-score"
                  >
                    +{floatingScore.score}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface TileItemProps {
  cell: Cell;
  r: number;
  c: number;
  isSelected: boolean;
  isAdjacentMatching: boolean;
  isHint: boolean;
  onClick: () => void;
}

const TileItem: React.FC<TileItemProps> = ({
  cell,
  r,
  c,
  isSelected,
  isAdjacentMatching,
  isHint,
  onClick,
}) => {
  // 1. Rock obstacle tile
  if (cell.type === 'rock') {
    const isDamaged = (cell.hp ?? 2) === 1;
    return (
      <button
        onClick={onClick}
        aria-label={`Rock Obstacle at row ${r + 1}, col ${c + 1}, ${cell.hp} HP remaining`}
        className={`w-full h-full rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer relative overflow-hidden bg-gradient-to-br from-stone-600 via-stone-700 to-stone-900 border-2 ${
          isDamaged ? 'border-amber-500/60 shadow-inner' : 'border-stone-500/50 shadow-md'
        }`}
      >
        <ShieldAlert className={`w-5 h-5 ${isDamaged ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
        <span className="text-[10px] font-bold font-mono text-stone-300 mt-0.5">
          {cell.hp ?? 2} HP
        </span>
        {isDamaged && (
          <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
        )}
      </button>
    );
  }

  // 2. Ice obstacle tile
  if (cell.type === 'ice') {
    return (
      <button
        onClick={onClick}
        aria-label={`Frozen Tile ${cell.value} at row ${r + 1}, col ${c + 1}`}
        className="w-full h-full rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer relative overflow-hidden bg-gradient-to-br from-sky-400/40 via-cyan-600/30 to-blue-900/60 border-2 border-cyan-300 shadow-lg shadow-cyan-500/20"
      >
        <div className="absolute top-1 right-1 text-cyan-200">
          <Snowflake className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <span className="font-display font-extrabold text-base sm:text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          {cell.value}
        </span>
        <span className="text-[9px] font-semibold text-cyan-200 tracking-wider uppercase">
          Ice
        </span>
      </button>
    );
  }

  // 3. Normal Number tile
  const visual = getTileVisual(cell.value);

  return (
    <button
      onClick={onClick}
      aria-label={`Tile ${cell.value} at row ${r + 1}, col ${c + 1}`}
      className={`w-full h-full rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer font-display font-extrabold relative bg-gradient-to-br ${
        visual.bg
      } ${visual.text} border-2 ${visual.border} ${
        cell.isMerged ? 'animate-merge-pulse' : cell.isNew ? 'animate-pop-in' : ''
      } ${
        isSelected
          ? 'ring-4 ring-white shadow-xl scale-105 z-20'
          : isAdjacentMatching
          ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-[#160d2e] shadow-xl animate-pulse scale-102 z-10'
          : isHint
          ? 'animate-hint-glow ring-2 ring-yellow-300 z-10'
          : 'shadow-md'
      }`}
    >
      <span
        className={`leading-none drop-shadow-sm ${
          cell.value >= 1024
            ? 'text-xs sm:text-sm tracking-tighter'
            : cell.value >= 128
            ? 'text-sm sm:text-base tracking-tight'
            : cell.value >= 16
            ? 'text-base sm:text-lg'
            : 'text-lg sm:text-xl'
        }`}
      >
        {cell.value}
      </span>

      {/* Target indicator icon if it matches the selected tile */}
      {isAdjacentMatching && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] flex items-center justify-center font-black shadow">
          ✓
        </span>
      )}
    </button>
  );
};
