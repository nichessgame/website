<template>
  <v-container max-width="1000px" class="pa-0">
    <div ref="chessboardContainer" class="chessboard-container">
      <TheChessboard
        @board-created="handleBoardCreated"
        :board-config="boardConfig"
        class="mt-10"
      />
    </div>

    <!-- Control Row -->
    <div class="control-row mt-2 mt-sm-4">
      <!-- Left: Analysis -->
      <div class="control-row-left">
        <template v-if="confirmingAnalysis">
          <v-btn
            @click="confirmOpenAnalysis"
            variant="flat"
          >
            <v-icon icon="$mdiCheckCircle" color="green" />
          </v-btn>
          <v-btn
            @click="confirmingAnalysis = false"
            variant="flat"
            class="ml-2"
          >
            <v-icon icon="$mdiClose" color="red" />
          </v-btn>
        </template>
        <v-btn
          v-else
          @click="confirmingAnalysis = true"
          variant="flat"
        >
          <v-icon icon="$mdiLaptop" />
        </v-btn>
      </div>

      <!-- Center: Control Buttons -->
      <div class="control-row-center">
        <v-btn
          @click="undoAll"
          :disabled="isPlaying"
          variant="outlined"
        >
          <v-icon
            icon="$mdiChevronDoubleLeft"
            class="ma-auto"
          />
        </v-btn>

        <v-btn
          @click="undoMove"
          :disabled="isPlaying"
          variant="outlined"
        >
          <v-icon
            icon="$mdiChevronLeft"
            class="ma-auto"
          />
        </v-btn>

        <v-btn
          @click="togglePlayPause"
          variant="outlined"
        >
          <v-icon
            :icon="isPlaying ? '$mdiPause' : '$mdiPlay'"
            class="ma-auto"
          />
        </v-btn>

        <v-btn
          @click="redoMove"
          :disabled="isPlaying"
          variant="outlined"
        >
          <v-icon
            icon="$mdiChevronRight"
            class="ma-auto"
          />
        </v-btn>

        <v-btn
          @click="redoAll"
          :disabled="isPlaying"
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
      <v-tab value="moves">Moves</v-tab>
      <v-tab value="games">Games</v-tab>
      <v-tab value="settings">Settings</v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <!-- Moves Tab -->
    <div v-show="activeTab === 'moves'" class="tab-content">
      <div class="move-history-section">
        <div class="history-header">
          <div class="history-label">History:</div>
          <div class="history-buttons" v-if="parsedMoves.length > 0">
            <v-btn
              v-if="viewMode"
              @click="copyMoveHistory"
              variant="outlined"
              size="small"
              prepend-icon="$mdiContentCopy"
            >
              Copy
            </v-btn>
            <v-btn
              @click="toggleViewMode"
              variant="outlined"
              size="small"
            >
              {{ viewMode ? 'Edit' : 'View' }}
            </v-btn>
          </div>
        </div>

        <!-- Input Mode -->
        <div v-if="!viewMode">
          <v-textarea
            v-model="moveHistoryText"
            placeholder="Enter move history, e.g.:
1.e2 -> e4
2.d7 -> d6
3.g1 -> f3
4.b7 -> b6"
            rows="8"
            variant="outlined"
            class="mt-2"
          ></v-textarea>
          <v-btn
            @click="loadMoveHistory"
            variant="outlined"
            prepend-icon="$mdiUpload"
            class="mt-2"
          >
            Load Moves
          </v-btn>

          <!-- Load Message Display -->
          <div v-if="loadMessage.text" :class="['load-message', 'mt-3', `message-${loadMessage.type}`]">
            <v-icon v-if="loadMessage.type === 'error'" icon="$mdiAlertCircle" class="message-icon" />
            <v-icon v-else-if="loadMessage.type === 'success'" icon="$mdiCheckCircle" class="message-icon" />
            <v-icon v-else icon="$mdiInformation" class="message-icon" />
            <span>{{ loadMessage.text }}</span>
          </div>
        </div>

        <!-- Viewing Mode -->
        <div v-else class="move-history-view mt-2">
          <!-- Copy Message Display -->
          <div v-if="copyMessage.show" :class="['copy-message', 'mb-3', `message-${copyMessage.type}`]">
            <v-icon v-if="copyMessage.type === 'error'" icon="$mdiAlertCircle" class="message-icon" />
            <v-icon v-else-if="copyMessage.type === 'success'" icon="$mdiCheckCircle" class="message-icon" />
            <span>{{ copyMessage.text }}</span>
          </div>

          <div v-if="parsedMoves.length === 0" class="no-moves">No moves loaded</div>
          <div v-else class="move-list">
            <div
              v-for="(move, index) in parsedMoves"
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
          :class="['saved-game-item', { 'current-game': game.gameId === loadedGameId }]"
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

    <!-- Settings Tab -->
    <div v-show="activeTab === 'settings'" class="tab-content">
      <div class="settings-section">
        <div class="config-row">
          <label class="config-label">Time between moves (ms):</label>
          <v-text-field
            v-model.number="moveDelay"
            type="number"
            :min="100"
            :max="5000"
            :step="100"
            variant="outlined"
            density="compact"
            style="max-width: 150px;"
          ></v-text-field>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Piece, PieceType } from 'nichess'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';
import { useAppStore, MAX_SAVED_GAMES } from '../stores/app';
import { AIDifficulty } from '../AI/common';
import MoveSound from '@/assets/Move.ogg';
import CaptureSound from '@/assets/Capture.ogg';

const appStore = useAppStore();
const router = useRouter();

const boardConfig = reactive({
  animation: {
    enabled: true,
    duration: 200
  },
  viewOnly: true,
});

let boardAPI = null;
const chessboardContainer = ref(null);
const moveHistoryText = ref('');
const parsedMoves = ref([]);
const currentMoveIndex = ref(0);
const isPlaying = ref(false);
const moveDelay = ref(1000);
const loadMessage = ref({ text: '', type: 'info' });
const viewMode = ref(false);
const copyMessage = ref({ text: '', type: 'info', show: false });
const activeTab = ref('history');
const savedGames = computed(() => appStore.savedGames)
const loadedGameId = ref(null)
const confirmingAnalysis = ref(false)

function onStorageChange(e) {
  if (e.key === 'nichess-saved-games') {
    appStore.refreshSavedGames()
    if (loadedGameId.value) {
      const game = appStore.savedGames.find(g => g.gameId === loadedGameId.value)
      if (game && game.moveHistory.length !== parsedMoves.value.length) {
        reloadCurrentGame(game)
      }
    }
  }
}

let playbackInterval = null;
let wheelThrottle = false;

const moveAudio = new Audio(MoveSound);
const captureAudio = new Audio(CaptureSound);

function handleBoardCreated(api) {
  boardAPI = api;
  currentMoveIndex.value = 0;
  parsedMoves.value = [];
}

function handleWheel(event) {
  // Always prevent page scroll first
  event.preventDefault();
  event.stopPropagation();

  if (isPlaying.value || wheelThrottle) return;

  // Throttle wheel events to prevent too rapid scrolling
  wheelThrottle = true;
  setTimeout(() => {
    wheelThrottle = false;
  }, 20);

  // deltaY > 0 means scrolling down (backward in history)
  // deltaY < 0 means scrolling up (forward in history)
  if (event.deltaY > 0) {
    undoMove();
  } else if (event.deltaY < 0) {
    redoMove();
  }
}

function handleKeyDown(event) {
  if (isPlaying.value) return;

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
  window.addEventListener('storage', onStorageChange);
});

onBeforeUnmount(() => {
  if (chessboardContainer.value) {
    chessboardContainer.value.removeEventListener('wheel', handleWheel);
  }

  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('storage', onStorageChange);
});

function undoMove() {
  if (boardAPI && currentMoveIndex.value > 0) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
  }
}

function redoWithSound() {
  const move = parsedMoves.value[currentMoveIndex.value];
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
  if (boardAPI && currentMoveIndex.value < parsedMoves.value.length) {
    redoWithSound();
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
}

function redoAll() {
  if (!boardAPI || currentMoveIndex.value >= parsedMoves.value.length) return;

  while (currentMoveIndex.value < parsedMoves.value.length - 1) {
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
  }
  redoWithSound();
}

function toggleViewMode() {
  viewMode.value = !viewMode.value;
  copyMessage.value.show = false;
}

async function copyMoveHistory() {
  if (parsedMoves.value.length === 0) return;

  // Format moves back to text
  const formattedText = parsedMoves.value
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

function jumpToMove(targetIndex) {
  if (!boardAPI || isPlaying.value) return;
  if (targetIndex === currentMoveIndex.value) return;

  // Undo or redo to one before the target
  while (currentMoveIndex.value > targetIndex - 1) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
  }
  while (currentMoveIndex.value < targetIndex - 1) {
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
  }
  // Final move with correct sound
  redoWithSound();
}

function togglePlayPause() {
  if (isPlaying.value) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  if (currentMoveIndex.value >= parsedMoves.value.length) {
    undoAll();
  }

  isPlaying.value = true;

  playbackInterval = setInterval(() => {
    if (currentMoveIndex.value < parsedMoves.value.length) {
      redoMove();
    } else {
      pausePlayback();
    }
  }, moveDelay.value);
}

function pausePlayback() {
  isPlaying.value = false;
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
}

function playCaptureSound() {
  captureAudio.currentTime = 0;
  captureAudio.play();
}

function playMoveSound() {
  moveAudio.currentTime = 0;
  moveAudio.play();
}

function confirmOpenAnalysis() {
  confirmingAnalysis.value = false
  appStore.setAnalysisData({ history: parsedMoves.value })
  router.push('/analysis')
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

function parseMoveHistory(historyText) {
  const lines = historyText.split('\n').filter(line => line.trim() !== '');
  const moves = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check if line starts with a move number
    const moveNumMatch = line.match(/^(\d+)\./);
    if (!moveNumMatch) {
      return { error: `Line ${lineNum}: Missing move number (expected format: "1. e2 -> e4")` };
    }

    // Expected move number should match line position
    const expectedMoveNum = i + 1;
    const actualMoveNum = parseInt(moveNumMatch[1]);
    if (actualMoveNum !== expectedMoveNum) {
      return { error: `Line ${lineNum}: Move number mismatch (expected ${expectedMoveNum}, got ${actualMoveNum})` };
    }

    // Remove move number and trim
    const cleanedLine = line.replace(/^\d+\./, '').trim();

    // Match pattern: "from -> to"
    const match = cleanedLine.match(/^([a-h][1-8])\s*->\s*([a-h][1-8])$/);

    if (!match) {
      return { error: `Line ${lineNum}: Invalid move format (expected "from -> to" with squares a1-h8)` };
    }

    moves.push({
      from: match[1],
      to: match[2],
      lineNum: lineNum
    });
  }

  return { moves };
}

function loadMoveHistory() {
  loadMessage.value = { text: '', type: 'info' };

  if (!boardAPI) {
    loadMessage.value = { text: 'Board not initialized yet', type: 'error' };
    return;
  }

  // Save current state in case we need to restore it
  const previousMoves = parsedMoves.value;
  const previousMoveIndex = currentMoveIndex.value;

  // Parse the move history
  const parseResult = parseMoveHistory(moveHistoryText.value);

  // Check for parsing errors
  if (parseResult.error) {
    loadMessage.value = { text: parseResult.error, type: 'error' };
    return;
  }

  const moves = parseResult.moves;

  if (moves.length === 0) {
    loadMessage.value = { text: 'No valid moves found in the history', type: 'error' };
    return;
  }

  boardAPI.resetBoard();
  let tempMoveIndex = 0;

  // Apply all moves to the board and check legality
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];

    if (!boardAPI.isMoveLegal(move)) {
      loadMessage.value = {
        text: `Illegal move at line ${move.lineNum}: ${move.from} -> ${move.to}`,
        type: 'error'
      };

      // Restore previous state
      boardAPI.resetBoard();
      if (previousMoves.length > 0) {
        for (let j = 0; j < previousMoveIndex; j++) {
          boardAPI.move(previousMoves[j]);
        }
      }
      return;
    }

    const isAttack = boardAPI.getPiece(move.to).type !== PieceType.NO_PIECE;
    move.attack = isAttack;

    boardAPI.move(move);
    tempMoveIndex++;
  }

  // Successfully loaded all moves - now update the state
  parsedMoves.value = moves;

  // Reset to start position so user can step through
  for (let i = 0; i < moves.length; i++) {
    boardAPI.undoLastMove();
  }
  currentMoveIndex.value = 0;

  loadMessage.value = {
    text: `Loaded ${moves.length} moves.`,
    type: 'success'
  };

  // Switch to view mode after loading
  viewMode.value = true;

  // Detach from any saved game so live updates don't overwrite edited history
  loadedGameId.value = null;
}

function loadSavedGame(game) {
  boardConfig.orientation = game.myColor === 'black' ? 'black' : 'white'
  moveHistoryText.value = game.moveHistory
    .map((m, i) => `${i + 1}.${m.from} -> ${m.to}`)
    .join('\n')
  loadMoveHistory()
  loadedGameId.value = game.gameId // set after loadMoveHistory which clears it

  // Play all moves
  while (currentMoveIndex.value < parsedMoves.value.length) {
    boardAPI.redoLastMove()
    currentMoveIndex.value++
  }
}

function reloadCurrentGame(game) {
  if (!boardAPI) return

  // Reset and replay all moves from scratch to handle any history divergence
  boardAPI.resetBoard()
  for (const move of game.moveHistory) {
    boardAPI.move({ from: move.from, to: move.to })
  }

  parsedMoves.value = game.moveHistory.map(m => ({
    from: m.from,
    to: m.to,
    attack: m.attack
  }))
  currentMoveIndex.value = parsedMoves.value.length
}

function getDifficultyLabel(difficulty) {
  return AIDifficulty.getConfig(Number(difficulty)).label
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

.move-history-section {
  /* Styling provided by parent .tab-content */
}

.settings-section {
  /* Styling provided by parent .tab-content */
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

.status-display {
  background-color: #2a2a2a;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #555;
}

.status-info {
  color: #ffd700;
  font-family: monospace;
  font-size: 14px;
  text-align: center;
}

.load-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.load-message .message-icon {
  flex-shrink: 0;
}

.message-error {
  background-color: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #ef5350;
}

.message-success {
  background-color: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #66bb6a;
}

.message-info {
  background-color: rgba(33, 150, 243, 0.15);
  border: 1px solid rgba(33, 150, 243, 0.3);
  color: #42a5f5;
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

.saved-game-detail {
  color: #aaa;
  font-size: 13px;
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
</style>
