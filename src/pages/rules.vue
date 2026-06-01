<template>
  <main class="page-shell page-shell-wide">
    <header class="page-header">
      <h1 class="page-title">Rules</h1>
    </header>

    <div class="rules-layout">
      <nav class="rules-nav" aria-label="Rules sections">
        <div class="site-panel">
          <a v-for="rule in rules" :key="rule.id" :href="`#${rule.id}`">{{ rule.name }}</a>
        </div>
      </nav>

      <section class="content-stack">
        <article id="attacking" class="site-panel rule-card">
          <h2>Attacking</h2>
          <p>The number next to each piece shows its health points.</p>
          <p>When you perform a standard attack, one of two things happens:</p>
          <p><b>1.</b> If your piece has enough ability points to destroy the enemy piece, it moves to its position.</p>
          <p><b>2.</b> Otherwise, it moves toward the enemy piece and stops one square away. The attacked piece then loses health points equal to the attacker's ability points.</p>
        </article>

        <article id="king" class="site-panel rule-card">
          <div class="rule-content">
            <div>
              <h2>King</h2>
              <p><b>Health points:</b> 10</p>
              <p><b>Ability points:</b> 60</p>
              <p>The king moves one square in any direction: horizontally, vertically, or diagonally. The game is over when the king loses its health points.</p>
              <h3>Castling</h3>
              <p>Castling is a special move that allows the king to move two squares horizontally towards the pirate and then moving the pirate to the square that the king passed over. The king and the pirate must be in their original positions, and there must be no pieces between them.</p>
              <p><b>Note:</b> Unlike in chess, it does not matter whether the square the king passes over is attacked by an enemy piece.</p>
              <p><b>Note:</b> Unlike in chess, it does not matter whether the pieces have moved before.</p>
            </div>
            <img src="@/assets/wK.png" alt="King" class="rule-piece" />
          </div>
        </article>

        <article id="queen" class="site-panel rule-card">
          <div class="rule-content">
            <div>
              <h2>Queen</h2>
              <p><b>Health points:</b> 10</p>
              <p><b>Ability points:</b> 30</p>
              <p>The queen moves any number of squares in any direction: horizontally, vertically, or diagonally. Queens have the most versatile movement of all the pieces.</p>
              <h3>Queen-Maenad ability</h3>
              <p>When placed 1 square diagonally to an allied maenad, the queen can throw the maenad and destroy the first enemy piece in its path. Neighbouring enemy pieces will take 20 damage.</p>
            </div>
            <img src="@/assets/wQ.png" alt="Queen" class="rule-piece" />
          </div>
        </article>

        <article id="pawn" class="site-panel rule-card">
          <div class="rule-content">
            <div>
              <h2>Pawn</h2>
              <p><b>Health points:</b> 30</p>
              <p><b>Ability points:</b> 60</p>
              <p>The pawn moves forward one square, except when attacking a piece diagonally. It can move two squares forward from its starting position. Pawns are the only pieces that attack differently from how they move.</p>
              <p><b>Note:</b> Unlike in chess, there is no en passant rule in this game.</p>
              <h3>Pawn promotion</h3>
              <p>When a pawn reaches the last row, it transforms into a pirate.</p>
            </div>
            <img src="@/assets/wp.png" alt="Pawn" class="rule-piece" />
          </div>
        </article>

        <article id="maenad" class="site-panel rule-card">
          <div class="rule-content">
            <div>
              <h2>Maenad</h2>
              <p><b>Health points:</b> 10</p>
              <p><b>Ability points:</b> 30</p>
              <p>The maenad moves diagonally any number of squares and also one square in any other direction.</p>
            </div>
            <img src="@/assets/wM.png" alt="Maenad" class="rule-piece" />
          </div>
        </article>

        <article id="pirate" class="site-panel rule-card">
          <div class="rule-content">
            <div>
              <h2>Pirate</h2>
              <p><b>Health points:</b> 60</p>
              <p><b>Ability points:</b> 30</p>
              <p>The pirate moves horizontally or vertically any number of squares.</p>
              <h3>Pirate-Pirate ability</h3>
              <p>When placed 1 square horizontally or vertically to an allied pirate, the pirate can throw the allied pirate and destroy the first enemy piece in its path. Neighbouring enemy pieces will take 20 damage.</p>
            </div>
            <img src="@/assets/wPirate.png" alt="Pirate" class="rule-piece" />
          </div>
        </article>

        <article id="knight" class="site-panel rule-card">
          <div class="rule-content">
            <div>
              <h2>Knight</h2>
              <p><b>Health points:</b> 60</p>
              <p><b>Ability points:</b> 60</p>
              <p>The knight moves in an L-shape: two squares in one direction and then one square perpendicular to that direction. Knights are the only pieces that can jump over other pieces.</p>
            </div>
            <img src="@/assets/wN.png" alt="Knight" class="rule-piece" />
          </div>
        </article>

        <article id="threefold-repetition" class="site-panel rule-card">
          <h2>Threefold Repetition</h2>
          <p>If the same position occurs three times, the game automatically ends in a draw.</p>
        </article>

        <article id="three-hundred-thirty-three-move-rule" class="site-panel rule-card">
          <h2>333-Move Rule</h2>
          <p>If the game reaches move 333, it automatically ends in a draw.</p>
          <p><b>Note:</b> Move here refers to an action taken by a single player. Two Nichess moves are equivalent to one chess move.</p>
        </article>
      </section>
    </div>
  </main>
</template>

<script setup>
import { useHead } from '@unhead/vue'

useHead({
  title: 'Rules',
  link: [
    { rel: 'canonical', href: 'https://www.nichess.org/rules' },
  ],
  meta: [
    { name: 'description', content: 'Learn the rules of Nichess: how pieces attack, health points, ability points, and special abilities for each piece.' },
    { property: 'og:title', content: 'Rules' },
    { property: 'og:description', content: 'Learn the rules of Nichess: how pieces attack, health points, ability points, and special abilities for each piece.' },
    { property: 'og:url', content: 'https://www.nichess.org/rules' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://www.nichess.org/pwa-512x512.png' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Rules' },
    { name: 'twitter:description', content: 'Learn the rules of Nichess: how pieces attack, health points, ability points, and special abilities for each piece.' },
  ],
})

const rules = [
  {
    id: 'attacking',
    name: 'Attacking',
  },
  {
    id: 'king',
    name: 'King',
  },
  {
    id: 'queen',
    name: 'Queen',
  },
  {
    id: 'pawn',
    name: 'Pawn',
  },
  {
    id: 'maenad',
    name: 'Maenad',
  },
  {
    id: 'pirate',
    name: 'Pirate',
  },
  {
    id: 'knight',
    name: 'Knight',
  },
  {
    id: 'threefold-repetition',
    name: 'Threefold Repetition',
  },
  {
    id: 'three-hundred-thirty-three-move-rule',
    name: '333-Move Rule',
  },


]
</script>
