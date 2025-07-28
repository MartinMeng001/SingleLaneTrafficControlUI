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
      :meetingZones="monitoringStore.meetingZones"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMonitoringStore } from '@/stores/monitoring'
import { formatTimestamp } from '@/utils/format'
import RoadNetwork from '@/components/monitoring/RoadNetwork.vue'
import StatisticsCard from '@/components/monitoring/StatisticsCard.vue'

const monitoringStore = useMonitoringStore()
const isRefreshing = ref(false)
let updateInterval: number | null = null

const statisticsData = computed(() => [
  {
    key: 'totalVehicles',
    title: '当前总车辆数',
    value: monitoringStore.statistics.totalVehicles,
    unit: '辆',
    trend: 'stable',
    color: 'blue'
  },
  {
    key: 'conflictCount',
    title: '冲突路段数',
    value: monitoringStore.statistics.conflictCount,
    unit: '个',
    trend: monitoringStore.statistics.conflictCount > 0 ? 'up' : 'down',
    color: monitoringStore.statistics.conflictCount > 0 ? 'red' : 'green'
  },
  {
    key: 'passedVehicles',
    title: '今日通过车辆',
    value: monitoringStore.statistics.passedVehicles,
    unit: '辆',
    trend: 'up',
    color: 'green'
  },
  {
    key: 'averageWaitTime',
    title: '平均等待时间',
    value: monitoringStore.statistics.averageWaitTime,
    unit: '秒',
    trend: 'stable',
    color: 'orange'
  }
])

const refreshData = async () => {
  isRefreshing.value = true
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 1000))
  // 这里应该调用实际的API来刷新数据
  isRefreshing.value = false
}

// 模拟实时数据更新
const simulateDataUpdate = () => {
  // 这里可以添加WebSocket连接或定时API调用
  // 目前使用模拟数据
  monitoringStore.updateStatistics({
    totalVehicles: Math.max(0, monitoringStore.statistics.totalVehicles + Math.floor(Math.random() * 3) - 1),
    passedVehicles: monitoringStore.statistics.passedVehicles + Math.floor(Math.random() * 2),
    averageWaitTime: Math.max(10, monitoringStore.statistics.averageWaitTime + Math.floor(Math.random() * 6) - 3)
  })
}

onMounted(() => {
  updateInterval = setInterval(simulateDataUpdate, 5000)
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
