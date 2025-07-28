<template>
  <div class="loading-spinner" :class="sizeClass">
    <div class="spinner"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const sizeClass = computed(() => `spinner-${props.size}`)
</script>

<style scoped>
.loading-spinner {
  display: inline-block;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner-medium .spinner {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner-large .spinner {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
