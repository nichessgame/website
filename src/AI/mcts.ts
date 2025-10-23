import type { GameState } from './game_state'
import { Node } from './common'
import { VIRTUAL_LOSS } from './nichess_constants'

export class MCTS {
  private cpuct_: number
  private num_players_: number
  private num_moves_: number
  private depth_: number
  public root_: Node
  public current_: Node
  public path_: Array<Node>
  private epsilon: number
  private root_policy_temp_: number
  private fpu_reduction_: number

  constructor(cpuct: number, num_players: number, num_moves: number, epsilon: number,
              root_policy_temp: number, fpu_reduction: number) 
  {
    this.cpuct_ = cpuct
    this.num_players_ = num_players
    this.num_moves_ = num_moves
    this.epsilon = epsilon
    this.root_policy_temp_ = root_policy_temp
    this.fpu_reduction_ = fpu_reduction
    this.root_ = new Node(-1)
    this.current_ = this.root_
    this.path_ = new Array<Node>()
  }

  update_root(gs: GameState,  move: number): void {
    this.depth_ = 0
    if(this.root_.children.length == 0) {
      this.root_.add_children(gs.valid_moves())
    }
    let x: Node
    let n: Node
    for(let i = 0; i < this.root_.children.length; i++) {
      n = this.root_.children[i];
      if(move == n.move) {
        x = n
        break
      }
    }
    this.root_ = x
  }

  process_result(gs: GameState, value: Float32Array, pi: Float32Array, root_noise_enabled: boolean, current: Node, path: Array<Node>) {
    if(current.scores != undefined) {
      value = current.scores
    } else {
      let valids = new Float32Array<number>(gs.num_moves()).fill(0)
      let c: Node
      for(let i = 0; i < current.children.length; i++) {
        c = current.children[i]
        valids[c.move] = 1
      }
      let pi_sum = 0
      for(let i = 0; i < pi.length; i++) {
        pi[i] *= valids[i]
        pi_sum += pi[i]
      }
      for(let i = 0; i < pi.length; i++) {
        pi[i] /= pi_sum
      }
      if(current == this.root_) {
        let pi_sum = 0
        for(let i = 0; i < pi.length; i++) {
          pi[i] = pi[i] ** (1 / this.root_policy_temp_)
          pi_sum += pi[i]
        }
        for(let i = 0; i < pi.length; i++) {
          pi[i] /= pi_sum
        }
        current.update_policy(pi)
        let leaf_v = value[current.player] + value[this.num_players_] / this.num_players_;
        current.v = leaf_v
        if(root_noise_enabled) {
          this.add_root_noise()
        }
      } else {
        current.update_policy(pi)
      }
    }

    while(!(path.length === 0)) {
      let parent: Node = path.pop()
      let v = value[parent.player]
      v += value[this.num_players_] / this.num_players_
      current.q = (current.q * current.n + v) / (current.n + 1)
      current.d = (current.d * current.n + value[this.num_players_]) / (current.n + 1)
      if(current.n == 0) {
        let leaf_v = value[current.player] + value[this.num_players_] / this.num_players_;
        current.v = leaf_v
      }
      current.n += 1
      current.virtual_loss = 0;
      current = parent
    }
    this.depth_ += 1
    this.root_.n += 1
    this.root_.virtual_loss = 0;
  }

  add_root_noise(): void {
    // TODO: not used now, maybe add later
    return
  }

  find_leaf(gs: GameState): GameState | null {
    this.current_ = this.root_
    let leaf: GameState = gs.copy()
    while(this.current_.n > 0 && this.current_.scores == undefined) {
      this.current_.virtual_loss += VIRTUAL_LOSS
      this.path_.push(this.current_)
      this.current_ = this.current_.best_child(this.cpuct_, this.fpu_reduction_)
      leaf.play_move(this.current_.move)
    }
    if(this.current_.n == 0) {
      if(this.current_.virtual_loss != 0) {
        return null;
      }
      this.current_.player = leaf.current_player()
      this.current_.scores = leaf.scores()
      this.current_.add_children(leaf.valid_moves())
    }
    this.current_.virtual_loss += VIRTUAL_LOSS
    return leaf
  }

  root_value(): Array<number> {
    let q = 0
    let d = 0
    let c: Node
    for(let i = 0; i < this.root_.children.length; i++) {
      c = this.root_.children[i]
      if(c.n > 0 && c.q > q) {
        q = c.q
        d = c.d
      }
    }
    let w = q - d / this.num_players_
    let l = 1 - w - d
    let wld = [w, l, d]
    return wld;
  }

  counts(): Array<number> {
    let counts = new Array<number>(this.num_moves_).fill(0)
    let c: Node
    for(let i = 0; i < this.root_.children.length; i++) {
      c = this.root_.children[i]
      counts[c.move] = c.n
    }
    return counts
  }

  probs(temp: number): Array<number> {
    let counts: Array<number> = this.counts()
    let probs = new Array<number>(this.num_moves_).fill(0)

    if(temp == 0) {
      let best_moves = new Array<number>()
      let best_count: number = counts[0]
      for(let m = 0; m < this.num_moves_; m++) {
        if(counts[m] > best_count) {
          best_count = counts[m]
          best_moves = []
          best_moves.push(m)
        } else if(counts[m] == best_count) {
          best_moves.push(m)
        }
      }
      console.log(`best_count: ${best_count}`)
      console.log(`best_move: ${best_moves[0]}`)
      let move: number
      for(let i = 0; i < best_moves.length; i++) {
        move = best_moves[i]
        probs[move] = 1 / best_moves.length
      }
      return probs
    }
    let counts_sum = 0
    for(let i = 0; i < counts.length; i++) {
      counts_sum += counts[i]
    }

    let probs_sum = 0
    for(let i = 0; i < counts.length; i++) {
      probs[i] = (counts[i] / counts_sum) ** (1 / temp)
      probs_sum += probs[i]
    }

    for(let i = 0; i < counts.length; i++) {
      probs[i] /= probs_sum
    }

    return probs
  }

  depth(): number {
    return this.depth_;
  }

  pick_move(p: Array<number>): number {
    let choice: number = Math.random()
    let sum = 0
    for(let m = 0; m < p.length; m++) {
      sum += p[m]
      if(sum > choice) {
        return m
      }
    }
    // Due to floating point error we didn't pick a move.
    // Pick the last valid move.
    for(let m = p.length - 1; m >= 0; m--) {
      if(p[m] > 0) {
        return m;
      }
    }
    throw new Error("This shouldn't be possible.")
  }
}
