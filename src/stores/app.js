// Utilities
import { defineStore } from 'pinia'
import { AIDifficulty } from '../AI/common'

export const useAppStore = defineStore('app', {
  state: () => ({
    boardWorker: null,
    modelReady: false,
    modelLoading: false,
    selectedDifficulty: AIDifficulty.getConfig(3),
    selectedColor: 'white'
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
    },
    setDifficultyByLevel(level) {
      this.selectedDifficulty = AIDifficulty.getConfig(level);
    },
    setColor(color) {
      this.selectedColor = color;
    }
  }
})
