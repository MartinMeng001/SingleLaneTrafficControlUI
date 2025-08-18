<!-- src/components/realtime/WaitingArea.vue -->
<template>
  <div class="waiting-area" :class="waitingAreaClasses">
    <div class="waiting-title">等待区 {{ areaId }}</div>
    <div class="vehicle-counts">
      <div class="count-item">
        <span class="direction-label">上行:</span>
        <span class="vehicle-count" :class="{ 'has-vehicles': upstreamCount > 0 }">
          {{ upstreamCount }}
        </span>
      </div>
      <div class="count-item">
        <span class="direction-label">下行:</span>
        <span class="vehicle-count" :class="{ 'has-vehicles': downstreamCount > 0 }">
          {{ downstreamCount }}
        </span>
      </div>
    </div>

    <!-- 车辆指示器 -->
    <div class="vehicle-indicators">
      <div class="indicator-row">
        <span class="indicator-label">上:</span>
        <div class="vehicle-dots">
          <div
            v-for="i in Math.min(upstreamCount, 5)"
            :key="`up-${i}`"
            class="vehicle-dot upstream"
          ></div>
          <span v-if="upstreamCount > 5" class="more-vehicles">+{{ upstreamCount - 5 }}</span>
        </div>
      </div>
      <div class="indicator-row">
        <span class="indicator-label">下:</span>
        <div class="vehicle-dots">
          <div
            v-for="i in Math.min(downstreamCount, 5)"
            :key="`down-${i}`"
            class="vehicle-dot downstream"
          ></div>
          <span v-if="downstreamCount > 5" class="more-vehicles">+{{ downstreamCount - 5 }}</span>
        </div>
      </div>
    </div>

    <!-- 请求状态指示 -->
    <div class="request-status" v-if="upstreamRequest || downstreamRequest">
      <div v-if="upstreamRequest" class="request-indicator upstream">↑ 上行请求</div>
      <div v-if="downstreamRequest" class="request-indicator downstream">↓ 下行请求</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  areaId: number
  upstreamCount: number
  downstreamCount: number
  upstreamHasVehicle?: boolean
  downstreamHasVehicle?: boolean
  upstreamRequest?: boolean
  downstreamRequest?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  upstreamCount: 0,
  downstreamCount: 0,
  upstreamHasVehicle: false,
  downstreamHasVehicle: false,
  upstreamRequest: false,
  downstreamRequest: false
})

// 计算等待区样式
const waitingAreaClasses = computed(() => {
  const classes = []

  const totalVehicles = props.upstreamCount + props.downstreamCount

  if (totalVehicles === 0) {
    classes.push('empty')
  } else if (totalVehicles >= 8) {
    classes.push('busy')
  } else if (totalVehicles >= 4) {
    classes.push('normal')
  } else {
    classes.push('light')
  }

  if (props.upstreamRequest || props.downstreamRequest) {
    classes.push('has-request')
  }

  return classes
})
</script>

<style scoped>
.waiting-area {
  width: 180px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border: 2px solid #007bff;
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 8px;
  gap: 4px;
}

.waiting-area:hover {
  background-color: #f0f8ff;
  border-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
}

.waiting-area.empty {
  border-color: #6c757d;
  background-color: #f8f9fa;
}

.waiting-area.light {
  border-color: #28a745;
  background-color: #f8fff8;
}

.waiting-area.normal {
  border-color: #ffc107;
  background-color: #fffbf0;
}

.waiting-area.busy {
  border-color: #dc3545;
  background-color: #fff5f5;
  animation: busy-pulse 2s infinite;
}

.waiting-area.has-request {
  border-width: 3px;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
}

@keyframes busy-pulse {
  0%, 100% { border-color: #dc3545; }
  50% { border-color: #ff6b6b; }
}

.waiting-title {
  font-weight: bold;
  color: #0056b3;
  margin-bottom: 4px;
  font-size: 13px;
}

.vehicle-counts {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.count-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.direction-label {
  font-size: 10px;
  color: #6c757d;
  font-weight: 500;
}

.vehicle-count {
  color: #007bff;
  font-weight: bold;
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
  background-color: rgba(0, 123, 255, 0.1);
  min-width: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.vehicle-count.has-vehicles {
  background-color: #007bff;
  color: white;
  animation: count-highlight 1s ease-out;
}

@keyframes count-highlight {
  0% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.vehicle-indicators {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.indicator-row {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.indicator-label {
  font-size: 9px;
  color: #6c757d;
  font-weight: bold;
  min-width: 12px;
}

.vehicle-dots {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 8px;
}

.vehicle-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: dot-pulse 2s infinite;
}

.vehicle-dot.upstream {
  background: #28a745;
}

.vehicle-dot.downstream {
  background: #007bff;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.more-vehicles {
  font-size: 8px;
  color: #6c757d;
  margin-left: 2px;
  font-weight: bold;
}

.request-status {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.request-indicator {
  font-size: 9px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 3px;
  animation: request-blink 1s infinite;
}

.request-indicator.upstream {
  color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
}

.request-indicator.downstream {
  color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

@keyframes request-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .waiting-area {
    width: 150px;
    min-height: 60px;
    padding: 6px;
  }

  .waiting-title {
    font-size: 11px;
  }

  .vehicle-counts {
    gap: 8px;
  }

  .direction-label {
    font-size: 9px;
  }

  .vehicle-count {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .waiting-area {
    width: 120px;
    min-height: 50px;
    padding: 4px;
  }

  .waiting-title {
    font-size: 10px;
  }

  .vehicle-counts {
    flex-direction: column;
    gap: 2px;
  }

  .indicator-row {
    justify-content: flex-start;
  }
}
</style>
