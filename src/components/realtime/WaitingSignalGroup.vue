<!-- src/components/realtime/WaitingSignalGroup.vue -->
<template>
  <div class="waiting-signal-group">
    <WaitingArea
      :area-id="areaId"
      :upstream-count="upstreamCount"
      :downstream-count="downstreamCount"
      :upstream-has-vehicle="upstreamHasVehicle"
      :downstream-has-vehicle="downstreamHasVehicle"
      :upstream-request="upstreamRequest"
      :downstream-request="downstreamRequest"
    />

    <TrafficSignal
      :signal-id="signalId"
      :status="signalStatus"
      :status-description="statusDescription"
      :phase="phase"
      :show-history="showHistory"
      :size="signalSize"
    />
  </div>
</template>

<script setup lang="ts">
import WaitingArea from './WaitingArea.vue'
import TrafficSignal from './TrafficSignal.vue'

interface Props {
  // 等待区属性
  areaId: number
  upstreamCount: number
  downstreamCount: number
  upstreamHasVehicle?: boolean
  downstreamHasVehicle?: boolean
  upstreamRequest?: boolean
  downstreamRequest?: boolean

  // 信号灯属性
  signalId: string
  signalStatus: 'UPSTREAM' | 'DOWNSTREAM' | 'ALL_RED' | 'YELLOW_FLASH' | 'UPDOWN'
  statusDescription?: string
  phase?: number | null
  showHistory?: boolean
  signalSize?: 'small' | 'medium' | 'large'
}

// const props = withDefaults(defineProps<Props>(), {
//   upstreamHasVehicle: false,
//   downstreamHasVehicle: false,
//   upstreamRequest: false,
//   downstreamRequest: false,
//   statusDescription: '',
//   phase: null,
//   showHistory: false,
//   signalSize: 'medium'
// })
</script>

<style scoped>
.waiting-signal-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  width: 100%;
  min-height: 100px;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  border: 2px dashed #6c757d;
  transition: all 0.3s ease;
}

.waiting-signal-group:hover {
  background-color: #f0f0f0;
  border-color: #495057;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .waiting-signal-group {
    flex-direction: column;
    gap: 20px;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .waiting-signal-group {
    gap: 15px;
    padding: 10px;
    min-height: 80px;
  }
}
</style>
