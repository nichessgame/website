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
