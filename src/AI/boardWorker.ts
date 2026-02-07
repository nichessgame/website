import { AIAgent } from './ai_agent'
import { PlayerAction } from 'nichess'
import { AIDifficulty, DifficultyConfig } from './common'

console.log('creating new worker')
let aiAgent = new AIAgent();

self.onmessage = async (event: MessageEvent) => {
  try {
    if(!aiAgent.initialized) {
      console.log('initializing aiAgent')
      self.postMessage({ type: 'model-status', status: 'starting', gameId: event.data?.gameId ?? '' });
      await aiAgent.init()
      console.log('agent initialized')
      self.postMessage({ type: 'model-status', status: 'ready', gameId: event.data?.gameId ?? '' });
    } else {
      self.postMessage({ type: 'model-status', status: 'ready', gameId: event.data?.gameId ?? '' });
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
    console.error('worker error', e);
    self.postMessage({ type: 'model-status', status: 'error', message: String(e?.message ?? e), gameId: event.data?.gameId ?? '' });
  }
};
