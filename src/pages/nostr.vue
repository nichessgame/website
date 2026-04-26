<template>
  <v-container max-width="clamp(864px, 80vh, 1920px)" class="pa-0">
    <TheChessboard
      @board-created="handleBoardCreated"
      @move="handleMove"
      @checkmate="handleCheckmate"
      @draw="handleDraw"
      player-color="both"
      :board-config="boardConfig"
      :key="currentGameId"
      class="mt-10"
    />

    <!-- Control Row -->
    <div class="control-row mt-2 mt-sm-4">
      <div class="control-row-left">
        <span class="relay-status" :class="{ connected: connectedRelays > 0 }">
          relays {{ connectedRelays }}/{{ totalRelays }}
        </span>
      </div>

      <div class="control-row-center">
        <v-btn @click="undoAll" :disabled="currentMoveIndex === 0" variant="outlined">
          <v-icon icon="$mdiChevronDoubleLeft" />
        </v-btn>
        <v-btn @click="undoMove" :disabled="currentMoveIndex === 0" variant="outlined">
          <v-icon icon="$mdiChevronLeft" />
        </v-btn>
        <v-btn @click="redoMove" :disabled="currentMoveIndex >= moveHistory.length" variant="outlined">
          <v-icon icon="$mdiChevronRight" />
        </v-btn>
        <v-btn @click="redoAll" :disabled="currentMoveIndex >= moveHistory.length" variant="outlined">
          <v-icon icon="$mdiChevronDoubleRight" />
        </v-btn>
      </div>

      <div class="control-row-right">
        <v-btn @click="flipBoard" variant="flat">
          <v-icon icon="$mdiRotate3dVariant" />
        </v-btn>
        <v-btn @click="toggleSound" variant="flat">
          <v-icon :icon="appStore.soundEnabled ? '$mdiVolumeHigh' : '$mdiVolumeOff'" />
        </v-btn>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <v-tabs v-model="activeTab" class="mt-4 tabs-no-scroll" bg-color="#1a1a1a">
      <v-tab value="moves">Moves</v-tab>
      <v-tab value="nostr">Nostr</v-tab>
    </v-tabs>

    <!-- Moves Tab -->
    <div v-show="activeTab === 'moves'" class="tab-content">
      <!-- Game ID share row -->
      <div class="share-row mb-3">
        <span class="share-id-label">Game ID:</span>
        <span class="share-id">{{ currentGameId }}</span>
        <v-btn @click="copyGameId" variant="outlined" size="small" prepend-icon="$mdiContentCopy">
          Copy
        </v-btn>
      </div>
      <div v-if="copyMessage.show" :class="['copy-message', 'mb-3', `message-${copyMessage.type}`]">
        <span>{{ copyMessage.text }}</span>
      </div>

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
          <div v-if="moveHistory.length === 0" class="no-moves">No moves yet</div>
          <div v-else class="move-list">
            <div
              v-for="(move, index) in moveHistory"
              :key="index"
              :class="['move-item', { active: index === currentMoveIndex - 1, clickable: true }]"
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
    <div v-show="activeTab === 'nostr'" class="tab-content">
      <!-- Join / Create -->
      <div class="join-section mb-3">
        <div class="join-row">
          <v-text-field
            v-model="joinGameId"
            label="Game ID"
            variant="outlined"
            density="compact"
            hide-details
            class="join-input"
          ></v-text-field>
          <v-btn
            @click="joinGame"
            :disabled="!joinGameId.trim()"
            variant="outlined"
            size="small"
          >
            Join
          </v-btn>
          <v-btn
            @click="createNewGame"
            variant="outlined"
            size="small"
          >
            New
          </v-btn>
        </div>
      </div>

      <div class="games-info-message">Your last {{ MAX_SAVED_NOSTR_GAMES }} games will be saved here.</div>
      <div v-if="savedNostrGames.length === 0" class="no-moves">No saved games</div>
      <div v-else class="saved-games-list">
        <div
          v-for="(game, index) in savedNostrGames"
          :key="game.gameId"
          :class="['saved-game-item', { 'current-game': game.gameId === currentGameId }]"
          @click="switchToGame(game.gameId)"
        >
          <div class="saved-game-info">
            <span class="saved-game-number">{{ index + 1 }}.</span>
            <span class="saved-game-color">{{ game.gameId }}</span>
            <span class="saved-game-moves">{{ game.moveCount || 0 }} moves</span>
            <span v-if="game.gameOver" class="saved-game-over">ended</span>
          </div>
          <div class="saved-game-actions">
            <span class="saved-game-date">{{ formatDate(game.savedAt) }}</span>
            <template v-if="confirmingDeleteId === game.gameId">
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click.stop="deleteSavedGame(game.gameId)"
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
import { useHead } from '@unhead/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TheChessboard } from 'vue3-nichessboard'
import 'vue3-nichessboard/style.css'
import { useAppStore, MAX_SAVED_NOSTR_GAMES } from '../stores/app'
import MoveSound from '@/assets/Move.ogg'
import CaptureSound from '@/assets/Capture.ogg'
import { Buffer } from 'buffer'
import * as secp256k1 from '@noble/secp256k1'
import { HDKey } from '@scure/bip32'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

useHead({
  title: 'Nostr',
  meta: [
    { name: 'description', content: 'Play Nichess peer-to-peer over the Nostr protocol.' },
    { property: 'og:title', content: 'Nostr' },
    { property: 'og:url', content: 'https://www.nichess.org/nostr' },
  ],
})

const boardConfig = {
  animation: { enabled: true, duration: 200 },
}

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

// State
const currentGameId = ref('')
const moveHistory = ref([])
const currentMoveIndex = ref(0)
const connectedRelays = ref(0)
const totalRelays = ref(0)
const copyMessage = ref({ text: '', type: 'info', show: false })
const activeTab = ref('moves')
const joinGameId = ref('')
const confirmingDeleteId = ref(null)
const gameOver = ref(false)
const savedNostrGames = computed(() => appStore.savedNostrGames)

// Nostr config
const relays = ['wss://nos.lol']
let websockets = []
let privKey = null
let pubKey = null
let boardAPI = null
let restoringMoves = true
let isNavigatingHistory = false
let previousEvents = []
let processedEventIds = {}
let moveSeq = 0

function generateGameId() {
  return Math.random().toString(36).substring(2, 10)
}

// Derive Nostr keys from the game URL
function deriveKeys(gameId) {
  const seedStr = window.location.origin + '/nostr?game=' + gameId
  const seed = Buffer.from(seedStr)
  const paddedSeed = Buffer.alloc(Math.max(seed.length, 32))
  seed.copy(paddedSeed)
  const node = HDKey.fromMasterSeed(paddedSeed)
  const child = node.derive("m/44'/1237'/0'/0/0")
  const privBytes = child.privateKey
  const pubBytes = secp256k1.getPublicKey(privBytes, true)
  const priv = bytesToHex(privBytes)
  const pub = bytesToHex(pubBytes).substring(2)
  return [priv, pub]
}

// Create and sign a Nostr event
async function createSignedEvent(content) {
  const created_at = Math.floor(Date.now() / 1000)
  const kind = 30
  const tags = []
  const event = [0, pubKey, created_at, kind, tags, content]
  const message = JSON.stringify(event)
  const hashBytes = sha256(new TextEncoder().encode(message))
  const hashHex = bytesToHex(hashBytes)
  const sigBytes = await secp256k1.schnorr.signAsync(hashBytes, hexToBytes(privKey))
  const sigHex = bytesToHex(sigBytes)
  const isValid = await secp256k1.schnorr.verifyAsync(sigBytes, hashBytes, hexToBytes(pubKey))
  if (!isValid) return null
  return {
    id: hashHex,
    pubkey: pubKey,
    created_at,
    kind,
    tags,
    content,
    sig: sigHex,
  }
}

// Send game state over Nostr
async function sendGame({ move, fen }) {
  const seq = moveSeq++
  const content = JSON.stringify({ move, fen, seq })
  const event = await createSignedEvent(content)
  if (!event) return
  processedEventIds[event.id] = true
  for (const ws of websockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(['EVENT', event]))
    }
  }
}

// Open WebSocket connections to relays
function openWebsockets() {
  totalRelays.value = relays.length
  for (const relay of relays) {
    const ws = new WebSocket(relay)
    websockets.push(ws)

    ws.onerror = () => {
      websockets = websockets.filter(w => w !== ws)
      connectedRelays.value = websockets.filter(w => w.readyState === WebSocket.OPEN).length
    }

    ws.onopen = () => {
      connectedRelays.value = websockets.filter(w => w.readyState === WebSocket.OPEN).length
      const filter = { authors: [pubKey] }
      ws.send(JSON.stringify(['REQ', 'my-sub', filter]))
      const keepAlive = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: ['ping'] }))
        } else {
          clearInterval(keepAlive)
        }
      }, 10000)
    }

    ws.onmessage = async (event) => {
      const [msgType, subscriptionId, data] = JSON.parse(event.data)

      if (msgType === 'EOSE' && restoringMoves) {
        setTimeout(async () => {
          const pubKeyBytes = hexToBytes(pubKey)

          const verified = []
          for (const eventData of previousEvents) {
            const { content, id, sig, created_at } = eventData
            if (processedEventIds[id]) continue
            if (await secp256k1.schnorr.verifyAsync(hexToBytes(sig), hexToBytes(id), pubKeyBytes)) {
              const parsed = JSON.parse(content)
              verified.push({ content: parsed, id, created_at, seq: parsed.seq ?? 0 })
            }
          }

          verified.sort((a, b) => a.created_at - b.created_at || a.seq - b.seq)

          let startFrom = 0
          for (let i = verified.length - 1; i >= 0; i--) {
            if (verified[i].content.fen === 'start') {
              startFrom = i + 1
              break
            }
          }

          for (let i = 0; i < startFrom; i++) {
            processedEventIds[verified[i].id] = true
          }

          for (let i = startFrom; i < verified.length; i++) {
            applyNostrMove(verified[i].content)
            processedEventIds[verified[i].id] = true
          }

          moveSeq = verified.length > 0 ? (verified[verified.length - 1].seq + 1) : 0
          restoringMoves = false
          saveGameToStorage()
        }, 500)
      }

      if (msgType === 'EVENT' && subscriptionId === 'my-sub') {
        const { content, id, sig } = data
        if (processedEventIds[id]) return
        if (restoringMoves) {
          previousEvents.push(data)
        } else if (await secp256k1.schnorr.verifyAsync(hexToBytes(sig), hexToBytes(id), hexToBytes(pubKey))) {
          applyNostrMove(JSON.parse(content))
          processedEventIds[id] = true
          saveGameToStorage()
        }
      }
    }

    ws.onclose = () => {
      connectedRelays.value = websockets.filter(w => w.readyState === WebSocket.OPEN).length
    }
  }
}

function closeWebsockets() {
  for (const ws of websockets) {
    ws.close()
  }
  websockets = []
}

// Apply a move received from Nostr
function applyNostrMove({ move, fen }) {
  if (!boardAPI) return

  if (fen === 'start') {
    boardAPI.resetBoard()
    moveHistory.value = []
    currentMoveIndex.value = 0
  } else if (move) {
    isNavigatingHistory = true
    boardAPI.move({ from: move.from, to: move.to, promotion: undefined })
    isNavigatingHistory = false
    const isAttack = move.attack || false
    moveHistory.value.push({ from: move.from, to: move.to, attack: isAttack })
    currentMoveIndex.value = moveHistory.value.length
    gameOver.value = boardAPI.getIsGameOver()
    if (!restoringMoves && appStore.soundEnabled) {
      new Audio(isAttack ? CaptureSound : MoveSound).play().catch(() => {})
    }
  } else {
    boardAPI.setPosition(fen)
  }
}

// Persistence
function saveGameToStorage() {
  if (!currentGameId.value) return
  appStore.saveNostrGame({
    gameId: currentGameId.value,
    moveCount: moveHistory.value.length,
    moveHistory: moveHistory.value.map(m => ({ from: m.from, to: m.to, attack: m.attack })),
    gameOver: gameOver.value,
  })
}

const isViewingHistory = computed(() => currentMoveIndex.value < moveHistory.value.length)

function updateMovable() {
  if (!boardAPI) return
  if (isViewingHistory.value) {
    boardAPI.forbidMoves()
  } else {
    boardAPI.allowMoves()
  }
}

function handleBoardCreated(api) {
  boardAPI = api
  moveHistory.value = []
  currentMoveIndex.value = 0
  gameOver.value = false
}

async function handleMove(move) {
  if (isNavigatingHistory) return
  if (isViewingHistory.value) return

  moveHistory.value.push({ from: move.from, to: move.to, attack: move.attack })
  currentMoveIndex.value = moveHistory.value.length

  if (appStore.soundEnabled) {
    if (move.attack) {
      new Audio(CaptureSound).play().catch(() => {})
    } else {
      new Audio(MoveSound).play().catch(() => {})
    }
  }

  gameOver.value = boardAPI.getIsGameOver()
  const fen = boardAPI.getFen()
  await sendGame({ move: { from: move.from, to: move.to, attack: move.attack }, fen })
  saveGameToStorage()
}

function handleCheckmate() {
  gameOver.value = true
  saveGameToStorage()
}

function handleDraw() {
  gameOver.value = true
  saveGameToStorage()
}

function flipBoard() {
  if (boardAPI) boardAPI.toggleOrientation()
}

function toggleSound() {
  const wasDisabled = !appStore.soundEnabled
  appStore.toggleSound()
  if (wasDisabled && appStore.soundEnabled) {
    new Audio(MoveSound).play().catch(() => {})
  }
}

function undoMove() {
  if (boardAPI && currentMoveIndex.value > 0) {
    isNavigatingHistory = true
    boardAPI.undoLastMove()
    currentMoveIndex.value--
    isNavigatingHistory = false
    updateMovable()
  }
}

function redoMove() {
  if (boardAPI && currentMoveIndex.value < moveHistory.value.length) {
    isNavigatingHistory = true
    boardAPI.redoLastMove()
    currentMoveIndex.value++
    isNavigatingHistory = false
    updateMovable()
    const move = moveHistory.value[currentMoveIndex.value - 1]
    if (appStore.soundEnabled && move) {
      if (move.attack) {
        new Audio(CaptureSound).play().catch(() => {})
      } else {
        new Audio(MoveSound).play().catch(() => {})
      }
    }
  }
}

function undoAll() {
  if (!boardAPI || currentMoveIndex.value === 0) return
  isNavigatingHistory = true
  while (currentMoveIndex.value > 0) {
    boardAPI.undoLastMove()
    currentMoveIndex.value--
  }
  isNavigatingHistory = false
  updateMovable()
  if (appStore.soundEnabled) {
    new Audio(MoveSound).play().catch(() => {})
  }
}

function redoAll() {
  if (!boardAPI || currentMoveIndex.value >= moveHistory.value.length) return
  isNavigatingHistory = true
  while (currentMoveIndex.value < moveHistory.value.length) {
    boardAPI.redoLastMove()
    currentMoveIndex.value++
  }
  isNavigatingHistory = false
  updateMovable()
  if (appStore.soundEnabled) {
    const move = moveHistory.value[currentMoveIndex.value - 1]
    if (move && move.attack) {
      new Audio(CaptureSound).play().catch(() => {})
    } else {
      new Audio(MoveSound).play().catch(() => {})
    }
  }
}

function jumpToMove(targetIndex) {
  if (!boardAPI || targetIndex === currentMoveIndex.value) return
  isNavigatingHistory = true
  while (currentMoveIndex.value > targetIndex) {
    boardAPI.undoLastMove()
    currentMoveIndex.value--
  }
  while (currentMoveIndex.value < targetIndex) {
    boardAPI.redoLastMove()
    currentMoveIndex.value++
  }
  isNavigatingHistory = false
  updateMovable()
  if (appStore.soundEnabled) {
    new Audio(MoveSound).play().catch(() => {})
  }
}

// Game management
function connectToGame(gameId) {
  // Clean up previous connection
  closeWebsockets()
  restoringMoves = true
  previousEvents = []
  processedEventIds = {}
  moveSeq = 0
  moveHistory.value = []
  currentMoveIndex.value = 0

  currentGameId.value = gameId
  // Update URL
  const url = new URL(window.location.href)
  url.searchParams.set('game', gameId)
  window.history.replaceState({}, '', url.toString())

  ;[privKey, pubKey] = deriveKeys(gameId)
  openWebsockets()
}

function createNewGame() {
  const gameId = generateGameId()
  connectToGame(gameId)
  saveGameToStorage()
}

function joinGame() {
  const gameId = joinGameId.value.trim()
  if (!gameId) return
  joinGameId.value = ''
  connectToGame(gameId)
  saveGameToStorage()
}

function switchToGame(gameId) {
  if (gameId === currentGameId.value) return
  connectToGame(gameId)
}

function deleteSavedGame(gameId) {
  confirmingDeleteId.value = null
  appStore.deleteNostrGame(gameId)
  if (gameId === currentGameId.value) {
    const remaining = appStore.savedNostrGames
    if (remaining.length > 0) {
      connectToGame(remaining[0].gameId)
    } else {
      createNewGame()
    }
  }
}

async function copyGameId() {
  try {
    await navigator.clipboard.writeText(currentGameId.value)
    copyMessage.value = { text: 'Game ID copied!', type: 'success', show: true }
    setTimeout(() => { copyMessage.value.show = false }, 3000)
  } catch {
    copyMessage.value = { text: 'Failed to copy', type: 'error', show: true }
  }
}

async function copyMoveHistory() {
  if (moveHistory.value.length === 0) return
  const formattedText = moveHistory.value
    .map((move, index) => `${index + 1}.${move.from} -> ${move.to}`)
    .join('\n')
  try {
    await navigator.clipboard.writeText(formattedText)
    copyMessage.value = { text: 'Move history copied!', type: 'success', show: true }
    setTimeout(() => { copyMessage.value.show = false }, 3000)
  } catch {
    copyMessage.value = { text: 'Failed to copy', type: 'error', show: true }
  }
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

onMounted(() => {
  let gameId = route.query.game
  if (!gameId) {
    const existing = appStore.savedNostrGames
    if (existing.length > 0) {
      gameId = existing[0].gameId
    } else {
      gameId = generateGameId()
    }
  }
  connectToGame(gameId)
  saveGameToStorage()
})

onBeforeUnmount(() => {
  closeWebsockets()
})
</script>

<style scoped>
.relay-status {
  color: #f44336;
  font-size: 13px;
}

.relay-status.connected {
  color: #4CAF50;
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
}

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

.share-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background-color: #222;
  border: 1px solid #444;
  border-radius: 6px;
}

.share-id-label {
  color: #999;
  font-size: 14px;
  white-space: nowrap;
}

.share-id {
  color: #ffd700;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  flex: 1;
  word-break: break-all;
}

.copy-message {
  font-size: 13px;
  color: #66bb6a;
}

.copy-message.message-error {
  color: #ef5350;
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

.join-section {
  padding: 12px;
  background-color: #222;
  border: 1px solid #444;
  border-radius: 6px;
}

.join-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.join-input {
  flex: 1;
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
  font-family: monospace;
}

.saved-game-moves {
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
</style>
