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

    <!-- Neural Net Evaluation -->
    <div class="neural-net-eval mt-4">
      <!-- Download Warning (only show if model not ready) -->
      <div v-if="!modelReady" class="download-warning mb-3">
        <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
        <span>Note: The 40 MB AI model will be downloaded when you first use eval.</span>
      </div>

      <div class="eval-controls">
        <v-btn
          @click="evaluatePosition"
          variant="outlined"
          :loading="evaluating"
          :disabled="modelLoading || evaluating || autoEvaluate"
          class="eval-button"
        >
          Get Neural Net Evaluation
        </v-btn>

        <v-switch
          v-model="autoEvaluate"
          label="Auto-evaluate"
          color="primary"
          density="compact"
          hide-details
        ></v-switch>
      </div>

      <div v-if="modelLoading" class="model-status mt-2">
        <v-progress-linear indeterminate color="grey" class="mb-2"></v-progress-linear>
        <div class="model-status-text">Downloading AI model (40 MB)... This may take a while.</div>
      </div>

      <div v-if="formattedEvaluation" class="evaluation-result mt-3" :class="{ 'evaluating': evaluating }">
        <div v-if="evaluating" class="evaluating-indicator">
          <v-progress-circular indeterminate size="20" width="2" color="grey"></v-progress-circular>
          <span class="evaluating-text">Updating...</span>
        </div>

        <div class="evaluation-label">Neural Net Evaluation - Value Head:</div>
        <div class="evaluation-values">
          <div class="evaluation-item">
            <span class="evaluation-key">Player 1 (White) Win:</span>
            <span class="evaluation-value">{{ formattedEvaluation.player1Win }}%</span>
          </div>
          <div class="evaluation-item">
            <span class="evaluation-key">Player 2 (Black) Win:</span>
            <span class="evaluation-value">{{ formattedEvaluation.player2Win }}%</span>
          </div>
          <div class="evaluation-item">
            <span class="evaluation-key">Draw:</span>
            <span class="evaluation-value">{{ formattedEvaluation.draw }}%</span>
          </div>
        </div>

        <div class="policy-section mt-3">
          <div class="evaluation-label">Neural Net Evaluation - Policy Head (Top 8 Moves):</div>
          <div class="policy-moves">
            <div
              v-for="(move, index) in formattedEvaluation.topMoves"
              :key="index"
              class="policy-move-item"
            >
              <span class="move-rank">{{ index + 1 }}.</span>
              <span class="move-notation">{{ move.from }} → {{ move.to }}</span>
              <span class="move-probability">{{ move.probability }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Move index lookup -->
    <div class="move-index-lookup mt-4">
      <div class="move-index-label">Neural Net Move Index Lookup (Squares to Index):</div>
      <div class="move-index-label">*Invalid inputs will produce invalid results</div>
      <div class="move-index-controls">
        <v-select
          v-model="sourceSquare"
          :items="squareOptions"
          label="Source Square"
          variant="outlined"
          density="compact"
          style="min-width: 120px;"
        ></v-select>
        <v-select
          v-model="destSquare"
          :items="squareOptions"
          label="Destination Square"
          variant="outlined"
          density="compact"
          style="min-width: 120px;"
        ></v-select>
        <div class="move-index-result">
          Move Index: <span class="move-index-value">{{ moveIndex }}</span>
        </div>
      </div>
    </div>

    <!-- Reverse move index lookup -->
    <div class="move-index-lookup mt-4">
      <div class="move-index-label">Neural Net Move Index Lookup (Index to Squares):</div>
      <div class="move-index-label">*Invalid inputs will produce invalid results</div>
      <div class="move-index-controls">
        <v-text-field
          v-model.number="reverseMoveIndex"
          type="number"
          label="Move Index"
          variant="outlined"
          density="compact"
          style="min-width: 120px; max-width: 150px;"
          :min="0"
          :max="4096"
          :rules="[moveIndexRule]"
          @update:model-value="validateMoveIndex"
        ></v-text-field>
        <div class="move-index-result">
          Source: <span class="move-index-value">{{ reverseSourceSquare }}</span>
        </div>
        <div class="move-index-result">
          Destination: <span class="move-index-value">{{ reverseDestSquare }}</span>
        </div>
      </div>
    </div>

    <!-- Board string display -->
    <div class="board-string-display mt-4">
      <div class="board-string-label">Board State:</div>
      <div class="board-string">{{ currentBoardString }}</div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch, computed, onBeforeUnmount } from 'vue'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';
import { PieceType, Player } from 'nichess';
import { AgentCache } from '@/AI/agent_cache';
import { useAppStore } from '../stores/app';

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

// AI evaluation state
const appStore = useAppStore();
const boardWorker = appStore.initBoardWorker();
const modelLoading = computed(() => appStore.modelLoading);
const modelReady = computed(() => appStore.modelReady);
const evaluationResult = ref(null);
const evaluating = ref(false);
const autoEvaluate = ref(false);

// Square options for move index lookup (a1 to h8)
const squareOptions = [];
for (let rank = 1; rank <= 8; rank++) {
  for (let file = 0; file < 8; file++) {
    squareOptions.push(String.fromCharCode(97 + file) + rank);
  }
}

const sourceSquare = ref('a1');
const destSquare = ref('a1');

// Convert square notation (e.g., 'a1') to index (0-63)
// a1=0, b1=1, ..., h1=7, a2=8, ..., h8=63
function squareToIndex(square) {
  const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
  const rank = parseInt(square[1]) - 1;   // '1' = 0, '2' = 1, etc.
  return rank * 8 + file;
}

const moveIndex = computed(() => {
  const srcIndex = squareToIndex(sourceSquare.value);
  const dstIndex = squareToIndex(destSquare.value);
  return AgentCache.srcSquareToDstSquareToMoveIndex[srcIndex][dstIndex];
});

// Reverse move index lookup (index to squares)
const reverseMoveIndex = ref(0);

// Convert index (0-63) to square notation (e.g., 'a1')
function indexToSquare(index) {
  const file = String.fromCharCode(97 + (index % 8)); // 'a' + file
  const rank = Math.floor(index / 8) + 1;
  return file + rank;
}

// Validation rule for move index input
const moveIndexRule = (value) => {
  if (value === '' || value === null || value === undefined) return true;
  const num = Number(value);
  if (isNaN(num)) return 'Must be a number';
  if (num < 0 || num > 4096) return 'Must be between 0 and 4096';
  if (!Number.isInteger(num)) return 'Must be an integer';
  return true;
};

// Clamp move index to valid range
function validateMoveIndex(value) {
  if (value === '' || value === null || value === undefined) {
    reverseMoveIndex.value = 0;
    return;
  }
  const num = Number(value);
  if (isNaN(num)) {
    reverseMoveIndex.value = 0;
  } else {
    reverseMoveIndex.value = Math.max(0, Math.min(4096, Math.floor(num)));
  }
}

const reverseSourceSquare = computed(() => {
  const idx = reverseMoveIndex.value;
  if (idx < 0 || idx > 4096 || !AgentCache.moveIndexToSrcAndDstSquare[idx]) {
    return '-';
  }
  const srcIndex = AgentCache.moveIndexToSrcAndDstSquare[idx][0];
  return indexToSquare(srcIndex);
});

const reverseDestSquare = computed(() => {
  const idx = reverseMoveIndex.value;
  if (idx < 0 || idx > 4096 || !AgentCache.moveIndexToSrcAndDstSquare[idx]) {
    return '-';
  }
  const dstIndex = AgentCache.moveIndexToSrcAndDstSquare[idx][1];
  return indexToSquare(dstIndex);
});

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

// Watch for board state changes and auto-evaluate if enabled
watch(currentBoardString, (newValue) => {
  if (autoEvaluate.value && newValue && !evaluating.value) {
    evaluatePosition();
  }
});

// Watch for auto-evaluate toggle - when enabled, evaluate current position immediately
watch(autoEvaluate, (newValue) => {
  if (newValue && currentBoardString.value && !evaluating.value) {
    evaluatePosition();
  }
});

// Worker message handler
boardWorker.onmessage = (event) => {
  const { type } = event.data;

  if (type === 'model-status') {
    if (event.data.status === 'starting') {
      appStore.setModelLoading(true);
    } else if (event.data.status === 'ready') {
      appStore.setModelLoading(false);
      appStore.setModelReady(true);
      // If we were waiting to evaluate, do it now
      if (evaluating.value) {
        const boardString = boardAPI.getFen();
        boardWorker.postMessage({
          type: 'evaluate',
          id: 'editor-eval',
          boardString: boardString
        });
      }
    } else if (event.data.status === 'error') {
      appStore.setModelLoading(false);
      evaluating.value = false;
      console.error('Model load error:', event.data.message);
      alert('Error loading AI model: ' + event.data.message);
    }
    return;
  }

  if (type === 'evaluation-result') {
    evaluating.value = false;
    evaluationResult.value = event.data.evaluation;
    console.log('Evaluation result:', evaluationResult.value);
  }
};

function evaluatePosition() {
  if (!boardAPI) return;

  evaluating.value = true;
  // Don't clear evaluationResult.value here to prevent UI refresh
  // Just let the new results replace the old ones when ready
  const boardString = boardAPI.getFen();

  boardWorker.postMessage({
    type: 'evaluate',
    id: 'editor-eval',
    boardString: boardString
  });
}

const formattedEvaluation = computed(() => {
  if (!evaluationResult.value) return null;

  const v = evaluationResult.value.value;
  const pi = evaluationResult.value.policy;

  // v[0] = player 1 win probability
  // v[1] = player 2 win probability
  // v[2] = draw probability

  // Format top moves from policy
  const topMoves = formatTopMoves(pi, 8);

  return {
    player1Win: (v[0] * 100).toFixed(1),
    player2Win: (v[1] * 100).toFixed(1),
    draw: (v[2] * 100).toFixed(1),
    topMoves: topMoves
  };
});

function formatTopMoves(policy, topN) {
  // Create array of [moveIndex, probability] pairs
  const movesWithProbs = policy.map((prob, index) => ({
    moveIndex: index,
    probability: prob
  }));

  // Sort by probability descending
  movesWithProbs.sort((a, b) => b.probability - a.probability);

  // Take top N moves
  const topMoves = movesWithProbs.slice(0, topN);

  // Convert move indices to square notation
  return topMoves.map(move => {
    const squares = AgentCache.moveIndexToSrcAndDstSquare[move.moveIndex];
    if (!squares) {
      return {
        from: '?',
        to: '?',
        probability: (move.probability * 100).toFixed(2)
      };
    }
    const srcSquare = indexToSquare(squares[0]);
    const dstSquare = indexToSquare(squares[1]);
    return {
      from: srcSquare,
      to: dstSquare,
      probability: (move.probability * 100).toFixed(2)
    };
  });
}

onBeforeUnmount(() => {
  // Clean up worker message handler
  boardWorker.onmessage = null;
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

.move-index-lookup {
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #444;
}

.move-index-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 12px;
}

.move-index-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.move-index-result {
  color: #fff;
  font-family: monospace;
  font-size: 16px;
}

.move-index-value {
  color: #ffd700;
  font-weight: bold;
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

.neural-net-eval {
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #444;
}

.download-warning {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  color: #ffb74d;
  font-size: 14px;
}

.eval-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.eval-button {
  flex-shrink: 0;
}

.model-status {
  padding: 12px;
  background-color: #2a2a2a;
  border-radius: 6px;
  border: 1px solid #555;
}

.model-status-text {
  color: #999;
  font-size: 14px;
  text-align: center;
}

.evaluation-result {
  background-color: #2a2a2a;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #555;
  position: relative;
  transition: opacity 0.2s;
}

.evaluation-result.evaluating {
  opacity: 0.7;
}

.evaluating-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 4px;
  z-index: 10;
}

.evaluating-text {
  color: #999;
  font-size: 12px;
}

.evaluation-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 12px;
  font-weight: 600;
}

.evaluation-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.evaluation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #333;
  border-radius: 4px;
}

.evaluation-key {
  color: #ccc;
  font-size: 14px;
}

.evaluation-value {
  color: #ffd700;
  font-weight: bold;
  font-size: 16px;
  font-family: monospace;
}

.policy-section {
  border-top: 1px solid #444;
  padding-top: 12px;
}

.policy-moves {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.policy-move-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #333;
  border-radius: 4px;
}

.move-rank {
  color: #999;
  font-weight: bold;
  font-size: 14px;
  min-width: 24px;
}

.move-notation {
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  flex-grow: 1;
}

.move-probability {
  color: #4CAF50;
  font-weight: bold;
  font-size: 14px;
  font-family: monospace;
  min-width: 60px;
  text-align: right;
}
</style>
