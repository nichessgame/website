export const WIDTH = 8;
export const HEIGHT = 8;
export const NUM_MAX_POSSIBLE_MOVES_FOR_PIECE = 7*8 + 8; // 7 squares x 8 directions + 8 knight moves
export const NUM_MOVES = WIDTH * HEIGHT * NUM_MAX_POSSIBLE_MOVES_FOR_PIECE + 1; // +1 for MOVE_SKIP
export const MOVE_SKIP_IDX = NUM_MOVES - 1;
export const NUM_PLAYERS = 2;
export const NUM_SYMMETRIES = 2;
export const BOARD_SHAPE = [2, HEIGHT, WIDTH];
// 12 piece types (exluding NO_PIECE, 6 for P1 and 6 for P2)
// 2 layers per type, first indicates whether piece is alive and second % of max health points.
// 2 layers indicating whether it's P1 or P2 turn.
export const CANONICAL_SHAPE = [12 * 2 + 2, HEIGHT, WIDTH];
export const VIRTUAL_LOSS = 1;
export const NUM_SQUARES = WIDTH * HEIGHT;
// Under the current rules, living pieces can only have 10, 20, 30, 40, 50 or 60 HP.
export const NUM_DISTINCT_HP_VALUES = 6;

