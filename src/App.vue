<template>
  <v-app>
    <v-app-bar
      app
      :class="['site-app-bar', { 'mobile-scrolled': !isAtTop }]"
      color="transparent"
      elevation="0"
      scroll-behavior="collapse"
      scroll-threshold="1"
    >

      <v-container class="nav-container d-flex align-center">
        <v-app-bar-nav-icon
          aria-label="Open navigation"
          class="mobile-menu-button d-sm-none"
          @click="drawer = !drawer"
        />

        <router-link class="brand-link" to="/">Nichess</router-link>
        
        <div class="desktop-nav d-none d-sm-flex ml-auto">
          <v-btn class="nav-link" variant="text" @click="showNewGameDialog = true">Play</v-btn>
          <NewGameDialog v-model="showNewGameDialog" />
          <v-btn to="/faq" :active="false" class="nav-link" variant="text">FAQ</v-btn>
          <v-btn to="/rules" :active="false" class="nav-link" variant="text">Rules</v-btn>
          <v-btn to="/tools" :active="false" class="nav-link" variant="text">Tools</v-btn>
          <v-btn to="/nostr" :active="false" class="nav-link" variant="text">Nostr</v-btn>
          <v-btn to="/donate" :active="false" class="nav-link donate-link" variant="text">Donate</v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      temporary
      class="mobile-drawer d-sm-none"
    >
      <v-list class="mobile-nav-list">
        <v-list-item
          title="Play"
          class="mobile-play-item"
          @click="showNewGameDialog = true; drawer = false"
        />
        <v-list-item
          title="FAQ"
          to="/faq"
          :active="false"
          class="mobile-nav-item"
        />
        <v-list-item
          title="Rules"
          to="/rules"
          :active="false"
          class="mobile-nav-item"
        />
        <v-list-item
          title="Tools"
          to="/tools"
          :active="false"
          class="mobile-nav-item"
        />

        <v-list-item
          title="Nostr"
          to="/nostr"
          :active="false"
          class="mobile-nav-item"
        />

        <v-list-item
          title="Donate"
          to="/donate"
          :active="false"
          class="mobile-nav-item mobile-donate-item"
        />
      </v-list>
    </v-navigation-drawer>
    <router-view />
  </v-app>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { useAppStore } from './stores/app'
import NewGameDialog from '@/components/NewGameDialog.vue'

const drawer = ref(false)
const showNewGameDialog = ref(false)
const isAtTop = ref(true)
const appStore = useAppStore()

function updateScrollState() {
  isAtTop.value = window.scrollY <= 0
  if (!isAtTop.value) drawer.value = false
}

onMounted(() => {
  updateScrollState()
  appStore.refreshModelCacheStatus()
  window.addEventListener('scroll', updateScrollState, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollState)
  appStore.cleanupBoardWorker()
})
</script>

<style scoped>
.site-app-bar {
  background: transparent !important;
  transition: transform 180ms ease, opacity 180ms ease;
}

.nav-container {
  max-width: min(100% - 32px, 1120px);
  padding: 0;
}

.brand-link {
  color: var(--site-text-muted);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  margin-right: 30px;
  text-decoration: none;
  text-transform: uppercase;
}

.brand-link:hover {
  color: var(--site-text-strong);
}

.desktop-nav {
  align-items: center;
  gap: 8px;
}

.nav-link {
  color: var(--site-text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0;
  min-height: 40px;
  min-width: auto;
  padding: 0 14px;
  text-transform: uppercase;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.035);
  color: var(--site-text-strong);
}

.donate-link {
  color: var(--site-gold);
}

.donate-link:hover {
  background: rgba(242, 201, 76, 0.06);
  color: var(--site-gold-hover);
}

.mobile-menu-button {
  color: var(--site-text-strong);
  margin-right: 8px;
}

.mobile-drawer {
  background: #15181d;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.mobile-nav-list {
  display: grid;
  gap: 4px;
  padding: 12px;
}

.mobile-play-item,
.mobile-nav-item {
  border-radius: 6px;
  color: var(--site-text-muted);
  font-size: 0.92rem;
  font-weight: 700;
  min-height: 48px;
  text-transform: uppercase;
}

.mobile-play-item {
  color: var(--site-text-muted);
}

.mobile-nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.mobile-donate-item {
  color: var(--site-gold);
}

@media (max-width: 599px) {
  .site-app-bar.mobile-scrolled {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-100%);
  }

  .nav-container {
    max-width: min(100% - 24px, 1120px);
  }

  .brand-link {
    margin-right: 0;
  }
}
</style>
