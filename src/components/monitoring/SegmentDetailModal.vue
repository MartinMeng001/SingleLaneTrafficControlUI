<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ segment.name }} - 详细信息</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="segment-info">
          <!-- 基本状态信息 -->
          <div class="info-section">
            <h3 class="section-title">基本状态</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">当前状态:</span>
                <span class="info-value" :class="`status-${segment.status}`">
                  {{ getSegmentStatusText(segment.status) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">容量:</span>
                <span class="info-value">{{ segment.capacity }} 辆</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前车辆数:</span>
                <span class="info-value">{{ segment.currentCount }} 辆</span>
              </div>
              <div class="info-item">
                <span class="info-label">冲突状态:</span>
                <span class="info-value" :class="segment.conflict ? 'conflict' : 'normal'">
                  {{ segment.conflict ? '有冲突' : '无冲突' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 上行方向车辆信息 -->
          <div class="info-section">
            <h3 class="section-title">
              上行方向
              <TrafficLight :state="segment.upstreamLight" :size="'small'" />
            </h3>
            <div class="direction-info">
              <div class="vehicle-count">
                <span class="count-label">车辆数量:</span>
                <span class="count-value">{{ upstreamVehicleCount }} 辆</span>
              </div>
              <div class="vehicle-status">
                <span class="status-label">检测状态:</span>
                <span class="status-value" :class="segment.upstreamVehicles ? 'has-vehicle' : 'no-vehicle'">
                  {{ segment.upstreamVehicles ? '有车' : '无车' }}
                </span>
              </div>
              <div class="vehicle-list">
                <h4>车辆ID列表:</h4>
                <div class="vehicle-ids">
                  <span
                    v-for="vehicleId in upstreamVehicleIds"
                    :key="vehicleId"
                    class="vehicle-id"
                  >
                    {{ vehicleId }}
                  </span>
                  <span v-if="upstreamVehicleIds.length === 0" class="no-vehicles">
                    暂无车辆
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 下行方向车辆信息 -->
          <div class="info-section">
            <h3 class="section-title">
              下行方向
              <TrafficLight :state="segment.downstreamLight" :size="'small'" />
            </h3>
            <div class="direction-info">
              <div class="vehicle-count">
                <span class="count-label">车辆数量:</span>
                <span class="count-value">{{ downstreamVehicleCount }} 辆</span>
              </div>
              <div class="vehicle-status">
                <span class="status-label">检测状态:</span>
                <span class="status-value" :class="segment.downstreamVehicles ? 'has-vehicle' : 'no-vehicle'">
                  {{ segment.downstreamVehicles ? '有车' : '无车' }}
                </span>
              </div>
              <div class="vehicle-list">
                <h4>车辆ID列表:</h4>
                <div class="vehicle-ids">
                  <span
                    v-for="vehicleId in downstreamVehicleIds"
                    :key="vehicleId"
                    class="vehicle-id"
                  >
                    {{ vehicleId }}
                  </span>
                  <span v-if="downstreamVehicleIds.length === 0" class="no-vehicles">
                    暂无车辆
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="info-section">
            <h3 class="section-title">统计信息</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">占用率:</span>
                <span class="stat-value">{{ occupancyRate }}%</span>
                <div class="stat-bar">
                  <div
                    class="stat-fill"
                    :style="{ width: occupancyRate + '%' }"
                    :class="occupancyRateClass"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary" @click="$emit('close')">
          关闭
        </button>
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
  close: []
}>()

// 模拟车辆数据 - 在实际项目中这些数据应该从后端获取
const upstreamVehicleCount = computed(() => {
  // 实际车辆数可能与检测状态不完全一致
  return props.segment.upstreamVehicles ? Math.floor(Math.random() * 3) + 1 : 0
})

const downstreamVehicleCount = computed(() => {
  return props.segment.downstreamVehicles ? Math.floor(Math.random() * 3) + 1 : 0
})

const upstreamVehicleIds = computed(() => {
  if (!props.segment.upstreamVehicles) return []
  // 模拟车牌号
  const count = upstreamVehicleCount.value
  return Array.from({ length: count }, (_, i) =>
    `京A${String(Math.floor(Math.random() * 900000) + 100000)}`
  )
})

const downstreamVehicleIds = computed(() => {
  if (!props.segment.downstreamVehicles) return []
  const count = downstreamVehicleCount.value
  return Array.from({ length: count }, (_, i) =>
    `京B${String(Math.floor(Math.random() * 900000) + 100000)}`
  )
})

const occupancyRate = computed(() => {
  return Math.round((props.segment.currentCount / props.segment.capacity) * 100)
})

const occupancyRateClass = computed(() => {
  const rate = occupancyRate.value
  if (rate >= 90) return 'critical'
  if (rate >= 70) return 'warning'
  return 'normal'
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.modal-title {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #667eea;
  font-size: 1.1rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-label {
  font-weight: 600;
  color: #495057;
}

.info-value {
  font-weight: 500;
}

.status-empty { color: #17a2b8; }
.status-normal { color: #28a745; }
.status-warning { color: #ffc107; }
.status-conflict { color: #dc3545; }

.conflict { color: #dc3545; font-weight: bold; }
.normal { color: #28a745; }

.direction-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.vehicle-count,
.vehicle-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.count-label,
.status-label {
  font-weight: 600;
  color: #495057;
}

.count-value,
.status-value {
  font-weight: 500;
}

.has-vehicle { color: #28a745; }
.no-vehicle { color: #6c757d; }

.vehicle-list h4 {
  margin-bottom: 0.5rem;
  color: #495057;
  font-size: 0.9rem;
}

.vehicle-ids {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  align-items: center;
}

.vehicle-id {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
}

.no-vehicles {
  color: #6c757d;
  font-style: italic;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
}

.stat-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  font-weight: 600;
  color: #495057;
  display: block;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-weight: 500;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  display: block;
}

.stat-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.stat-fill.normal { background: #28a745; }
.stat-fill.warning { background: #ffc107; }
.stat-fill.critical { background: #dc3545; }

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  background: #f8f9fa;
}

.btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
