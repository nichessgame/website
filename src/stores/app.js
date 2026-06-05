// Utilities
import { defineStore } from 'pinia'
import { AIDifficulty } from '../AI/common'

export const POINTS_TEXT_THEMES = [
  { value: 'standard', title: 'Standard', description: 'Bright labels with a warm outline.' },
  { value: 'strong', title: 'Strong', description: 'Darker labels with a stronger outline.' },
  { value: 'simple', title: 'Simple', description: 'Plain labels with no text effects.' },
]

export const useAppStore = defineStore('app', {
  state: () => ({
    boardWorker: null,
    modelReady: false,
    modelLoading: false,
    selectedDifficulty: loadDifficultySetting(),
    selectedColor: loadColorSetting(),
    selectedPointsTextTheme: loadPointsTextThemeSetting(),
    abilityPointsVisible: loadAbilityPointsVisibleSetting(),
    soundEnabled: loadSoundSetting(),
    savedGames: loadSavedGames(),
    analysisData: null,
    savedNostrGames: loadSavedNostrGames()
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
    setPointsTextTheme(theme) {
      const nextTheme = POINTS_TEXT_THEMES.some(option => option.value === theme) ? theme : 'standard';
      this.selectedPointsTextTheme = nextTheme;
      savePointsTextThemeSetting(nextTheme);
    },
    setAbilityPointsVisible(visible) {
      this.abilityPointsVisible = visible;
      saveAbilityPointsVisibleSetting(visible);
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
    },
    saveNostrGame(gameData) {
      const filtered = this.savedNostrGames.filter(g => g.gameId !== gameData.gameId)
      filtered.push({ ...gameData, savedAt: Date.now() })
      filtered.sort((a, b) => b.savedAt - a.savedAt)
      this.savedNostrGames = filtered.slice(0, MAX_SAVED_NOSTR_GAMES)
      persistSavedNostrGames(this.savedNostrGames)
    },
    deleteNostrGame(gameId) {
      this.savedNostrGames = this.savedNostrGames.filter(g => g.gameId !== gameId)
      persistSavedNostrGames(this.savedNostrGames)
    },
    refreshSavedNostrGames() {
      this.savedNostrGames = loadSavedNostrGames()
    },
    setAnalysisData(data) {
      this.analysisData = data
    },
    consumeAnalysisData() {
      const data = this.analysisData
      this.analysisData = null
      return data
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
  const level = stored !== null ? JSON.parse(stored) : AIDifficulty.DEFAULT_LEVEL;
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

function loadPointsTextThemeSetting() {
  try {
    const stored = localStorage.getItem('nichess-points-text-theme') ?? localStorage.getItem('nichess-health-text-theme');
    const theme = stored !== null ? JSON.parse(stored) : 'standard';
    if (theme === 'gold') return 'standard';
    return POINTS_TEXT_THEMES.some(option => option.value === theme) ? theme : 'standard';
  } catch {
    return 'standard';
  }
}

function savePointsTextThemeSetting(theme) {
  localStorage.setItem('nichess-points-text-theme', JSON.stringify(theme));
}

function loadAbilityPointsVisibleSetting() {
  try {
    const stored = localStorage.getItem('nichess-ability-points-visible');
    return stored !== null ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
}

function saveAbilityPointsVisibleSetting(visible) {
  localStorage.setItem('nichess-ability-points-visible', JSON.stringify(visible));
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

const SAVED_NOSTR_GAMES_KEY = 'nichess-saved-nostr-games'
export const MAX_SAVED_NOSTR_GAMES = 30

function loadSavedNostrGames() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_NOSTR_GAMES_KEY) || '[]')
  } catch {
    return []
  }
}

function persistSavedNostrGames(games) {
  localStorage.setItem(SAVED_NOSTR_GAMES_KEY, JSON.stringify(games))
}
