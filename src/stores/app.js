// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    boardWorker: null,
    modelReady: false,
    modelLoading: false
  }),
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
    }
  }
})
