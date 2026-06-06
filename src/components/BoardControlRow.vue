<template>
  <div class="board-control-row" :style="rowStyle">
    <div class="board-control-left">
      <slot name="left" />
    </div>

    <div class="board-control-center">
      <slot name="center" />
    </div>

    <div class="board-control-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  maxWidth: {
    type: String,
    default: '832px',
  },
})

const rowStyle = computed(() => ({
  '--board-control-max-width': props.maxWidth,
}))
</script>

<style scoped>
.board-control-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  margin-left: auto;
  margin-right: auto;
  max-width: var(--board-control-max-width);
  width: 100%;
}

.board-control-left,
.board-control-center,
.board-control-right {
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.board-control-left {
  justify-content: flex-start;
}

.board-control-center {
  justify-content: center;
}

.board-control-right {
  justify-content: flex-end;
}
</style>
