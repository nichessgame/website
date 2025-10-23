// TODO: Should this really be imported manually like this?
// Without it I get: "Error: Unable to decode base64 in this environment. Missing built-in atob() or Buffer()"
import { Buffer } from 'buffer';
// Make it available globally
self.Buffer = Buffer;
globalThis.Buffer = Buffer;

import { NichessGS } from './nichess_gs'
import type { GameState } from './game_state'
import { MCTS } from './mcts'
import { NetData } from './common'
import { NUM_MOVES } from './nichess_constants'
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { AgentCache } from './agent_cache'
import {
  Api as NichessApi, Player, PlayerAction
} from 'nichess'

let model;

// TODO: don't do this in javascript, add it to the model in pytorch
function expArr(arr: Float32Array) {
    const result = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        result[i] = Math.exp(arr[i]);
    }
    return result;
}

function calcTemp(moveNumber: number, startTemp: number, endTemp: number): number {
  const ln2 = 0.693;
  const TEMP_DECAY_HALF_LIFE = 10;
  let ld = ln2 / TEMP_DECAY_HALF_LIFE;
  let temp = startTemp - endTemp;
  temp *= Math.exp(-ld * moveNumber);
  temp += endTemp;

  // TODO: there were some bugs with very small temp values creating -nan in python and c++ when calculating probabilities. Haven't tested this in javascript but putting this until that is resolved / tested.
  if(temp < 0.1) {
    temp = 0;
  }
  return temp;
}

export class AIAgent {
  public initialized = false;
  constructor() {}

  async init(): void {
    // TODO: Github pages needs this?
    //const modelPath = '/nichess/model.json'; // TODO: remove /nichess if local
    const modelPath = '/model.json';
    await tf.setBackend('webgl');
    await tf.ready();
    console.log('tf backend:')
    console.log(tf.getBackend());

    console.log('loading model')
    model = await loadGraphModel(modelPath);
    //
    // Prevents OutOfMemory - forces TFJS to clear WebGL textures when reaching 256Mb
    // TODO: Memory is still slowly growing? Test it.
    tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 256000000);
    this.initialized = true;
  }

  nnPredictBatch(batch: Array<NetData>, size: number): void {
    tf.tidy(() => {
      let inpArr = []
      for(let i = 0; i < size; i++) {
        inpArr.push(batch[i].gs.canonicalized())
      }
      const inp = tf.tensor(inpArr)
      const out = model.execute(inp)
      const pis = out[0].dataSync();
      const vs = out[1].dataSync();

      for(let i = 0; i < size; i++) {
        batch[i].pi = new Array(NUM_MOVES);
        batch[i].v = new Array(3);
        let idx = 0;
        for(let j = i * NUM_MOVES; j < (i* NUM_MOVES) + NUM_MOVES; j++) {
          batch[i].pi[idx] = pis[j];
          idx += 1;
        }
        idx = 0;
        for(let j = i * 3; j < (i * 3) + 3; j++) {
          batch[i].v[idx] = vs[j];
          idx += 1;
        }
      }
      tf.dispose([inp, out])
    })
  }

  async runSearch(difficulty: number, batchSize: number, history): [PlayerAction, string] {
    let nichessAction: PlayerAction;
    let selectedAction: number;
    let debugStr: string;
    let timeInSeconds: number;
    let startTemp: number;
    let endTemp: number;
    // make the AI play better when it's losing
    let losingTemp1: number; // when losing slightly
    let losingTemp2: number; // when losing bigly
    switch(difficulty) {
      case 1:
        timeInSeconds = 3;
        startTemp = 2.0;
        endTemp = 1.7;
        losingTemp1 = 1.7;
        losingTemp2 = 1.7;
        break;
      case 2:
        timeInSeconds = 3;
        startTemp = 1.4;
        endTemp = 1.0;
        losingTemp1 = 1.0;
        losingTemp2 = 0.7;
        break;
      case 3:
        timeInSeconds = 3;
        startTemp = 1.0;
        endTemp = 0.6;
        losingTemp1 = 0.6;
        losingTemp2 = 0.1;
        break;
      case 4:
        timeInSeconds = 3;
        startTemp = 0.8;
        endTemp = 0.3;
        losingTemp1 = 0.3;
        losingTemp2 = 0.0;
        break;
      case 5:
        timeInSeconds = 5;
        startTemp = 0.8;
        endTemp = 0.3;
        losingTemp1 = 0.3;
        losingTemp2 = 0.0;
        break;
      case 6:
        timeInSeconds = 8;
        startTemp = 0.7;
        endTemp = 0.2;
        losingTemp1 = 0.2;
        losingTemp2 = 0.0;
        break;
      default:
        timeInSeconds = 3;
        startTemp = 1.0;
        endTemp = 0.5;
        losingTemp1 = 0.5;
        losingTemp2 = 0.2;
        break;
    };

    tf.tidy(() => {
      const startTime = performance.now();
      let gs: NichessGS = new NichessGS({});
      for(let i = 0; i < history.length; i++) {
        let a: number = AgentCache.srcSquareToDstSquareToMoveIndex[history[i][0]][history[i][1]];
        gs.play_move(a);
      }
      console.log(`gs scores: ${gs.scores()}`)
      console.log(gs.dump())
      let mcts = new MCTS(1.25, gs.num_players(), gs.num_moves(), 0, 1.4, 0.25);
      
      let leafs: Array<GameState | null> = new Array(batchSize);
      //let vs: Array<Float32Array> = new Array(batchSize);
      //let pis: Array<Float32Array> = new Array(batchSize);
      // 1. build batch of leafs
      // 2. predict
      // 3. backprop
      const t0 = performance.now();
      let t1 = performance.now();
      let iter = 0;
      while(t1 - t0 < timeInSeconds * 1000 || iter < 3) {
        // 1
        let batch: Array<NetData> = new Array(batchSize);
        let batchIdx = 0;
        for(let j = 0; j < batchSize; j++) {
          leafs[j] = mcts.find_leaf(gs)
          if(leafs[j] != null) {
            batch[batchIdx] = new NetData(mcts.path_, mcts.current_, leafs[j])
            batchIdx += 1
          }
          mcts.path_ = []
          mcts.current_ = {}
        }

        // 2
        this.nnPredictBatch(batch, batchIdx);

        // 3
        for(let j = 0; j < batchIdx; j++) {
          let nd: NetData = batch[j];
          mcts.process_result(nd.gs, nd.v, nd.pi, false, nd.current, nd.path);
        }

        leafs = new Array(batchSize);
        t1 = performance.now()
        iter += 1;
      }


      let counts = mcts.counts();
      console.log('counts')
      for(let i = 0; i < counts.length; i++) {
        if(counts[i] != 0) {
          console.log(`${i}: ${counts[i]}`)
        }
      }
      const numNodes = counts.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      debugStr = numNodes;
      // For some users WebGL won't work and the AI will explore a very small number of nodes.
      // This, counter-intuitively makes the model play better (at low difficulties) because it only gets to try the best
      // moves and never even considers the bad ones.
      // To combat this we'll add some "fake" visits to the nodes based on their policy.
      let policyMultiplier = 0;
      if(difficulty <= 2) {
        if(numNodes <= 30) {
          policyMultiplier = 5;
        } else if(numNodes <= 200) {
          policyMultiplier = 10;
        }
      } else if(difficulty == 3) {
        if(numNodes <= 100) {
          policyMultiplier = 2;
        } else if(numNodes <= 200) {
          policyMultiplier = 3;
        }
      }
      console.log('root children')
      for(let i = 0; i < mcts.root_.children.length; i++) {
        if(mcts.root_.children[i].policy > 0.05) {
          console.log(`${i}: ${mcts.root_.children[i].policy}`)
          mcts.root_.children[i].n += mcts.root_.children[i].policy * policyMultiplier;
        }
      }
      console.log('*******************************')
      counts = mcts.counts(); // new, modified counts

      // sorted list of (moveIndex, numVisits) pairs
      const sortedCounts = counts
        .map((value, index) => [index, value])
        .sort((a, b) => b[1] - a[1]);

      let rootValue = mcts.root_value();
      console.log(rootValue);
      let wldStr = "AI chance of winning: " + rootValue[0] + "\n";
      wldStr += "Human chance of winning: " + rootValue[1] + "\n"
      wldStr += "Draw chance: " + rootValue[2] + "\n"
      console.log(wldStr)

      let aiWinning = rootValue[0] - rootValue[1]; // ai - human score
      console.log(`AI winning score: ${aiWinning}`)
      let temp: number;
      if(aiWinning < -0.35) {
        console.log('AI losing bigly')
        temp = losingTemp2;
      } else if(aiWinning < -0.2) {
        console.log('AI losing slightly')
        temp = losingTemp1;
      } else {
        temp = calcTemp(gs.current_turn(), startTemp, endTemp);
      }
      console.log(`Move number: ${gs.current_turn()}, temp: ${temp}`)
      let probs: Array<number> = mcts.probs(temp);
      const sortedProbs = probs
        .map((value, index) => [index, value])
        .sort((a, b) => b[1] - a[1]);

      console.log('probs')
      sortedProbs.forEach((val, idx) => {
        if(val[1] > 0.02) {
          let action = gs.gameWrapper.createNichessAction(val[0])
          console.log(action.srcIdx + " -> " + action.dstIdx + ": " + val[1] + "\n");
        }
      })

      selectedAction = mcts.pick_move(probs);
      nichessAction = gs.gameWrapper.createNichessAction(selectedAction);
      const endTime = performance.now();
      console.log(`Number of nodes explored ${numNodes}`);
      console.log(`runSearch took ${(endTime - startTime).toFixed(3)}ms`);
    });
    return [nichessAction, debugStr];
  }
}
