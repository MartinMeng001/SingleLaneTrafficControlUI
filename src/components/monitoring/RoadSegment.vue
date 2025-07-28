<template>
  <div class="road-segment" :class="segmentClasses">
    <div class="segment-header">
      <h3 class="segment-title">{{ segment.name }}</h3>
      <span class="segment-status" :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <div class="directions-container">
      <div class="direction">
        <div class="direction-title">上行</div>
        <TrafficLight
          :state="segment.upstreamLight"
          :size="'medium'"
        />
        <div class="vehicle-indicator" :class="{ active: segment.upstreamVehicles }">
          <span class="vehicle-icon">🚗</span>
          <span class="vehicle-text">{{ segment.upstreamVehicles ? '有车' : '无车' }}</span>
        </div>
      </div>

      <div class="direction">
        <div class="direction-title">下行</div>
        <TrafficLight
          :state="segment.downstreamLight"
          :size="'medium'"
        />
        <div class="vehicle-indicator" :class="{ active: segment.downstreamVehicles }">
          <span class="vehicle-icon">🚗</span>
          <span class="vehicle-text">{{ segment.downstreamVehicles ? '有车' : '无车' }}</span>
        </div>
      </div>
    </div>

    <div class="segment-footer">
      <div class="capacity-info">
        <span class="capacity-text">载量: {{ segment.currentCount }}/{{ segment.capacity }}</span>
        <div class="capacity-bar">
          <div
            class="capacity-fill"
            :style="{ width: capacityPercentage + '%' }"
            :class="capacityClass"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Segment } from '@/types/monitoring'
import { getSegmentStatusText } from '@/utils/format'
import TrafficLight from './TrafficLight.vue'

interface Props {
  segment: Segment
}

const props = defineProps<Props>()

defineEmits<{
  update: [data: { id: number, updates: Partial<Segment> }]
}>()

const segmentClasses = computed(() => ({
  'segment-conflict': props.segment.conflict,
  'segment-warning': props.segment.status === 'warning',
  'segment-empty': props.segment.status === 'empty'
}))

const statusClass = computed(() => `status-${props.segment.status}`)
const statusText = computed(() => getSegmentStatusText(props.segment.status))

const capacityPercentage = computed(() =>
  Math.round((props.segment.currentCount / props.segment.capacity) * 100)
)

const capacityClass = computed(() => {
  const percentage = capacityPercentage.value
  if (percentage >= 90) return 'capacity-critical'
  if (percentage >= 70) return 'capacity-warning'
  return 'capacity-normal'
})
</script>

<style scoped>
.road-segment {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 220px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.segment-conflict {
  border-color: #dc3545;
  box-shadow: 0 0 20px rgba(220, 53, 69, 0.3);
  animation: warning 1s infinite alternate;
}

.segment-warning {
  border-color: #ffc107;
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);
}

.segment-empty {
  border-color: #17a2b8;
  background: #e1f7fa;
}

@keyframes warning {
  from { transform: scale(1); }
  to { transform: scale(1.02); }
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.segment-title {
  margin: 0;
  color: #343a40;
  font-size: 1.1rem;
}

.segment-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-empty { background: #d1ecf1; color: #0c5460; }
.status-normal { background: #d4edda; color: #155724; }
.status-warning { background: #fff3cd; color: #856404; }
.status-conflict { background: #f8d7da; color: #721c24; }

.directions-container {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.direction {
  flex: 1;
  text-align: center;
}

.direction-title {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.vehicle-indicator {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #999;
  transition: all 0.3s ease;
}

.vehicle-indicator.active {
  color: #28a745;
  font-weight: bold;
}

.vehicle-icon {
  display: block;
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.segment-footer {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.capacity-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.capacity-text {
  min-width: 80px;
  color: #666;
}

.capacity-bar {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.capacity-normal { background: #28a745; }
.capacity-warning { background: #ffc107; }
.capacity-critical { background: #dc3545; }
</style>
