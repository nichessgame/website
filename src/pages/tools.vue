<template>
  <main class="page-shell">
    <header class="page-header">
      <h1 class="page-title">Tools</h1>
      <p class="page-subtitle">Utilities for setting up positions, replaying games, and evaluating play.</p>
    </header>

    <nav class="content-stack" aria-label="Nichess tools">
      <router-link class="tool-link" to="/editor">Board Editor</router-link>
      <router-link class="tool-link" to="/gameviewer">Game Viewer</router-link>
      <router-link class="tool-link" to="/analysis">Analysis</router-link>
    </nav>
  </main>
</template>

<script setup>
import { useHead } from '@unhead/vue'

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
