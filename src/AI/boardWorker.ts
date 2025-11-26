import { AIAgent } from './ai_agent'
import { PlayerAction } from 'nichess'

console.log('creating new worker')
let aiAgent = new AIAgent();

self.onmessage = async (event: MessageEvent) => {
  try {
    // Inform the main thread that model download/initialization is starting (or already done).
    if(!aiAgent.initialized) {
      console.log('initializing aiAgent')
      self.postMessage({ type: 'model-status', status: 'starting', id: event.data?.id ?? '' });
      await aiAgent.init()
      console.log('agent initialized')
      self.postMessage({ type: 'model-status', status: 'ready', id: event.data?.id ?? '' });
    } else {
      // If already initialized, let the UI know immediately.
      self.postMessage({ type: 'model-status', status: 'ready', id: event.data?.id ?? '' });
    }

    let searchResult: [PlayerAction, string] = await aiAgent.runSearch(event.data.difficulty, 20, event.data.history);
    let action = searchResult[0];
    let debugStr = searchResult[1];
    self.postMessage({
      id: event.data.id,
      move: action.srcIdx.toString() + '.' + action.dstIdx.toString(),
      debug: debugStr
    });
  } catch (e: any) {
    console.error('worker error', e);
    self.postMessage({ type: 'model-status', status: 'error', message: String(e?.message ?? e), id: event.data?.id ?? '' });
  }
};
