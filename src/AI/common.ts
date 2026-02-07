function shuffle(a: Array<any>): Array<any> {
  var j: number
  var x: number
  var i: number
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

export interface DifficultyConfig {
  level: number;
  label: string;
  timeInSeconds: number;
  startTemp: number;
  endTemp: number;
  losingTemp1: number;
  losingTemp2: number;
}

export class AIDifficulty {
  private static readonly DIFFICULTIES: DifficultyConfig[] = [
    {
      level: 1,
      label: '1 (3 seconds)',
      timeInSeconds: 3,
      startTemp: 2.0,
      endTemp: 1.7,
      losingTemp1: 1.7,
      losingTemp2: 1.7
    },
    {
      level: 2,
      label: '2 (3 seconds)',
      timeInSeconds: 3,
      startTemp: 1.4,
      endTemp: 1.0,
      losingTemp1: 1.0,
      losingTemp2: 0.7
    },
    {
      level: 3,
      label: '3 (3 seconds)',
      timeInSeconds: 3,
      startTemp: 1.0,
      endTemp: 0.6,
      losingTemp1: 0.6,
      losingTemp2: 0.1
    },
    {
      level: 4,
      label: '4 (3 seconds)',
      timeInSeconds: 3,
      startTemp: 0.8,
      endTemp: 0.3,
      losingTemp1: 0.3,
      losingTemp2: 0.0
    },
    {
      level: 5,
      label: '5 (5 seconds)',
      timeInSeconds: 5,
      startTemp: 0.8,
      endTemp: 0.3,
      losingTemp1: 0.3,
      losingTemp2: 0.0
    },
    {
      level: 6,
      label: '6 (8 seconds)',
      timeInSeconds: 8,
      startTemp: 0.7,
      endTemp: 0.2,
      losingTemp1: 0.2,
      losingTemp2: 0.0
    }
  ];

  private static readonly DEFAULT_CONFIG: DifficultyConfig = {
    level: 3,
    label: '3 (3 seconds)',
    timeInSeconds: 3,
    startTemp: 1.0,
    endTemp: 0.6,
    losingTemp1: 0.6,
    losingTemp2: 0.1
  };

  static getConfig(level: number): DifficultyConfig {
    const config = this.DIFFICULTIES.find(d => d.level === level);
    return config || this.DEFAULT_CONFIG;
  }

  static getAllLabels(): string[] {
    return this.DIFFICULTIES.map(d => d.label);
  }

  static getDefaultLabel(): string {
    return this.DIFFICULTIES[2].label; // level 3
  }

  static getAllConfigs(): DifficultyConfig[] {
    return [...this.DIFFICULTIES];
  }
}

export class Node {
  public q: number = 0
  public d: number = 0
  public v: number = 0
  public virtual_loss: number = 0
  public policy: number = 0
  public move: number = 0
  public n: number = 0
  public player: number = 0
  public scores: Array<number> | undefined
  public children: Array<Node>
  constructor(m: number) {
    this.move = m
  }

  add_children(valids: Array<number>): void {
    this.children = new Array(valids.reduce((a,b) => a+b))      
    let idx = 0;
    for(let w = 0; w < valids.length; w++) {
      if(valids[w] == 1) {
        this.children[idx] = new Node(w)
        idx++
      }
    }
    shuffle(this.children)
  }

  update_policy(pi: Float32Array): void {
    let c: Node
    for(let i = 0; i < this.children.length; i++) {
      c = this.children[i]
      c.policy = pi[c.move]
    }
  }

  uct(sqrt_parent_n: number, cpuct: number, fpu_value: number): number {
    if(this.n == 0) {
      return fpu_value + cpuct * this.policy * sqrt_parent_n / (this.n + 1 + this.virtual_loss)
    } else {
      return this.q + cpuct * this.policy * sqrt_parent_n / (this.n + 1 + this.virtual_loss)
    }
  }

  best_child(cpuct: number, fpu_reduction: number): Node {
    let seen_policy: number = 0
    let c: Node
    for(let i = 0; i < this.children.length; i++) {
      c = this.children[i]
      if(c.n > 0) {
        seen_policy += c.policy
      }
    }
    let fpu_value = this.v - fpu_reduction * Math.sqrt(seen_policy)
    let sqrt_n = Math.sqrt(this.n)
    let best_i = 0
    let best_uct = this.children[0].uct(sqrt_n, cpuct, fpu_value)
    for(let i = 1; i < this.children.length; i++) {
      let uct = this.children[i].uct(sqrt_n, cpuct, fpu_value)
      if(uct > best_uct) {
        best_uct = uct
        best_i = i
      }
    }
    return this.children[best_i]
  }
}

export class NetData {
  public path: Array<Node>;
  public current: Node;
  public gs: GameState;
  public v: Float32Array = 0
  public pi: Float32Array = 0
  constructor(path: Array<node>, current: Node, gs: GameState) {
    this.path = path;
    this.current = current;
    this.gs = gs;
  }
}
