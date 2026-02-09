<template>
  <v-container max-width="1000px" class="pa-0">
    <NewGameDialog v-model="showNewGameDialog" />
    <TheChessboard
      @board-created="handleBoardCreated"
      @move="handleMove"
      @checkmate="handleCheckmate"
      @draw="handleDraw"
      :player-color="props.myColor"
      :board-config="boardConfig"
      :key="props.gameId"
      class="mt-10"
    />

    <div v-if="modelLoading" class="model-status mt-4">
      <v-progress-linear indeterminate color="grey" class="mb-2"></v-progress-linear>
      <div>Downloading AI model... This may take a while.</div>
    </div>

    <!-- Combined Control Row -->
    <div class="control-row mt-2 mt-sm-4">
      <!-- Left: Number of nodes or Analysis button -->
      <div class="control-row-left">
        <template v-if="gameOver">
          <template v-if="confirmingAnalysis">
            <v-btn
              @click="confirmOpenAnalysis"
              variant="outlined"
              class="gold"
            >
              <v-icon icon="$mdiCheckCircle" color="green" />
            </v-btn>
            <v-btn
              @click="confirmingAnalysis = false"
              variant="outlined"
              class="ml-2 gold"
            >
              <v-icon icon="$mdiClose" color="red" />
            </v-btn>
          </template>
          <v-btn
            v-else
            @click="confirmingAnalysis = true"
            variant="outlined"
            class="gold"
          >
            <v-icon icon="$mdiLaptop" />
          </v-btn>
        </template>
        <div v-else class="nodes-count">
          {{ numNodesExplored }}
        </div>
      </div>

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

      <!-- Right: New Game, Board Flip and Sound -->
      <div class="control-row-right">
        <v-btn
          @click="showNewGameDialog = true"
          :variant="gameOver ? 'outlined' : 'flat'"
          :class="{ 'gold': gameOver }"
        >
          <v-icon icon="$mdiSwordCross" />
        </v-btn>

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
    </v-tabs>

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
          :class="['saved-game-item', { 'current-game': game.gameId === props.gameId }]"
          @click="loadSavedGame(game)"
        >
          <div class="saved-game-info">
            <span class="saved-game-number">{{ index + 1 }}.</span>
            <span class="saved-game-color">{{ game.myColor === 'white' ? 'W' : 'B' }} {{ game.gameId }}</span>
            <span v-if="game.gameOver" class="saved-game-over">ended</span>
          </div>
          <div class="saved-game-actions">
            <span class="saved-game-date">{{ formatDate(game.savedAt) }}</span>
            <template v-if="confirmingDeleteId === game.gameId">
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click.stop="deleteSavedGame(game)"
              >
                <v-icon icon="$mdiCheckCircle" size="small" color="green" />
              </v-btn>
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click.stop="confirmingDeleteId = null"
              >
                <v-icon icon="$mdiClose" size="small" color="red" />
              </v-btn>
            </template>
            <v-btn
              v-else
              icon
              size="x-small"
              variant="text"
              @click.stop="confirmingDeleteId = game.gameId"
            >
              <v-icon icon="$mdiDelete" size="small" />
            </v-btn>
          </div>
        </div>
      </div>
    </div>

  </v-container>
</template>

<script setup>
const boardConfig = {
  animation: {
    enabled: true,
    duration: 200
  }
};

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';
import NewGameDialog from '@/components/NewGameDialog.vue'
import { useAppStore, loadGame, MAX_SAVED_GAMES } from '../stores/app';
import { PieceType } from 'nichess';
import MoveSound from '@/assets/Move.ogg';
import CaptureSound from '@/assets/Capture.ogg';
import { AIDifficulty } from '../AI/common';

const appStore = useAppStore();
const router = useRouter();
const boardWorker = appStore.initBoardWorker();
const moveHistory = ref([]);
const aiHistory = [];
const showNewGameDialog = ref(false)
const numNodesExplored = ref(0)
const gameOver = ref(false)
const modelLoading = ref(false)
const currentMoveIndex = ref(0)
const copyMessage = ref({ text: '', type: 'info', show: false })
const activeTab = ref('history')
const savedGames = computed(() => appStore.savedGames)
const confirmingDeleteId = ref(null)
const confirmingAnalysis = ref(false)

function onStorageChange(e) {
  if (e.key === 'nichess-saved-games') {
    appStore.refreshSavedGames()
    // If the current game was deleted from another tab, start a new default game
    if (props.gameId && moveHistory.value.length > 0 && !appStore.savedGames.find(g => g.gameId === props.gameId)) {
      startNewDefaultGame()
    }
  }
}

onMounted(() => {
  window.addEventListener('storage', onStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorageChange)
})

let isRestoring = false

function saveGameToStorage() {
  if (isRestoring || !props.gameId) return
  appStore.saveGame({
    gameId: props.gameId,
    myColor: props.myColor,
    difficulty: props.difficulty,
    moveHistory: moveHistory.value.map(m => ({ from: m.from, to: m.to, attack: m.attack })),
    gameOver: gameOver.value
  })
}

const difficultyConfig = computed(() => {
  return AIDifficulty.getConfig(Number(props.difficulty));
});

// AI request tracking to handle stale responses
let aiRequestCounter = 0
const currentAIRequestId = ref(null)
const aiComputingFromIndex = ref(null)

const moveAudio = new Audio(MoveSound);
const captureAudio = new Audio(CaptureSound);

const chessSquares = [
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'
];

boardWorker.onmessage = (event) => {
  console.log(event.data)
  const { type } = event.data;
  if (type === 'model-status') {
    if (event.data.status === 'starting') {
      modelLoading.value = true;
      appStore.setModelLoading(true);
    } else if (event.data.status === 'ready') {
      modelLoading.value = false;
      appStore.setModelLoading(false);
      appStore.setModelReady(true);
    } else if (event.data.status === 'error') {
      modelLoading.value = false;
      appStore.setModelLoading(false);
      console.error('Model load error:', event.data.message);
    }
    return;
  }

  const { gameId, move, debug, requestId } = event.data;
  if (gameId !== props.gameId || gameId === "") return;

  // Ignore stale AI responses
  if (requestId !== currentAIRequestId.value) {
    console.log(`Ignoring stale AI response. Expected: ${currentAIRequestId.value}, got: ${requestId}`);
    return;
  }

  numNodesExplored.value = debug;
  const [srcIdx, dstIdx] = move.split('.').map(Number);
  // TODO: this doesn't work for the SKIP action which is -1.-1
  // SKIP is not a legal action anymore.
  var action = {from: chessSquares[srcIdx], to: chessSquares[dstIdx], promotion: undefined};
  console.log(action)

  // If user is viewing history, jump to the end before applying AI move
  if (currentMoveIndex.value < moveHistory.value.length) {
    console.log(`User is viewing history (at move ${currentMoveIndex.value}). Jumping to end before applying AI move.`);
    // Jump to the end of history
    while (currentMoveIndex.value < moveHistory.value.length) {
      const move = moveHistory.value[currentMoveIndex.value];
      boardAPI.redoLastMove();
      currentMoveIndex.value++;
      aiHistory.push([chessSquares.indexOf(move.from), chessSquares.indexOf(move.to)]);
    }
  }

  // Now apply the AI move (it will trigger handleMove which adds it to history)
  boardAPI.move(action);
}

let boardAPI;

function handleBoardCreated(api) {
  boardAPI = api;
  moveHistory.value = [];
  aiHistory.splice(0, aiHistory.length);
  currentMoveIndex.value = 0;
  console.log('aih')
  console.log(aiHistory);
  gameOver.value = false;
  numNodesExplored.value = 0;

  // Reset AI request tracking for new game
  aiRequestCounter = 0;
  currentAIRequestId.value = null;
  aiComputingFromIndex.value = null;

  // Try to restore a saved game
  const savedGame = loadGame(props.gameId);
  if (savedGame && savedGame.moveHistory && savedGame.moveHistory.length > 0) {
    isRestoring = true;

    if (props.myColor === 'black') {
      boardAPI.toggleOrientation();
    }

    // Replay all saved moves
    for (const move of savedGame.moveHistory) {
      boardAPI.move({ from: move.from, to: move.to, promotion: undefined });
    }

    gameOver.value = savedGame.gameOver || boardAPI.getIsGameOver();
    isRestoring = false;

    // If it's AI's turn and game isn't over, request AI move
    if (!gameOver.value && boardAPI.getTurnColor() !== props.myColor) {
      aiRequestCounter++;
      currentAIRequestId.value = aiRequestCounter;
      aiComputingFromIndex.value = currentMoveIndex.value;

      boardWorker.postMessage({
        gameId: props.gameId,
        difficulty: difficultyConfig.value,
        history: aiHistory,
        requestId: currentAIRequestId.value
      });
    }
  } else {
    // New game
    if(props.myColor === 'black') {
      boardAPI.toggleOrientation();

      // Assign request ID for AI's first move
      aiRequestCounter++;
      currentAIRequestId.value = aiRequestCounter;
      aiComputingFromIndex.value = 0;

      console.log(`Sending AI request with ID: ${currentAIRequestId.value} (first move)`);

      let boardStr = boardAPI.getFen();
      boardWorker.postMessage({
        gameId: props.gameId,
        board: boardStr,
        difficulty: difficultyConfig.value,
        history: aiHistory,
        requestId: currentAIRequestId.value
      });
    }
  }
}

async function handleMove(move) {
  console.log(move);
  console.log(boardAPI.getTurnColor());

  // If we're not at the end of history, truncate the history
  if (currentMoveIndex.value < moveHistory.value.length) {
    moveHistory.value = moveHistory.value.slice(0, currentMoveIndex.value);
    aiHistory.splice(currentMoveIndex.value);
  }

  moveHistory.value.push({from: move.from, to: move.to, attack: move.attack});
  aiHistory.push([chessSquares.indexOf(move.from), chessSquares.indexOf(move.to)]);
  currentMoveIndex.value = moveHistory.value.length;

  gameOver.value = boardAPI.getIsGameOver();

  if (isRestoring) return;

  if (appStore.soundEnabled) {
    if (move.attack) {
      playCaptureSound();
    } else {
      playMoveSound();
    }
  }

  saveGameToStorage();

  if(
    (boardAPI.getTurnColor() != props.myColor) &&
    (!boardAPI.getIsGameOver())
  ) {
    aiRequestCounter++;
    currentAIRequestId.value = aiRequestCounter;
    aiComputingFromIndex.value = currentMoveIndex.value;

    console.log(`Sending AI request with ID: ${currentAIRequestId.value}`);

    let boardStr = boardAPI.getFen();
    boardWorker.postMessage({
      gameId: props.gameId,
      difficulty: difficultyConfig.value,
      history: aiHistory,
      requestId: currentAIRequestId.value
    });
  }
}

function handleCheckmate(isMated) {
  gameOver.value = true;
  saveGameToStorage();
  console.log(isMated);
}

function handleDraw() {
  gameOver.value = true;
  saveGameToStorage();
  console.log('draw');
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

function confirmOpenAnalysis() {
  appStore.setAnalysisData({ history: moveHistory.value })
  router.push('/analysis')
}

function undoMove() {
  if (boardAPI && currentMoveIndex.value > 0) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
    aiHistory.pop();
  }
}

function redoWithSound() {
  const move = moveHistory.value[currentMoveIndex.value];
  boardAPI.redoLastMove();
  currentMoveIndex.value++;
  aiHistory.push([chessSquares.indexOf(move.from), chessSquares.indexOf(move.to)]);
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
  }
}

function undoAll() {
  if (!boardAPI) return;

  while (currentMoveIndex.value > 0) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
    aiHistory.pop();
  }

  if (appStore.soundEnabled) {
    playMoveSound();
  }
}

function redoAll() {
  if (!boardAPI || currentMoveIndex.value >= moveHistory.value.length) return;

  while (currentMoveIndex.value < moveHistory.value.length - 1) {
    const move = moveHistory.value[currentMoveIndex.value];
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
    aiHistory.push([chessSquares.indexOf(move.from), chessSquares.indexOf(move.to)]);
  }
  redoWithSound();
}

function jumpToMove(targetIndex) {
  if (!boardAPI) return;
  if (targetIndex === currentMoveIndex.value) return;

  // Undo or redo to one before the target
  while (currentMoveIndex.value > targetIndex - 1) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
    aiHistory.pop();
  }
  while (currentMoveIndex.value < targetIndex - 1) {
    const move = moveHistory.value[currentMoveIndex.value];
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
    aiHistory.push([chessSquares.indexOf(move.from), chessSquares.indexOf(move.to)]);
  }
  // Final move with correct sound
  redoWithSound();
}

async function copyMoveHistory() {
  if (moveHistory.value.length === 0) return;

  // Format moves back to text
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
  if (game.gameId === props.gameId) return
  router.push({
    name: 'game',
    params: {
      myColor: game.myColor,
      difficulty: game.difficulty,
      gameId: game.gameId
    }
  })
}

function deleteSavedGame(game) {
  confirmingDeleteId.value = null
  appStore.deleteGame(game.gameId)
  if (game.gameId === props.gameId) {
    startNewDefaultGame()
  }
}

function startNewDefaultGame() {
  router.push({
    name: 'game',
    params: {
      myColor: 'white',
      difficulty: '3',
      gameId: Date.now().toString()
    }
  })
}

function getDifficultyLabel(difficulty) {
  return AIDifficulty.getConfig(Number(difficulty)).label
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

const props = defineProps({
  myColor: {
    type: String,
    default: 'white'
  },
  difficulty: {
    type: String,
    default: "3"
  },
  gameId: {
    type: String,
    default: ""
  }
})

</script>

<style scoped>
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

.nodes-count {
  font-size: 18px;
  font-weight: 600;
  color: #ccc;
  min-width: 60px;
  text-align: left;
}

/* Mobile styles */
@media (max-width: 600px) {
  .control-row {
    gap: 8px;
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

  .nodes-count {
    font-size: 14px;
    min-width: 40px;
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

.tabs-no-scroll {
  scroll-margin: 0;
}

.tabs-no-scroll :deep(.v-tab) {
  scroll-margin: 0;
}

.tabs-no-scroll :deep(.v-btn) {
  scroll-margin: 0;
}

.tab-content {
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 0 0 8px 8px;
  border: 1px solid #444;
  border-top: none;
  min-height: 400px;
}

.move-history-section {
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

.gold {
  color: #ffd700;
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
  cursor: default;
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
