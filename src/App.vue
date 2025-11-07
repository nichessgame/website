<template>
  <v-app>
    <!--<v-app-bar app scroll-behavior="fully-hide" scroll-threshold="1" elevation="0"
      color="transparent">-->
    <v-app-bar app scroll-behavior="collapse" scroll-threshold="1" elevation="0" color="transparent">

      <v-container class="d-flex align-center px-0">
        <v-app-bar-nav-icon @click="drawer = !drawer" class="d-sm-none" />
        <v-toolbar-title class="mr-sm-4"><v-btn to="/" :active="false" class="nav-button">Nichess</v-btn></v-toolbar-title>
        
        <div class="d-none d-sm-flex ml-auto">
          <v-btn prepend-icon="mdi-sword-cross" @click="showNewGameDialog = true" class="nav-button">Play</v-btn>
          <NewGameDialog v-model="showNewGameDialog" />
          <v-btn to="/faq" prepend-icon="mdi-information" :active="false" class="nav-button">FAQ</v-btn>
          <v-btn to="/rules" prepend-icon="mdi-script-text" :active="false" class="nav-button">Rules</v-btn>
          <v-btn to="/donate" prepend-icon="mdi-gift" :active="false" class="donate">Donate</v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      temporary
      class="d-sm-none"
    >
      <v-list>
        <v-list-item
          prepend-icon="mdi-sword-cross"
          title="Play"
          @click="showNewGameDialog = true"
          class="nav-button"
        />
        <v-list-item
          prepend-icon="mdi-information"
          title="FAQ"
          to="/faq"
          :active="false"
          class="nav-button"
        />
        <v-list-item
          prepend-icon="mdi-script-text"
          title="Rules"
          to="/rules"
          :active="false"
          class="nav-button"
        />

        <v-list-item
          prepend-icon="mdi-gift"
          title="Donate"
          to="/donate"
          :active="false"
          class="donate"
        />
      </v-list>
    </v-navigation-drawer>
    <router-view />
  </v-app>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useAppStore } from './stores/app'
import NewGameDialog from '@/components/NewGameDialog.vue'

const drawer = ref(false)
const showNewGameDialog = ref(false)
const appStore = useAppStore()

onBeforeUnmount(() => {
  appStore.cleanupBoardWorker()
})
</script>

<style scoped>
.v-btn {
  margin-left: 8px;
}

.donate {
  color: #ffd700; /* gold */
}

.nav-button {
  color: gainsboro;
}

/* Center content on larger screens */
@media (min-width: 600px) {
  .v-container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>
