import type { GameState } from './game_state'
import { GameWrapper } from './nichess_wrapper'
import { coordinatesToBoardIndex, Piece, PieceType, Player, NUM_ROWS, NUM_COLUMNS,
 KING_STARTING_HEALTH_POINTS,
 MAGE_STARTING_HEALTH_POINTS,
 WARRIOR_STARTING_HEALTH_POINTS,
 PAWN_STARTING_HEALTH_POINTS,
 ASSASSIN_STARTING_HEALTH_POINTS,
 KNIGHT_STARTING_HEALTH_POINTS
} from 'nichess'
import * as agentConstants from './nichess_constants'

export class NichessGS implements GameState {
  public gameWrapper: GameWrapper

  constructor(params: {other?: NichessGS, encodedBoard?: string}) {
    if(params.other !== undefined) {
      this.gameWrapper = new GameWrapper({other: params.other.gameWrapper})
    } else if(params.encodedBoard !== undefined){
      this.gameWrapper = new GameWrapper({encodedBoard: params.encodedBoard})
    } else {
      this.gameWrapper = new GameWrapper({})
    }
  }

  copy(): GameState {
    return new NichessGS({other: this})
  }

  current_player(): number {
    return this.gameWrapper.game.currentPlayer
  }

  current_turn(): number {
    return this.gameWrapper.game.moveNumber
  }

  num_moves(): number {
    return agentConstants.NUM_MOVES 
  }

  num_players(): number {
    return agentConstants.NUM_PLAYERS
  }

  valid_moves(): Array<number> {
    let valids: Array<number> = this.gameWrapper.computeValids()
    return valids
  }

  play_move(move: number): void {
    this.gameWrapper.makeAction(move)
  }

  scores(): Array<number> | undefined {
    if(this.gameWrapper.isGameDraw()) {
      return [0, 0, 1]
    }
    let winner: Player | undefined = this.gameWrapper.game.winner()
    if(winner === undefined) {
      return
    } else if(winner === Player.PLAYER_1) {
      return [1, 0, 0]
    } else if(winner === Player.PLAYER_2) {
      return [0, 1, 0]
    }
  }

  canonicalized(): Array<Array<Array<number>>> {
    let out = new Array<Array<Array<number>>>()
    let currentPlayerIdx: number = 24 + this.gameWrapper.game.currentPlayer

    // initialize values
    for(let i = 0; i < 26; i++) {
      out[i] = new Array<Array<number>>()
      for(let h = 0; h < NUM_ROWS; h++) {
        out[i][h] = new Array<number>(NUM_COLUMNS)
        for(let w = 0; w < NUM_COLUMNS; w++) {
          out[i][h][w] = 0.0
        }
      }
    }

    for(let h = 0; h < NUM_ROWS; h++) {
      for(let w = 0; w < NUM_COLUMNS; w++) {
        // indicates whose turn it is
        out[currentPlayerIdx][h][w] = 1.0

        // each piece has 2 layers
        // first (currentCanonicalIdx) indicates whether piece exists there or not
        // second (currentCanonicalIdx + 12) is used for piece's health points
        let currentBoardIdx: number = coordinatesToBoardIndex(w, h);
        let currentPiece: Piece = this.gameWrapper.game.board[currentBoardIdx];
        if(currentPiece.type == PieceType.NO_PIECE) continue;
        let currentCanonicalIdx: number = pieceTypeToCanonicalIndex(currentPiece.type);
        out[currentCanonicalIdx][h][w] = 1.0;
        let maxHP: number = pieceTypeToMaxHealthPoints(currentPiece.type);
        out[currentCanonicalIdx + 12][h][w] = currentPiece.healthPoints / maxHP;
      }
    }
    return out
  }

  dump(): string {
    return this.gameWrapper.game.dump()
  }
}

function pieceTypeToCanonicalIndex(pt: PieceType): number {
  switch(pt) {
    case PieceType.P1_KING:
      return 0;
    case PieceType.P1_MAGE:
      return 1;
    case PieceType.P1_PAWN:
      return 2;
    case PieceType.P1_WARRIOR:
      return 3;
    case PieceType.P1_ASSASSIN:
      return 4;
    case PieceType.P1_KNIGHT:
      return 5;
    case PieceType.P2_KING:
      return 6;
    case PieceType.P2_MAGE:
      return 7;
    case PieceType.P2_PAWN:
      return 8;
    case PieceType.P2_WARRIOR:
      return 9;
    case PieceType.P2_ASSASSIN:
      return 10;
    case PieceType.P2_KNIGHT:
      return 11;
    default:
      return 1000;
  }
}

function pieceTypeToMaxHealthPoints(pt: PieceType): number {
  switch(pt) {
    case PieceType.P1_KING:
      return KING_STARTING_HEALTH_POINTS;
    case PieceType.P1_MAGE:
      return MAGE_STARTING_HEALTH_POINTS;
    case PieceType.P1_PAWN:
      return PAWN_STARTING_HEALTH_POINTS;
    case PieceType.P1_WARRIOR:
      return WARRIOR_STARTING_HEALTH_POINTS;
    case PieceType.P1_ASSASSIN:
      return ASSASSIN_STARTING_HEALTH_POINTS;
    case PieceType.P1_KNIGHT:
      return KNIGHT_STARTING_HEALTH_POINTS;
    case PieceType.P2_KING:
      return KING_STARTING_HEALTH_POINTS;
    case PieceType.P2_MAGE:
      return MAGE_STARTING_HEALTH_POINTS;
    case PieceType.P2_PAWN:
      return PAWN_STARTING_HEALTH_POINTS;
    case PieceType.P2_WARRIOR:
      return WARRIOR_STARTING_HEALTH_POINTS;
    case PieceType.P2_ASSASSIN:
      return ASSASSIN_STARTING_HEALTH_POINTS;
    case PieceType.P2_KNIGHT:
      return KNIGHT_STARTING_HEALTH_POINTS;
    default:
      return 0;
  }
}
