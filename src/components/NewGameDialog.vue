<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        Create a new game
        <v-btn icon="$mdiClose" variant="text" @click="dialog = false"></v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-radio-group v-model="myColor" label="Choose your color:" inline>
          <v-radio label="White" value="white"></v-radio>
          <v-radio label="Black" value="black"></v-radio>
        </v-radio-group>

        <v-select
          v-model="selectedDifficultyLabel"
          :items="difficultyOptions"
          label="Difficulty"
          class="mt-6"
        ></v-select>

        <v-alert v-if="!appStore.boardWorker" type="info" class="mt-4" color="gray">
          The 40 MB AI model will be downloaded when you start the game. This might take a while if
          your internet is slow.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-btn color="white" size="large" block @click="startGame">
          Play
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
console.log('script setup')
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app';
import { AIDifficulty } from '../AI/common';

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

const difficultyOptions = AIDifficulty.getAllLabels();

// Work with labels in the UI, but store the full config
const selectedDifficultyLabel = computed({
  get() {
    return appStore.selectedDifficulty.label
  },
  set(label) {
    const config = AIDifficulty.getAllConfigs().find(c => c.label === label);
    if (config) {
      appStore.setDifficulty(config);
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

<style>
.v-overlay__scrim {
  background-color: rgba(0, 0, 0, 1.0) !important;
}
</style>
