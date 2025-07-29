<template>
  <div class="road-network">
    <!-- 交通统计面板 -->
    <TrafficStatisticsPanel
      :segments="segments"
      :segment-vehicles="segmentVehicles"
      :last-update="lastUpdate"
    />

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
          <div class="queue-details">
            <div class="queue-subtitle">排队车辆</div>
            <div class="queue-vehicles">
              <span
                v-for="vehicle in downstreamQueueVehicles.slice(0, 3)"
                :key="vehicle"
                class="queue-vehicle-id"
              >
                {{ vehicle }}
              </span>
              <span
                v-if="downstreamQueueVehicles.length > 3"
                class="more-queue-vehicles"
              >
                +{{ downstreamQueueVehicles.length - 3 }}
              </span>
            </div>
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
          <div class="queue-details">
            <div class="queue-subtitle">排队车辆</div>
            <div class="queue-vehicles">
              <span
                v-for="vehicle in upstreamQueueVehicles.slice(0, 3)"
                :key="vehicle"
                class="queue-vehicle-id"
              >
                {{ vehicle }}
              </span>
              <span
                v-if="upstreamQueueVehicles.length > 3"
                class="more-queue-vehicles"
              >
                +{{ upstreamQueueVehicles.length - 3 }}
              </span>
            </div>
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
import TrafficStatisticsPanel from './TrafficStatisticsPanel.vue'

interface Props {
  segments: Segment[]
  meetingZones: MeetingZoneType[]
  upstreamQueue?: number
  downstreamQueue?: number
  segmentVehicles: Record<number, {
    upstreamVehicles: string[]
    downstreamVehicles: string[]
    upstreamCount: number
    downstreamCount: number
  }>
  lastUpdate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  upstreamQueue: 0,
  downstreamQueue: 0,
  lastUpdate: () => new Date()
})

defineEmits<{
  updateSegment: [data: { id: number, updates: Partial<Segment> }]
  updateZone: [data: { id: number, updates: Partial<MeetingZoneType> }]
  zoneControl: [data: { zoneId: number, action: string }]
}>()

const selectedSegment = ref<Segment | null>(null)
const selectedZone = ref<MeetingZoneType | null>(null)

// 模拟排队车辆ID数据
const upstreamQueueVehicles = computed(() => {
  const queueSize = props.upstreamQueue
  if (queueSize === 0) return []

  return Array.from({ length: queueSize }, (_, i) =>
    `京A${String(Math.floor(Math.random() * 900000) + 100000)}`
  )
})

const downstreamQueueVehicles = computed(() => {
  const queueSize = props.downstreamQueue
  if (queueSize === 0) return []

  return Array.from({ length: queueSize }, (_, i) =>
    `京B${String(Math.floor(Math.random() * 900000) + 100000)}`
  )
})

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
  emit('zoneControl', data)
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
  border-radius: 12px;
  padding: 1rem;
  min-width: 140px;
  text-align: center;
  border: 2px solid #e17055;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.entrance-area:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.entrance-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #d63031;
  margin-bottom: 0.75rem;
}

.queue-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.queue-icon {
  font-size: 1.2rem;
}

.queue-count {
  background: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: bold;
  color: #d63031;
  min-width: 35px;
  font-size: 1rem;
}

.queue-details {
  border-top: 1px solid rgba(214, 48, 49, 0.3);
  padding-top: 0.75rem;
}

.queue-subtitle {
  font-size: 0.8rem;
  color: #d63031;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.queue-vehicles {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.queue-vehicle-id {
  background: rgba(255, 255, 255, 0.8);
  color: #d63031;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-family: monospace;
  font-weight: 500;
  border: 1px solid rgba(214, 48, 49, 0.3);
}

.more-queue-vehicles {
  color: #d63031;
  font-size: 0.7rem;
  font-style: italic;
  opacity: 0.8;
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
    min-width: 120px;
    padding: 0.875rem;
  }

  .queue-vehicle-id {
    font-size: 0.65rem;
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
    min-width: 100px;
    padding: 0.75rem;
  }

  .left-entrance {
    order: 1;
  }

  .right-entrance {
    order: 3;
  }

  .queue-vehicles {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .entrance-area {
    min-width: 90px;
    padding: 0.5rem;
  }

  .entrance-label {
    font-size: 0.8rem;
  }

  .queue-count {
    font-size: 0.9rem;
    padding: 0.2rem 0.6rem;
  }

  .queue-subtitle {
    font-size: 0.7rem;
  }

  .queue-vehicle-id {
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
  }
}
</style>
