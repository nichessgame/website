import { AIAgent } from './ai_agent'
import { PlayerAction } from 'nichess'
import { AIDifficulty, DifficultyConfig } from './common'

console.log('creating new worker')
let aiAgent = new AIAgent();
let modelInitialization: Promise<void> | null = null;

self.onmessage = async (event: MessageEvent) => {
  try {
    if (event.data.type === 'stop-analysis') {
      aiAgent.stopAnalysis();
      return;
    }

    if(!aiAgent.initialized) {
      if (event.data.type !== 'load-model' || event.data.modelDownloadConsent !== true) {
        self.postMessage({
          type: 'model-status',
          status: 'consent-required',
          gameId: event.data?.gameId ?? ''
        });
        return;
      }

      if (!modelInitialization) {
        console.log('initializing aiAgent')
        self.postMessage({ type: 'model-status', status: 'starting', gameId: event.data?.gameId ?? '' });
        modelInitialization = aiAgent.init();
      }
      await modelInitialization
      console.log('agent initialized')
      self.postMessage({ type: 'model-status', status: 'ready', gameId: event.data?.gameId ?? '' });
    } else if (event.data.type === 'load-model') {
      self.postMessage({ type: 'model-status', status: 'ready', gameId: event.data?.gameId ?? '' });
    }

    if (event.data.type === 'load-model') return;

    if (event.data.type === 'analyze') {
      // Fire-and-forget so the message loop stays responsive
      const maxNodes = event.data.maxNodes || 10000;
      aiAgent.runAnalysis(event.data.boardString, 20, maxNodes, (data) => {
        self.postMessage({ type: 'analysis-update', ...data });
      });
      return;
    }

    if (event.data.type === 'evaluate') {
      const evaluation = aiAgent.evaluate(event.data.boardString);
      self.postMessage({
        type: 'evaluation-result',
        gameId: event.data.gameId,
        evaluation: evaluation
      });
      return;
    }

    // Convert difficulty config or level to DifficultyConfig object
    let difficultyConfig: DifficultyConfig;
    if (typeof event.data.difficulty === 'number') {
      difficultyConfig = AIDifficulty.getConfig(event.data.difficulty);
    } else {
      difficultyConfig = event.data.difficulty;
    }

    let searchResult: [PlayerAction, string] = await aiAgent.runSearch(difficultyConfig, 20, event.data.history);
    let action = searchResult[0];
    let debugStr = searchResult[1];
    self.postMessage({
      gameId: event.data.gameId,
      move: action.srcIdx.toString() + '.' + action.dstIdx.toString(),
      debug: debugStr,
      requestId: event.data.requestId
    });
  } catch (e: any) {
    modelInitialization = null;
    console.error('worker error', e);
    self.postMessage({ type: 'model-status', status: 'error', message: String(e?.message ?? e), gameId: event.data?.gameId ?? '' });
  }
};
