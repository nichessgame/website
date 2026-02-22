// TODO: Should this really be imported manually like this?
// Without it I get: "Error: Unable to decode base64 in this environment. Missing built-in atob() or Buffer()"
import { Buffer } from 'buffer';
// Make it available globally
self.Buffer = Buffer;
globalThis.Buffer = Buffer;

import { NichessGS } from './nichess_gs'
import type { GameState } from './game_state'
import { MCTS } from './mcts'
import { NetData, AIDifficulty, DifficultyConfig } from './common'
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
  private currentAnalysisId = 0;
  constructor() {}

  async init(): void {
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

  evaluate(boardString: string): { policy: Array<number>, value: Array<number> } {
    let result = { policy: [], value: [] };
    tf.tidy(() => {
      let gs: NichessGS = new NichessGS({encodedBoard: boardString});
      let netData = new NetData([], null, gs);
      let batch = [netData];
      this.nnPredictBatch(batch, 1);
      result.policy = batch[0].pi;
      result.value = batch[0].v;
    });
    return result;
  }

  async runSearch(difficultyConfig: DifficultyConfig, batchSize: number, history): [PlayerAction, string] {
    // TODO: This is very ugly. It works for now, but need to make a simpler algorithm.
    // (1) AlphaZero search for timeInSeconds seconds. For difficulty levels [1, 3], the goal is to
    //  find not the best moves (highest q), but to find the slightly losing moves (q = 0.45)
    // (2) If the number of nodes is low, augment the number based on neural net policy and
    //    difficulty level.
    // (3) For difficulty levels [1, 3], try to get the AI to play slightly losing moves.
    // (4) If (3) fails or if difficultyLevel > 3, pick move regularly based on temp.
    let nichessAction: PlayerAction;
    let selectedAction: number;
    let debugStr: string;

    const timeInSeconds = difficultyConfig.timeInSeconds;
    const startTemp = difficultyConfig.startTemp;
    const endTemp = difficultyConfig.endTemp;
    const losingTemp1 = difficultyConfig.losingTemp1;
    const losingTemp2 = difficultyConfig.losingTemp2;


    tf.tidy(() => {
      // (1) Search
      const startTime = performance.now();
      let gs: NichessGS = new NichessGS({});
      for(let i = 0; i < history.length; i++) {
        let a: number = AgentCache.srcSquareToDstSquareToMoveIndex[history[i][0]][history[i][1]];
        gs.play_move(a);
      }
      console.log(gs.dump())
      let mcts = new MCTS(1.25, gs.num_players(), gs.num_moves(), 0.25, 1.4, 0.25);
      
      let leafs: Array<GameState | null> = new Array(batchSize);
      const useWeakSearch = difficultyConfig.level <= 3;
      const t0 = performance.now();
      let t1 = performance.now();
      let iter = 0;
      while(t1 - t0 < timeInSeconds * 1000 || iter < 3) {
        // build batch of leafs
        let batch: Array<NetData> = new Array(batchSize);
        let batchIdx = 0;
        for(let j = 0; j < batchSize; j++) {
          leafs[j] = useWeakSearch ? mcts.find_leaf_weak(gs, 0.45) : mcts.find_leaf(gs)
          if(leafs[j] != null) {
            batch[batchIdx] = new NetData(mcts.path_, mcts.current_, leafs[j])
            batchIdx += 1
          }
          mcts.path_ = []
          mcts.current_ = {}
        }

        // predict
        this.nnPredictBatch(batch, batchIdx);

        // backprop
        for(let j = 0; j < batchIdx; j++) {
          let nd: NetData = batch[j];
          mcts.process_result(nd.gs, nd.v, nd.pi, false, nd.current, nd.path);
        }

        leafs = new Array(batchSize);
        t1 = performance.now()
        iter += 1;
      }


      let counts = mcts.counts();
      const sortedChildren = [...mcts.root_.children].filter(c => c.n != 0).sort((a, b) => b.n - a.n);
      console.log('counts')
      for(let i = 0; i < sortedChildren.length; i++) {
        const child = sortedChildren[i];
        const squares = AgentCache.moveIndexToSrcAndDstSquare[child.move];
        const srcKey = String.fromCharCode(97 + (squares[0] % 8)) + (Math.floor(squares[0] / 8) + 1);
        const dstKey = String.fromCharCode(97 + (squares[1] % 8)) + (Math.floor(squares[1] / 8) + 1);
        const w = child.q - child.d / gs.num_players();
        const l = 1 - w - child.d;
        console.log(`${srcKey} -> ${dstKey}, n: ${child.n}, q: ${child.q}, p: ${child.policy} (${(w * 100).toFixed(1)}% ${(l * 100).toFixed(1)}% ${(child.d * 100).toFixed(1)}%)`)
      }
      const numNodes = counts.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      debugStr = numNodes;
      // (2) Augment the number of nodes if it's low.
      //
      // For some users WebGL won't work and the AI will explore a very small number of nodes.
      // This, counter-intuitively makes the model play better (at low difficulties) because it only gets to try the best
      // moves and never even considers the bad ones.
      // To combat this we'll add some "fake" visits to the nodes based on their policy.
      let policyMultiplier = 0;
      if(difficultyConfig.level <= 2) {
        if(numNodes <= 30) {
          policyMultiplier = 5;
        } else if(numNodes <= 200) {
          policyMultiplier = 10;
        }
      } else if(difficultyConfig.level == 3) {
        if(numNodes <= 100) {
          policyMultiplier = 2;
        } else if(numNodes <= 200) {
          policyMultiplier = 3;
        }
      }
      for(let i = 0; i < mcts.root_.children.length; i++) {
        if(mcts.root_.children[i].policy > 0.05) {
          mcts.root_.children[i].n += mcts.root_.children[i].policy * policyMultiplier;
        }
      }
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

      // (3) For difficulty levels 1-3, try to pick slightly-losing moves to weaken the AI
      let useWeakMoveSelection = false;
      if(difficultyConfig.level <= 3) {
        // Compute per-child WLD scores
        const numPlayers = gs.num_players();
        const childScores: Array<{move: number, score: number, n: number}> = [];
        for(let i = 0; i < mcts.root_.children.length; i++) {
          const child = mcts.root_.children[i];
          if(child.n > 0) {
            const w = child.q - child.d / numPlayers;
            const l = 1 - w - child.d;
            const score = w - l; // positive = AI winning, negative = AI losing
            childScores.push({move: child.move, score, n: child.n});
          }
        }

        // The goal here is to have the AI lose slowly.
        // First range [0.5, 1.0] means that if you really blunder hard, the AI will punish you. 
        // If you haven't blundered, the AI should try to make a small mistake.
        // If that's not possible, try to make a slightly bigger mistake.
        // Otherwise, try to pick the least winning move.
        let ranges: Array<[number, number]>;
        if(difficultyConfig.level == 3) {
          ranges = [[0.5, 1.0],[-0.1, 0], [-0.2, 0], [0, 0.1], [0.1, 0.3], [0.3, 0.5]];
        } else if(difficultyConfig.level == 2) {
          ranges = [[0.5, 1.0],[-0.15, 0], [-0.3, 0], [0, 0.1], [0.1, 0.2], [0.2, 0.3], [0.3, 0.5]];
        } else {
          ranges = [[0.65, 1.0],[-0.3, -0.15], [-0.3, 0], [0, 0.1], [0.1, 0.2], [0.2, 0.3], [0.3, 0.65]];
        }
        let filteredMoves: Array<{move: number, score: number, n: number}> | null = null;
        for(const [lo, hi] of ranges) {
          const candidates = childScores.filter(c => c.score > lo && c.score < hi);
          if(candidates.length > 0) {
            filteredMoves = candidates;
            console.log(`Weak AI: found ${candidates.length} moves in (${lo}, ${hi}) range`);
            break;
          }
        }

        if(filteredMoves != null) {
          useWeakMoveSelection = true;
          // Build probability distribution from visit counts of filtered moves only
          let temp = calcTemp(gs.current_turn(), startTemp, endTemp);
          console.log(`Weak AI temp: ${temp}, move number: ${gs.current_turn()}`);

          let totalCount = 0;
          for(const m of filteredMoves) {
            totalCount += m.n;
          }

          let probs = new Array<number>(gs.num_moves()).fill(0);
          if(temp == 0) {
            // Pick the most-visited among filtered
            let bestN = 0;
            let bestMoves: number[] = [];
            for(const m of filteredMoves) {
              if(m.n > bestN) {
                bestN = m.n;
                bestMoves = [m.move];
              } else if(m.n === bestN) {
                bestMoves.push(m.move);
              }
            }
            for(const mv of bestMoves) {
              probs[mv] = 1 / bestMoves.length;
            }
          } else {
            let probsSum = 0;
            for(const m of filteredMoves) {
              probs[m.move] = (m.n / totalCount) ** (1 / temp);
              probsSum += probs[m.move];
            }
            for(const m of filteredMoves) {
              probs[m.move] /= probsSum;
            }
          }

          console.log('Weak AI probs:');
          for(const m of filteredMoves) {
            let action = gs.gameWrapper.createNichessAction(m.move);
            console.log(`${action.srcIdx} -> ${action.dstIdx}: prob=${probs[m.move].toFixed(3)}, score=${m.score.toFixed(3)}`);
          }

          selectedAction = mcts.pick_move(probs);
        } else {
          console.log('Weak AI: no slightly-losing moves found, falling back to normal selection');
        }
      }

      // (4) standard, old algorithm for action selection
      if(!useWeakMoveSelection) {
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
      }
      nichessAction = gs.gameWrapper.createNichessAction(selectedAction);
      const endTime = performance.now();
      console.log(`Number of nodes explored ${numNodes}`);
      console.log(`runSearch took ${(endTime - startTime).toFixed(3)}ms`);
    });
    return [nichessAction, debugStr];
  }

  stopAnalysis(): void {
    this.currentAnalysisId++;
  }

  async runAnalysis(boardString: string, batchSize: number, maxNodes: number, postUpdate: (data: any) => void): Promise<void> {
    this.currentAnalysisId++;
    const myId = this.currentAnalysisId;

    let gs: NichessGS = new NichessGS({encodedBoard: boardString});
    let mcts = new MCTS(1.25, gs.num_players(), gs.num_moves(), 0.25, 1.4, 0.25);

    let leafs: Array<GameState | null> = new Array(batchSize);
    let totalNodes = 0;
    let iter = 0;
    let lastUpdateTime = performance.now();

    while (myId === this.currentAnalysisId && totalNodes < maxNodes) {
      // 1. build batch of leafs
      let batch: Array<NetData> = new Array(batchSize);
      let batchIdx = 0;
      for (let j = 0; j < batchSize; j++) {
        leafs[j] = mcts.find_leaf(gs);
        if (leafs[j] != null) {
          batch[batchIdx] = new NetData(mcts.path_, mcts.current_, leafs[j]);
          batchIdx += 1;
        }
        mcts.path_ = [];
        mcts.current_ = {};
      }

      // 2. predict
      this.nnPredictBatch(batch, batchIdx);

      // 3. backprop
      for (let j = 0; j < batchIdx; j++) {
        let nd: NetData = batch[j];
        mcts.process_result(nd.gs, nd.v, nd.pi, false, nd.current, nd.path);
      }

      totalNodes += batchIdx;
      leafs = new Array(batchSize);
      iter++;

      // Post update every 0.3 seconds
      const now = performance.now();
      if (iter >= 2 && now - lastUpdateTime >= 300) {
        const wld = mcts.root_value();
        const topMoves = this.getTopMovesWithContinuation(mcts.root_, 4, 4);
        postUpdate({ wld, topMoves, nodes: totalNodes, currentPlayer: gs.current_player() });
        lastUpdateTime = now;
      }

      // Yield to event loop so worker can process incoming messages
      await new Promise(r => setTimeout(r, 0));
    }

    // Final update
    if (iter >= 2 && myId === this.currentAnalysisId) {
      const wld = mcts.root_value();
      const topMoves = this.getTopMovesWithContinuation(mcts.root_, 4, 4);
      postUpdate({ wld, topMoves, nodes: totalNodes, currentPlayer: gs.current_player() });
    }
  }

  private getTopMovesWithContinuation(root: any, topN: number, maxDepth: number): Array<{continuation: number[], wld: number[]}> {
    if (!root.children || root.children.length === 0) return [];
    const sorted = [...root.children].sort((a: any, b: any) => b.n - a.n);
    const result: Array<{continuation: number[], wld: number[]}> = [];
    for (let i = 0; i < Math.min(topN, sorted.length); i++) {
      if (sorted[i].n === 0) break;
      const rest = this.getBestContinuation(sorted[i], maxDepth - 1);
      const q = sorted[i].q;
      const d = sorted[i].d;
      const w = q - d / 2;
      const l = 1 - w - d;
      result.push({ continuation: [sorted[i].move, ...rest], wld: [w, l, d] });
    }
    return result;
  }

  private getBestContinuation(node: any, maxDepth: number): number[] {
    const moves: number[] = [];
    let current = node;
    for (let i = 0; i < maxDepth; i++) {
      if (!current.children || current.children.length === 0) break;
      let bestChild = current.children[0];
      for (let j = 1; j < current.children.length; j++) {
        if (current.children[j].n > bestChild.n) {
          bestChild = current.children[j];
        }
      }
      if (bestChild.n === 0) break;
      moves.push(bestChild.move);
      current = bestChild;
    }
    return moves;
  }
}
