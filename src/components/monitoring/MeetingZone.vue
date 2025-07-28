<template>
  <div class="meeting-zone" :class="zoneClasses">
    <div class="zone-header">
      <h3 class="zone-title">{{ zone.name }}</h3>
      <span class="zone-capacity">{{ totalOccupancy }}/{{ zone.capacity }}</span>
    </div>

    <div class="zone-directions">
      <div class="zone-direction">
        <span class="direction-label">上行</span>
        <span class="zone-status" :class="`status-${zone.upstream}`">
          {{ getZoneStatusText(zone.upstream) }}
        </span>
        <span class="vehicle-count">({{ zone.upstreamCount }})</span>
      </div>

      <div class="zone-direction">
        <span class="direction-label">下行</span>
        <span class="zone-status" :class="`status-${zone.downstream}`">
          {{ getZoneStatusText(zone.downstream) }}
        </span>
        <span class="vehicle-count">({{ zone.downstreamCount }})</span>
      </div>
    </div>

    <div class="zone-footer">
      <div class="occupancy-bar">
        <div
          class="occupancy-fill"
          :style="{ width: occupancyPercentage + '%' }"
          :class="occupancyClass"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MeetingZoneType } from '@/types/monitoring'
import { getZoneStatusText } from '@/utils/format'

interface Props {
  zone: MeetingZoneType
}

const props = defineProps<Props>()

defineEmits<{
  update: [data: { id: number, updates: Partial<MeetingZoneType> }]
}>()

const zoneClasses = computed(() => ({
  'zone-full': props.zone.full,
  'zone-critical': occupancyPercentage.value >= 90
}))

const totalOccupancy = computed(() =>
  props.zone.upstreamCount + props.zone.downstreamCount
)

const occupancyPercentage = computed(() =>
  Math.round((totalOccupancy.value / props.zone.capacity) * 100)
)

const occupancyClass = computed(() => {
  const percentage = occupancyPercentage.value
  if (percentage >= 90) return 'occupancy-critical'
  if (percentage >= 70) return 'occupancy-warning'
  return 'occupancy-normal'
})
</script>

<style scoped>
.meeting-zone {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #2196f3;
  transition: all 0.3s ease;
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
