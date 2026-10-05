<template>
  <v-container class="pa-0" max-width="clamp(864px, 80vh, 1920px)">
    <TheChessboard
      :board-config="boardConfig"
      :reactive-config="true"
      @board-created="handleBoardCreated"
    />
  </v-container>
</template>

<script setup>
  import { useHead } from '@unhead/vue'
  import { PieceType } from 'nichess'
  import { onBeforeUnmount, reactive } from 'vue'
  import { TheChessboard } from 'vue3-nichessboard'
  import { useBoardDisplaySettings } from '@/composables/useBoardDisplaySettings'
  import 'vue3-nichessboard/style.css'

  useHead({
    title: 'Game Recorder',
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  })

  const boardConfig = reactive({
    orientation: 'white',
    animation: { enabled: true, duration: 200 },
  })
  useBoardDisplaySettings(boardConfig)

  let boardAPI = null
  let timeline = []
  let initialPosition = null
  let currentIndex = 0

  function parseHistory (text) {
    const lines = text.split('\n').filter(line => line.trim() !== '')
    const steps = []
    let moveCount = 0

    for (const [index, line] of lines.entries()) {
      const lineNum = index + 1
      const positionMatch = line.trim().match(/^SET_POSITION\s+"([^"]*)"$/)
      if (positionMatch) {
        steps.push({ type: 'set_position', position: positionMatch[1], lineNum })
        continue
      }

      const moveNumMatch = line.match(/^(\d+)\./)
      if (!moveNumMatch) {
        throw new Error(`Line ${lineNum}: Expected SET_POSITION "..." or a numbered move such as "1. e2 -> e4"`)
      }

      const expectedMoveNum = moveCount + 1
      const actualMoveNum = Number(moveNumMatch[1])
      if (actualMoveNum !== expectedMoveNum) {
        throw new Error(`Line ${lineNum}: Move number mismatch (expected ${expectedMoveNum}, got ${actualMoveNum})`)
      }

      const moveMatch = line.replace(/^\d+\./, '').trim().match(/^([a-h][1-8])\s*->\s*([a-h][1-8])$/)
      if (!moveMatch) {
        throw new Error(`Line ${lineNum}: Invalid move format (expected "from -> to" with squares a1-h8)`)
      }

      steps.push({ from: moveMatch[1], to: moveMatch[2], lineNum })
      moveCount++
    }

    if (moveCount === 0) throw new Error('No valid moves found in the history')
    return steps
  }

  function applyStep (step) {
    if (step.type === 'set_position') {
      // A new position is a cut, not a move: pieces must not slide from the
      // previous position into it.
      boardAPI.setConfig({ animation: { enabled: false } })
      boardAPI.setPosition(step.position)
      boardAPI.setConfig({ animation: { enabled: true, duration: boardConfig.animation.duration } })
    } else {
      boardAPI.move(step)
    }
  }

  function rebuildBoard () {
    boardAPI.resetBoard()
    if (initialPosition !== null) boardAPI.setPosition(initialPosition)
    for (let i = 0; i < currentIndex; i++) applyStep(timeline[i])
    boardAPI.forbidMoves()
  }

  function getMoves () {
    return timeline.map(step => step.type === 'set_position'
      ? { type: step.type, position: step.position }
      : { from: step.from, to: step.to, attack: !!step.attack })
  }

  function loadMoves (text) {
    const steps = parseHistory(text)
    let nextInitialPosition = null
    let leadingPositionCount = 0
    let customPositionActive = false
    let readingLeadingPositions = true

    try {
      boardAPI.resetBoard()
      for (const step of steps) {
        if (step.type === 'set_position') {
          boardAPI.setPosition(step.position)
          customPositionActive = true
          if (readingLeadingPositions) {
            nextInitialPosition = step.position
            leadingPositionCount++
          }
          continue
        }

        readingLeadingPositions = false
        // Tutorial positions may omit kings, which the normal legality helper
        // treats as game-over. Only this recorder bypasses that check.
        if (!customPositionActive && !boardAPI.isMoveLegal(step)) {
          throw new Error(`Illegal move at line ${step.lineNum}: ${step.from} -> ${step.to}`)
        }
        step.attack = boardAPI.getPiece(step.to).type !== PieceType.NO_PIECE
        boardAPI.move(step)
      }
    } catch (error) {
      rebuildBoard()
      throw error
    }

    // Leading position commands establish the opening frame; later commands
    // remain instantaneous steps in the recording timeline.
    timeline = steps.slice(leadingPositionCount)
    initialPosition = nextInitialPosition
    currentIndex = 0
    rebuildBoard()
    return getMoves()
  }

  // Expose the API only after the board exists so Puppeteer's readiness check
  // also guarantees that loadMoves and the playback controls are usable.
  const recorder = {
    loadMoves,
    getMoves,
    getCurrentIndex: () => currentIndex,
    stepForward () {
      if (currentIndex >= timeline.length) return false
      applyStep(timeline[currentIndex])
      currentIndex++
      boardAPI.forbidMoves()
      return true
    },
    setAnimationDuration (duration) {
      boardConfig.animation.duration = duration
      boardAPI.setConfig({ animation: { enabled: true, duration } })
    },
    setOrientation (color) {
      boardConfig.orientation = color
      boardAPI.setConfig({ orientation: color })
    },
  }

  function handleBoardCreated (api) {
    boardAPI = api
    boardAPI.forbidMoves()
    window.__gameRecorder = recorder
  }

  onBeforeUnmount(() => {
    if (window.__gameRecorder === recorder) delete window.__gameRecorder
  })
</script>
