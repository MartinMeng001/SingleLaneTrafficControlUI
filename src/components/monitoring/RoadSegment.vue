<template>
  <div
    class="road-segment"
    :class="[
      `status-${segment.status}`,
      {
        'selected': selected,
        'has-conflict': segment.conflict,
        'clickable': true
      }
    ]"
    @click="$emit('click')"
  >
    <!-- 路段名称和状态 -->
    <div class="segment-header">
      <h3 class="segment-name">{{ segment.name }}</h3>
      <div class="segment-status-indicator">
        <StatusIcon :status="segment.status" />
      </div>
    </div>

    <!-- 交通灯状态 -->
    <div class="traffic-lights">
      <div class="light-row">
        <span class="direction-label">上行</span>
        <TrafficLight :state="segment.upstreamLight" />
        <div class="vehicle-indicator" :class="{ 'has-vehicle': segment.upstreamVehicles }">
          {{ segment.upstreamVehicles ? '🚗' : '　' }}
        </div>
      </div>

      <div class="light-row">
        <span class="direction-label">下行</span>
        <TrafficLight :state="segment.downstreamLight" />
        <div class="vehicle-indicator" :class="{ 'has-vehicle': segment.downstreamVehicles }">
          {{ segment.downstreamVehicles ? '🚗' : '　' }}
        </div>
      </div>
    </div>

    <!-- 冲突警告 -->
    <div v-if="segment.conflict" class="conflict-warning">
      <span class="conflict-icon">⚠️</span>
      <span class="conflict-text">冲突</span>
    </div>

    <!-- 容量信息 -->
    <div class="capacity-info">
      <div class="capacity-bar">
        <div
          class="capacity-fill"
          :style="{ width: capacityPercentage + '%' }"
          :class="capacityClass"
        ></div>
      </div>
      <div class="capacity-text">
        {{ segment.currentCount }}/{{ segment.capacity }}
      </div>
    </div>

    <!-- 选中指示器 -->
    <div v-if="selected" class="selection-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Segment } from '@/types/monitoring'
import TrafficLight from './TrafficLight.vue'
import StatusIcon from '../icons/StatusIcon.vue'

interface Props {
  segment: Segment
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

defineEmits<{
  click: []
  update: [data: { id: number, updates: Partial<Segment> }]
}>()

const capacityPercentage = computed(() => {
  return Math.round((props.segment.currentCount / props.segment.capacity) * 100)
})

const capacityClass = computed(() => {
  const percentage = capacityPercentage.value
  if (percentage >= 90) return 'critical'
  if (percentage >= 70) return 'warning'
  return 'normal'
})
</script>

<style scoped>
.road-segment {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  min-width: 180px;
  max-width: 220px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  border: 3px solid transparent;
}

.road-segment.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.road-segment.selected {
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.road-segment.has-conflict {
  border-color: #e74c3c;
  background: linear-gradient(135deg, #fff5f5, #fed7d7);
}

/* 状态颜色 */
.status-empty {
  background: linear-gradient(135deg, #e8f4fd, #d1ecf1);
  border-left: 4px solid #17a2b8;
}

.status-normal {
  background: linear-gradient(135deg, #e8f5e8, #d4edda);
  border-left: 4px solid #28a745;
}

.status-warning {
  background: linear-gradient(135deg, #fff8e1, #fff3cd);
  border-left: 4px solid #ffc107;
}

.status-conflict {
  background: linear-gradient(135deg, #fff5f5, #f8d7da);
  border-left: 4px solid #dc3545;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.segment-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.segment-status-indicator {
  display: flex;
  align-items: center;
}

.traffic-lights {
  margin-bottom: 1rem;
}

.light-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
}

.light-row:last-child {
  margin-bottom: 0;
}

.direction-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #6c757d;
  min-width: 30px;
}

.vehicle-indicator {
  font-size: 1.2rem;
  min-width: 30px;
  text-align: center;
  transition: all 0.3s ease;
}

.vehicle-indicator.has-vehicle {
  animation: vehiclePulse 2s infinite;
}

@keyframes vehiclePulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.conflict-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 6px;
  margin-bottom: 1rem;
  animation: conflictBlink 1s infinite alternate;
}

@keyframes conflictBlink {
  from { background: rgba(231, 76, 60, 0.1); }
  to { background: rgba(231, 76, 60, 0.2); }
}

.conflict-icon {
  font-size: 1rem;
}

.conflict-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e74c3c;
}

.capacity-info {
  margin-top: 1rem;
}

.capacity-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.capacity-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.capacity-fill.normal {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.capacity-fill.warning {
  background: linear-gradient(90deg, #ffc107, #fd7e14);
}

.capacity-fill.critical {
  background: linear-gradient(90deg, #dc3545, #e74c3c);
}

.capacity-text {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6c757d;
}

.selection-indicator {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border: 3px solid #667eea;
  border-radius: 15px;
  pointer-events: none;
  animation: selectionPulse 2s infinite;
}

@keyframes selectionPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.02);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .road-segment {
    min-width: 160px;
    max-width: 200px;
    padding: 0.875rem;
  }

  .segment-name {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .road-segment {
    min-width: 140px;
    max-width: 180px;
    padding: 0.75rem;
  }

  .light-row {
    padding: 0.375rem;
  }

  .direction-label {
    font-size: 0.8rem;
    min-width: 25px;
  }

  .vehicle-indicator {
    font-size: 1rem;
    min-width: 25px;
  }
}
</style>
