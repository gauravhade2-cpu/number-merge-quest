import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board, LevelConfig, GameStats } from './game/types';
import {
  createInitialBoard,
  canMerge,
  executeMerge,
  applyGravity,
  findHintPair,
  evaluateWinLoss,
  calculateStars,
  getHighestTile,
  countObstacles,
  countTilesOfValue,
} from './game/rules';
import { LEVELS } from './game/levels';
import { loadProgress, recordLevelCompletion, resetAllProgress, UserProgress } from './utils/storage';
import { sound } from './utils/audio';

import { TitleScreen } from './components/TitleScreen';
import { LevelSelect } from './components/LevelSelect';
import { BoardView } from './components/BoardView';
import { HUD } from './components/HUD';
import {
  VictoryModal,
  GameOverModal,
  PauseModal,
  TutorialModal,
  PrivacyModal,
  AndroidGuideModal,
} from './components/Modals';

type ScreenState = 'title' | 'levels' | 'playing';
type ModalState = null | 'victory' | 'gameover' | 'paused' | 'tutorial' | 'privacy' | 'android_guide';

interface UndoSnapshot {
  board: Board;
  movesRemaining: number;
  stats: GameStats;
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('title');
  const [modal, setModal] = useState<ModalState>(null);
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const currentLevel: LevelConfig = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  const [board, setBoard] = useState<Board>(() => createInitialBoard(currentLevel));
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [hintPair, setHintPair] = useState<[[number, number], [number, number]] | null>(null);
  const [movesRemaining, setMovesRemaining] = useState<number>(currentLevel.moves);
  const [earnedStars, setEarnedStars] = useState<number>(1);

  const [stats, setStats] = useState<GameStats>({
    movesUsed: 0,
    score: 0,
    highestTile: 2,
    obstaclesRemaining: 0,
    collectedTargetCount: 0,
  });

  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [floatingScore, setFloatingScore] = useState<{ r: number; c: number; score: number; key: number } | null>(null);

  const hintTimerRef = useRef<number | null>(null);

  // Sync state machine to document.body.dataset.state
  useEffect(() => {
    if (screen === 'title') {
      document.body.dataset.state = 'title';
    } else if (modal === 'paused') {
      document.body.dataset.state = 'paused';
    } else if (modal === 'victory' || modal === 'gameover') {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [screen, modal]);

  // Support ?autostart=1 or ?level=N
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';
    const lvlParam = parseInt(params.get('level') || '0', 10);

    if (lvlParam >= 1 && lvlParam <= 50) {
      startLevel(lvlParam);
    } else if (autostart) {
      startLevel(progress.highestUnlockedLevel || 1);
    }
  }, []);

  // Initialize level
  const startLevel = useCallback((levelId: number) => {
    const lvl = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    const initialBoard = createInitialBoard(lvl);

    setCurrentLevelId(lvl.id);
    setBoard(initialBoard);
    setSelectedPos(null);
    setHintPair(null);
    setMovesRemaining(lvl.moves);
    setUndoStack([]);
    setFloatingScore(null);
    setModal(null);
    setScreen('playing');

    const initialObstacles = countObstacles(initialBoard);
    const initialHighest = getHighestTile(initialBoard);

    setStats({
      movesUsed: 0,
      score: 0,
      highestTile: initialHighest,
      obstaclesRemaining: initialObstacles,
      collectedTargetCount: 0,
    });
  }, []);

  // Handle Tile Click
  const handleTileClick = useCallback(
    (r: number, c: number) => {
      if (modal !== null) return;

      const cell = board[r][c];

      // If nothing currently selected:
      if (!selectedPos) {
        if (cell && cell.type === 'number') {
          sound.playSelect();
          setSelectedPos([r, c]);
        } else if (cell) {
          sound.playTap();
        }
        return;
      }

      const [sr, sc] = selectedPos;

      // Clicked the exact same tile -> Deselect
      if (sr === r && sc === c) {
        sound.playTap();
        setSelectedPos(null);
        return;
      }

      // Check if this is an adjacent matching merge move!
      if (canMerge(board, sr, sc, r, c)) {
        // 1. Push undo snapshot
        setUndoStack(prev => [
          ...prev,
          {
            board: board.map(row => row.map(cl => (cl ? { ...cl } : null))),
            movesRemaining,
            stats: { ...stats },
          },
        ]);

        // 2. Execute merge
        const { nextBoard, scoreGained, mergedValue, brokenObstacles } = executeMerge(
          board,
          sr,
          sc,
          r,
          c
        );

        // Sound & visual feedback
        sound.playMerge(mergedValue);
        if (brokenObstacles > 0) {
          setTimeout(() => sound.playObstacleBreak(), 80);
        }

        // Floating score popup
        setFloatingScore({
          r,
          c,
          score: scoreGained,
          key: Date.now(),
        });

        // 3. Gravity and drop
        const { board: settledBoard } = applyGravity(nextBoard, currentLevel.spawnPool);

        const newMoves = movesRemaining - 1;
        const newScore = stats.score + scoreGained;
        const newHighest = Math.max(stats.highestTile, getHighestTile(settledBoard));
        const newObstacles = countObstacles(settledBoard);
        const newCollected =
          currentLevel.objective.targetTile && currentLevel.objective.type === 'collect_tiles'
            ? countTilesOfValue(settledBoard, currentLevel.objective.targetTile)
            : stats.collectedTargetCount;

        const nextStats: GameStats = {
          movesUsed: stats.movesUsed + 1,
          score: newScore,
          highestTile: newHighest,
          obstaclesRemaining: newObstacles,
          collectedTargetCount: newCollected,
        };

        setBoard(settledBoard);
        setSelectedPos(null);
        setHintPair(null);
        setMovesRemaining(newMoves);
        setStats(nextStats);

        // 4. Win/Loss Check
        const winLoss = evaluateWinLoss(settledBoard, nextStats, currentLevel, newMoves);

        if (winLoss === 'victory') {
          const stars = calculateStars(newScore, newMoves, currentLevel.moves, currentLevel);
          setEarnedStars(stars);
          const updatedProgress = recordLevelCompletion(currentLevel.id, newScore, stars);
          setProgress(updatedProgress);

          setTimeout(() => {
            sound.playVictory();
            setModal('victory');
          }, 350);
        } else if (winLoss === 'gameover') {
          setTimeout(() => {
            sound.playGameOver();
            setModal('gameover');
          }, 400);
        }
      } else {
        // Player clicked another number tile -> Switch selection
        if (cell && cell.type === 'number') {
          sound.playSelect();
          setSelectedPos([r, c]);
        } else {
          sound.playTap();
          setSelectedPos(null);
        }
      }
    },
    [board, selectedPos, modal, movesRemaining, stats, currentLevel]
  );

  // Undo Move
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));

    setBoard(previous.board);
    setMovesRemaining(previous.movesRemaining);
    setStats(previous.stats);
    setSelectedPos(null);
    setHintPair(null);
    setFloatingScore(null);
    if (modal === 'gameover') {
      setModal(null);
    }
  }, [undoStack, modal]);

  // Hint
  const handleHint = useCallback(() => {
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
    }
    const pair = findHintPair(board);
    if (pair) {
      setHintPair(pair);
      hintTimerRef.current = window.setTimeout(() => {
        setHintPair(null);
      }, 3500);
    }
  }, [board]);

  // Restart
  const handleRestart = useCallback(() => {
    startLevel(currentLevelId);
  }, [startLevel, currentLevelId]);

  // Reset all progress
  const handleResetProgress = useCallback(() => {
    const fresh = resetAllProgress();
    setProgress(fresh);
  }, []);

  // Total stars
  const totalStars = Object.values(progress.levelStars).reduce((sum, s) => sum + s, 0);
  const bestScoreForCurrentLevel = progress.levelScores[currentLevelId] || 0;

  return (
    <main className="w-full h-full min-h-screen bg-[#0f0a1c] flex flex-col items-center justify-center overflow-hidden">
      {screen === 'title' && (
        <TitleScreen
          onStartGame={() => startLevel(progress.highestUnlockedLevel || 1)}
          onOpenLevelSelect={() => {
            sound.playTap();
            setScreen('levels');
          }}
          onOpenTutorial={() => {
            sound.playTap();
            setModal('tutorial');
          }}
          onOpenPrivacy={() => {
            sound.playTap();
            setModal('privacy');
          }}
          onOpenAndroidGuide={() => {
            sound.playTap();
            setModal('android_guide');
          }}
          highestUnlockedLevel={progress.highestUnlockedLevel}
          totalStars={totalStars}
        />
      )}

      {screen === 'levels' && (
        <LevelSelect
          progress={progress}
          onSelectLevel={lvlId => startLevel(lvlId)}
          onBackToMenu={() => {
            sound.playTap();
            setScreen('title');
          }}
          onResetProgress={handleResetProgress}
        />
      )}

      {screen === 'playing' && (
        <div
          aria-hidden={modal !== null}
          className={`relative w-full h-full min-h-screen max-w-md flex flex-col justify-between px-3 py-3 select-none transition-all duration-300 ${
            modal !== null ? 'pointer-events-none opacity-30 filter blur-[1px]' : ''
          }`}
        >
          {/* Top HUD */}
          <HUD
            level={currentLevel}
            stats={stats}
            movesRemaining={movesRemaining}
            canUndo={undoStack.length > 0}
            onUndo={handleUndo}
            onRestart={handleRestart}
            onHint={handleHint}
            onPause={() => setModal('paused')}
            onHelp={() => setModal('tutorial')}
            bestScore={bestScoreForCurrentLevel}
          />

          {/* Center 5x5 Board */}
          <div className="my-auto py-2">
            <BoardView
              board={board}
              selectedPos={selectedPos}
              hintPair={hintPair}
              onTileClick={handleTileClick}
              floatingScore={floatingScore}
            />
          </div>

          {/* Quick Helper Subtext */}
          <div className="text-center text-[11px] text-purple-400/50 pb-1">
            Tap a tile then tap an adjacent match to merge
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal === 'victory' && (
        <VictoryModal
          level={currentLevel}
          stats={stats}
          stars={earnedStars}
          movesRemaining={movesRemaining}
          bestScore={bestScoreForCurrentLevel}
          hasNextLevel={currentLevelId < 50}
          onNextLevel={() => startLevel(currentLevelId + 1)}
          onReplay={handleRestart}
          onLevelSelect={() => {
            setModal(null);
            setScreen('levels');
          }}
        />
      )}

      {modal === 'gameover' && (
        <GameOverModal
          level={currentLevel}
          stats={stats}
          canUndo={undoStack.length > 0}
          onRetry={handleRestart}
          onUndo={handleUndo}
          onLevelSelect={() => {
            setModal(null);
            setScreen('levels');
          }}
        />
      )}

      {modal === 'paused' && (
        <PauseModal
          onResume={() => setModal(null)}
          onRestart={handleRestart}
          onLevelSelect={() => {
            setModal(null);
            setScreen('levels');
          }}
          onTutorial={() => setModal('tutorial')}
        />
      )}

      {modal === 'tutorial' && <TutorialModal onClose={() => setModal(null)} />}

      {modal === 'privacy' && <PrivacyModal onClose={() => setModal(null)} />}

      {modal === 'android_guide' && <AndroidGuideModal onClose={() => setModal(null)} />}
    </main>
  );
}
