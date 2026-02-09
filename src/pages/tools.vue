<template>
  <v-container max-width="900px" class="mt-2">
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
</script>

<style scoped>
</style>
