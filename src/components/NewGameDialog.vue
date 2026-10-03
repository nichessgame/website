<template>
  <v-dialog v-model="dialog" max-width="460">
    <v-card class="new-game-dialog">
      <div class="dialog-header">
        <v-card-title class="dialog-title">New game</v-card-title>
        <v-btn
          aria-label="Close new game dialog"
          class="close-button"
          icon
          size="small"
          variant="text"
          @click="dialog = false"
        >
          <v-icon icon="$mdiClose" size="18" />
        </v-btn>
      </div>

      <v-card-text class="dialog-text">
        <section class="dialog-section" aria-labelledby="color-label">
          <div id="color-label" class="section-label">Play as</div>
          <div class="option-grid color-grid" role="radiogroup" aria-labelledby="color-label">
            <button
              v-for="option in colorOptions"
              :key="option.value"
              :class="['dialog-option', 'color-option', { 'dialog-option-selected': myColor === option.value }]"
              type="button"
              role="radio"
              :aria-checked="myColor === option.value"
              @click="myColor = option.value"
            >
              <img :src="option.image" alt="" class="color-piece" />
              {{ option.label }}
            </button>
          </div>
        </section>

        <section class="dialog-section" aria-labelledby="difficulty-label">
          <div id="difficulty-label" class="section-label">Difficulty</div>
          <div class="option-grid difficulty-grid" role="radiogroup" aria-labelledby="difficulty-label">
            <button
              v-for="option in difficultyOptions"
              :key="option.level"
              :class="['dialog-option', { 'dialog-option-selected': selectedDifficulty.level === option.level }]"
              type="button"
              role="radio"
              :aria-checked="selectedDifficulty.level === option.level"
              :aria-label="option.label"
              @click="appStore.setDifficultyByLevel(option.level)"
            >
              {{ option.level }}
            </button>
          </div>
          <div class="difficulty-hint">AI thinks {{ selectedDifficulty.timeInSeconds }} seconds per move</div>
        </section>

        <div v-if="modelDownloadRequired" class="site-note">
          <v-icon icon="$mdiInformation" class="site-note-icon" />
          <span>
            <strong>The 40 MB AI model will be downloaded when you start the game.</strong>
            This might take a while if your internet is slow.
          </span>
        </div>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-btn block class="site-button-primary" size="large" variant="flat" @click="startGame">
          Play
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { AIDifficulty } from '../AI/common'
import whiteKing from '@/assets/wK.svg'
import blackKing from '@/assets/bk.svg'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const router = useRouter()
const appStore = useAppStore()

const modelReady = computed(() => appStore.modelReady)
const modelDownloadRequired = computed(() => !modelReady.value && appStore.modelCached === false)

const difficultyOptions = AIDifficulty.getAllConfigs()
const selectedDifficulty = computed(() => appStore.selectedDifficulty)

const colorOptions = [
  { value: 'white', label: 'White', image: whiteKing },
  { value: 'black', label: 'Black', image: blackKing },
]

const myColor = computed({
  get() {
    return appStore.selectedColor
  },
  set(value) {
    appStore.setColor(value)
  }
})

const startGame = () => {
  appStore.grantModelDownloadConsent()
  router.push({
    name: 'game',
    params: {
      myColor: appStore.selectedColor,
      difficulty: appStore.selectedDifficulty.level.toString(),
      gameId: Date.now().toString()
    }
  })
  dialog.value = false
}
</script>

<style scoped>
.new-game-dialog {
  background: #1a1c21;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  color: var(--site-text-strong);
}

.dialog-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 16px 12px 0 22px;
}

.dialog-title {
  color: var(--site-text-strong);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
  padding: 0;
}

.close-button {
  color: var(--site-text-subtle);
}

.close-button:hover {
  color: #ffffff;
}

.dialog-text {
  display: grid;
  gap: 20px;
  padding: 16px 22px 20px !important;
}

.dialog-section {
  display: grid;
  gap: 8px;
}

.section-label {
  color: var(--site-text-subtle);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.option-grid {
  display: grid;
  gap: 10px;
}

.color-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.difficulty-grid {
  gap: 6px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.dialog-option {
  align-items: center;
  appearance: none;
  background: rgba(255, 255, 255, 0.035);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: var(--site-text-muted);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.94rem;
  font-weight: 700;
  justify-content: center;
  letter-spacing: 0;
  min-height: 40px;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.dialog-option:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.dialog-option:focus-visible {
  outline: 2px solid rgba(226, 232, 240, 0.6);
  outline-offset: 2px;
}

.dialog-option-selected,
.dialog-option-selected:hover {
  background: rgba(226, 232, 240, 0.1);
  border-color: rgba(226, 232, 240, 0.85);
  color: #ffffff;
}

.color-option {
  flex-direction: column;
  gap: 6px;
  padding: 12px 0 10px;
}

.color-piece {
  height: 48px;
  width: 48px;
}

.difficulty-hint {
  color: var(--site-text-subtle);
  font-size: 0.82rem;
}

.dialog-actions {
  padding: 0 22px 22px;
}

@media (max-width: 420px) {
  .dialog-header {
    padding-left: 18px;
  }

  .dialog-text {
    padding: 14px 18px 18px !important;
  }

  .dialog-actions {
    padding: 0 18px 18px;
  }

  .color-piece {
    height: 40px;
    width: 40px;
  }
}
</style>
