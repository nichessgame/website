<template>
  <v-container max-width="900">
    <v-row>
      <v-col cols="12" md="3">
        <v-list>
          <v-list-item
            v-for="rule in rules"
            :key="rule.id"
            :href="`#${rule.id}`"
            :title="rule.name"
          />
        </v-list>
      </v-col>

      <v-col cols="12" md="9">
        <v-card
          id="king"
          class="mb-6"
        >
          <v-card-title> King </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2"><b>Health points:</b> 10</p>
                <p class="mb-2"><b>Ability points:</b> 60</p>
                <p class="mb-2">The king moves one square in any direction: horizontally, vertically, or diagonally. The game is over when the king loses its health points.</p>
                <h4 class="mb-2">Castling</h4>
                <p class="mb-2">Castling is a special move that allows the king to move two squares horizontally towards the pirate and then moving the pirate to the square that the king passed over. The king and the pirate must be in their original positions, and there must be no pieces between them.</p>
                <p class="mb-2"><b>Note:</b> Unlike in chess, it does not matter whether the square the king passes over is attacked
                  by an enemy piece.</p>
                <p class="mb-2"><b>Note:</b> Unlike in chess, it does not matter whether the pieces have moved before.</p>
              </v-col>
              <v-col cols="12" md="4">
                <v-img
                  src='@/assets/wK.png'
                  contain
                  height="150"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card
          id="queen"
          class="mb-6"
        >
          <v-card-title> Queen </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2"><b>Health points:</b> 10</p>
                <p class="mb-2"><b>Ability points:</b> 30</p>
                <p class="mb-2">The queen moves any number of squares in any direction: horizontally, vertically, or diagonally. Queens have the most versatile movement of all the pieces.</p>
                <h4 class="mb-2">Queen-Maenad ability</h4>
                <p class="mb-2">When placed 1 square diagonally to an allied maenad, the queen can throw the maenad and destroy the first enemy piece in its path. Neighbouring enemy pieces will take 20 damage.</p>
              </v-col>
              <v-col cols="12" md="4">
                <v-img
                  src='@/assets/wQ.png'
                  contain
                  height="150"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card
          id="pawn"
          class="mb-6"
        >
          <v-card-title> Pawn </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2"><b>Health points:</b> 30</p>
                <p class="mb-2"><b>Ability points:</b> 60</p>
                <p class="mb-2">The pawn moves forward one square, except when attacking a piece diagonally. It can move two squares forward from its starting position. Pawns are the only pieces that attack differently from how they move.</p>
                <p class="mb-2"><b>Note:</b> Unlike in chess, there is no en passant rule in this game.</p>

                <h4 class="mb-2">Pawn promotion</h4>
                <p class="mb-2">When a pawn reaches the last row, it transforms into a pirate.</p>
              </v-col>
              <v-col cols="12" md="4">
                <v-img
                  src='@/assets/wp.png'
                  contain
                  height="150"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card
          id="maenad"
          class="mb-6"
        >
          <v-card-title> Maenad </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2"><b>Health points:</b> 10</p>
                <p class="mb-2"><b>Ability points:</b> 30</p>
                <p class="mb-2">The maenad moves diagonally any number of squares and also one square in any other direction.</p>
              </v-col>
              <v-col cols="12" md="4">
                <v-img
                  src='@/assets/wM.png'
                  contain
                  height="165"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card
          id="pirate"
          class="mb-6"
        >
          <v-card-title> Pirate </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2"><b>Health points:</b> 60</p>
                <p class="mb-2"><b>Ability points:</b> 30</p>
                <p class="mb-2">The pirate moves horizontally or vertically any number of squares.</p>
                <h4 class="mb-2">Pirate-Pirate ability</h4>
                <p class="mb-2">When placed 1 square horizontally or vertically to an allied pirate,
                  the pirate can throw the allied pirate and destroy the first enemy piece in its path. Neighbouring enemy pieces will take 20 damage.</p>
              </v-col>
              <v-col cols="12" md="4">
                <v-img
                  src='@/assets/wPirate.png'
                  contain
                  height="165"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card
          id="knight"
          class="mb-6"
        >
          <v-card-title> Knight </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2"><b>Health points:</b> 60</p>
                <p class="mb-2"><b>Ability points:</b> 60</p>
                <p class="mb-2">The knight moves in an L-shape: two squares in one direction and then one square perpendicular to that direction. Knights are the only pieces that can jump over other pieces.</p>
              </v-col>
              <v-col cols="12" md="4">
                <v-img
                  src='@/assets/wN.png'
                  contain
                  height="150"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card
          id="threefold-repetition"
          class="mb-6"
        >
          <v-card-title> Threefold Repetition </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2">If the same position occurs three times, the game automatically ends in a draw.</p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card
          id="three-hundred-thirty-three-move-rule"
          class="mb-6"
        >
          <v-card-title> 333-Move Rule </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <p class="mb-2">If the game reaches move 333, it automatically ends in a draw.</p>
                <p class="mb-2"><b>Note:</b> Move here refers to an action taken by a single player. Two Nichess moves are equivalent to one chess move.</p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>


      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const rules = [
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

<style scoped>
.v-card {
  scroll-margin-top: 80px; /* Prevents header from covering content when jumping to anchor */
}
</style>
