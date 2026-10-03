<template>
  <v-dialog v-model="dialog" max-width="440">
    <v-card class="site-dialog">
      <div class="site-dialog-header">
        <v-card-title class="site-dialog-title">New game</v-card-title>
        <v-btn
          aria-label="Close new game dialog"
          class="site-dialog-close"
          icon
          size="small"
          variant="text"
          @click="dialog = false"
        >
          <v-icon icon="$mdiClose" size="18" />
        </v-btn>
      </div>

      <v-card-text class="site-dialog-body">
        <section class="site-dialog-section" aria-labelledby="color-label">
          <div id="color-label" class="site-dialog-label">Play as</div>
          <div class="option-grid color-grid" role="radiogroup" aria-labelledby="color-label">
            <button
              v-for="option in colorOptions"
              :key="option.value"
              :class="['site-option', 'color-option', { 'site-option-selected': myColor === option.value }]"
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

        <section class="site-dialog-section" aria-labelledby="difficulty-label">
          <div id="difficulty-label" class="site-dialog-label">Difficulty</div>
          <div class="option-grid difficulty-grid" role="radiogroup" aria-labelledby="difficulty-label">
            <button
              v-for="option in difficultyOptions"
              :key="option.level"
              :class="['site-option', { 'site-option-selected': selectedDifficulty.level === option.level }]"
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

      <v-card-actions class="site-dialog-actions">
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

@media (max-width: 420px) {
  .color-piece {
    height: 40px;
    width: 40px;
  }
}
</style>
