export type CellType = 'number' | 'rock' | 'ice';

export interface Cell {
  id: string;
  type: CellType;
  value: number; // For number and ice tiles
  hp?: number;    // For rock obstacles (e.g. 1 or 2 hits to break)
  isNew?: boolean;
  isMerged?: boolean;
}

export type Board = (Cell | null)[][]; // 5x5 grid

export type ObjectiveType =
  | 'reach_tile'        // e.g. reach tile 64 or 128
  | 'target_score'       // e.g. score >= 1500
  | 'reach_tile_and_score'
  | 'clear_obstacles'    // clear all rocks/ice
  | 'collect_tiles';     // create X amount of a specific tile

export interface LevelObjective {
  type: ObjectiveType;
  targetTile?: number;
  targetScore?: number;
  targetCount?: number; // for collect_tiles
  targetObstacleType?: 'rock' | 'ice' | 'all';
  description: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  tier: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  moves: number;
  objective: LevelObjective;
  spawnPool: number[]; // e.g. [2, 4]
  initialBoard: number[][]; // 5x5 numbers or negative values for obstacles (-1 = rock, -2 = ice with 2)
  threeStarScore: number;
  twoStarScore: number;
}

export interface MoveResult {
  valid: boolean;
  scoreGained: number;
  mergedValue: number;
  clearedObstacles: number;
  comboCount: number;
  message?: string;
}

export interface GameStats {
  movesUsed: number;
  score: number;
  highestTile: number;
  obstaclesRemaining: number;
  collectedTargetCount: number;
}
