<template>
  <div class="statistics-card" :class="cardClass">
    <div class="card-header">
      <span class="card-title">{{ title }}</span>
      <div class="trend-indicator" v-if="trend !== 'stable'">
        <span class="trend-icon" :class="`trend-${trend}`">
          {{ trendIcon }}
        </span>
      </div>
    </div>

    <div class="card-content">
      <div class="stat-value">
        <span class="stat-number">{{ formattedValue }}</span>
        <span class="stat-unit" v-if="unit">{{ unit }}</span>
      </div>

      <div class="card-footer">
        <div class="value-bar">
          <div
            class="value-fill"
            :style="{ width: normalizedPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  trend: 'stable',
  color: 'blue',
  max: 100
})

const cardClass = computed(() => `card-${props.color}`)

const formattedValue = computed(() => {
  if (props.value >= 1000) {
    return (props.value / 1000).toFixed(1) + 'K'
  }
  return props.value.toString()
})

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'up': return '↗'
    case 'down': return '↘'
    default: return '→'
  }
})

const normalizedPercentage = computed(() => {
  return Math.min((props.value / props.max) * 100, 100)
})
</script>

<style scoped>
.statistics-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.statistics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.card-green { background: linear-gradient(135deg, #56ab2f, #a8e6cf); }
.card-red { background: linear-gradient(135deg, #ff416c, #ff4b2b); }
.card-purple { background: linear-gradient(135deg, #a8edea, #fed6e3); }

.statistics-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.statistics-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 500;
}

.trend-indicator {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.trend-up { color: #4caf50; }
.trend-down { color: #f44336; }

.card-content {
  position: relative;
  z-index: 1;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
}

.stat-unit {
  font-size: 1rem;
  opacity: 0.8;
}

.card-footer {
  margin-top: 1rem;
}

.value-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.value-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  transition: width 0.3s ease;
}

@media (max-width: 480px) {
  .statistics-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 2rem;
  }

  .card-title {
    font-size: 0.8rem;
  }
}
</style>
