<template>
  <div class="road-network">
    <!-- 整体交通统计面板 -->
    <div class="traffic-overview">
      <h2 class="overview-title">交通状况总览</h2>
      <div class="overview-stats">
        <div class="stat-card upstream">
          <div class="stat-header">
            <span class="direction-label">上行方向</span>
            <span class="vehicle-count">{{ upstreamStats.totalVehicles }}辆</span>
          </div>
          <div class="vehicle-list">
            <div class="vehicle-ids">
              <span
                v-for="vehicleId in upstreamStats.vehicleIds"
                :key="`up-${vehicleId}`"
                class="vehicle-tag upstream-tag"
              >
                {{ vehicleId }}
              </span>
              <span v-if="upstreamStats.vehicleIds.length === 0" class="no-vehicles">
                暂无车辆
              </span>
            </div>
          </div>
        </div>

        <div class="stat-card downstream">
          <div class="stat-header">
            <span class="direction-label">下行方向</span>
            <span class="vehicle-count">{{ downstreamStats.totalVehicles }}辆</span>
          </div>
          <div class="vehicle-list">
            <div class="vehicle-ids">
              <span
                v-for="vehicleId in downstreamStats.vehicleIds"
                :key="`down-${vehicleId}`"
                class="vehicle-tag downstream-tag"
              >
                {{ vehicleId }}
              </span>
              <span v-if="downstreamStats.vehicleIds.length === 0" class="no-vehicles">
                暂无车辆
              </span>
            </div>
          </div>
        </div>

        <div class="stat-card total">
          <div class="stat-header">
            <span class="direction-label">总计</span>
            <span class="vehicle-count total-count">{{ totalVehicles }}辆</span>
          </div>
          <div class="total-info">
            <div class="density-indicator">
              <span class="density-label">路网密度:</span>
              <div class="density-bar">
                <div
                  class="density-fill"
                  :style="{ width: densityPercentage + '%' }"
                  :class="densityClass"
                ></div>
              </div>
              <span class="density-text">{{ densityPercentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 路网布局 -->
    <div class="network-container">
      <!-- 路段0 -->
      <RoadSegment
        :segment="enhancedSegments[0]"
        @update="$emit('updateSegment', $event)"
      />

      <div class="connection-line">
        <div class="flow-indicator upstream" v-if="flowIndicators.segment0ToZone0.upstream">
          <span class="flow-arrow">→</span>
        </div>
        <div class="flow-indicator downstream" v-if="flowIndicators.segment0ToZone0.downstream">
          <span class="flow-arrow">←</span>
        </div>
      </div>

      <!-- 会车区0 -->
      <MeetingZone
        :zone="enhancedZones[0]"
        @update="$emit('updateZone', $event)"
      />

      <div class="connection-line">
        <div class="flow-indicator upstream" v-if="flowIndicators.zone0ToSegment1.upstream">
          <span class="flow-arrow">→</span>
        </div>
        <div class="flow-indicator downstream" v-if="flowIndicators.zone0ToSegment1.downstream">
          <span class="flow-arrow">←</span>
        </div>
      </div>

      <!-- 路段1 -->
      <RoadSegment
        :segment="enhancedSegments[1]"
        @update="$emit('updateSegment', $event)"
      />

      <div class="connection-line">
        <div class="flow-indicator upstream" v-if="flowIndicators.segment1ToZone1.upstream">
          <span class="flow-arrow">→</span>
        </div>
        <div class="flow-indicator downstream" v-if="flowIndicators.segment1ToZone1.downstream">
          <span class="flow-arrow">←</span>
        </div>
      </div>

      <!-- 会车区1 -->
      <MeetingZone
        :zone="enhancedZones[1]"
        @update="$emit('updateZone', $event)"
      />

      <div class="connection-line">
        <div class="flow-indicator upstream" v-if="flowIndicators.zone1ToSegment2.upstream">
          <span class="flow-arrow">→</span>
        </div>
        <div class="flow-indicator downstream" v-if="flowIndicators.zone1ToSegment2.downstream">
          <span class="flow-arrow">←</span>
        </div>
      </div>

      <!-- 路段2 -->
      <RoadSegment
        :segment="enhancedSegments[2]"
        @update="$emit('updateSegment', $event)"
      />
    </div>

    <!-- 实时车辆详情面板 -->
    <div class="vehicle-details" v-if="selectedVehicles.length > 0">
      <h3 class="details-title">车辆详情</h3>
      <div class="vehicle-cards">
        <div
          v-for="vehicle in selectedVehicles"
          :key="vehicle.id"
          class="vehicle-card"
          :class="vehicle.direction"
        >
          <div class="vehicle-header">
            <span class="vehicle-id">{{ vehicle.id }}</span>
            <span class="vehicle-direction">{{ vehicle.direction === 'upstream' ? '上行' : '下行' }}</span>
          </div>
          <div class="vehicle-info">
            <div class="info-item">
              <span class="info-label">当前位置:</span>
              <span class="info-value">{{ vehicle.currentLocation }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">进入时间:</span>
              <span class="info-value">{{ formatTime(vehicle.enterTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">等待时长:</span>
              <span class="info-value">{{ vehicle.waitTime }}秒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Segment, MeetingZoneType } from '@/types/monitoring'
import RoadSegment from './RoadSegment.vue'
import MeetingZone from './MeetingZone.vue'

interface Props {
  segments: Segment[]
  meetingZones: MeetingZoneType[]
}

interface VehicleInfo {
  id: string
  direction: 'upstream' | 'downstream'
  currentLocation: string
  enterTime: Date
  waitTime: number
}

interface TrafficStats {
  totalVehicles: number
  vehicleIds: string[]
}

interface FlowIndicators {
  [key: string]: {
    upstream: boolean
    downstream: boolean
  }
}

const props = defineProps<Props>()

defineEmits<{
  updateSegment: [data: { id: number, updates: Partial<Segment> }]
  updateZone: [data: { id: number, updates: Partial<MeetingZoneType> }]
}>()

// 模拟车辆数据
const vehicleData = ref<VehicleInfo[]>([
  {
    id: '京A12345',
    direction: 'upstream',
    currentLocation: '路段0',
    enterTime: new Date(Date.now() - 120000),
    waitTime: 120
  },
  {
    id: '京B67890',
    direction: 'upstream',
    currentLocation: '会车区0',
    enterTime: new Date(Date.now() - 90000),
    waitTime: 90
  },
  {
    id: '京C11111',
    direction: 'downstream',
    currentLocation: '路段1',
    enterTime: new Date(Date.now() - 60000),
    waitTime: 60
  },
  {
    id: '京D22222',
    direction: 'downstream',
    currentLocation: '会车区1',
    enterTime: new Date(Date.now() - 30000),
    waitTime: 30
  },
  {
    id: '京E33333',
    direction: 'upstream',
    currentLocation: '路段2',
    enterTime: new Date(Date.now() - 180000),
    waitTime: 180
  }
])

const selectedVehicles = ref<VehicleInfo[]>([])

// 计算上行方向统计
const upstreamStats = computed((): TrafficStats => {
  const upstreamVehicles = vehicleData.value.filter(v => v.direction === 'upstream')
  return {
    totalVehicles: upstreamVehicles.length,
    vehicleIds: upstreamVehicles.map(v => v.id)
  }
})

// 计算下行方向统计
const downstreamStats = computed((): TrafficStats => {
  const downstreamVehicles = vehicleData.value.filter(v => v.direction === 'downstream')
  return {
    totalVehicles: downstreamVehicles.length,
    vehicleIds: downstreamVehicles.map(v => v.id)
  }
})

// 总车辆数
const totalVehicles = computed(() => vehicleData.value.length)

// 路网总容量（所有路段和会车区容量之和）
const totalCapacity = computed(() => {
  const segmentCapacity = props.segments.reduce((sum, segment) => sum + segment.capacity, 0)
  const zoneCapacity = props.meetingZones.reduce((sum, zone) => sum + zone.capacity, 0)
  return segmentCapacity + zoneCapacity
})

// 密度百分比
const densityPercentage = computed(() => {
  return Math.round((totalVehicles.value / totalCapacity.value) * 100)
})

// 密度等级
const densityClass = computed(() => {
  const percentage = densityPercentage.value
  if (percentage >= 80) return 'density-critical'
  if (percentage >= 60) return 'density-high'
  if (percentage >= 40) return 'density-medium'
  return 'density-low'
})

// 增强的路段数据（包含车辆ID信息）
const enhancedSegments = computed(() => {
  return props.segments.map(segment => {
    const segmentVehicles = vehicleData.value.filter(v =>
      v.currentLocation === `路段${segment.id}`
    )

    return {
      ...segment,
      vehicleIds: segmentVehicles.map(v => v.id),
      upstreamVehicleIds: segmentVehicles.filter(v => v.direction === 'upstream').map(v => v.id),
      downstreamVehicleIds: segmentVehicles.filter(v => v.direction === 'downstream').map(v => v.id)
    }
  })
})

// 增强的会车区数据
const enhancedZones = computed(() => {
  return props.meetingZones.map(zone => {
    const zoneVehicles = vehicleData.value.filter(v =>
      v.currentLocation === `会车区${zone.id}`
    )

    return {
      ...zone,
      vehicleIds: zoneVehicles.map(v => v.id),
      upstreamVehicleIds: zoneVehicles.filter(v => v.direction === 'upstream').map(v => v.id),
      downstreamVehicleIds: zoneVehicles.filter(v => v.direction === 'downstream').map(v => v.id)
    }
  })
})

// 流量指示器
const flowIndicators = computed((): FlowIndicators => {
  return {
    segment0ToZone0: {
      upstream: enhancedSegments.value[0]?.upstreamVehicleIds.length > 0,
      downstream: enhancedZones.value[0]?.downstreamVehicleIds.length > 0
    },
    zone0ToSegment1: {
      upstream: enhancedZones.value[0]?.upstreamVehicleIds.length > 0,
      downstream: enhancedSegments.value[1]?.downstreamVehicleIds.length > 0
    },
    segment1ToZone1: {
      upstream: enhancedSegments.value[1]?.upstreamVehicleIds.length > 0,
      downstream: enhancedZones.value[1]?.downstreamVehicleIds.length > 0
    },
    zone1ToSegment2: {
      upstream: enhancedZones.value[1]?.upstreamVehicleIds.length > 0,
      downstream: enhancedSegments.value[2]?.downstreamVehicleIds.length > 0
    }
  }
})

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 显示车辆详情
const showVehicleDetails = () => {
  selectedVehicles.value = vehicleData.value.slice(0, 3) // 显示前3辆车的详情
}

// 组件挂载时显示车辆详情
showVehicleDetails()
</script>

<style scoped>
.road-network {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 交通统计面板 */
.traffic-overview {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #dee2e6;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.overview-title {
  color: #495057;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  text-align: center;
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.stat-card.upstream {
  border-left: 4px solid #28a745;
}

.stat-card.downstream {
  border-left: 4px solid #007bff;
}

.stat-card.total {
  border-left: 4px solid #6f42c1;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.direction-label {
  font-weight: 600;
  color: #495057;
}

.vehicle-count {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  color: #495057;
}

.total-count {
  background: #6f42c1;
  color: white;
}

.vehicle-list {
  min-height: 60px;
}

.vehicle-ids {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.vehicle-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vehicle-tag:hover {
  transform: scale(1.05);
}

.upstream-tag {
  background: #28a745;
}

.downstream-tag {
  background: #007bff;
}

.no-vehicles {
  color: #6c757d;
  font-style: italic;
  font-size: 0.9rem;
}

.total-info {
  margin-top: 0.5rem;
}

.density-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.density-label {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

.density-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.density-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.density-low {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.density-medium {
  background: linear-gradient(90deg, #ffc107, #fd7e14);
}

.density-high {
  background: linear-gradient(90deg, #fd7e14, #dc3545);
}

.density-critical {
  background: linear-gradient(90deg, #dc3545, #6f42c1);
  animation: pulse-critical 2s infinite;
}

@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.density-text {
  font-size: 0.8rem;
  font-weight: bold;
  color: #495057;
  min-width: 35px;
}

/* 路网布局 */
.network-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
  border-radius: 12px;
  padding: 2rem;
  border: 2px solid #e1bee7;
}

.connection-line {
  width: 50px;
  height: 6px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connection-line::before {
  content: '';
  position: absolute;
  right: -10px;
  top: -6px;
  width: 0;
  height: 0;
  border-left: 10px solid #764ba2;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
}

.flow-indicator {
  position: absolute;
  font-size: 1.2rem;
  font-weight: bold;
  animation: flow 2s infinite;
}

.flow-indicator.upstream {
  top: -25px;
  color: #28a745;
}

.flow-indicator.downstream {
  bottom: -25px;
  color: #007bff;
}

@keyframes flow {
  0%, 100% { opacity: 0.5; transform: translateX(-5px); }
  50% { opacity: 1; transform: translateX(5px); }
}

/* 车辆详情面板 */
.vehicle-details {
  background: linear-gradient(135deg, #fff3e0, #fce4ec);
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #f8bbd9;
}

.details-title {
  color: #495057;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  text-align: center;
}

.vehicle-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.vehicle-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.vehicle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.vehicle-card.upstream {
  border-left: 4px solid #28a745;
}

.vehicle-card.downstream {
  border-left: 4px solid #007bff;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.vehicle-id {
  font-weight: bold;
  font-size: 1.1rem;
  color: #495057;
}

.vehicle-direction {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.vehicle-card.upstream .vehicle-direction {
  background: #28a745;
}

.vehicle-card.downstream .vehicle-direction {
  background: #007bff;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .overview-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .network-container {
    flex-direction: column;
    padding: 1rem;
  }

  .connection-line {
    width: 6px;
    height: 40px;
    transform: rotate(90deg);
  }

  .connection-line::before {
    right: -6px;
    top: -10px;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 10px solid #764ba2;
    border-bottom: none;
  }

  .flow-indicator.upstream {
    top: -30px;
    left: -15px;
  }

  .flow-indicator.downstream {
    bottom: -30px;
    right: -15px;
  }
}

@media (max-width: 768px) {
  .vehicle-cards {
    grid-template-columns: 1fr;
  }

  .road-network {
    margin: 1rem 0;
    gap: 1rem;
  }

  .traffic-overview,
  .vehicle-details {
    padding: 1rem;
  }
}
</style>
