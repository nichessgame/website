<template>
  <v-btn
    aria-label="Board settings"
    class="board-action-button"
    variant="flat"
    @click="dialogOpen = true"
  >
    <v-icon icon="$mdiCog" />
  </v-btn>

  <v-dialog v-model="dialogOpen" max-width="420">
    <v-card class="board-settings-card">
      <div class="board-settings-header">
        <v-card-title class="board-settings-title">Board settings</v-card-title>
        <v-btn
          aria-label="Close board settings"
          class="close-button"
          icon
          size="small"
          variant="text"
          @click="dialogOpen = false"
        >
          <v-icon icon="$mdiClose" size="18" />
        </v-btn>
      </div>

      <v-card-text class="board-settings-content">
        <v-select
          v-model="selectedPointsTextTheme"
          :items="POINTS_TEXT_THEMES"
          item-title="title"
          item-value="value"
          label="Text style"
          variant="outlined"
          density="compact"
          hide-details
        />

        <div class="settings-row toggle-row">
          <div class="toggle-label">
            <v-icon icon="$mdiLightningBolt" size="20" />
            <span>Ability points</span>
          </div>

          <v-switch
            :model-value="appStore.abilityPointsVisible"
            color="primary"
            density="compact"
            hide-details
            inset
            @update:model-value="appStore.setAbilityPointsVisible"
          />
        </div>

        <div class="settings-row sound-row">
          <div class="toggle-label">
            <v-icon
              :icon="appStore.soundEnabled ? '$mdiVolumeHigh' : '$mdiVolumeOff'"
              size="20"
            />
            <span>Sound</span>
          </div>

          <v-switch
            :model-value="appStore.soundEnabled"
            color="primary"
            density="compact"
            hide-details
            inset
            @update:model-value="toggleSound"
          />
        </div>

        <v-btn
          block
          class="site-button-secondary"
          prepend-icon="$mdiRotate3dVariant"
          variant="flat"
          @click="emit('flip-board')"
        >
          Flip board
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { POINTS_TEXT_THEMES, useAppStore } from '@/stores/app'
import MoveSound from '@/assets/Move.ogg'

const emit = defineEmits(['flip-board'])
const appStore = useAppStore()
const dialogOpen = ref(false)

const selectedPointsTextTheme = computed({
  get: () => appStore.selectedPointsTextTheme,
  set: theme => appStore.setPointsTextTheme(theme),
})

function toggleSound(enabled) {
  const wasDisabled = !appStore.soundEnabled
  appStore.setSoundEnabled(enabled)

  if (wasDisabled && appStore.soundEnabled) {
    new Audio(MoveSound).play().catch(() => {})
  }
}
</script>

<style scoped>
.board-settings-card {
  background: #17191f;
  color: #e7eaf0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.board-settings-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  min-height: 52px;
  padding: 8px 10px 6px 18px;
}

.board-settings-title {
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

.board-settings-content {
  display: grid;
  gap: 14px;
  padding: 10px 18px 18px;
}

.settings-row {
  align-items: center;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  display: flex;
  min-height: 48px;
  padding: 6px 10px 6px 12px;
}

.toggle-row,
.sound-row {
  justify-content: space-between;
}

.toggle-label {
  align-items: center;
  color: #d7dbe3;
  display: flex;
  font-size: 0.92rem;
  font-weight: 560;
  gap: 10px;
  letter-spacing: 0;
}
</style>
