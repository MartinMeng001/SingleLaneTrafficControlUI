<template>
  <div class="traffic-statistics-panel">
    <div class="statistics-header">
      <h3 class="statistics-title">
        <span class="title-icon">📊</span>
        整体交通统计
      </h3>
      <div class="update-indicator">
        <span class="update-dot" :class="{ active: isUpdating }"></span>
        <span class="update-text">{{ formatTimeAgo(lastUpdate) }}</span>
      </div>
    </div>

    <div class="statistics-content">
      <!-- 总体车辆统计 -->
      <div class="total-statistics">
        <div class="stat-card total-vehicles">
          <div class="stat-header">
            <span class="stat-icon">🚗</span>
            <span class="stat-label">路段总车辆</span>
          </div>
          <div class="stat-value">
            <span class="main-number">{{ totalVehiclesCount }}</span>
            <span class="unit">辆</span>
          </div>
          <div class="stat-breakdown">
            <span class="breakdown-item upstream">
              <span class="direction-icon">⬆️</span>
              上行: {{ totalUpstreamCount }}
            </span>
            <span class="breakdown-item downstream">
              <span class="direction-icon">⬇️</span>
              下行: {{ totalDownstreamCount }}
            </span>
          </div>
        </div>

        <div class="stat-card density-info">
          <div class="stat-header">
            <span class="stat-icon">📈</span>
            <span class="stat-label">整体密度</span>
          </div>
          <div class="stat-value">
            <span class="main-number">{{ overallDensityPercentage }}</span>
            <span class="unit">%</span>
          </div>
          <div class="density-bar">
            <div
              class="density-fill"
              :style="{ width: overallDensityPercentage + '%' }"
              :class="densityClass"
            ></div>
          </div>
        </div>
      </div>

      <!-- 方向详细统计 -->
      <div class="direction-statistics">
        <!-- 上行统计 -->
        <div class="direction-panel upstream-panel">
          <div class="direction-header">
            <div class="direction-title">
              <span class="direction-arrow">⬆️</span>
              <span class="direction-name">上行方向</span>
            </div>
            <div class="direction-count">{{ totalUpstreamCount }} 辆</div>
          </div>

          <div class="vehicle-distribution">
            <h4 class="distribution-title">车辆分布</h4>
            <div class="segment-distribution">
              <div
                v-for="(segment, index) in segments"
                :key="'upstream-' + segment.id"
                class="segment-item"
                :class="{ 'has-vehicles': getUpstreamVehicleDetails(segment.id).length > 0 }"
              >
                <div class="segment-name">{{ segment.name }}</div>
                <div class="vehicle-count">{{ getUpstreamVehicleDetails(segment.id).length }}</div>
                <div class="vehicle-indicator">
                  <div
                    v-for="i in Math.min(getUpstreamVehicleDetails(segment.id).length, 3)"
                    :key="i"
                    class="vehicle-dot upstream"
                  ></div>
                  <span
                    v-if="getUpstreamVehicleDetails(segment.id).length > 3"
                    class="more-indicator"
                  >
                    +{{ getUpstreamVehicleDetails(segment.id).length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="vehicle-list">
            <h4 class="list-title">
              车辆ID列表
              <button
                class="toggle-btn"
                @click="toggleUpstreamList"
                :class="{ expanded: showUpstreamList }"
              >
                {{ showUpstreamList ? '▼' : '▶' }}
              </button>
            </h4>
            <div v-if="showUpstreamList" class="vehicle-ids">
              <div
                v-for="vehicleId in allUpstreamVehicles"
                :key="vehicleId"
                class="vehicle-id-tag upstream"
              >
                {{ vehicleId }}
              </div>
              <div v-if="allUpstreamVehicles.length === 0" class="no-vehicles">
                暂无上行车辆
              </div>
            </div>
          </div>
        </div>

        <!-- 下行统计 -->
        <div class="direction-panel downstream-panel">
          <div class="direction-header">
            <div class="direction-title">
              <span class="direction-arrow">⬇️</span>
              <span class="direction-name">下行方向</span>
            </div>
            <div class="direction-count">{{ totalDownstreamCount }} 辆</div>
          </div>

          <div class="vehicle-distribution">
            <h4 class="distribution-title">车辆分布</h4>
            <div class="segment-distribution">
              <div
                v-for="(segment, index) in segments"
                :key="'downstream-' + segment.id"
                class="segment-item"
                :class="{ 'has-vehicles': getDownstreamVehicleDetails(segment.id).length > 0 }"
              >
                <div class="segment-name">{{ segment.name }}</div>
                <div class="vehicle-count">{{ getDownstreamVehicleDetails(segment.id).length }}</div>
                <div class="vehicle-indicator">
                  <div
                    v-for="i in Math.min(getDownstreamVehicleDetails(segment.id).length, 3)"
                    :key="i"
                    class="vehicle-dot downstream"
                  ></div>
                  <span
                    v-if="getDownstreamVehicleDetails(segment.id).length > 3"
                    class="more-indicator"
                  >
                    +{{ getDownstreamVehicleDetails(segment.id).length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="vehicle-list">
            <h4 class="list-title">
              车辆ID列表
              <button
                class="toggle-btn"
                @click="toggleDownstreamList"
                :class="{ expanded: showDownstreamList }"
              >
                {{ showDownstreamList ? '▼' : '▶' }}
              </button>
            </h4>
            <div v-if="showDownstreamList" class="vehicle-ids">
              <div
                v-for="vehicleId in allDownstreamVehicles"
                :key="vehicleId"
                class="vehicle-id-tag downstream"
              >
                {{ vehicleId }}
              </div>
              <div v-if="allDownstreamVehicles.length === 0" class="no-vehicles">
                暂无下行车辆
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 路段详细信息 -->
      <div class="segments-detail">
        <h4 class="detail-title">路段详细统计</h4>
        <div class="segments-grid">
          <div
            v-for="segment in segments"
            :key="segment.id"
            class="segment-detail-card"
            :class="`status-${segment.status}`"
          >
            <div class="segment-card-header">
              <span class="segment-name">{{ segment.name }}</span>
              <span class="segment-status" :class="`status-${segment.status}`">
                {{ getSegmentStatusText(segment.status) }}
              </span>
            </div>

            <div class="segment-directions">
              <div class="segment-direction">
                <span class="direction-label">上行:</span>
                <span class="vehicle-count">{{ getUpstreamVehicleDetails(segment.id).length }}</span>
                <div class="mini-vehicle-list">
                  <span
                    v-for="vehicleId in getUpstreamVehicleDetails(segment.id).slice(0, 2)"
                    :key="vehicleId"
                    class="mini-vehicle-id"
                  >
                    {{ vehicleId }}
                  </span>
                  <span
                    v-if="getUpstreamVehicleDetails(segment.id).length > 2"
                    class="more-vehicles"
                  >
                    +{{ getUpstreamVehicleDetails(segment.id).length - 2 }}
                  </span>
                </div>
              </div>

              <div class="segment-direction">
                <span class="direction-label">下行:</span>
                <span class="vehicle-count">{{ getDownstreamVehicleDetails(segment.id).length }}</span>
                <div class="mini-vehicle-list">
                  <span
                    v-for="vehicleId in getDownstreamVehicleDetails(segment.id).slice(0, 2)"
                    :key="vehicleId"
                    class="mini-vehicle-id"
                  >
                    {{ vehicleId }}
                  </span>
                  <span
                    v-if="getDownstreamVehicleDetails(segment.id).length > 2"
                    class="more-vehicles"
                  >
                    +{{ getDownstreamVehicleDetails(segment.id).length - 2 }}
                  </span>
                </div>
              </div>
            </div>

            <div class="segment-capacity">
              <div class="capacity-bar">
                <div
                  class="capacity-fill"
                  :style="{ width: getSegmentOccupancyRate(segment) + '%' }"
                  :class="getSegmentCapacityClass(segment)"
                ></div>
              </div>
              <div class="capacity-text">
                {{ segment.currentCount }}/{{ segment.capacity }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Segment } from '@/types/monitoring'
import { formatTimeAgo, getSegmentStatusText } from '@/utils/format'

interface Props {
  segments: Segment[]
  segmentVehicles: Record<number, {
    upstreamVehicles: string[]
    downstreamVehicles: string[]
    upstreamCount: number
    downstreamCount: number
  }>
  lastUpdate: Date
}

const props = defineProps<Props>()

const isUpdating = ref(false)
const showUpstreamList = ref(false)
const showDownstreamList = ref(false)

// 模拟更新指示器
setInterval(() => {
  isUpdating.value = true
  setTimeout(() => {
    isUpdating.value = false
  }, 500)
}, 3000)

// 计算属性
const totalVehiclesCount = computed(() => {
  return props.segments.reduce((total, segment) => total + segment.currentCount, 0)
})

const totalUpstreamCount = computed(() => {
  return props.segments.reduce((total, segment) => {
    const vehicleData = props.segmentVehicles[segment.id]
    return total + (vehicleData?.upstreamVehicles?.length || 0)
  }, 0)
})

const totalDownstreamCount = computed(() => {
  return props.segments.reduce((total, segment) => {
    const vehicleData = props.segmentVehicles[segment.id]
    return total + (vehicleData?.downstreamVehicles?.length || 0)
  }, 0)
})

const totalCapacity = computed(() => {
  return props.segments.reduce((total, segment) => total + segment.capacity, 0)
})

const overallDensityPercentage = computed(() => {
  return Math.round((totalVehiclesCount.value / totalCapacity.value) * 100)
})

const densityClass = computed(() => {
  const percentage = overallDensityPercentage.value
  if (percentage >= 80) return 'critical'
  if (percentage >= 60) return 'warning'
  return 'normal'
})

const allUpstreamVehicles = computed(() => {
  const vehicles: string[] = []
  props.segments.forEach(segment => {
    const vehicleData = props.segmentVehicles[segment.id]
    if (vehicleData?.upstreamVehicles) {
      vehicles.push(...vehicleData.upstreamVehicles)
    }
  })
  return vehicles
})

const allDownstreamVehicles = computed(() => {
  const vehicles: string[] = []
  props.segments.forEach(segment => {
    const vehicleData = props.segmentVehicles[segment.id]
    if (vehicleData?.downstreamVehicles) {
      vehicles.push(...vehicleData.downstreamVehicles)
    }
  })
  return vehicles
})

// 方法
const getUpstreamVehicleDetails = (segmentId: number) => {
  return props.segmentVehicles[segmentId]?.upstreamVehicles || []
}

const getDownstreamVehicleDetails = (segmentId: number) => {
  return props.segmentVehicles[segmentId]?.downstreamVehicles || []
}

const getSegmentOccupancyRate = (segment: Segment) => {
  return Math.round((segment.currentCount / segment.capacity) * 100)
}

const getSegmentCapacityClass = (segment: Segment) => {
  const rate = getSegmentOccupancyRate(segment)
  if (rate >= 90) return 'critical'
  if (rate >= 70) return 'warning'
  return 'normal'
}

const toggleUpstreamList = () => {
  showUpstreamList.value = !showUpstreamList.value
}

const toggleDownstreamList = () => {
  showDownstreamList.value = !showDownstreamList.value
}
</script>

<style scoped>
.traffic-statistics-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.statistics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.statistics-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #667eea;
  font-size: 1.3rem;
}

.title-icon {
  font-size: 1.5rem;
}

.update-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6c757d;
}

.update-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c757d;
  transition: all 0.3s ease;
}

.update-dot.active {
  background: #28a745;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 总体统计 */
.total-statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-label {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.9;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.main-number {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
}

.unit {
  font-size: 1rem;
  opacity: 0.8;
}

.stat-breakdown {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  opacity: 0.9;
}

.direction-icon {
  font-size: 0.8rem;
}

.density-info {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.density-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.density-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.density-fill.normal { background: rgba(255, 255, 255, 0.9); }
.density-fill.warning { background: #ffc107; }
.density-fill.critical { background: #dc3545; }

/* 方向统计 */
.direction-statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.direction-panel {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.25rem;
  border-left: 4px solid;
}

.upstream-panel {
  border-left-color: #007bff;
}

.downstream-panel {
  border-left-color: #6f42c1;
}

.direction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.direction-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
}

.direction-arrow {
  font-size: 1.2rem;
}

.direction-count {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: bold;
  color: #495057;
}

.vehicle-distribution {
  margin-bottom: 1rem;
}

.distribution-title {
  margin: 0 0 0.75rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 600;
}

.segment-distribution {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.segment-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.5rem;
  min-width: 80px;
  text-align: center;
  transition: all 0.3s ease;
}

.segment-item.has-vehicles {
  border-color: #28a745;
  background: #e8f5e8;
}

.segment-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.25rem;
}

.vehicle-count {
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.25rem;
}

.vehicle-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  min-height: 16px;
}

.vehicle-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: vehiclePulse 2s infinite;
}

.vehicle-dot.upstream {
  background: #007bff;
}

.vehicle-dot.downstream {
  background: #6f42c1;
}

.more-indicator {
  font-size: 0.7rem;
  color: #6c757d;
  margin-left: 2px;
}

@keyframes vehiclePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.vehicle-list {
  margin-top: 1rem;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 600;
}

.toggle-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  transition: transform 0.2s ease;
}

.toggle-btn.expanded {
  transform: rotate(90deg);
}

.vehicle-ids {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.vehicle-id-tag {
  background: #495057;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  font-weight: 500;
}

.vehicle-id-tag.upstream {
  background: #007bff;
}

.vehicle-id-tag.downstream {
  background: #6f42c1;
}

.no-vehicles {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 1rem;
}

/* 路段详细信息 */
.segments-detail {
  margin-top: 2rem;
}

.detail-title {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.segments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.segment-detail-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.segment-detail-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.segment-detail-card.status-conflict {
  border-left: 4px solid #dc3545;
  background: #fff5f5;
}

.segment-detail-card.status-warning {
  border-left: 4px solid #ffc107;
  background: #fffbf0;
}

.segment-detail-card.status-normal {
  border-left: 4px solid #28a745;
  background: #f8fff8;
}

.segment-detail-card.status-empty {
  border-left: 4px solid #17a2b8;
  background: #f0faff;
}

.segment-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.segment-name {
  font-weight: 600;
  color: #495057;
}

.segment-status {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.segment-status.status-empty { background: #d1ecf1; color: #0c5460; }
.segment-status.status-normal { background: #d4edda; color: #155724; }
.segment-status.status-warning { background: #fff3cd; color: #856404; }
.segment-status.status-conflict { background: #f8d7da; color: #721c24; }

.segment-directions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.segment-direction {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.direction-label {
  font-weight: 500;
  color: #6c757d;
  min-width: 30px;
}

.mini-vehicle-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-left: auto;
}

.mini-vehicle-id {
  background: #495057;
  color: white;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-family: monospace;
}

.more-vehicles {
  color: #6c757d;
  font-size: 0.7rem;
  font-style: italic;
}

.segment-capacity {
  margin-top: 0.75rem;
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
}

.capacity-fill.normal { background: #28a745; }
.capacity-fill.warning { background: #ffc107; }
.capacity-fill.critical { background: #dc3545; }

.capacity-text {
  text-align: center;
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .direction-statistics {
    grid-template-columns: 1fr;
  }

  .segments-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .traffic-statistics-panel {
    padding: 1rem;
  }

  .total-statistics {
    grid-template-columns: 1fr;
  }

  .segments-grid {
    grid-template-columns: 1fr;
  }

  .statistics-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }

  .stat-breakdown {
    flex-direction: column;
    gap: 0.5rem;
  }

  .segment-distribution {
    justify-content: center;
  }
}
</style>
