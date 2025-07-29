<template>
  <div
    class="meeting-zone"
    :class="[
      `status-${overallStatus}`,
      {
        'selected': selected,
        'full': zone.full,
        'clickable': true
      }
    ]"
    @click="$emit('click')"
  >
    <!-- 会车区名称 -->
    <div class="zone-header">
      <h3 class="zone-name">{{ zone.name }}</h3>
      <div class="zone-status-badge" :class="`badge-${overallStatus}`">
        {{ getStatusText(overallStatus) }}
      </div>
    </div>

    <!-- 方向状态 -->
    <div class="directions">
      <div class="direction-section">
        <div class="direction-header">
          <span class="direction-icon">⬆️</span>
          <span class="direction-label">上行</span>
        </div>
        <div class="direction-status" :class="`status-${zone.upstream}`">
          <span class="status-text">{{ getZoneStatusText(zone.upstream) }}</span>
          <span class="vehicle-count">({{ zone.upstreamCount || 0 }})</span>
        </div>
        <div class="direction-visual">
          <div
            v-for="i in Math.min(zone.upstreamCount || 0, 3)"
            :key="`up-${i}`"
            class="vehicle-dot upstream"
          ></div>
        </div>
      </div>

      <div class="direction-section">
        <div class="direction-header">
          <span class="direction-icon">⬇️</span>
          <span class="direction-label">下行</span>
        </div>
        <div class="direction-status" :class="`status-${zone.downstream}`">
          <span class="status-text">{{ getZoneStatusText(zone.downstream) }}</span>
          <span class="vehicle-count">({{ zone.downstreamCount || 0 }})</span>
        </div>
        <div class="direction-visual">
          <div
            v-for="i in Math.min(zone.downstreamCount || 0, 3)"
            :key="`down-${i}`"
            class="vehicle-dot downstream"
          ></div>
        </div>
      </div>
    </div>

    <!-- 容量指示器 -->
    <div class="capacity-indicator">
      <div class="capacity-label">容量</div>
      <div class="capacity-bar">
        <div
          class="capacity-fill"
          :style="{ width: capacityPercentage + '%' }"
          :class="capacityClass"
        ></div>
      </div>
      <div class="capacity-text">
        {{ totalOccupancy }}/{{ zone.capacity }}
      </div>
    </div>

    <!-- 满载警告 -->
    <div v-if="zone.full" class="full-warning">
      <span class="warning-icon">🚫</span>
      <span class="warning-text">已满</span>
    </div>

    <!-- 选中指示器 -->
    <div v-if="selected" class="selection-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MeetingZoneType } from '@/types/monitoring'

interface Props {
  zone: MeetingZoneType
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

defineEmits<{
  click: []
  update: [data: { id: number, updates: Partial<MeetingZoneType> }]
}>()

const totalOccupancy = computed(() => {
  return (props.zone.upstreamCount || 0) + (props.zone.downstreamCount || 0)
})

const capacityPercentage = computed(() => {
  return Math.round((totalOccupancy.value / props.zone.capacity) * 100)
})

const capacityClass = computed(() => {
  const percentage = capacityPercentage.value
  if (percentage >= 90) return 'critical'
  if (percentage >= 70) return 'warning'
  return 'normal'
})

const overallStatus = computed(() => {
  if (props.zone.full) return 'full'
  if (totalOccupancy.value > 0) return 'occupied'
  return 'empty'
})

const getZoneStatusText = (status: string) => {
  switch (status) {
    case 'empty': return '空闲'
    case 'occupied': return '有车'
    case 'full': return '满载'
    default: return '未知'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'empty': return '空闲'
    case 'occupied': return '使用中'
    case 'full': return '已满'
    default: return '未知'
  }
}
</script>

<style scoped>
.meeting-zone {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  min-width: 200px;
  max-width: 240px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  border: 3px solid transparent;
}

.meeting-zone.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.meeting-zone.selected {
  border-color: #28a745;
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
}

.zone-full {
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-color: #f44336;
}

.zone-critical {
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.zone-title {
  margin: 0;
  color: #1976d2;
  font-size: 1.1rem;
}

.zone-capacity {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #1976d2;
}

.zone-directions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.zone-direction {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  font-size: 0.9rem;
}

.direction-label {
  font-weight: 600;
  color: #1976d2;
}

.zone-status {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-empty { background: #e8f5e8; color: #2e7d32; }
.status-occupied { background: #fff3e0; color: #ef6c00; }
.status-full { background: #ffebee; color: #c62828; }

.vehicle-count {
  font-size: 0.8rem;
  color: #666;
}

.zone-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.5);
  padding-top: 0.75rem;
}

.occupancy-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 3px;
  overflow: hidden;
}

.occupancy-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.occupancy-normal { background: #4caf50; }
.occupancy-warning { background: #ff9800; }
.occupancy-critical { background: #f44336; }
</style>
