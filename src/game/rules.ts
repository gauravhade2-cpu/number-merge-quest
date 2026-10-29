import { Board, Cell, LevelConfig, GameStats } from './types';

let idCounter = 1;
export function generateCellId(): string {
  return `cell_${idCounter++}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export const BOARD_SIZE = 5;

/**
 * Creates initial 5x5 board from level config matrix.
 * Matrix numbers:
 * > 0 : Number tile with that value
 * -1  : Rock obstacle (hp = 2)
 * -2  : Ice obstacle holding a 2 tile
 * -4  : Ice obstacle holding a 4 tile
 * -8  : Ice obstacle holding an 8 tile
 */
export function createInitialBoard(level: LevelConfig): Board {
  const board: Board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: (Cell | null)[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const val = level.initialBoard[r]?.[c] ?? 2;
      if (val === -1) {
        row.push({
          id: generateCellId(),
          type: 'rock',
          value: 0,
          hp: 2,
        });
      } else if (val < -1) {
        row.push({
          id: generateCellId(),
          type: 'ice',
          value: Math.abs(val),
          hp: 1,
        });
      } else {
        row.push({
          id: generateCellId(),
          type: 'number',
          value: val,
        });
      }
    }
    board.push(row);
  }
  return board;
}

/**
 * Check if two positions are orthogonally adjacent.
 */
export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/**
 * Check if two cells can be merged:
 * Must be orthogonally adjacent, both number tiles, and have the exact same value.
 */
export function canMerge(board: Board, r1: number, c1: number, r2: number, c2: number): boolean {
  if (r1 < 0 || r1 >= BOARD_SIZE || c1 < 0 || c1 >= BOARD_SIZE) return false;
  if (r2 < 0 || r2 >= BOARD_SIZE || c2 < 0 || c2 >= BOARD_SIZE) return false;
  if (!isAdjacent(r1, c1, r2, c2)) return false;

  const cellA = board[r1][c1];
  const cellB = board[r2][c2];

  if (!cellA || !cellB) return false;
  if (cellA.type !== 'number' || cellB.type !== 'number') return false;

  return cellA.value === cellB.value;
}

/**
 * Merges cell (r1, c1) into target cell (r2, c2).
 * Target cell doubles in value.
 * Source cell is emptied.
 * Also damages adjacent obstacles (rocks lose 1 hp, ice melts to become free numbers).
 */
export function executeMerge(
  board: Board,
  r1: number,
  c1: number,
  r2: number,
  c2: number
): {
  nextBoard: Board;
  scoreGained: number;
  mergedValue: number;
  brokenObstacles: number;
} {
  if (!canMerge(board, r1, c1, r2, c2)) {
    throw new Error(`Invalid merge from (${r1},${c1}) to (${r2},${c2})`);
  }

  // Deep clone board
  const nextBoard: Board = board.map(row => row.map(cell => (cell ? { ...cell } : null)));

  const sourceCell = nextBoard[r1][c1]!;
  const targetCell = nextBoard[r2][c2]!;

  const mergedValue = targetCell.value * 2;
  const scoreGained = mergedValue;

  // Upgrade target
  nextBoard[r2][c2] = {
    id: generateCellId(),
    type: 'number',
    value: mergedValue,
    isMerged: true,
  };

  // Clear source
  nextBoard[r1][c1] = null;

  let brokenObstacles = 0;

  // Obstacles damage from merge shockwave: any obstacle adjacent to either (r1,c1) or (r2,c2)
  const affectedCoords = [
    [r1 - 1, c1], [r1 + 1, c1], [r1, c1 - 1], [r1, c1 + 1],
    [r2 - 1, c2], [r2 + 1, c2], [r2, c2 - 1], [r2, c2 + 1],
  ];

  const processed = new Set<string>();

  for (const [ar, ac] of affectedCoords) {
    const key = `${ar},${ac}`;
    if (processed.has(key)) continue;
    processed.add(key);

    if (ar >= 0 && ar < BOARD_SIZE && ac >= 0 && ac < BOARD_SIZE) {
      const neighbor = nextBoard[ar][ac];
      if (!neighbor) continue;

      if (neighbor.type === 'rock') {
        const hp = (neighbor.hp ?? 2) - 1;
        if (hp <= 0) {
          nextBoard[ar][ac] = null; // rock shattered!
          brokenObstacles++;
        } else {
          nextBoard[ar][ac] = { ...neighbor, hp };
        }
      } else if (neighbor.type === 'ice') {
        // Ice melts and turns into a normal playable number tile!
        nextBoard[ar][ac] = {
          id: generateCellId(),
          type: 'number',
          value: neighbor.value,
          isNew: true,
        };
        brokenObstacles++;
      }
    }
  }

  return { nextBoard, scoreGained, mergedValue, brokenObstacles };
}

/**
 * Gravity step:
 * Tiles in each column fall down towards row BOARD_SIZE - 1 to fill empty slots.
 * Empty slots at the top fill with random values from spawnPool.
 */
export function applyGravity(
  board: Board,
  spawnPool: number[],
  randomFn: () => number = Math.random
): {
  board: Board;
  droppedCount: number;
  spawnedCount: number;
} {
  const nextBoard: Board = board.map(row => row.map(cell => (cell ? { ...cell, isNew: false, isMerged: false } : null)));
  let droppedCount = 0;
  let spawnedCount = 0;

  for (let c = 0; c < BOARD_SIZE; c++) {
    // Collect non-null cells from bottom to top
    const colCells: Cell[] = [];
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      const cell = nextBoard[r][c];
      if (cell !== null) {
        colCells.push(cell);
      }
    }

    // Place collected cells back from bottom to top
    let idx = 0;
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      if (idx < colCells.length) {
        const cell = colCells[idx];
        if (nextBoard[r][c]?.id !== cell.id) {
          droppedCount++;
        }
        nextBoard[r][c] = cell;
        idx++;
      } else {
        // Spawn a new tile from spawnPool
        const poolIndex = Math.floor(randomFn() * spawnPool.length);
        const spawnedValue = spawnPool[poolIndex] || 2;
        nextBoard[r][c] = {
          id: generateCellId(),
          type: 'number',
          value: spawnedValue,
          isNew: true,
        };
        spawnedCount++;
      }
    }
  }

  return { board: nextBoard, droppedCount, spawnedCount };
}

/**
 * Check if the board has ANY valid adjacent merge move.
 */
export function hasAnyValidMove(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (!cell || cell.type !== 'number') continue;

      // Check right neighbor
      if (c + 1 < BOARD_SIZE) {
        const right = board[r][c + 1];
        if (right && right.type === 'number' && right.value === cell.value) {
          return true;
        }
      }
      // Check down neighbor
      if (r + 1 < BOARD_SIZE) {
        const down = board[r + 1][c];
        if (down && down.type === 'number' && down.value === cell.value) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Finds the first valid pair of adjacent matching tiles for hint.
 */
export function findHintPair(board: Board): [[number, number], [number, number]] | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (!cell || cell.type !== 'number') continue;

      // Check right
      if (c + 1 < BOARD_SIZE) {
        const right = board[r][c + 1];
        if (right && right.type === 'number' && right.value === cell.value) {
          return [[r, c], [r, c + 1]];
        }
      }
      // Check down
      if (r + 1 < BOARD_SIZE) {
        const down = board[r + 1][c];
        if (down && down.type === 'number' && down.value === cell.value) {
          return [[r, c], [r + 1, c]];
        }
      }
    }
  }
  return null;
}

/**
 * Count obstacles currently on board (rocks or un-melted ice).
 */
export function countObstacles(board: Board): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell && (cell.type === 'rock' || cell.type === 'ice')) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Get highest number value currently on board.
 */
export function getHighestTile(board: Board): number {
  let highest = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell && cell.type === 'number' && cell.value > highest) {
        highest = cell.value;
      }
    }
  }
  return highest;
}

/**
 * Count how many tiles of specific value exist on board.
 */
export function countTilesOfValue(board: Board, val: number): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell && cell.type === 'number' && cell.value === val) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Evaluate victory or game over conditions.
 */
export function evaluateWinLoss(
  board: Board,
  stats: GameStats,
  level: LevelConfig,
  movesRemaining: number
): 'playing' | 'victory' | 'gameover' {
  const obj = level.objective;
  let objectiveMet = false;

  switch (obj.type) {
    case 'reach_tile': {
      const highest = getHighestTile(board);
      if (obj.targetTile && highest >= obj.targetTile) {
        objectiveMet = true;
      }
      break;
    }
    case 'target_score': {
      if (obj.targetScore && stats.score >= obj.targetScore) {
        objectiveMet = true;
      }
      break;
    }
    case 'reach_tile_and_score': {
      const highest = getHighestTile(board);
      if (
        obj.targetTile &&
        obj.targetScore &&
        highest >= obj.targetTile &&
        stats.score >= obj.targetScore
      ) {
        objectiveMet = true;
      }
      break;
    }
    case 'clear_obstacles': {
      const remaining = countObstacles(board);
      if (remaining === 0) {
        objectiveMet = true;
      }
      break;
    }
    case 'collect_tiles': {
      if (obj.targetTile && obj.targetCount) {
        const count = countTilesOfValue(board, obj.targetTile);
        if (count >= obj.targetCount) {
          objectiveMet = true;
        }
      }
      break;
    }
  }

  if (objectiveMet) {
    return 'victory';
  }

  // If moves exhausted, game over
  if (movesRemaining <= 0) {
    return 'gameover';
  }

  // If no valid moves remaining on the board
  if (!hasAnyValidMove(board)) {
    return 'gameover';
  }

  return 'playing';
}

/**
 * Calculate stars (1, 2, or 3) earned on level victory.
 */
export function calculateStars(
  score: number,
  movesRemaining: number,
  totalMoves: number,
  level: LevelConfig
): number {
  if (score >= level.threeStarScore || movesRemaining >= Math.ceil(totalMoves * 0.35)) {
    return 3;
  }
  if (score >= level.twoStarScore || movesRemaining >= Math.ceil(totalMoves * 0.15)) {
    return 2;
  }
  return 1;
}

/**
 * Color and styling lookup for tile values.
 */
export interface TileVisual {
  bg: string;
  text: string;
  border: string;
  glow?: string;
}

export function getTileVisual(value: number): TileVisual {
  switch (value) {
    case 2:
      return { bg: 'from-amber-400 to-amber-500', text: 'text-amber-950', border: 'border-amber-300' };
    case 4:
      return { bg: 'from-orange-400 to-orange-500', text: 'text-orange-950', border: 'border-orange-300' };
    case 8:
      return { bg: 'from-emerald-400 to-emerald-600', text: 'text-emerald-950', border: 'border-emerald-300' };
    case 16:
      return { bg: 'from-teal-400 to-cyan-500', text: 'text-teal-950', border: 'border-cyan-300' };
    case 32:
      return { bg: 'from-blue-500 to-indigo-600', text: 'text-white', border: 'border-blue-300' };
    case 64:
      return { bg: 'from-violet-500 to-purple-600', text: 'text-white', border: 'border-violet-300', glow: 'shadow-purple-500/50' };
    case 128:
      return { bg: 'from-fuchsia-500 to-pink-600', text: 'text-white', border: 'border-pink-300', glow: 'shadow-pink-500/50' };
    case 256:
      return { bg: 'from-rose-500 to-red-600', text: 'text-white', border: 'border-rose-300', glow: 'shadow-rose-500/60' };
    case 512:
      return { bg: 'from-yellow-300 via-amber-400 to-amber-500', text: 'text-amber-950', border: 'border-yellow-200', glow: 'shadow-yellow-400/70' };
    case 1024:
      return { bg: 'from-cyan-300 via-sky-400 to-blue-600', text: 'text-blue-950', border: 'border-cyan-200', glow: 'shadow-cyan-400/80' };
    case 2048:
      return { bg: 'from-yellow-400 via-amber-300 to-amber-600', text: 'text-amber-950', border: 'border-yellow-100', glow: 'shadow-amber-300/90' };
    case 4096:
      return { bg: 'from-purple-400 via-pink-500 to-rose-600', text: 'text-white', border: 'border-pink-200', glow: 'shadow-fuchsia-400/90' };
    default:
      return { bg: 'from-slate-600 to-slate-800', text: 'text-white', border: 'border-slate-500' };
  }
}
