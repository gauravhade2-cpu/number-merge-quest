import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAdjacent,
  canMerge,
  executeMerge,
  applyGravity,
  hasAnyValidMove,
  findHintPair,
  evaluateWinLoss,
  calculateStars,
  createInitialBoard,
  BOARD_SIZE,
} from './rules';
import { LEVELS } from './levels';

test('Level integrity: exactly 50 levels exist and have 5x5 valid initial boards', () => {
  assert.equal(LEVELS.length, 50, 'There should be exactly 50 levels');

  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    assert.equal(lvl.id, i + 1, `Level at index ${i} must have id ${i + 1}`);
    assert.equal(lvl.initialBoard.length, BOARD_SIZE, `Level ${lvl.id} must have ${BOARD_SIZE} rows`);

    for (let r = 0; r < BOARD_SIZE; r++) {
      assert.equal(lvl.initialBoard[r].length, BOARD_SIZE, `Level ${lvl.id} row ${r} must have ${BOARD_SIZE} columns`);
    }

    const board = createInitialBoard(lvl);
    assert.ok(hasAnyValidMove(board), `Level ${lvl.id} (${lvl.name}) must have at least one valid starting move`);
  }
});

test('Adjacency check works correctly for orthogonal neighbors only', () => {
  assert.equal(isAdjacent(0, 0, 0, 1), true, 'Right is adjacent');
  assert.equal(isAdjacent(0, 0, 1, 0), true, 'Down is adjacent');
  assert.equal(isAdjacent(2, 2, 2, 1), true, 'Left is adjacent');
  assert.equal(isAdjacent(2, 2, 1, 2), true, 'Up is adjacent');

  // Diagonals and far points
  assert.equal(isAdjacent(0, 0, 1, 1), false, 'Diagonal is not adjacent');
  assert.equal(isAdjacent(0, 0, 0, 2), false, '2 steps away is not adjacent');
  assert.equal(isAdjacent(1, 1, 1, 1), false, 'Same cell is not adjacent');
});

test('Merge check and execution doubles value and clears source', () => {
  const level1 = LEVELS[0];
  const board = createInitialBoard(level1);

  // In Level 1, [0][0] is 2 and [0][1] is 2
  assert.equal(canMerge(board, 0, 0, 0, 1), true);

  const result = executeMerge(board, 0, 0, 0, 1);
  assert.equal(result.mergedValue, 4);
  assert.equal(result.scoreGained, 4);
  assert.equal(result.nextBoard[0][0], null, 'Source cell becomes null');
  assert.equal(result.nextBoard[0][1]?.value, 4, 'Target cell becomes 4');
});

test('Rock obstacles take damage and break after 2 hits', () => {
  const level11 = LEVELS[10]; // Rock Crusher level
  const board = createInitialBoard(level11);

  // Level 11 has rocks at (1, 1) and (1, 3).
  // At (0,0)=4, (0,1)=4. (0,1) is adjacent to rock at (1,1).
  assert.equal(board[1][1]?.type, 'rock');
  assert.equal(board[1][1]?.hp, 2);

  // Merge (0,0) into (0,1)
  const step1 = executeMerge(board, 0, 0, 0, 1);
  assert.equal(step1.nextBoard[1][1]?.type, 'rock');
  assert.equal(step1.nextBoard[1][1]?.hp, 1, 'Rock should now have 1 HP');

  // Set up adjacent matching tiles to hit it a second time
  step1.nextBoard[2][0] = { id: 'temp1', type: 'number', value: 8 };
  step1.nextBoard[2][1] = { id: 'temp2', type: 'number', value: 8 };
  assert.equal(canMerge(step1.nextBoard, 2, 0, 2, 1), true);

  const step2 = executeMerge(step1.nextBoard, 2, 0, 2, 1);
  assert.equal(step2.nextBoard[1][1], null, 'Rock should shatter to null when HP hits 0');
  assert.equal(step2.brokenObstacles, 1);
});

test('Ice obstacles melt on adjacent merge into usable number tile', () => {
  const level26 = LEVELS[25]; // Frostbite
  const board = createInitialBoard(level26);

  // [0][0]=8, [0][1]=8, adjacent to [1][1] which is ice (-4)
  assert.equal(board[1][1]?.type, 'ice');
  assert.equal(board[1][1]?.value, 4);

  const result = executeMerge(board, 0, 0, 0, 1);
  assert.equal(result.nextBoard[1][1]?.type, 'number', 'Ice melts to normal number tile');
  assert.equal(result.nextBoard[1][1]?.value, 4, 'Tile has value 4');
});

test('Gravity drops tiles down and spawns replacement tiles from pool', () => {
  const level = LEVELS[0];
  const board = createInitialBoard(level);

  // Empty a cell
  board[4][0] = null;
  const gravityRes = applyGravity(board, [2, 4], () => 0.5);

  assert.notEqual(gravityRes.board[4][0], null, 'Bottom cell should be filled after gravity');
  assert.notEqual(gravityRes.board[0][0], null, 'Top cell should be newly spawned');
});

test('findHintPair returns coordinates of valid move', () => {
  const level = LEVELS[0];
  const board = createInitialBoard(level);
  const hint = findHintPair(board);
  assert.ok(hint !== null, 'Should find a hint pair');
  const [[r1, c1], [r2, c2]] = hint!;
  assert.equal(canMerge(board, r1, c1, r2, c2), true);
});

test('evaluateWinLoss identifies victory on target reached', () => {
  const level1 = LEVELS[0]; // targetTile: 16
  const board = createInitialBoard(level1);
  // Put a 16 on board
  board[2][2] = { id: 'test_16', type: 'number', value: 16 };

  const status = evaluateWinLoss(board, { movesUsed: 2, score: 200, highestTile: 16, obstaclesRemaining: 0, collectedTargetCount: 0 }, level1, 18);
  assert.equal(status, 'victory');
});

test('evaluateWinLoss identifies gameover when moves are 0 and objective not met', () => {
  const level1 = LEVELS[0];
  const board = createInitialBoard(level1);
  const status = evaluateWinLoss(board, { movesUsed: 20, score: 50, highestTile: 8, obstaclesRemaining: 0, collectedTargetCount: 0 }, level1, 0);
  assert.equal(status, 'gameover');
});

test('calculateStars awards 3 stars for high score or move conservation', () => {
  const level1 = LEVELS[0];
  const starsMax = calculateStars(250, 12, 20, level1);
  assert.equal(starsMax, 3);

  const starsMid = calculateStars(130, 4, 20, level1);
  assert.equal(starsMid, 2);

  const starsMin = calculateStars(50, 1, 20, level1);
  assert.equal(starsMin, 1);
});
