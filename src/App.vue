<template>
  <v-app>
    <v-app-bar
      app
      :class="['site-app-bar', { 'mobile-scrolled': !isAtTop, 'menu-open': drawer }]"
      color="transparent"
      elevation="0"
      scroll-behavior="collapse"
      scroll-threshold="1"
    >

      <v-container class="nav-container d-flex align-center">
        <v-app-bar-nav-icon
          :aria-expanded="drawer"
          :aria-label="drawer ? 'Close navigation' : 'Open navigation'"
          class="mobile-menu-button d-sm-none"
          :icon="drawer ? '$close' : '$menu'"
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
      location="top"
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
  transition: transform 180ms ease, opacity 180ms ease, background-color 200ms ease;
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

.site-app-bar.menu-open {
  background: #121212 !important;
}

/* Mobile menu: a panel that drops down from under the app bar */
.mobile-drawer {
  background: #121212;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.45);
  height: auto !important;
  transition-property: box-shadow, transform, visibility, opacity;
}

/*
 * Vuetify hides a closed top drawer by shifting it up by its width prop,
 * which doesn't match this panel's auto height, so hide it explicitly.
 */
.mobile-drawer:not(.v-navigation-drawer--active) {
  opacity: 0;
  transform: translateY(-8px) !important;
  visibility: hidden;
}

.v-application :deep(.v-navigation-drawer__scrim) {
  opacity: 0.6;
}

.mobile-nav-list {
  background: transparent;
  display: grid;
  gap: 2px;
  padding: 8px 12px 16px;
}

.mobile-play-item,
.mobile-nav-item {
  border-radius: 6px;
  color: var(--site-text-muted);
  min-height: 48px;
}

.mobile-play-item :deep(.v-list-item-title),
.mobile-nav-item :deep(.v-list-item-title) {
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.mobile-play-item:hover,
.mobile-nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.mobile-donate-item {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0 0 6px 6px;
  color: var(--site-gold);
  margin-top: 6px;
}

.mobile-donate-item:hover {
  background: rgba(242, 201, 76, 0.06);
  color: var(--site-gold-hover);
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
