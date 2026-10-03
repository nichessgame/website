<template>
  <main class="page-shell">
    <header class="page-header">
      <h1 class="page-title">Donate</h1>
      <p class="page-subtitle">If you'd like to support the development of Nichess, consider donating.</p>
    </header>

    <section class="donation-grid" aria-label="Donation methods">
      <article class="site-panel patreon-panel">
        <h2>Patreon</h2>
        <p>
          <a class="site-link" href="https://www.patreon.com/join/nichessgame">https://www.patreon.com/join/nichessgame</a>
        </p>
      </article>

      <article class="site-panel donation-panel">
        <h2>BTC</h2>
        <img src="@/assets/btc_qr.png" alt="Bitcoin donation QR code" class="qr-code" />
        <p class="address-text">
        bc1qj77tuw0x7llvehwjq5yw3luzeefpu8dmtlgy4r
        </p>
      </article>

      <article class="site-panel donation-panel">
        <h2>ETH</h2>
        <img src="@/assets/eth_qr.png" alt="Ethereum donation QR code" class="qr-code" />
        <p class="address-text">
        0x952838143173312f1F9B9416226A21105604D135
        </p>
      </article>

      <article class="site-panel donation-panel">
        <h2>XMR</h2>
        <img src="@/assets/monero_qr.png" alt="Monero donation QR code" class="qr-code" />
        <p class="address-text">
        43HhtcAuDyL5i8ozADfar64yA4NF5XARrMvJeEJWQhEb47JzrEHkDf3fb1mS3Krp3KJwktbvfNtjtf4DM5w963wT6Z1pGnQ
        </p>
      </article>
    </section>
  </main>
</template>

<script setup>
import { useHead } from '@unhead/vue'

useHead({
  title: 'Donate',
  link: [
    { rel: 'canonical', href: 'https://www.nichess.org/donate' },
  ],
  meta: [
    { name: 'description', content: 'Support Nichess development. Donate via Patreon, Bitcoin, Ethereum, or Monero.' },
    { property: 'og:title', content: 'Donate' },
    { property: 'og:description', content: 'Support Nichess development. Donate via Patreon, Bitcoin, Ethereum, or Monero.' },
    { property: 'og:url', content: 'https://www.nichess.org/donate' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://www.nichess.org/pwa-512x512.png' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Donate - Nichess' },
    { name: 'twitter:description', content: 'Support Nichess development. Donate via Patreon, Bitcoin, Ethereum, or Monero.' },
  ],
})
</script>

<style scoped>
.donation-grid {
  display: grid;
  gap: clamp(14px, 2vw, 20px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.patreon-panel {
  grid-column: 1 / -1;
}

.donation-panel {
  align-content: start;
  display: grid;
  gap: 12px;
}

.qr-code {
  background: #ffffff;
  border-radius: 4px;
  display: block;
  height: 168px;
  image-rendering: pixelated;
  padding: 6px;
  width: 168px;
}

@media (max-width: 760px) {
  .donation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
