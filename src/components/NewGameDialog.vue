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
          <div id="color-label" class="section-label">Color</div>
          <div class="color-toggle" role="radiogroup" aria-labelledby="color-label">
            <button
              :class="['color-option', { 'color-option-selected': myColor === 'white' }]"
              type="button"
              role="radio"
              :aria-checked="myColor === 'white'"
              @click="myColor = 'white'"
            >
              White
            </button>
            <button
              :class="['color-option', { 'color-option-selected': myColor === 'black' }]"
              type="button"
              role="radio"
              :aria-checked="myColor === 'black'"
              @click="myColor = 'black'"
            >
              Black
            </button>
          </div>
        </section>

        <v-select
          v-model="selectedDifficultyLabel"
          :items="difficultyOptions"
          label="Difficulty"
          variant="outlined"
          density="compact"
          hide-details
        ></v-select>

        <v-alert
          v-if="!modelReady"
          class="model-alert"
          density="compact"
        >
          The 40 MB AI model will be downloaded when you start the game. This might take a while if
          your internet is slow.
        </v-alert>
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

const difficultyOptions = AIDifficulty.getAllLabels()

// Work with labels in the UI, but store the full config
const selectedDifficultyLabel = computed({
  get() {
    return appStore.selectedDifficulty.label
  },
  set(label) {
    const config = AIDifficulty.getAllConfigs().find(c => c.label === label)
    if (config) {
      appStore.setDifficulty(config)
    }
  }
})

const myColor = computed({
  get() {
    return appStore.selectedColor
  },
  set(value) {
    appStore.setColor(value)
  }
})

const startGame = () => {
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
  background: #17191f;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #e7eaf0;
}

.dialog-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  min-height: 52px;
  padding: 8px 10px 6px 18px;
}

.dialog-title {
  color: #f1f3f6;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: 0;
  line-height: 1.2;
  padding: 0;
}

.close-button {
  color: #aeb4bf;
}

.close-button:hover {
  color: #ffffff;
}

.dialog-text {
  display: grid;
  gap: 14px;
  padding: 10px 18px 14px;
}

.dialog-section {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  display: grid;
  gap: 10px;
  padding: 12px;
}

.section-label {
  color: #d7dbe3;
  font-size: 0.92rem;
  font-weight: 560;
  letter-spacing: 0;
}

.color-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.color-option {
  appearance: none;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 6px;
  color: #d0d4dc;
  cursor: pointer;
  font: inherit;
  font-size: 0.94rem;
  font-weight: 650;
  letter-spacing: 0;
  min-height: 46px;
  padding: 0 14px;
  position: relative;
  text-align: center;
  transition: background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
}

.color-option:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.color-option-selected {
  background: rgba(226, 232, 240, 0.1);
  border-color: rgba(226, 232, 240, 0.76);
  box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.16);
  color: #f4f4f5;
}

.color-option-selected:hover {
  background: rgba(226, 232, 240, 0.14);
  border-color: #f4f4f5;
  color: #ffffff;
}

.dialog-text :deep(.v-field) {
  color: #e7eaf0;
}

.dialog-text :deep(.v-label) {
  color: #b9bec8;
  opacity: 1;
}

.dialog-actions {
  padding: 0 18px 18px;
}

.model-alert {
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  color: #ffb74d;
  font-size: 0.88rem;
  line-height: 1.45;
  text-align: left;
}

.model-alert :deep(.v-alert__content) {
  text-align: left;
}

@media (max-width: 420px) {
  .color-toggle {
    gap: 8px;
  }

  .color-option {
    min-height: 44px;
    padding: 0 8px;
  }
}
</style>
