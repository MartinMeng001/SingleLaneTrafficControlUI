<template>
  <div class="status-icon" :class="iconClass">
    <span class="icon-symbol">{{ iconSymbol }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SegmentStatus } from '@/types/monitoring'

interface Props {
  status: SegmentStatus
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const iconClass = computed(() => [
  `status-${props.status}`,
  `size-${props.size}`
])

const iconSymbol = computed(() => {
  switch (props.status) {
    case 'empty': return '⚪'
    case 'normal': return '🟢'
    case 'warning': return '🟡'
    case 'conflict': return '🔴'
    default: return '❔'
  }
})
</script>

<style scoped>
.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.size-small {
  width: 20px;
  height: 20px;
}

.size-medium {
  width: 24px;
  height: 24px;
}

.size-large {
  width: 32px;
  height: 32px;
}

.icon-symbol {
  font-size: 0.8em;
  line-height: 1;
}

.status-empty {
  background: rgba(23, 162, 184, 0.1);
}

.status-normal {
  background: rgba(40, 167, 69, 0.1);
}

.status-warning {
  background: rgba(255, 193, 7, 0.1);
  animation: warningPulse 2s infinite;
}

.status-conflict {
  background: rgba(220, 53, 69, 0.1);
  animation: conflictPulse 1s infinite;
}

@keyframes warningPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes conflictPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
</style>
