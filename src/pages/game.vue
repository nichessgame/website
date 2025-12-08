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

    <div v-if="gameOver" class="mt-2">
      <v-btn variant="outlined" class="gold" prepend-icon="$mdiSwordCross" @click="showNewGameDialog = true">New Game</v-btn>
    </div>
    <div v-else class="mt-2">
          <v-btn prepend-icon="$mdiSwordCross" @click="showNewGameDialog = true">New Game</v-btn>
    </div>
    <div v-if="modelLoading" class="model-status mt-4">
      <v-progress-linear indeterminate color="grey" class="mb-2"></v-progress-linear>
      <div>Downloading AI model... This may take a while.</div>
    </div>
    <div class="mt-2">
      Number of nodes explored by the AI: {{ numNodesExplored }}
    </div>
    <div class="move-history">
      <div v-if="moveHistory.length === 0">No moves yet</div>
      <div v-else>
        <div class="move-list">
          <div v-for="(move, index) in moveHistory" :key="index" class="move-item">
            <span class="move-number">{{ Math.floor(index/2) + 1 }}{{ index % 2 === 0 ? '.' : '...' }}</span>
            <span class="move-notation">{{ move.from }} -> {{ move.to }}</span>
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

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';
import NewGameDialog from '@/components/NewGameDialog.vue'
import { useAppStore } from '../stores/app';

const appStore = useAppStore();
const boardWorker = appStore.initBoardWorker();
const moveHistory = ref([]);
const aiHistory = [];
const showNewGameDialog = ref(false)
const numNodesExplored = ref(0)
const gameOver = ref(false)
const modelLoading = ref(false)

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
    } else if (event.data.status === 'ready') {
      modelLoading.value = false;
    } else if (event.data.status === 'error') {
      modelLoading.value = false;
      console.error('Model load error:', event.data.message);
    }
    return;
  }

  const { id, move, debug } = event.data;
  if (id !== props.gameId || id === "") return;
  
  numNodesExplored.value = debug;
  const [srcIdx, dstIdx] = move.split('.').map(Number);
  // TODO: this doesn't work for the SKIP action which is -1.-1
  // SKIP is not a legal action anymore.
  var action = {from: chessSquares[srcIdx], to: chessSquares[dstIdx], promotion: undefined};
  console.log(action)
  boardAPI.move(action);
}

let boardAPI;

function handleBoardCreated(api) {
  boardAPI = api;
  moveHistory.value = [];
  aiHistory.splice(0, aiHistory.length);
  console.log('aih')
  console.log(aiHistory);
  gameOver.value = false;
  numNodesExplored.value = 0;
  if(props.myColor === 'black') {
    boardAPI.toggleOrientation();
    let boardStr = boardAPI.getFen();
    boardWorker.postMessage({
      id: props.gameId,
      board: boardStr,
      difficulty: Number(props.difficulty),
      history: aiHistory
    });
  }
}

async function handleMove(move) {
  console.log(move);
  console.log(boardAPI.getTurnColor());
  moveHistory.value.push({from: move.from, to: move.to});
  aiHistory.push([chessSquares.indexOf(move.from), chessSquares.indexOf(move.to)]);
  console.log(aiHistory)
  if(
    (boardAPI.getTurnColor() != props.myColor) &&
    (!boardAPI.getIsGameOver())
  ) {
    let boardStr = boardAPI.getFen();
    boardWorker.postMessage({id: props.gameId, difficulty: Number(props.difficulty),
      history: aiHistory});
  }
}

function handleCheckmate(isMated) {
  gameOver.value = true;
  console.log(isMated);
}

function handleDraw() {
  gameOver.value = true;
  console.log('draw');
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
.move-history {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #444;
  padding: 8px;
  background-color: #222;
}

.move-list {
  display: flex;
  flex-wrap: wrap;
}

.move-item {
  margin: 4px 8px;
  padding: 2px 6px;
  background-color: #333;
  border-radius: 4px;
  display: inline-block;
}

.move-number {
  color: #999;
  margin-right: 4px;
}

.move-notation {
  color: #fff;
  font-weight: bold;
}

.gold {
  color: #ffd700; /* gold */
}

</style>
