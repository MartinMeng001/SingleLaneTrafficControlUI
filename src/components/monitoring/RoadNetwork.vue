<template>
  <div class="road-network">
    <div class="network-container">
      <!-- 上层：路段层 -->
      <div class="segments-layer">
        <RoadSegment
          v-for="segment in segments"
          :key="segment.id"
          :segment="segment"
          :selected="selectedSegment?.id === segment.id"
          @click="selectSegment(segment)"
          @update="$emit('updateSegment', $event)"
        />
      </div>

      <!-- 下层：会车区层 -->
      <div class="zones-layer">
        <!-- 左侧下行入口 -->
        <div class="entrance-area left-entrance">
          <div class="entrance-label">下行入口</div>
          <div class="queue-info">
            <span class="queue-icon">🚗</span>
            <span class="queue-count">{{ downstreamQueue }}</span>
          </div>
        </div>

        <!-- 会车区 -->
        <MeetingZone
          v-for="zone in meetingZones"
          :key="zone.id"
          :zone="zone"
          :selected="selectedZone?.id === zone.id"
          @click="selectZone(zone)"
          @update="$emit('updateZone', $event)"
        />

        <!-- 右侧上行入口 -->
        <div class="entrance-area right-entrance">
          <div class="entrance-label">上行入口</div>
          <div class="queue-info">
            <span class="queue-icon">🚗</span>
            <span class="queue-count">{{ upstreamQueue }}</span>
          </div>
        </div>
      </div>

      <!-- 连接线 -->
      <div class="connection-lines">
        <div
          v-for="i in segments.length - 1"
          :key="i"
          class="connection-line"
          :style="{ left: `${(i * 100 / segments.length) + (50 / segments.length)}%` }"
        ></div>
      </div>
    </div>

    <!-- 路段详细信息弹窗 -->
    <SegmentDetailModal
      v-if="selectedSegment"
      :segment="selectedSegment"
      @close="selectedSegment = null"
    />

    <!-- 会车区控制弹窗 -->
    <ZoneControlModal
      v-if="selectedZone"
      :zone="selectedZone"
      @close="selectedZone = null"
      @control="handleZoneControl"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Segment, MeetingZoneType } from '@/types/monitoring'
import RoadSegment from './RoadSegment.vue'
import MeetingZone from './MeetingZone.vue'
import SegmentDetailModal from './SegmentDetailModal.vue'
import ZoneControlModal from './ZoneControlModal.vue'

interface Props {
  segments: Segment[]
  meetingZones: MeetingZoneType[]
  upstreamQueue?: number
  downstreamQueue?: number
}

const props = withDefaults(defineProps<Props>(), {
  upstreamQueue: 0,
  downstreamQueue: 0
})

defineEmits<{
  updateSegment: [data: { id: number, updates: Partial<Segment> }]
  updateZone: [data: { id: number, updates: Partial<MeetingZoneType> }]
  zoneControl: [data: { zoneId: number, action: string }]
}>()

const selectedSegment = ref<Segment | null>(null)
const selectedZone = ref<MeetingZoneType | null>(null)

const selectSegment = (segment: Segment) => {
  selectedSegment.value = segment
  selectedZone.value = null
}

const selectZone = (zone: MeetingZoneType) => {
  selectedZone.value = zone
  selectedSegment.value = null
}

const handleZoneControl = (data: { zoneId: number, action: string }) => {
  // 发送控制指令到父组件
  $emit('zoneControl', data)
  selectedZone.value = null
}
</script>

<style scoped>
.road-network {
  margin: 2rem 0;
  position: relative;
}

.network-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* 路段层 */
.segments-layer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  z-index: 2;
  position: relative;
}

/* 会车区层 */
.zones-layer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  z-index: 1;
  position: relative;
}

/* 入口区域 */
.entrance-area {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  border-radius: 8px;
  padding: 1rem;
  min-width: 120px;
  text-align: center;
  border: 2px solid #e17055;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.entrance-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #d63031;
  margin-bottom: 0.5rem;
}

.queue-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.queue-icon {
  font-size: 1.2rem;
}

.queue-count {
  background: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: bold;
  color: #d63031;
  min-width: 30px;
}

/* 连接线 */
.connection-lines {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 0;
}

.connection-line {
  position: absolute;
  top: -2px;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transform: translateX(-50%);
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .network-container {
    gap: 1.5rem;
  }

  .segments-layer,
  .zones-layer {
    gap: 0.5rem;
  }

  .entrance-area {
    min-width: 100px;
    padding: 0.75rem;
  }
}

@media (max-width: 768px) {
  .network-container {
    flex-direction: column;
    align-items: center;
  }

  .segments-layer {
    flex-wrap: wrap;
    justify-content: center;
  }

  .zones-layer {
    flex-wrap: wrap;
    justify-content: center;
  }

  .connection-lines {
    display: none;
  }

  .entrance-area {
    order: -1;
    margin-bottom: 1rem;
  }

  .left-entrance {
    order: 1;
  }

  .right-entrance {
    order: 3;
  }
}
</style>
