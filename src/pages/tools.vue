<template>
  <main class="page-shell">
    <header class="page-header">
      <h1 class="page-title">Tools</h1>
    </header>

    <nav class="content-stack" aria-label="Nichess tools">
      <router-link v-for="tool in tools" :key="tool.to" class="tool-link site-panel" :to="tool.to">
        <v-icon class="tool-icon" :icon="tool.icon" />
        <span class="tool-name">{{ tool.name }}</span>
      </router-link>
    </nav>
  </main>
</template>

<script setup>
import { useHead } from '@unhead/vue'

// Same icons as the Game Viewer's autoplay button and the board pages' analysis button
const tools = [
  { name: 'Board Editor', to: '/editor', icon: '$mdiPencil' },
  { name: 'Game Viewer', to: '/gameviewer', icon: '$mdiPlay' },
  { name: 'Analysis', to: '/analysis', icon: '$mdiLaptop' },
]

useHead({
  title: 'Tools',
  link: [
    { rel: 'canonical', href: 'https://www.nichess.org/tools' },
  ],
  meta: [
    { name: 'description', content: 'Nichess tools: board editor, game viewer, and position analysis.' },
    { property: 'og:title', content: 'Tools' },
    { property: 'og:description', content: 'Nichess tools: board editor, game viewer, and position analysis.' },
    { property: 'og:url', content: 'https://www.nichess.org/tools' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://www.nichess.org/pwa-512x512.png' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Tools' },
    { name: 'twitter:description', content: 'Nichess tools: board editor, game viewer, and position analysis.' },
  ],
})
</script>

<style scoped>
/* Rows match the FAQ questions, with the FAQ's chevron pointing right */
.tool-link {
  align-items: center;
  color: var(--site-text-strong);
  display: flex;
  gap: 12px;
  text-decoration: none;
  transition: background-color 140ms ease, border-color 140ms ease;
}

.tool-link:hover,
.tool-link:focus-visible {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.13);
}

.tool-link:focus-visible {
  outline: 2px solid rgba(139, 181, 255, 0.55);
  outline-offset: 2px;
}

.tool-icon.v-icon {
  color: var(--site-text-muted);
  font-size: 18px;
  transition: color 140ms ease;
}

.tool-name {
  flex: 1;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.35;
}

.tool-link::after {
  border-bottom: 2px solid var(--site-text-muted);
  border-right: 2px solid var(--site-text-muted);
  content: "";
  flex: 0 0 auto;
  height: 8px;
  margin-right: 4px;
  transform: rotate(-45deg);
  transition: border-color 140ms ease;
  width: 8px;
}

.tool-link:hover .tool-icon.v-icon,
.tool-link:focus-visible .tool-icon.v-icon {
  color: #ffffff;
}

.tool-link:hover::after,
.tool-link:focus-visible::after {
  border-color: #ffffff;
}
</style>
