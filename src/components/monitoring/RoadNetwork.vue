<template>
  <div class="road-network">
    <div class="network-container">
      <!-- 路段0 -->
      <RoadSegment
        :segment="segments[0]"
        @update="$emit('updateSegment', $event)"
      />

      <div class="connection-line"></div>

      <!-- 会车区0 -->
      <MeetingZone
        :zone="meetingZones[0]"
        @update="$emit('updateZone', $event)"
      />

      <div class="connection-line"></div>

      <!-- 路段1 -->
      <RoadSegment
        :segment="segments[1]"
        @update="$emit('updateSegment', $event)"
      />

      <div class="connection-line"></div>

      <!-- 会车区1 -->
      <MeetingZone
        :zone="meetingZones[1]"
        @update="$emit('updateZone', $event)"
      />

      <div class="connection-line"></div>

      <!-- 路段2 -->
      <RoadSegment
        :segment="segments[2]"
        @update="$emit('updateSegment', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Segment, MeetingZoneType } from '@/types/monitoring'
import RoadSegment from './RoadSegment.vue'
import MeetingZone from './MeetingZone.vue'

interface Props {
  segments: Segment[]
  meetingZones: MeetingZoneType[]
}

defineProps<Props>()

defineEmits<{
  updateSegment: [data: { id: number, updates: Partial<Segment> }]
  updateZone: [data: { id: number, updates: Partial<MeetingZoneType> }]
}>()
</script>

<style scoped>
.road-network {
  margin: 2rem 0;
}

.network-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.connection-line {
  width: 40px;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  position: relative;
  flex-shrink: 0;
}

.connection-line::before {
  content: '';
  position: absolute;
  right: -8px;
  top: -4px;
  width: 0;
  height: 0;
  border-left: 8px solid #764ba2;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

@media (max-width: 768px) {
  .network-container {
    flex-direction: column;
  }

  .connection-line {
    width: 4px;
    height: 40px;
    transform: rotate(90deg);
  }

  .connection-line::before {
    right: -4px;
    top: -8px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid #764ba2;
    border-bottom: none;
  }
}
</style>
