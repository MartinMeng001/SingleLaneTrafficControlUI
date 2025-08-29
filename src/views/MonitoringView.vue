<template>
  <div class="monitoring-view">
    <div class="view-header">
      <h1 class="view-title">实时交通状态监控</h1>
      <div class="refresh-info">
        <span>最后更新: {{ formatTimestamp(monitoringStore.lastUpdateTime) }}</span>
        <button @click="refreshData" class="refresh-btn" :disabled="isRefreshing">
          <span class="refresh-icon" :class="{ spinning: isRefreshing }">🔄</span>
          刷新
        </button>
      </div>
    </div>

    <RoadNetwork
      :segments="monitoringStore.segments"
      :segment-vehicles="monitoringStore.segmentVehicles"
      :meetingZones="monitoringStore.meetingZones"
      :upstreamQueue="upstreamQueue"
      :downstreamQueue="downstreamQueue"
      @updateSegment="handleSegmentUpdate"
      @updateZone="handleZoneUpdate"
      @zoneControl="handleZoneControl"
    />

    <div class="statistics-section">
      <h2 class="section-title">交通统计</h2>
      <div class="statistics-grid">
        <StatisticsCard
          v-for="stat in statisticsData"
          :key="stat.key"
          :title="stat.title"
          :value="stat.value"
          :unit="stat.unit"
          :trend="stat.trend"
          :color="stat.color"
        />
      </div>
    </div>

    <!-- 控制操作日志 -->
    <div class="control-log-section" v-if="controlLogs.length > 0">
      <h2 class="section-title">控制操作记录</h2>
      <div class="control-logs">
        <div
          v-for="log in recentControlLogs"
          :key="log.id"
          class="control-log-item"
          :class="`log-${log.type}`"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-content">{{ log.message }}</span>
          <span class="log-status" :class="`status-${log.status}`">
            {{ getLogStatusText(log.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMonitoringStore } from '@/stores/monitoring'
import { formatTimestamp } from '@/utils/format'
import RoadNetwork from '@/components/monitoring/RoadNetwork.vue'
import StatisticsCard from '@/components/monitoring/StatisticsCard.vue'
import type { Segment, MeetingZoneType } from '@/types/monitoring'

const monitoringStore = useMonitoringStore()
const isRefreshing = ref(false)

// 模拟排队车辆数据
const upstreamQueue = ref(3)
const downstreamQueue = ref(5)

// 控制操作日志
interface ControlLog {
  id: number
  timestamp: Date
  message: string
  type: 'zone' | 'segment'
  status: 'success' | 'failed' | 'pending'
  zoneId?: number
  action?: string
}

const controlLogs = ref<ControlLog[]>([])
let updateInterval: number | null = null

const statisticsData = computed(() => [
  {
    key: 'totalVehicles',
    title: '当前总车辆数',
    value: monitoringStore.statistics.totalVehicles,
    unit: '辆',
    trend: 'stable',
    color: 'blue',
  },
  {
    key: 'conflictCount',
    title: '冲突路段数',
    value: monitoringStore.statistics.conflictCount,
    unit: '个',
    trend: monitoringStore.statistics.conflictCount > 0 ? 'up' : 'down',
    color: monitoringStore.statistics.conflictCount > 0 ? 'red' : 'green',
  },
  {
    key: 'passedVehicles',
    title: '今日通过车辆',
    value: monitoringStore.statistics.passedVehicles,
    unit: '辆',
    trend: 'up',
    color: 'green',
  },
  {
    key: 'averageWaitTime',
    title: '平均等待时间',
    value: monitoringStore.statistics.averageWaitTime,
    unit: '秒',
    trend: 'stable',
    color: 'orange',
  },
  {
    key: 'upstreamQueue',
    title: '上行排队车辆',
    value: upstreamQueue.value,
    unit: '辆',
    trend: 'stable',
    color: 'purple',
  },
  {
    key: 'downstreamQueue',
    title: '下行排队车辆',
    value: downstreamQueue.value,
    unit: '辆',
    trend: 'stable',
    color: 'purple',
  },
])

const recentControlLogs = computed(() => {
  return controlLogs.value.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5)
})

const refreshData = async () => {
  isRefreshing.value = true
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 更新排队车辆数据
    upstreamQueue.value = Math.floor(Math.random() * 8)
    downstreamQueue.value = Math.floor(Math.random() * 8)

    // 更新统计数据
    monitoringStore.updateStatistics({
      totalVehicles: Math.max(
        0,
        monitoringStore.statistics.totalVehicles + Math.floor(Math.random() * 3) - 1,
      ),
      passedVehicles: monitoringStore.statistics.passedVehicles + Math.floor(Math.random() * 2),
      averageWaitTime: Math.max(
        10,
        monitoringStore.statistics.averageWaitTime + Math.floor(Math.random() * 6) - 3,
      ),
    })
  } finally {
    isRefreshing.value = false
  }
}

const handleSegmentUpdate = (data: { id: number; updates: Partial<Segment> }) => {
  monitoringStore.updateSegment(data.id, data.updates)
}

const handleZoneUpdate = (data: { id: number; updates: Partial<MeetingZoneType> }) => {
  monitoringStore.updateMeetingZone(data.id, data.updates)
}

const handleZoneControl = (data: { zoneId: number; action: string }) => {
  const actionMap = {
    release_upstream: '放行上行',
    release_downstream: '放行下行',
    prohibit_all: '禁止通行',
    release_control: '解除控制',
  }

  const actionText = actionMap[data.action as keyof typeof actionMap] || data.action
  const zoneName =
    monitoringStore.meetingZones.find((z) => z.id === data.zoneId)?.name || `会车区${data.zoneId}`

  // 添加控制日志
  const newLog: ControlLog = {
    id: Date.now(),
    timestamp: new Date(),
    message: `对 ${zoneName} 执行 "${actionText}" 操作`,
    type: 'zone',
    status: 'pending',
    zoneId: data.zoneId,
    action: data.action,
  }

  controlLogs.value.unshift(newLog)

  // 模拟操作执行
  setTimeout(() => {
    const log = controlLogs.value.find((l) => l.id === newLog.id)
    if (log) {
      log.status = Math.random() > 0.1 ? 'success' : 'failed'
      if (log.status === 'success') {
        log.message += ' - 执行成功'
      } else {
        log.message += ' - 执行失败'
      }
    }
  }, 2000)

  // 这里应该调用实际的API来执行控制操作
  console.log('Zone control:', data)
}

const formatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const getLogStatusText = (status: string): string => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'pending':
      return '执行中'
    default:
      return '未知'
  }
}

// 模拟实时数据更新
const simulateDataUpdate = () => {
  // 随机更新车辆状态
  const segments = monitoringStore.segments
  segments.forEach((segment) => {
    if (Math.random() < 0.1) {
      // 10% 概率更新
      monitoringStore.updateSegment(segment.id, {
        upstreamVehicles: Math.random() > 0.5,
        downstreamVehicles: Math.random() > 0.5,
        currentCount: Math.floor(Math.random() * segment.capacity),
      })
    }
  })

  // 随机更新统计数据
  monitoringStore.updateStatistics({
    totalVehicles: Math.max(
      0,
      monitoringStore.statistics.totalVehicles + Math.floor(Math.random() * 3) - 1,
    ),
    passedVehicles: monitoringStore.statistics.passedVehicles + Math.floor(Math.random() * 2),
    averageWaitTime: Math.max(
      10,
      monitoringStore.statistics.averageWaitTime + Math.floor(Math.random() * 6) - 3,
    ),
  })

  // 随机更新排队数据
  if (Math.random() < 0.3) {
    upstreamQueue.value = Math.max(0, upstreamQueue.value + Math.floor(Math.random() * 3) - 1)
    downstreamQueue.value = Math.max(0, downstreamQueue.value + Math.floor(Math.random() * 3) - 1)
  }
}

onMounted(() => {
  updateInterval = setInterval(simulateDataUpdate, 5000) as unknown as number
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.monitoring-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-title {
  color: #667eea;
  margin: 0;
  font-size: 2rem;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.statistics-section {
  margin-top: 2rem;
}

.section-title {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
  }

  .view-title {
    font-size: 1.5rem;
    text-align: center;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
