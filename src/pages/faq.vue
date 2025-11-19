<template>
  <v-container class="mt-6" max-width="900">
    <v-card class="pa-6" elevation="4">
      <h1 class="text-h4 mb-6">Frequently Asked Questions</h1>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel
            title="How can I play against a friend?"
        >
          <v-expansion-panel-text>
            For now the only way to do so is via <router-link to="/urbit" class="custom-link">Urbit</router-link>. Someday, we'll have centralized servers like Lichess and Chess.com.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel
            title="What is the point of this? Chess is better."
        >
          <v-expansion-panel-text>
            Nichess is a superset of chess—it has everything chess has and more. It's only a matter of time before a Nichess variant is made that's better than chess.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel
            title="I don't like X. You should add Y."
        >
          <v-expansion-panel-text>
            Unfortunately, even a small change requires retraining the AI from scratch. We appreciate the suggestions, but don't expect frequent changes once a variant is released. As more people get involved, we'll be able to make changes more frequently.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel
            title="I made a Nichess variant / I have ideas how to improve Nichess."
        >
          <v-expansion-panel-text>
            Great. Send your ideas to contact@nichess.org.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel
            title="How can I help?"
        >
          <v-expansion-panel-text>
            Pick something and make it better.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel
            title="Why is the AI playing better/worse on my desktop PC than on my smartphone?"
        >
          <v-expansion-panel-text>
            The AI is running locally, on your device. Its skill level depends on your hardware and software. If the performance is poor, try a different browser or a device. Chromium-based browsers (Chrome, Brave, Edge etc.) tend to perform a bit better than Firefox.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel
            title="I started a game and nothing is happening."
        >
          <v-expansion-panel-text>
            Sometimes it can take a while to download the AI model. Make sure you have a good internet connection.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel
            title="How do I report a bug?"
        >
          <v-expansion-panel-text>
            Send an email to contact@nichess.org.
          </v-expansion-panel-text>
        </v-expansion-panel>


      </v-expansion-panels>
    </v-card>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

</script>

<style scoped>
.custom-link {
  color: #6393ea;
  text-decoration: underline;
}

.v-card {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
</style>
