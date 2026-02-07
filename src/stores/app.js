// Utilities
import { defineStore } from 'pinia'
import { AIDifficulty } from '../AI/common'

export const useAppStore = defineStore('app', {
  state: () => ({
    boardWorker: null,
    modelReady: false,
    modelLoading: false,
    selectedDifficulty: loadDifficultySetting(),
    selectedColor: loadColorSetting(),
    soundEnabled: loadSoundSetting(),
    savedGames: loadSavedGames()
  }),
  getters: {
    selectedDifficultyLabel: (state) => state.selectedDifficulty.label
  },
  actions: {
    initBoardWorker() {
      if (!this.boardWorker) {
        this.boardWorker = new Worker(new URL('../AI/boardWorker.ts', import.meta.url), {
          type: 'module'
        });
      }
      return this.boardWorker;
    },
    cleanupBoardWorker() {
      if (this.boardWorker) {
        this.boardWorker.terminate();
        this.boardWorker = null;
      }
    },
    setModelReady(ready) {
      this.modelReady = ready;
    },
    setModelLoading(loading) {
      this.modelLoading = loading;
    },
    setDifficulty(difficultyConfig) {
      this.selectedDifficulty = difficultyConfig;
      saveDifficultySetting(difficultyConfig.level);
    },
    setDifficultyByLevel(level) {
      this.selectedDifficulty = AIDifficulty.getConfig(level);
      saveDifficultySetting(level);
    },
    setColor(color) {
      this.selectedColor = color;
      saveColorSetting(color);
    },
    setSoundEnabled(enabled) {
      this.soundEnabled = enabled;
      saveSoundSetting(enabled);
    },
    toggleSound() {
      this.setSoundEnabled(!this.soundEnabled);
    },
    saveGame(gameData) {
      const filtered = this.savedGames.filter(g => g.gameId !== gameData.gameId)
      filtered.push({ ...gameData, savedAt: Date.now() })
      filtered.sort((a, b) => b.savedAt - a.savedAt)
      this.savedGames = filtered.slice(0, MAX_SAVED_GAMES)
      persistSavedGames(this.savedGames)
    },
    deleteGame(gameId) {
      this.savedGames = this.savedGames.filter(g => g.gameId !== gameId)
      persistSavedGames(this.savedGames)
    },
    refreshSavedGames() {
      this.savedGames = loadSavedGames()
    }
  }
})

function loadSoundSetting() {
  const stored = localStorage.getItem('nichess-sound-enabled');
  return stored !== null ? JSON.parse(stored) : true;
}

function saveSoundSetting(enabled) {
  localStorage.setItem('nichess-sound-enabled', JSON.stringify(enabled));
}

function loadDifficultySetting() {
  const stored = localStorage.getItem('nichess-difficulty-level');
  const level = stored !== null ? JSON.parse(stored) : 3;
  return AIDifficulty.getConfig(level);
}

function saveDifficultySetting(level) {
  localStorage.setItem('nichess-difficulty-level', JSON.stringify(level));
}

function loadColorSetting() {
  const stored = localStorage.getItem('nichess-selected-color');
  return stored !== null ? JSON.parse(stored) : 'white';
}

function saveColorSetting(color) {
  localStorage.setItem('nichess-selected-color', JSON.stringify(color));
}

const SAVED_GAMES_KEY = 'nichess-saved-games'
export const MAX_SAVED_GAMES = 30

function loadSavedGames() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_GAMES_KEY) || '[]')
  } catch {
    return []
  }
}

function persistSavedGames(games) {
  localStorage.setItem(SAVED_GAMES_KEY, JSON.stringify(games))
}

export function loadGame(gameId) {
  return loadSavedGames().find(g => g.gameId === gameId) || null
}
