<template>
  <v-container max-width="1000px" class="pa-0">
    <div ref="chessboardContainer" class="chessboard-container">
      <TheChessboard
        @board-created="handleBoardCreated"
        @move="handleMove"
        :board-config="boardConfig"
        class="mt-10"
      />
    </div>

    <!-- Control Row -->
    <div class="control-row mt-2 mt-sm-4">
      <!-- Left: Empty -->
      <div class="control-row-left"></div>

      <!-- Center: Control Buttons -->
      <div class="control-row-center">
        <v-btn
          @click="undoAll"
          :disabled="currentMoveIndex === 0"
          variant="outlined"
        >
          <v-icon
            icon="$mdiChevronDoubleLeft"
            class="ma-auto"
          />
        </v-btn>

        <v-btn
          @click="undoMove"
          :disabled="currentMoveIndex === 0"
          variant="outlined"
        >
          <v-icon
            icon="$mdiChevronLeft"
            class="ma-auto"
          />
        </v-btn>

        <v-btn
          @click="redoMove"
          :disabled="currentMoveIndex >= moveHistory.length"
          variant="outlined"
        >
          <v-icon
            icon="$mdiChevronRight"
            class="ma-auto"
          />
        </v-btn>

        <v-btn
          @click="redoAll"
          :disabled="currentMoveIndex >= moveHistory.length"
          variant="outlined"
        >
          <v-icon
            icon="$mdiChevronDoubleRight"
            class="ma-auto"
          />
        </v-btn>
      </div>

      <!-- Right: Flip and Sound Buttons -->
      <div class="control-row-right">
        <v-btn
          @click="flipBoard"
          variant="flat"
        >
          <v-icon icon="$mdiRotate3dVariant" />
        </v-btn>

        <v-btn
          @click="toggleSound"
          variant="flat"
        >
          <v-icon :icon="appStore.soundEnabled ? '$mdiVolumeHigh' : '$mdiVolumeOff'" />
        </v-btn>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <v-tabs v-model="activeTab" class="mt-4 tabs-no-scroll" bg-color="#1a1a1a">
      <v-tab value="analysis">Analysis</v-tab>
      <v-tab value="moves">Moves</v-tab>
      <v-tab value="games">Games</v-tab>
    </v-tabs>

    <!-- Analysis Tab -->
    <div v-show="activeTab === 'analysis'" class="tab-content">
      <div v-if="!modelReady" class="download-warning mb-3">
        <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
        <span>Note: The 40 MB AI model will be downloaded when you first use eval.</span>
      </div>

      <div v-if="modelLoading" class="model-status mb-3">
        <v-progress-linear indeterminate color="grey" class="mb-2"></v-progress-linear>
        <div class="model-status-text">Downloading AI model (40 MB)... This may take a while.</div>
      </div>

      <div class="analysis-controls">
        <v-switch
          v-model="analysisEnabled"
          label="Analysis"
          color="primary"
          density="compact"
          hide-details
        ></v-switch>

        <v-text-field
          v-model.number="maxNodes"
          type="number"
          label="Max nodes"
          variant="outlined"
          density="compact"
          :min="100"
          :max="100000"
          :step="1000"
          hide-details
          style="max-width: 150px;"
        ></v-text-field>
      </div>

      <div v-if="analysisResult" class="evaluation-result mt-3">
        <div class="evaluation-label">MCTS Search — {{ analysisResult.nodes }} nodes</div>
        <div class="evaluation-values">
          <div class="evaluation-item">
            <span class="evaluation-key">White Win:</span>
            <span class="evaluation-value">{{ formattedWLD.whiteWin }}%</span>
          </div>
          <div class="evaluation-item">
            <span class="evaluation-key">Black Win:</span>
            <span class="evaluation-value">{{ formattedWLD.blackWin }}%</span>
          </div>
          <div class="evaluation-item">
            <span class="evaluation-key">Draw:</span>
            <span class="evaluation-value">{{ formattedWLD.draw }}%</span>
          </div>
        </div>

        <div v-if="formattedTopMoves.length > 0" class="policy-section mt-3">
          <div class="evaluation-label">Top Moves:</div>
          <div class="policy-moves">
            <div
              v-for="(entry, index) in formattedTopMoves"
              :key="index"
              class="policy-move-item"
            >
              <span class="move-rank">{{ index + 1 }}.</span>
              <span class="continuation-line-inline">
                <span
                  v-for="(move, mIdx) in entry.moves"
                  :key="mIdx"
                  class="continuation-move"
                >{{ move.from }} → {{ move.to }}<span v-if="mIdx < entry.moves.length - 1" class="continuation-separator">,&nbsp;</span></span>
              </span>
              <span class="move-wld">{{ entry.wld.whiteWin }}% {{ entry.wld.blackWin }}% {{ entry.wld.draw }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Moves Tab -->
    <div v-show="activeTab === 'moves'" class="tab-content">
      <div class="move-history-section">
        <div class="history-header">
          <div class="history-label">History:</div>
          <div class="history-buttons" v-if="moveHistory.length > 0">
            <v-btn
              @click="copyMoveHistory"
              variant="outlined"
              size="small"
              prepend-icon="$mdiContentCopy"
            >
              Copy
            </v-btn>
          </div>
        </div>

        <div class="move-history-view mt-2">
          <!-- Copy Message Display -->
          <div v-if="copyMessage.show" :class="['copy-message', 'mb-3', `message-${copyMessage.type}`]">
            <v-icon v-if="copyMessage.type === 'error'" icon="$mdiAlertCircle" class="message-icon" />
            <v-icon v-else-if="copyMessage.type === 'success'" icon="$mdiCheckCircle" class="message-icon" />
            <span>{{ copyMessage.text }}</span>
          </div>

          <div v-if="moveHistory.length === 0" class="no-moves">No moves yet</div>
          <div v-else class="move-list">
            <div
              v-for="(move, index) in moveHistory"
              :key="index"
              :class="['move-item', { 'active': index === currentMoveIndex - 1, 'clickable': true }]"
              @click="jumpToMove(index + 1)"
            >
              <span class="move-number">{{ index + 1 }}.</span>
              <span class="move-notation">{{ move.from }} -> {{ move.to }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Games Tab -->
    <div v-show="activeTab === 'games'" class="tab-content">
      <div class="games-info-message">Your last {{ MAX_SAVED_GAMES }} games will be saved here.</div>
      <div v-if="savedGames.length === 0" class="no-moves">No saved games</div>
      <div v-else class="saved-games-list">
        <div
          v-for="(game, index) in savedGames"
          :key="game.gameId"
          :class="['saved-game-item', { 'current-game': game.gameId === selectedGameId }]"
          @click="loadSavedGame(game)"
        >
          <div class="saved-game-info">
            <span class="saved-game-number">{{ index + 1 }}.</span>
            <span class="saved-game-color">{{ game.myColor === 'white' ? 'W' : 'B' }} {{ game.gameId }}</span>
            <span v-if="game.gameOver" class="saved-game-over">ended</span>
          </div>
          <div class="saved-game-actions">
            <span class="saved-game-date">{{ formatDate(game.savedAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { PieceType } from 'nichess'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';
import { useAppStore, MAX_SAVED_GAMES } from '../stores/app';
import { AgentCache } from '@/AI/agent_cache';
import MoveSound from '@/assets/Move.ogg';
import CaptureSound from '@/assets/Capture.ogg';

const appStore = useAppStore();

const boardConfig = reactive({
  animation: {
    enabled: true,
    duration: 200
  },
});

let boardAPI = null;
const chessboardContainer = ref(null);
const moveHistory = ref([]);
const currentMoveIndex = ref(0);
const copyMessage = ref({ text: '', type: 'info', show: false });
const activeTab = ref('analysis');
const savedGames = computed(() => appStore.savedGames);
const selectedGameId = ref(null);

// Analysis state
const analysisEnabled = ref(false);
const analysisResult = ref(null);
const currentBoardString = ref('');
const maxNodes = ref(1000);
const modelLoading = computed(() => appStore.modelLoading);
const modelReady = computed(() => appStore.modelReady);

let wheelThrottle = false;

const moveAudio = new Audio(MoveSound);
const captureAudio = new Audio(CaptureSound);

// Worker setup
const boardWorker = appStore.initBoardWorker();

boardWorker.onmessage = (event) => {
  const { type } = event.data;

  if (type === 'model-status') {
    if (event.data.status === 'starting') {
      appStore.setModelLoading(true);
    } else if (event.data.status === 'ready') {
      appStore.setModelLoading(false);
      appStore.setModelReady(true);
    } else if (event.data.status === 'error') {
      appStore.setModelLoading(false);
      analysisEnabled.value = false;
      console.error('Model load error:', event.data.message);
    }
    return;
  }

  if (type === 'analysis-update') {
    analysisResult.value = {
      wld: event.data.wld,
      topMoves: event.data.topMoves,
      nodes: event.data.nodes,
      currentPlayer: event.data.currentPlayer
    };
  }
};

// Helpers
function indexToSquare(index) {
  const file = String.fromCharCode(97 + (index % 8));
  const rank = Math.floor(index / 8) + 1;
  return file + rank;
}

function moveIndexToSquares(moveIndex) {
  const squares = AgentCache.moveIndexToSrcAndDstSquare[moveIndex];
  if (!squares) return { from: '?', to: '?' };
  return { from: indexToSquare(squares[0]), to: indexToSquare(squares[1]) };
}

const formattedWLD = computed(() => {
  if (!analysisResult.value) return { whiteWin: '0.0', blackWin: '0.0', draw: '0.0' };
  const wld = analysisResult.value.wld;
  const cp = analysisResult.value.currentPlayer;
  // wld[0] = current player win, wld[1] = opponent win, wld[2] = draw
  // currentPlayer 0 = White's turn, 1 = Black's turn
  const whiteWin = cp === 0 ? wld[0] : wld[1];
  const blackWin = cp === 0 ? wld[1] : wld[0];
  const draw = wld[2];
  return {
    whiteWin: (whiteWin * 100).toFixed(1),
    blackWin: (blackWin * 100).toFixed(1),
    draw: (draw * 100).toFixed(1)
  };
});

const formattedTopMoves = computed(() => {
  if (!analysisResult.value || !analysisResult.value.topMoves) return [];
  const cp = analysisResult.value.currentPlayer;
  return analysisResult.value.topMoves.map(entry => {
    const wld = entry.wld;
    const whiteWin = cp === 0 ? wld[0] : wld[1];
    const blackWin = cp === 0 ? wld[1] : wld[0];
    const draw = wld[2];
    return {
      moves: entry.continuation.map(moveIndexToSquares),
      wld: {
        whiteWin: (whiteWin * 100).toFixed(1),
        blackWin: (blackWin * 100).toFixed(1),
        draw: (draw * 100).toFixed(1)
      }
    };
  });
});

function updateBoardString() {
  if (boardAPI) {
    currentBoardString.value = boardAPI.getFen();
  }
}

// Watchers for analysis
watch(analysisEnabled, (enabled) => {
  if (enabled) {
    if (currentBoardString.value) {
      boardWorker.postMessage({ type: 'analyze', boardString: currentBoardString.value, maxNodes: maxNodes.value });
    }
  } else {
    boardWorker.postMessage({ type: 'stop-analysis' });
  }
});

watch(currentBoardString, (newVal) => {
  if (analysisEnabled.value && newVal) {
    boardWorker.postMessage({ type: 'analyze', boardString: newVal, maxNodes: maxNodes.value });
  }
});

function handleBoardCreated(api) {
  boardAPI = api;
  moveHistory.value = [];
  currentMoveIndex.value = 0;

  // Read data passed via store
  const data = appStore.consumeAnalysisData();

  if (data && data.history && Array.isArray(data.history)) {
    // From gameviewer: replay move history
    boardAPI.resetBoard();
    for (const move of data.history) {
      if (!boardAPI.isMoveLegal(move)) break;
      const isAttack = boardAPI.getPiece(move.to).type !== PieceType.NO_PIECE;
      boardAPI.move({ from: move.from, to: move.to });
      moveHistory.value.push({ from: move.from, to: move.to, attack: move.attack !== undefined ? move.attack : isAttack });
    }
    currentMoveIndex.value = moveHistory.value.length;
  } else if (data && data.position && typeof data.position === 'string') {
    // From editor: set custom position
    boardAPI.setPosition(data.position);
  }
  // Default: standard starting position (handled by TheChessboard)

  updateBoardString();
}

function handleMove(move) {
  // If browsing history, truncate future moves
  if (currentMoveIndex.value < moveHistory.value.length) {
    moveHistory.value = moveHistory.value.slice(0, currentMoveIndex.value);
  }

  moveHistory.value.push({ from: move.from, to: move.to, attack: move.attack });
  currentMoveIndex.value = moveHistory.value.length;
  selectedGameId.value = null;

  if (appStore.soundEnabled) {
    if (move.attack) {
      playCaptureSound();
    } else {
      playMoveSound();
    }
  }

  updateBoardString();
}

function handleWheel(event) {
  event.preventDefault();
  event.stopPropagation();

  if (wheelThrottle) return;

  wheelThrottle = true;
  setTimeout(() => {
    wheelThrottle = false;
  }, 20);

  if (event.deltaY > 0) {
    undoMove();
  } else if (event.deltaY < 0) {
    redoMove();
  }
}

function handleKeyDown(event) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    undoMove();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    redoMove();
  }
}

onMounted(() => {
  if (chessboardContainer.value) {
    chessboardContainer.value.addEventListener('wheel', handleWheel, { passive: false });
  }

  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  if (chessboardContainer.value) {
    chessboardContainer.value.removeEventListener('wheel', handleWheel);
  }

  document.removeEventListener('keydown', handleKeyDown);
  boardWorker.postMessage({ type: 'stop-analysis' });
  boardWorker.onmessage = null;
});

function undoMove() {
  if (boardAPI && currentMoveIndex.value > 0) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
    updateBoardString();
  }
}

function redoWithSound() {
  const move = moveHistory.value[currentMoveIndex.value];
  boardAPI.redoLastMove();
  currentMoveIndex.value++;
  if (appStore.soundEnabled) {
    if (move.attack) {
      playCaptureSound();
    } else {
      playMoveSound();
    }
  }
}

function redoMove() {
  if (boardAPI && currentMoveIndex.value < moveHistory.value.length) {
    redoWithSound();
    updateBoardString();
  }
}

function undoAll() {
  if (!boardAPI) return;

  while (currentMoveIndex.value > 0) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
  }

  if (appStore.soundEnabled) {
    playMoveSound();
  }

  updateBoardString();
}

function redoAll() {
  if (!boardAPI || currentMoveIndex.value >= moveHistory.value.length) return;

  while (currentMoveIndex.value < moveHistory.value.length - 1) {
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
  }
  redoWithSound();
  updateBoardString();
}

function jumpToMove(targetIndex) {
  if (!boardAPI) return;
  if (targetIndex === currentMoveIndex.value) return;

  while (currentMoveIndex.value > targetIndex - 1) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
  }
  while (currentMoveIndex.value < targetIndex - 1) {
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
  }
  redoWithSound();
  updateBoardString();
}

async function copyMoveHistory() {
  if (moveHistory.value.length === 0) return;

  const formattedText = moveHistory.value
    .map((move, index) => `${index + 1}.${move.from} -> ${move.to}`)
    .join('\n');

  try {
    await navigator.clipboard.writeText(formattedText);
    copyMessage.value = {
      text: 'Move history copied to clipboard!',
      type: 'success',
      show: true
    };

    setTimeout(() => {
      copyMessage.value.show = false;
    }, 3000);
  } catch (err) {
    copyMessage.value = {
      text: 'Failed to copy to clipboard',
      type: 'error',
      show: true
    };
  }
}

function loadSavedGame(game) {
  if (!boardAPI) return;

  // Refresh from localStorage to get the latest moves
  appStore.refreshSavedGames();
  const freshGame = appStore.savedGames.find(g => g.gameId === game.gameId);
  if (!freshGame) return;

  boardAPI.resetBoard();
  moveHistory.value = [];
  currentMoveIndex.value = 0;

  for (const move of freshGame.moveHistory) {
    if (!boardAPI.isMoveLegal(move)) break;
    const isAttack = boardAPI.getPiece(move.to).type !== PieceType.NO_PIECE;
    boardAPI.move({ from: move.from, to: move.to });
    moveHistory.value.push({ from: move.from, to: move.to, attack: move.attack !== undefined ? move.attack : isAttack });
  }
  currentMoveIndex.value = moveHistory.value.length;
  selectedGameId.value = freshGame.gameId;

  updateBoardString();
}

function playCaptureSound() {
  captureAudio.currentTime = 0;
  captureAudio.play();
}

function playMoveSound() {
  moveAudio.currentTime = 0;
  moveAudio.play();
}

function flipBoard() {
  if (boardAPI) boardAPI.toggleOrientation()
}

function toggleSound() {
  const wasDisabled = !appStore.soundEnabled;
  appStore.toggleSound();

  if (wasDisabled && appStore.soundEnabled) {
    playMoveSound();
  }
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}
</script>

<style scoped>
.chessboard-container {
  cursor: default;
}

.tabs-no-scroll {
  scroll-margin: 0;
}

.tabs-no-scroll :deep(.v-tab) {
  scroll-margin: 0;
}

.tabs-no-scroll :deep(.v-btn) {
  scroll-margin: 0;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.control-row-left {
  display: flex;
  align-items: center;
  flex: 1;
  padding-left: 16px;
}

.control-row-center {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.control-row-right {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  padding-right: 16px;
}

/* Mobile styles */
@media (max-width: 600px) {
  .control-row {
    gap: 8px;
    margin-top: 8px !important;
  }

  .control-row-left {
    padding-left: 8px;
  }

  .control-row-center {
    gap: 8px;
  }

  .control-row-right {
    gap: 8px;
    padding-right: 8px;
  }

  .control-row :deep(.v-btn) {
    min-width: 28px !important;
    width: 28px;
    height: 28px;
    padding: 0 4px;
  }

  .control-row :deep(.v-btn .v-icon) {
    font-size: 14px;
  }

  .policy-move-item {
    flex-wrap: wrap;
  }

  .move-wld {
    width: 100%;
    margin-left: 36px;
  }
}

.tab-content {
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 0 0 8px 8px;
  border: 1px solid #444;
  border-top: none;
  min-height: 400px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-label {
  color: #ccc;
  font-size: 14px;
  min-width: 200px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-label {
  color: #ccc;
  font-size: 16px;
  font-weight: 600;
}

.history-buttons {
  display: flex;
  gap: 8px;
}

.move-history-view {
  background-color: #222;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.no-moves {
  color: #999;
  text-align: center;
  padding: 20px;
}

.move-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.move-item {
  padding: 6px 12px;
  background-color: #333;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.move-item.clickable {
  cursor: pointer;
}

.move-item.clickable:hover {
  background-color: #444;
  border-color: #666;
}

.move-item.active {
  background-color: #2a4a2a;
  border-color: #4CAF50;
}

.move-number {
  color: #999;
  font-size: 13px;
}

.move-notation {
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  font-family: monospace;
}

.copy-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  background-color: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #66bb6a;
}

.copy-message .message-icon {
  flex-shrink: 0;
  font-size: 18px;
}

.copy-message.message-error {
  background-color: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #ef5350;
}

.saved-games-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.saved-game-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background-color: #333;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.saved-game-item:hover {
  background-color: #444;
  border-color: #666;
}

.saved-game-item.current-game {
  background-color: #2a4a2a;
  border-color: #4CAF50;
}

.saved-game-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.saved-game-number {
  color: #999;
  font-size: 14px;
  font-weight: 600;
  min-width: 30px;
}

.saved-game-color {
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  text-transform: capitalize;
}

.saved-game-over {
  color: #ffd700;
  font-size: 13px;
  font-weight: 600;
}

.saved-game-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.saved-game-date {
  color: #888;
  font-size: 12px;
  white-space: nowrap;
}

.games-info-message {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #2a2a2a;
  border-radius: 4px;
  border: 1px solid #444;
}

/* Analysis / Evaluation styles */
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

.analysis-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.continuation-line-inline {
  display: inline;
}

.continuation-move {
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
}

.continuation-separator {
  color: #999;
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

.move-wld {
  color: #ffd700;
  font-family: monospace;
  font-size: 13px;
  margin-left: auto;
  white-space: nowrap;
}

</style>
