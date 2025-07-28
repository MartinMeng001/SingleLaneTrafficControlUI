<template>
  <div class="traffic-light" :class="lightClasses">
    <div class="light-indicator">
      {{ lightSymbol }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LightState } from '@/types/monitoring'

interface Props {
  state: LightState
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const lightClasses = computed(() => [
  `light-${props.state}`,
  `light-${props.size}`
])

const lightSymbol = computed(() => {
  switch (props.state) {
    case 'green': return 'G'
    case 'red': return 'R'
    case 'yellow': return 'Y'
    default: return '?'
  }
})
</script>

<style scoped>
.traffic-light {
  border-radius: 50%;
  border: 3px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  margin: 0 auto;
  transition: all 0.3s ease;
}

.light-small {
  width: 30px;
  height: 30px;
  font-size: 0.8rem;
}

.light-medium {
  width: 40px;
  height: 40px;
  font-size: 1rem;
}

.light-large {
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
}

.light-red {
  background: #dc3545;
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.5);
}

.light-green {
  background: #28a745;
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.5);
}

.light-yellow {
  background: #ffc107;
  color: #333;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
}
</style>
