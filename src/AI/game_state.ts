export interface GameState {
  copy: () => GameState
  current_player: () => number
  current_turn: () => number
  num_moves: () => number
  num_players: () => number
  valid_moves: () => Array<number>
  play_move: (move: number) => void
  scores: () => Array<number>
  canonicalized: () => Array<Array<Array<number>>>
  dump: () => string
}
