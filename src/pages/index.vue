<template>
  <main class="home-page">
    <NewGameDialog v-model="showNewGameDialog" />

    <section class="hero" aria-labelledby="home-title">
      <h1 id="home-title">Nichess</h1>
      <p>Chess where pieces have special abilities and health points.</p>
      <div class="hero-actions">
        <button class="primary-action" type="button" @click="showNewGameDialog = true">
          Play against AI
        </button>
        <router-link class="secondary-action" to="/rules">
          Rules
        </router-link>
      </div>
    </section>

    <section class="info-grid" aria-label="Nichess links and information">
      <article class="info-panel">
        <h2>Peer-to-peer</h2>
        <p>
          Play against someone via <router-link to="/nostr" class="site-link">Nostr</router-link>
          or <router-link to="/urbit" class="site-link">Urbit</router-link>.
        </p>
      </article>

      <article class="info-panel">
        <h2>Social</h2>
        <p>
          Follow us on <a class="site-link" href="https://www.x.com/nichessgame">X</a>
          and <a class="site-link" href="https://www.youtube.com/@nichessgame">YouTube</a>.
        </p>
        <p>
          Email: contact@nichess.org
        </p>
      </article>

      <article class="info-panel">
        <h2>Free and Open Source</h2>
        <p>
          All the code and AI models are available on our
          <a class="site-link" href="https://github.com/nichessgame">GitHub page</a>
          under FOSS licenses.
        </p>
      </article>

      <article class="info-panel">
        <h2>AI Games</h2>
        <p>
          <a class="site-link" href="https://youtube.com/playlist?list=PLN0TnHkszmgQSnFrvF_ANIzX8GmDD5GFR">Watch</a>
          our AI play against itself.
        </p>
        <p>
          This is currently the best way to see what the game is like if both sides play well.
        </p>

      </article>

    </section>
  </main>
  <AppFooter />
</template>

<script setup>
import { useHead } from '@unhead/vue'
import NewGameDialog from '@/components/NewGameDialog.vue'
const showNewGameDialog = ref(false)

useHead({
  title: 'Nichess',
  link: [
    { rel: 'canonical', href: 'https://www.nichess.org/' },
  ],
  meta: [
    { name: 'description', content: 'Play Nichess, a free and open source game like chess where pieces have special abilities and health points.' },
    { property: 'og:title', content: 'Nichess' },
    { property: 'og:description', content: 'Play Nichess, a free and open source game like chess where pieces have special abilities and health points.' },
    { property: 'og:url', content: 'https://www.nichess.org/' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://www.nichess.org/pwa-512x512.png' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Nichess' },
    { name: 'twitter:description', content: 'Play Nichess, a free and open source game like chess where pieces have special abilities and health points.' },
    { name: 'twitter:image', content: 'https://www.nichess.org/pwa-512x512.png' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Nichess',
        url: 'https://www.nichess.org/',
        description: 'A free and open source game like chess where pieces have special abilities and health points.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.nichess.org/',
        },
      }),
    },
  ],
})
</script>

<style scoped>
.home-page {
  width: min(100% - 32px, 940px);
  margin: 0 auto;
  padding: clamp(24px, 4vw, 48px) 0 clamp(32px, 5vw, 56px);
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: clamp(12px, 2vw, 18px);
  padding: clamp(22px, 5vw, 56px) 0 clamp(28px, 5vw, 52px);
}

.hero h1 {
  color: #f4f4f5;
  font-size: clamp(2.75rem, 7vw, 5.25rem);
  font-weight: 760;
  letter-spacing: 0;
  line-height: 1;
  margin: 0;
}

.hero p {
  color: #d4d7dd;
  font-size: clamp(1rem, 1.6vw, 1.22rem);
  line-height: 1.45;
  margin: 0;
  max-width: 620px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  width: 100%;
}

.primary-action,
.secondary-action {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  min-width: min(100%, 148px);
  padding: 0 18px;
  font: inherit;
  font-size: 0.94rem;
  font-weight: 680;
  line-height: 1.2;
  text-decoration: none;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.primary-action {
  background: #e2e8f0;
  color: #101318;
}

.primary-action:hover {
  background: #ffffff;
}

.secondary-action {
  background: transparent;
  border-color: #6f7787;
  color: #f4f4f5;
}

.secondary-action:hover {
  border-color: #b8bfcc;
  color: #ffffff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 20px);
}

.info-panel {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 6px;
  min-height: 156px;
  padding: clamp(16px, 2.3vw, 22px);
}

.info-panel h2 {
  color: #f1f3f6;
  font-size: clamp(1.05rem, 1.55vw, 1.22rem);
  font-weight: 680;
  line-height: 1.2;
  margin: 0 0 10px;
}

.info-panel p,
.info-panel span {
  color: #d0d4dc;
  font-size: 0.94rem;
  line-height: 1.55;
  margin: 0;
}

.info-panel p + p {
  margin-top: 9px;
}

@media (max-width: 680px) {
  .home-page {
    width: min(100% - 24px, 940px);
    padding-top: 16px;
  }

  .hero {
    align-items: stretch;
    text-align: left;
    padding-top: 20px;
  }

  .hero-actions {
    justify-content: flex-start;
    gap: 10px;
  }

  .primary-action,
  .secondary-action {
    flex: 0 0 auto;
    min-width: auto;
    padding: 0 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-panel {
    min-height: auto;
  }
}

@media (max-width: 320px) {
  .primary-action,
  .secondary-action {
    flex: 1 1 100%;
  }
}
</style>
