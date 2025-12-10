import { Game, PlayerAction, Piece, coordinatesToBoardIndex,
  Player, PieceType, UndoInfo, ACTION_SKIP, isOffBoard, ActionType, pieceBelongsToPlayer,
  GameCache, PAWN_ABILITY_POINTS
} from 'nichess'
import * as nichessConstants from './nichess_constants'
import { AgentCache } from './agent_cache'

export class GameWrapper {
  public game: Game
  public actionsSinceProgress: number;

  // 1) constructor()
  // 2) constructor(encodedBoard)
  // 3) constructor(other)
  constructor(params: {encodedBoard?: string, other?: GameWrapper}) {
    if(params.encodedBoard !== undefined) { // 2
      this.actionsSinceProgress = 0; // history not encoded, so assume 0
      this.game = new Game({encodedBoard: params.encodedBoard});
    } else if(params.other !== undefined) { // 3
      this.actionsSinceProgress = params.other.actionsSinceProgress;
      this.game = new Game({other: params.other.game});
    } else { // 1
      this.actionsSinceProgress = 0;
      this.game = new Game({});
    }
  }

  isGameDraw(): boolean {
    return this.game.isGameDraw();
  }

  computeValids(): Array<number> {
    let valids = new Array<number>(nichessConstants.NUM_MOVES).fill(0);
    let foundLegalMove: boolean = false;
    let currentPlayerPieces: Array<Piece> = this.game.playerToPieces[this.game.currentPlayer]
    for(let i = 0; i < currentPlayerPieces.length; i++) {
      let currentPiece: Piece = currentPlayerPieces[i];
      if(currentPiece.healthPoints <= 0) continue; // dead pieces don't move
      let legalActions: Array<PlayerAction> = this.game.legalActionsByPiece(currentPiece);
      for(let j = 0; j < legalActions.length; j++) {
        let action: PlayerAction = legalActions[j];
        let currentIndex: number = AgentCache.srcSquareToDstSquareToMoveIndex[action.srcIdx][action.dstIdx];
        valids[currentIndex] = 1;
        foundLegalMove = true;
      }
    }
    /* TODO: Always false in the current version.
    if(!foundLegalMove) {
      valids[nichessConstants.ACTION_SKIP_IDX] = 1;
    }
   */

    return valids;
  }

  createNichessAction(move: number): PlayerAction {
    let srcIdx: number;
    let dstIdx: number;
    if(move == nichessConstants.ACTION_SKIP_IDX) {
      return new PlayerAction(ACTION_SKIP, ACTION_SKIP, ActionType.SKIP);
    } else {
      let srcAndDst: [number, number] = AgentCache.moveIndexToSrcAndDstSquare[move];
      srcIdx = srcAndDst[0];
      dstIdx = srcAndDst[1];
    }
    let srcPiece: Piece = this.game.board[srcIdx];
    let dstPiece: Piece = this.game.board[dstIdx];
    let actionType: ActionType;
    let direction: Direction;
    let directionLine: Array<number>;
    let currentPiece: Piece;

    switch(srcPiece.type) {
      case PieceType.P1_KING:
        if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
          actionType = ActionType.ABILITY_KING_DAMAGE;
        } else if(
          (srcIdx == 4 && dstIdx == 6) ||
          (srcIdx == 4 && dstIdx == 2)
          ) {
          actionType = ActionType.MOVE_CASTLE;
        } else {
          actionType = ActionType.MOVE_REGULAR;
        }
        break;
      case PieceType.P1_MAGE:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx];
          directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
          currentPiece = this.game.board[directionLine[0]];
          if(currentPiece.type == PieceType.P1_ASSASSIN) {
            actionType = ActionType.ABILITY_MAGE_THROW_ASSASSIN;
          } else {
            actionType = ActionType.ABILITY_MAGE_DAMAGE;
          }
        }
        break;
      case PieceType.P1_PAWN:
        if(dstPiece.type == PieceType.NO_PIECE) {
          if(dstIdx > 55) {
            actionType = ActionType.MOVE_PROMOTE_P1_PAWN;
          } else {
            actionType = ActionType.MOVE_REGULAR;
          }
        } else {
          if(dstIdx > 55 && dstPiece.healthPoints <= PAWN_ABILITY_POINTS) {
            actionType = ActionType.ABILITY_P1_PAWN_DAMAGE_AND_PROMOTION;
          } else {
            actionType = ActionType.ABILITY_PAWN_DAMAGE;
          }
        }
        break;
      case PieceType.P1_WARRIOR:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx];
          directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
          currentPiece = this.game.board[directionLine[0]];
          if(currentPiece.type == PieceType.P1_WARRIOR) {
            actionType = ActionType.ABILITY_WARRIOR_THROW_WARRIOR;
          } else {
            actionType = ActionType.ABILITY_WARRIOR_DAMAGE;
          }
        }
        break;
      case PieceType.P1_ASSASSIN:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          actionType = ActionType.ABILITY_ASSASSIN_DAMAGE;
        }
        break;
      case PieceType.P1_KNIGHT:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          actionType = ActionType.ABILITY_KNIGHT_DAMAGE;
        }
        break;
      case PieceType.P2_KING:
        if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
          actionType = ActionType.ABILITY_KING_DAMAGE;
        } else if(
          (srcIdx == 60 && dstIdx == 62) ||
          (srcIdx == 60 && dstIdx == 58)
          ) {
          actionType = ActionType.MOVE_CASTLE;
        } else {
          actionType = ActionType.MOVE_REGULAR;
        }
        break;
      case PieceType.P2_MAGE:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx];
          directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
          currentPiece = this.game.board[directionLine[0]];
          if(currentPiece.type == PieceType.P2_ASSASSIN) {
            actionType = ActionType.ABILITY_MAGE_THROW_ASSASSIN;
          } else {
            actionType = ActionType.ABILITY_MAGE_DAMAGE;
          }
        }
        break;
      case PieceType.P2_PAWN:
        if(dstPiece.type == PieceType.NO_PIECE) {
          if(dstIdx < 8) {
            actionType = ActionType.MOVE_PROMOTE_P2_PAWN;
          } else {
            actionType = ActionType.MOVE_REGULAR;
          }
        } else {
          if(dstIdx < 8 && dstPiece.healthPoints <= PAWN_ABILITY_POINTS) {
            actionType = ActionType.ABILITY_P2_PAWN_DAMAGE_AND_PROMOTION;
          } else {
            actionType = ActionType.ABILITY_PAWN_DAMAGE;
          }
        }
        break;
      case PieceType.P2_WARRIOR:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx];
          directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
          currentPiece = this.game.board[directionLine[0]];
          if(currentPiece.type == PieceType.P2_WARRIOR) {
            actionType = ActionType.ABILITY_WARRIOR_THROW_WARRIOR;
          } else {
            actionType = ActionType.ABILITY_WARRIOR_DAMAGE;
          }
        }
        break;
      case PieceType.P2_ASSASSIN:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          actionType = ActionType.ABILITY_ASSASSIN_DAMAGE;
        }
        break;
      case PieceType.P2_KNIGHT:
        if(dstPiece.type == PieceType.NO_PIECE) {
          actionType = ActionType.MOVE_REGULAR;
        } else {
          actionType = ActionType.ABILITY_KNIGHT_DAMAGE;
        }
        break;
      default:
        break;
    }

    return new PlayerAction(srcIdx, dstIdx, actionType);
  }

  makeAction(move: number): void {
    let a: PlayerAction = this.createNichessAction(move);
    // Is this action making progress?
    // 1) Skip: no progress
    // 2) Pawn action: any pawn action is defined as progress
    // 3) Other actions: Only count as progress if they cause damage.
    if(a.actionType == ActionType.SKIP) {
      this.actionsSinceProgress += 1;
    } else {
      let srcPiece: Piece = this.game.board[a.srcIdx];
      if(srcPiece.type == PieceType.P1_PAWN || srcPiece.type == PieceType.P2_PAWN) {
        this.actionsSinceProgress = 0;
      } else if(a.actionType == ActionType.MOVE_REGULAR || a.actionType == ActionType.MOVE_CASTLE) {
        this.actionsSinceProgress += 1;
      } else {
        this.actionsSinceProgress = 0;
      }
    }
    this.game.makeAction(a);
  }

  moveToPlayerAction(move: number): string {
    let nichessAction: PlayerAction = this.createNichessAction(move);
    let retval: string = "";
    retval += nichessAction.srcIdx.toString() + ".";
    retval += nichessAction.dstIdx.toString();
    return retval;
  }
}
