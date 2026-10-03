<template>
  <v-btn
    aria-label="Board settings"
    class="board-action-button"
    variant="flat"
    @click="dialogOpen = true"
  >
    <v-icon icon="$mdiCog" />
  </v-btn>

  <v-dialog v-model="dialogOpen" max-width="440">
    <v-card class="site-dialog">
      <div class="site-dialog-header">
        <v-card-title class="site-dialog-title">Board settings</v-card-title>
        <v-btn
          aria-label="Close board settings"
          class="site-dialog-close"
          icon
          size="small"
          variant="text"
          @click="dialogOpen = false"
        >
          <v-icon icon="$mdiClose" size="18" />
        </v-btn>
      </div>

      <v-card-text class="site-dialog-body">
        <section class="site-dialog-section">
          <div id="text-style-label" class="site-dialog-label">Text style</div>
          <v-select
            v-model="selectedPointsTextTheme"
            :items="POINTS_TEXT_THEMES"
            item-title="title"
            item-value="value"
            aria-labelledby="text-style-label"
            variant="outlined"
            density="compact"
            hide-details
          />
        </section>

        <section class="site-dialog-section">
          <div class="site-dialog-label">Display</div>

          <div class="toggle-row">
            <div class="toggle-label">
              <v-icon icon="$mdiLightningBolt" size="20" />
              <span>Ability points</span>
            </div>

            <SiteSwitch
              :model-value="appStore.abilityPointsVisible"
              aria-label="Ability points"
              @update:model-value="appStore.setAbilityPointsVisible"
            />
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <v-icon
                :icon="appStore.soundEnabled ? '$mdiVolumeHigh' : '$mdiVolumeOff'"
                size="20"
              />
              <span>Sound</span>
            </div>

            <SiteSwitch
              :model-value="appStore.soundEnabled"
              aria-label="Sound"
              @update:model-value="toggleSound"
            />
          </div>
        </section>

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
import SiteSwitch from '@/components/SiteSwitch.vue'

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
.toggle-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  min-height: 44px;
}

.toggle-label {
  align-items: center;
  color: var(--site-text);
  display: flex;
  font-size: 0.92rem;
  font-weight: 700;
  gap: 10px;
  letter-spacing: 0;
}
</style>
