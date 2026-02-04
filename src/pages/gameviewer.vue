<template>
  <v-container max-width="1000px" class="pa-0">
    <div ref="chessboardContainer" class="chessboard-container">
      <TheChessboard
        @board-created="handleBoardCreated"
        :board-config="boardConfig"
        class="mt-10"
      />
    </div>

    <!-- Control Buttons -->
    <div class="control-buttons mt-4">
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

    <!-- Playback Configuration -->
    <div class="playback-config mt-4">
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

      <div class="config-row">
        <v-checkbox
          v-model="soundEnabled"
          label="Enable sound"
          density="compact"
          hide-details
        ></v-checkbox>
      </div>
    </div>

    <!-- Move History Section -->
    <div class="move-history-section mt-4">
      <div class="history-header">
        <div class="history-label">Move History:</div>
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

    <!-- Status Display -->
    <div class="status-display mt-4" v-if="parsedMoves.length > 0">
      <div class="status-info">
        Total moves: {{ parsedMoves.length }} | Current position: {{ currentMoveIndex }}
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';

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
const soundEnabled = ref(false);
const loadMessage = ref({ text: '', type: 'info' });
const viewMode = ref(false);
const copyMessage = ref({ text: '', type: 'info', show: false });
let playbackInterval = null;
let wheelThrottle = false;

function handleBoardCreated(api) {
  boardAPI = api;
  currentMoveIndex.value = 0;
  parsedMoves.value = [];
}

function handleWheel(event) {
  // Always prevent page scroll first
  event.preventDefault();
  event.stopPropagation();

  // Don't process moves during playback or if throttled
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
  // Don't process during playback
  if (isPlaying.value) return;

  // Check for arrow keys
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
    // Add wheel event listener with passive: false to allow preventDefault
    chessboardContainer.value.addEventListener('wheel', handleWheel, { passive: false });
  }

  // Add keyboard event listener for arrow keys
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  if (chessboardContainer.value) {
    chessboardContainer.value.removeEventListener('wheel', handleWheel);
  }

  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeyDown);
});

function undoMove() {
  if (boardAPI && currentMoveIndex.value > 0) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
    if (soundEnabled.value) {
      playMoveSound();
    }
  }
}

function redoMove() {
  if (boardAPI && currentMoveIndex.value < parsedMoves.value.length) {
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
    if (soundEnabled.value) {
      playMoveSound();
    }
  }
}

function undoAll() {
  if (!boardAPI) return;

  while (currentMoveIndex.value > 0) {
    boardAPI.undoLastMove();
    currentMoveIndex.value--;
  }

  if (soundEnabled.value) {
    playMoveSound();
  }
}

function redoAll() {
  if (!boardAPI) return;

  while (currentMoveIndex.value < parsedMoves.value.length) {
    boardAPI.redoLastMove();
    currentMoveIndex.value++;
  }

  if (soundEnabled.value) {
    playMoveSound();
  }
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

    // Hide message after 3 seconds
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

  const currentIndex = currentMoveIndex.value;

  // Navigate to the target position
  if (targetIndex < currentIndex) {
    // Undo moves to reach target
    while (currentMoveIndex.value > targetIndex) {
      boardAPI.undoLastMove();
      currentMoveIndex.value--;
    }
  } else if (targetIndex > currentIndex) {
    // Redo moves to reach target
    while (currentMoveIndex.value < targetIndex) {
      boardAPI.redoLastMove();
      currentMoveIndex.value++;
    }
  }

  // Play sound for the action
  if (soundEnabled.value && currentIndex !== targetIndex) {
    playMoveSound();
  }
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
    currentMoveIndex.value = 0;
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

function playMoveSound() {
  // Simple audio feedback using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
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

  // Reset the board to starting position
  boardAPI.resetBoard();
  let tempMoveIndex = 0;

  // Apply all moves to the board and check legality
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];

    // Check if the move is legal
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
}
</script>

<style scoped>
.chessboard-container {
  cursor: default;
}

.control-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.playback-config {
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #444;
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
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #444;
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
</style>
