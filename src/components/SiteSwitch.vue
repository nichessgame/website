<template>
  <label class="site-switch">
    <input
      v-bind="$attrs"
      class="site-switch-input"
      type="checkbox"
      role="switch"
      :checked="modelValue"
      @change="emit('update:modelValue', $event.target.checked)"
    />
    <span class="site-switch-track" aria-hidden="true" />
    <span v-if="label" class="site-switch-label">{{ label }}</span>
  </label>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: Boolean,
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.site-switch {
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  position: relative;
}

/* Visually hidden, but still focusable and announced as a switch */
.site-switch-input {
  height: 1px;
  margin: 0;
  opacity: 0;
  position: absolute;
  width: 1px;
}

.site-switch-track {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  flex-shrink: 0;
  height: 20px;
  position: relative;
  transition: background-color 140ms ease;
  width: 36px;
}

.site-switch-track::after {
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  content: "";
  height: 16px;
  left: 2px;
  position: absolute;
  top: 2px;
  transition: transform 140ms ease;
  width: 16px;
}

.site-switch:hover .site-switch-track {
  background: rgba(255, 255, 255, 0.3);
}

.site-switch-input:checked + .site-switch-track {
  background: var(--site-switch);
}

.site-switch-input:checked + .site-switch-track::after {
  transform: translateX(16px);
}

.site-switch-input:focus-visible + .site-switch-track {
  outline: 2px solid rgba(226, 232, 240, 0.6);
  outline-offset: 2px;
}

.site-switch-label {
  color: var(--site-text);
  font-size: 0.92rem;
}
</style>
