<template>
  <!--
  <v-container class="fill-height">
    <v-card class="mx-auto" max-width="600">
      <v-card-title class="text-h4 mb-4">Create a new game</v-card-title>
      
      <v-card-text>
        <v-radio-group v-model="color" label="Choose your color:" inline>
          <v-radio label="White" value="white"></v-radio>
          <v-radio label="Black" value="black"></v-radio>
        </v-radio-group>

        <v-select
          v-model="aiTime"
          :items="[3, 5, 10, 15]"
          label="AI thinking time (seconds)"
          class="mt-6"
        ></v-select>

        <v-alert type="info" class="mt-4" color="gray">
          The 40 MB AI model will be downloaded when you press play.
        </v-alert>

        <v-alert type="info" class="mt-4" color="gray">
          AI strength depends on thinking time and the device you're playing on.
        </v-alert>

        <v-alert type="info" class="mt-4" color="gray">
          You can also play against a friend on Urbit. See *this* for more info.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-btn color="white" size="large" block @click="startGame">
          Play
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
  -->
  <NewGameDialog />
</template>

<script setup>
import { ref } from 'vue'

const color = ref('white')
const difficulty = ref(3)

import { useRouter } from 'vue-router'

const router = useRouter()

const startGame = () => {
  router.push({
    path: '/game',
    query: {
      color: color.value,
      difficulty: difficulty.value
    }
  })
}
</script>
