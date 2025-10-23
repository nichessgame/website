import { AIAgent } from './ai_agent'
import { PlayerAction } from 'nichess'

console.log('creating new worker')
let aiAgent = new AIAgent();

self.onmessage = async (event: MessageEvent) => {
  if(!aiAgent.initialized) {
    console.log('initializing aiAgent')
    await aiAgent.init()
    console.log('agent initialized')
  }
  let searchResult: [PlayerAction, string] = await aiAgent.runSearch(event.data.difficulty, 20, event.data.history);
  let action = searchResult[0];
  let debugStr = searchResult[1];
  self.postMessage({
    id: event.data.id,
    move: action.srcIdx.toString() + '.' + action.dstIdx.toString(),
    debug: debugStr
  });
};
