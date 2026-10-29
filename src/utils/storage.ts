// Safe persistent storage for Number Merge Quest

export interface UserProgress {
  highestUnlockedLevel: number; // 1 to 50
  levelScores: Record<number, number>; // levelId -> best score
  levelStars: Record<number, number>;  // levelId -> stars (1-3)
  tutorialCompleted: boolean;
  totalMerges: number;
}

const STORAGE_KEY = 'number_merge_quest_save_v1';

const DEFAULT_PROGRESS: UserProgress = {
  highestUnlockedLevel: 1,
  levelScores: {},
  levelStars: {},
  tutorialCompleted: false,
  totalMerges: 0,
};

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      highestUnlockedLevel: Math.max(1, Math.min(50, Number(parsed.highestUnlockedLevel) || 1)),
      levelScores: typeof parsed.levelScores === 'object' && parsed.levelScores ? parsed.levelScores : {},
      levelStars: typeof parsed.levelStars === 'object' && parsed.levelStars ? parsed.levelStars : {},
      tutorialCompleted: Boolean(parsed.tutorialCompleted),
      totalMerges: Number(parsed.totalMerges) || 0,
    };
  } catch (e) {
    console.warn('Could not load progress from localStorage:', e);
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Could not save progress to localStorage:', e);
  }
}

export function recordLevelCompletion(
  levelId: number,
  score: number,
  stars: number
): UserProgress {
  const current = loadProgress();

  const prevBestScore = current.levelScores[levelId] || 0;
  const prevBestStars = current.levelStars[levelId] || 0;

  current.levelScores[levelId] = Math.max(prevBestScore, score);
  current.levelStars[levelId] = Math.max(prevBestStars, stars);

  // Unlock next level up to 50
  if (levelId >= current.highestUnlockedLevel && levelId < 50) {
    current.highestUnlockedLevel = levelId + 1;
  }

  saveProgress(current);
  return current;
}

export function resetAllProgress(): UserProgress {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  const fresh = { ...DEFAULT_PROGRESS };
  saveProgress(fresh);
  return fresh;
}

export function getTotalStars(progress: UserProgress): number {
  return Object.values(progress.levelStars).reduce((sum, s) => sum + s, 0);
}
