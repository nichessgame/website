<template>
  <v-container class="mt-2" max-width="900">
    <v-card class="pa-6" elevation="4">
      <div class="text-h4"> Donate </div>
      <div class="mt-2">
      If you'd like to see a multiplayer server, consider donating.
      </div>
      <div class="text-h6 mt-md-4 mt-2"> Patreon </div>
      <div class="mt-2">
        <a class="custom-link"
          href="https://www.patreon.com/join/nichessgame">https://www.patreon.com/join/nichessgame</a>
      </div>
      <div class="text-h6 mt-md-4 mt-2"> BTC </div>
      <v-row class="mt-2">
        <v-col>
          <div class="d-flex justify-start">
            <v-img
              src="@/assets/btc_qr.png"
              max-width="155"
              max-height="155"
              contain
            ></v-img>
          </div>
        </v-col>
      </v-row>
      <div class="mt-2">
        bc1qj77tuw0x7llvehwjq5yw3luzeefpu8dmtlgy4r
      </div>

      <div class="text-h6 mt-md-4 mt-2"> ETH </div>
      <v-row class="mt-2">
        <v-col>
          <div class="d-flex justify-start">
            <v-img
              src="@/assets/eth_qr.png"
              max-width="132"
              max-height="132"
              contain
            ></v-img>
          </div>
        </v-col>
      </v-row>
      <div class="mt-2">
        0x952838143173312f1F9B9416226A21105604D135
      </div>
      <div class="text-h6 mt-md-4 mt-2"> XMR </div>
      <v-row class="mt-2">
        <v-col>
          <div class="d-flex justify-start">
            <v-img
              src="@/assets/monero_qr.png"
              max-width="240"
              max-height="240"
              contain
            ></v-img>
          </div>
        </v-col>
      </v-row>
      <div class="mt-2">
        43HhtcAuDyL5i8ozADfar64yA4NF5XARrMvJeEJWQhEb47JzrEHkDf3fb1mS3Krp3KJwktbvfNtjtf4DM5w963wT6Z1pGnQ
      </div>
    </v-card>
  </v-container>

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
.custom-link {
  color: #6393ea;
  text-decoration: underline;
}
.custom-link:hover {
  cursor:pointer;
}

.v-card {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
</style>

