<template>
  <v-container max-width="900px" class="pa-0">
    <!-- Piece selector section -->
    <div class="piece-selector">
      <div class="selector-layout">
        <div class="pieces-grid">
          <div
            v-for="piece in pieces"
            :key="piece.type"
            :class="['piece-icon', { selected: selectedPiece === piece.type }]"
            @click="selectPiece(piece.type)"
          >
            <img :src="piece.icon" :alt="piece.name" />
          </div>
        </div>

        <div class="controls">
          <v-select
            v-model="healthPoints"
            :items="healthOptions"
            label="Health Points"
            variant="outlined"
            density="compact"
            style="min-width: 250px;"
          ></v-select>
          <v-select
            v-model="sideToMove"
            :items="sideToMoveOptions"
            label="Side to move"
            variant="outlined"
            density="compact"
            style="min-width: 250px;"
          ></v-select>


          <div class="button-group mt-2">
            <v-btn @click="setStartingPosition" variant="outlined" block class="mb-2">
              Starting position
            </v-btn>
            <v-btn @click="clearPosition" variant="outlined" block>
              Clear position
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Chessboard -->
    <div class="chessboard-wrapper mt-6">
      <TheChessboard
        @board-created="handleBoardCreated"
        :board-config="boardConfig"
        @move="handleMove"
      />
    </div>

    <!-- Board string display -->
    <div class="board-string-display mt-4">
      <div class="board-string-label">Board State:</div>
      <div class="board-string">{{ currentBoardString }}</div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';
import { PieceType, Player } from 'nichess';

// Import piece icons
import openHand from '@/assets/open-hand.svg';
import wP from '@/assets/wP.svg';
import wN from '@/assets/wN.svg';
import wR from '@/assets/wR.svg';
import wK from '@/assets/wK.svg';
import wM from '@/assets/wM.svg';
import wQ from '@/assets/wQ.svg';
import bp from '@/assets/bp.svg';
import bn from '@/assets/bn.svg';
import br from '@/assets/br.svg';
import bk from '@/assets/bk.svg';
import bm from '@/assets/bm.svg';
import bq from '@/assets/bq.svg';
import x from '@/assets/x.svg';

// Piece definitions
const pieces = [
  { type: PieceType.P1_PAWN, icon: wP, name: 'White Pawn' },
  { type: PieceType.P1_KNIGHT, icon: wN, name: 'White Knight' },
  { type: PieceType.P1_WARRIOR, icon: wR, name: 'White Warrior' },
  { type: PieceType.P1_KING, icon: wK, name: 'White King' },
  { type: PieceType.P1_ASSASSIN, icon: wM, name: 'White Assassin' },
  { type: PieceType.P1_MAGE, icon: wQ, name: 'White Mage' },
  { type: PieceType.P2_PAWN, icon: bp, name: 'Black Pawn' },
  { type: PieceType.P2_KNIGHT, icon: bn, name: 'Black Knight' },
  { type: PieceType.P2_WARRIOR, icon: br, name: 'Black Warrior' },
  { type: PieceType.P2_KING, icon: bk, name: 'Black King' },
  { type: PieceType.P2_ASSASSIN, icon: bm, name: 'Black Assassin' },
  { type: PieceType.P2_MAGE, icon: bq, name: 'Black Mage' },
  { type: 'HAND', icon: openHand, name: 'Hand (Move pieces)' },
  { type: PieceType.NO_PIECE, icon: x, name: 'Delete' },
];

// State
const selectedPiece = ref('HAND');
const healthPoints = ref(30);
const healthOptions = [10, 20, 30, 40, 50, 60];
const sideToMove = ref('Player 1');
const sideToMoveOptions = ['Player 1', 'Player 2'];

const currentBoardString = ref('');
let boardAPI;

// Board configuration
const boardConfig = reactive({
  animation: {
    enabled: true,
    duration: 200
  },
  movable: {
    free: true
  },
  highlight: {
    lastMove: false,
    check: false,
  },
  events: {
    select: handleSquareSelect
  }
});

function selectPiece(pieceType) {
  selectedPiece.value = pieceType;
  // change health points to default value for that piece
  if(pieceType == PieceType.P1_PAWN) {
    healthPoints.value = 30;
  } else if(pieceType == PieceType.P1_MAGE) {
    healthPoints.value = 10;
  } else if(pieceType == PieceType.P1_ASSASSIN) {
    healthPoints.value = 10;
  } else if(pieceType == PieceType.P1_WARRIOR) {
    healthPoints.value = 60;
  } else if(pieceType == PieceType.P1_KNIGHT) {
    healthPoints.value = 60;
  } else if(pieceType == PieceType.P1_KING) {
    healthPoints.value = 10;
  } else if(pieceType == PieceType.P2_PAWN) {
    healthPoints.value = 30;
  } else if(pieceType == PieceType.P2_MAGE) {
    healthPoints.value = 10;
  } else if(pieceType == PieceType.P2_ASSASSIN) {
    healthPoints.value = 10;
  } else if(pieceType == PieceType.P2_WARRIOR) {
    healthPoints.value = 60;
  } else if(pieceType == PieceType.P2_KNIGHT) {
    healthPoints.value = 60;
  } else if(pieceType == PieceType.P2_KING) {
    healthPoints.value = 10;
  }
}

function handleMove(move) {
  updateBoardString();
}

function handleSquareSelect(square) {
  // If hand is selected, allow normal board movement
  if (selectedPiece.value === 'HAND' || selectedPiece.value === null) {
    return;
  }

  // Convert square notation (e.g., 'e4') to index [0, 63]
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const file = square[0];
  const rank = square[1];
  const fileIndex = files.indexOf(file);
  const rankIndex = parseInt(rank) - 1;
  const squareIndex = rankIndex * 8 + fileIndex;

  // Determine health points (0 for NO_PIECE)
  const hp = selectedPiece.value === PieceType.NO_PIECE ? 0 : healthPoints.value;

  // Place the piece
  boardAPI.putPiece(selectedPiece.value, squareIndex, hp);

  // Update FEN display
  updateBoardString();
}

function handleBoardCreated(api) {
  boardAPI = api;
  updateBoardString();
}

function updateBoardString() {
  if (boardAPI) {
    currentBoardString.value = boardAPI.getFen();
  }
}

function setStartingPosition() {
  boardAPI.setPosition("0|0-warrior-60,0-knight-60,0-assassin-10,0-mage-10,0-king-10,0-assassin-10,0-knight-60,0-warrior-60,0-pawn-30,0-pawn-30,0-pawn-30,0-pawn-30,0-pawn-30,0-pawn-30,0-pawn-30,0-pawn-30,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,1-pawn-30,1-pawn-30,1-pawn-30,1-pawn-30,1-pawn-30,1-pawn-30,1-pawn-30,1-pawn-30,1-warrior-60,1-knight-60,1-assassin-10,1-mage-10,1-king-10,1-assassin-10,1-knight-60,1-warrior-60,")
  updateBoardString();
  selectedPiece.value = 'HAND'
}

function clearPosition() {
  boardAPI.setPosition("0|empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,empty,")
  updateBoardString();
  selectedPiece.value = 'HAND'
}

watch(sideToMove, (newValue) => {
  if (boardAPI) {
    const player = newValue === 'Player 1' ? Player.PLAYER_1 : Player.PLAYER_2;
    boardAPI.setCurrentPlayer(player);
    updateBoardString();
  }
});
</script>

<style scoped>
.piece-selector {
  background-color: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.selector-layout {
  display: flex;
  gap: 60px;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}

.pieces-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  max-width: 360px;
  flex-shrink: 0;
}

.piece-icon {
  width: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 4px;
  transition: all 0.2s;
  background-color: #2a2a2a;
}

.piece-icon:hover {
  background-color: #3a3a3a;
  border-color: #555;
}

.piece-icon.selected {
  border-color: #ffd700;
  background-color: #3a3a3a;
}

.piece-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 250px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.board-string-display {
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #444;
}

.board-string-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

.board-string {
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
  line-height: 1.6;
}

.chessboard-wrapper {
  width: 100%;
  max-width: 832px;
  aspect-ratio: 1;
  margin: 0 auto;
  overflow: hidden;
}

.chessboard-wrapper :deep(div) {
  max-width: 100% !important;
  max-height: 100% !important;
}

.chessboard-wrapper :deep(.cg-wrap) {
  width: 100% !important;
  height: 100% !important;
  aspect-ratio: 1 !important;
}

@media (min-width: 900px) {
  .chessboard-wrapper {
    width: 832px;
    height: 832px;
  }

  .chessboard-wrapper :deep(.cg-wrap) {
    width: 832px !important;
    height: 832px !important;
  }
}
</style>
