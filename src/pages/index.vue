<template>
  <v-container class="fill-height" max-width="900">
    <NewGameDialog v-model="showNewGameDialog" />
    <v-row class="text-center" justify="center">
      <v-col cols="12">
        <div class="d-sm-block d-md-none">
          <v-img
            src="@/assets/logo.png"
            max-height="100"
            contain
            class="mb-6"
          ></v-img>
          <h1 class="text-h5 mb-4">Welcome to Nichess</h1>
          <p class="mb-4 ml-2 mr-2">
            Chess where pieces have special abilities and health points.
          </p>
        </div>
        <div class="d-none d-md-block">
          <v-img
            src="@/assets/logo.png"
            max-height="150"
            contain
            class="mb-6"
          ></v-img>

          <h1 class="text-h4 mb-4">Welcome to Nichess</h1>
          <p class="text-h6 mb-4">
            Chess where pieces have special abilities and health points.
          </p>
        </div>

      </v-col>

      <v-col cols="12" md="8">
        <v-card class="pa-6" elevation="4">
          <v-list lines="three">
            <v-list-item
              prepend-icon="$mdiRobot"
            >
              <v-list-item-title class="custom-title mb-2">Play against AI</v-list-item-title>
              Read the <router-link to="/rules" class="custom-link">rules</router-link> or start a <a @click="showNewGameDialog=true" class="custom-link">new game</a> against the computer.
            </v-list-item>

            <v-list-item
              prepend-icon="$mdiWeb"
            >
              <v-list-item-title class="custom-title mb-2">Play on Urbit</v-list-item-title>
                Urbit is a peer-to-peer network that allows you to play against other people and 
                test new Nichess variants.
                <br>See <router-link to="/urbit" class="custom-link">this</router-link> guide for more.

            </v-list-item>

            <v-list-item
              prepend-icon="$mdiAccountGroup"
            >
              <v-list-item-title class="custom-title mb-2">Social</v-list-item-title>
              <a class="custom-link" href="https://www.x.com/nichessgame">X account</a>
              <br>X community
              <br>X group chat
              <br>Email: contact@nichess.org
            </v-list-item>

            <v-list-item
              prepend-icon="$mdiGithub"
            >
              <v-list-item-title class="custom-title mb-2">Free and Open Source</v-list-item-title>
              All the code and AI models are available on our 
              <a class="custom-link" href="https://github.com/nichessgame">GitHub page</a>
              under FOSS licenses.
            </v-list-item>

            <v-list-item
              prepend-icon="$mdiYoutube"
            >
              <v-list-item-title class="custom-title mb-2">AI Games</v-list-item-title>
              Watch our AI play against itself.
              <br>This is currently the best way to see what the game is like if both sides play
              well.
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <AppFooter />
</template>

<script setup>
import NewGameDialog from '@/components/NewGameDialog.vue'
const showNewGameDialog = ref(false)
</script>

<style scoped>
.custom-link {
  color: #6393ea;
  text-decoration: underline;
}
.custom-link:hover {
  cursor:pointer;
}

.v-list-item {
  text-align: left;
  margin-bottom: 12px;
}
.v-list-item__title {
  font-weight: 600;
}

.custom-title {
  font-weight: 600;
  color: lightgrey;
}
</style>
