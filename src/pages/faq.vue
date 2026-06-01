<template>
  <main class="page-shell">
    <header class="page-header">
      <h1 class="page-title">Frequently Asked Questions</h1>
    </header>

    <section class="content-stack" aria-label="Frequently asked questions">
      <details class="faq-item">
        <summary>What is the point of this? Chess is better.</summary>
        <p>
            Nichess is a superset of chess—it has everything chess has and more. It's only a matter of time before a Nichess variant is made that's better than chess.
        </p>
      </details>

      <details class="faq-item">
        <summary>I don't like X. You should add Y.</summary>
        <p>
            Unfortunately, even a small change requires retraining the AI from scratch. We appreciate the suggestions, but don't expect frequent changes once a variant is released. As more people get involved, we'll be able to make changes more frequently.
        </p>
      </details>

      <details class="faq-item">
        <summary>I made a Nichess variant / I have ideas how to improve Nichess.</summary>
        <p>
            Great. Send your ideas to contact@nichess.org.
        </p>
      </details>

      <details class="faq-item">
        <summary>How can I help?</summary>
        <p>
            Pick something and make it better.
        </p>
      </details>

      <details class="faq-item">
        <summary>Why is the AI playing better/worse on my desktop PC than on my smartphone?</summary>
        <p>
            The AI is running locally, on your device. Its skill level depends on your hardware and software. If the performance is poor, try a different browser or a device. Chromium-based browsers (Chrome, Brave, Edge etc.) tend to perform a bit better than Firefox.
        </p>
      </details>

      <details class="faq-item">
        <summary>I started a game and nothing is happening.</summary>
        <p>
            Sometimes it can take a while to download the AI model. Make sure you have a good internet connection.
        </p>
      </details>

      <details class="faq-item">
        <summary>How do I report a bug?</summary>
        <p>
            Send an email to contact@nichess.org.
        </p>
      </details>
    </section>
  </main>
</template>

<script setup>
import { useHead } from '@unhead/vue'

useHead({
  title: 'Frequently Asked Questions',
  link: [
    { rel: 'canonical', href: 'https://www.nichess.org/faq' },
  ],
  meta: [
    { name: 'description', content: 'Frequently asked questions about Nichess.' },
    { property: 'og:title', content: 'Frequently Asked Questions' },
    { property: 'og:description', content: 'Frequently asked questions about Nichess.' },
    { property: 'og:url', content: 'https://www.nichess.org/faq' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://www.nichess.org/pwa-512x512.png' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'FAQ' },
    { name: 'twitter:description', content: 'Frequently asked questions about Nichess.' },
  ],
})
</script>

<style scoped>
.faq-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.11);
  padding: 12px 0;
}

.faq-item:first-child {
  border-top: 1px solid rgba(255, 255, 255, 0.11);
}

summary {
  color: #f1f3f6;
  cursor: pointer;
  font-size: 0.98rem;
  font-weight: 650;
  line-height: 1.35;
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

details p {
  color: #d0d4dc;
  font-size: 0.92rem;
  line-height: 1.55;
  margin-top: 10px;
}
</style>
