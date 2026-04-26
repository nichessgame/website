<template>
  <v-container max-width="clamp(900px, 35vw, 1440px)" class="mt-2">
    <v-card class="pa-6" elevation="4">
      <div class="text-h4 mb-6">Tools</div>
      <v-list>
        <v-list-item
          title="Board Editor"
          to="/editor"
        />
        <v-list-item
          title="Game Viewer"
          to="/gameviewer"
        />
        <v-list-item
          title="Analysis"
          to="/analysis"
        />
      </v-list>
    </v-card>
  </v-container>
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

<style scoped>
</style>
