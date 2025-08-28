<!-- src/components/monitoring/SystemStatusMonitor.vue -->
<template>
  <div class="system-status-monitor">
    <div class="monitor-header">
      <h3 class="monitor-title">
        <span class="title-icon">🖥️</span>
        系统状态监控
      </h3>
      <div class="monitor-controls">
        <button @click="refreshStatus" class="refresh-btn" :disabled="isLoading">
          <span class="btn-icon" :class="{ spinning: isLoading }">🔄</span>
          刷新
        </button>
        <button @click="toggleAutoRefresh" class="auto-refresh-btn" :class="{ active: autoRefresh }">
          <span class="btn-icon">{{ autoRefresh ? '⏸️' : '▶️' }}</span>
          {{ autoRefresh ? '停止' : '自动' }}
        </button>
      </div>
    </div>

    <!-- 系统总体状态 -->
    <div class="system-overview">
      <div class="overview-card" :class="systemStatusClass">
        <div class="card-icon">{{ systemStatusIcon }}</div>
        <div class="card-content">
          <div class="card-title">系统状态</div>
          <div class="card-value">{{ systemStatusText }}</div>
          <div class="card-score" v-if="systemVariables">
            健康度: {{ systemVariables.variables.healthVariables.systemHealthScore.toFixed(1) }}%
          </div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon">🎛️</div>
        <div class="card-content">
          <div class="card-title">控制模式</div>
          <div class="card-value">{{ controlModeText }}</div>
          <div class="card-description">{{ controlModeDescription }}</div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon">📡</div>
        <div class="card-content">
          <div class="card-title">通信状态</div>
          <div class="card-value" :class="communicationStatusClass">{{ communicationStatusText }}</div>
          <div class="card-description">电源状态: {{ powerStatusText }}</div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon">🛡️</div>
        <div class="card-content">
          <div class="card-title">路段状态</div>
          <div class="card-value">{{ segmentStatusText }}</div>
          <div class="card-description">{{ segmentStatusDescription }}</div>
        </div>
      </div>
    </div>

    <!-- 详细状态信息 -->
    <div class="status-details" v-if="systemVariables">
      <div class="details-section">
        <h4 class="section-title">
          <span class="section-icon">⏰</span>
          时间状态
        </h4>
        <div class="status-grid">
          <div class="status-item">
            <span class="item-label">全红时间</span>
            <span class="item-value">{{ systemVariables.variables.timeVariables.allRedTime }}秒</span>
          </div>
          <div class="status-item">
            <span class="item-label">最大全红时间</span>
            <span class="item-value">{{ systemVariables.variables.timeVariables.maxAllRedTime }}秒</span>
          </div>
          <div class="status-item">
            <span class="item-label">状态开始时间</span>
            <span class="item-value">{{ formatTime(systemVariables.variables.timeVariables.stateStartTime) }}</span>
          </div>
          <div class="status-item">
            <span class="item-label">最后健康检查</span>
            <span class="item-value">{{ formatTime(systemVariables.variables.timeVariables.lastHealthUpdateTime) }}</span>
          </div>
        </div>
      </div>

      <div class="details-section">
        <h4 class="section-title">
          <span class="section-icon">⚠️</span>
          错误统计
        </h4>
        <div class="error-stats">
          <div class="error-item" :class="{ 'has-errors': systemVariables.variables.errorVariables.idLogicErrorCount > 0 }">
            <span class="error-type">ID逻辑错误</span>
            <span class="error-count">{{ systemVariables.variables.errorVariables.idLogicErrorCount }}</span>
          </div>
          <div class="error-item" :class="{ 'has-errors': systemVariables.variables.errorVariables.counterMismatchErrorCount > 0 }">
            <span class="error-type">计数器不匹配</span>
            <span class="error-count">{{ systemVariables.variables.errorVariables.counterMismatchErrorCount }}</span>
          </div>
        </div>

        <!-- 最近错误历史 -->
        <div class="error-history" v-if="systemVariables.variables.errorVariables.recentErrorHistory.length > 0">
          <h5 class="history-title">最近错误记录</h5>
          <div class="error-list">
            <div
              v-for="(error, index) in systemVariables.variables.errorVariables.recentErrorHistory.slice(0, 3)"
              :key="index"
              class="error-record"
            >
              <div class="error-time">{{ formatTime(error.timestamp) }}</div>
              <div class="error-desc">{{ error.description }}</div>
              <div class="error-source">来源: {{ error.source }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="details-section">
        <h4 class="section-title">
          <span class="section-icon">🏃‍♂️</span>
          性能指标
        </h4>
        <div class="performance-metrics">
          <div class="metric-item">
            <div class="metric-label">性能降级程度</div>
            <div class="metric-value">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :class="getPerformanceClass(systemVariables.variables.healthVariables.performanceDegradation)"
                  :style="{ width: `${systemVariables.variables.healthVariables.performanceDegradation * 100}%` }"
                ></div>
              </div>
              <span class="percentage">{{ (systemVariables.variables.healthVariables.performanceDegradation * 100).toFixed(1) }}%</span>
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">系统健康度</div>
            <div class="metric-value">
              <div class="progress-bar">
                <div
                  class="progress-fill good"
                  :style="{ width: `${systemVariables.variables.healthVariables.systemHealthScore}%` }"
                ></div>
              </div>
              <span class="percentage">{{ systemVariables.variables.healthVariables.systemHealthScore.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态显示 -->
    <div v-if="error" class="error-display">
      <div class="error-icon">❌</div>
      <div class="error-message">{{ error }}</div>
      <button @click="refreshStatus" class="retry-btn">重试</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading && !systemVariables" class="loading-display">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载系统状态...</div>
    </div>

    <!-- 最后更新时间 -->
    <div class="update-info" v-if="lastUpdateTime">
      <span class="update-text">最后更新: {{ formatTime(lastUpdateTime) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { monitoringApiService, type SystemVariablesResponse } from '@/api/monitoring'

// Props
interface Props {
  autoRefreshInterval?: number
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefreshInterval: 30000, // 30秒
  showDetails: true
})

// Emits
const emit = defineEmits<{
  statusChange: [status: 'normal' | 'warning' | 'error']
  error: [error: string]
}>()

// 响应式数据
const systemVariables = ref<SystemVariablesResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const lastUpdateTime = ref<string | null>(null)
const autoRefresh = ref(false)
const refreshTimer = ref<number | null>(null)

// 计算属性
const systemStatusClass = computed(() => {
  if (!systemVariables.value) return 'unknown'

  const healthScore = systemVariables.value.variables.healthVariables.systemHealthScore
  const hasErrors = systemVariables.value.variables.errorVariables.idLogicErrorCount > 0 ||
    systemVariables.value.variables.errorVariables.counterMismatchErrorCount > 0

  if (healthScore >= 90 && !hasErrors) return 'good'
  if (healthScore >= 70) return 'warning'
  return 'error'
})

const systemStatusIcon = computed(() => {
  switch (systemStatusClass.value) {
    case 'good': return '✅'
    case 'warning': return '⚠️'
    case 'error': return '❌'
    default: return '❓'
  }
})

const systemStatusText = computed(() => {
  switch (systemStatusClass.value) {
    case 'good': return '正常运行'
    case 'warning': return '存在警告'
    case 'error': return '系统异常'
    default: return '状态未知'
  }
})

const controlModeText = computed(() => {
  if (!systemVariables.value) return '未知'

  const mode = systemVariables.value.variables.controlVariables.currentControlMode
  switch (mode) {
    case 'INDUCTIVE': return '感应控制'
    case 'MANUAL': return '手动控制'
    case 'MAINTENANCE': return '维护模式'
    default: return mode
  }
})

const controlModeDescription = computed(() => {
  if (!systemVariables.value) return ''

  const mode = systemVariables.value.variables.controlVariables.currentControlMode
  switch (mode) {
    case 'INDUCTIVE': return '基于车辆感应自动控制'
    case 'MANUAL': return '人工手动控制模式'
    case 'MAINTENANCE': return '系统维护中'
    default: return '其他控制模式'
  }
})

const communicationStatusClass = computed(() => {
  if (!systemVariables.value) return ''

  const status = systemVariables.value.variables.communicationVariables.communicationStatus
  switch (status) {
    case 'NORMAL': return 'good'
    case 'WARNING': return 'warning'
    case 'ERROR': return 'error'
    default: return ''
  }
})

const communicationStatusText = computed(() => {
  if (!systemVariables.value) return '未知'

  const status = systemVariables.value.variables.communicationVariables.communicationStatus
  switch (status) {
    case 'NORMAL': return '正常'
    case 'WARNING': return '警告'
    case 'ERROR': return '错误'
    default: return status
  }
})

const powerStatusText = computed(() => {
  if (!systemVariables.value) return '未知'

  const status = systemVariables.value.variables.communicationVariables.powerStatus
  switch (status) {
    case 'NORMAL': return '正常'
    case 'WARNING': return '警告'
    case 'ERROR': return '错误'
    default: return status
  }
})

const segmentStatusText = computed(() => {
  if (!systemVariables.value) return '未知'

  const cleared = systemVariables.value.variables.segmentVariables.clearedSegmentCount
  const total = systemVariables.value.variables.segmentVariables.segmentCount

  return `${cleared}/${total} 已清空`
})

const segmentStatusDescription = computed(() => {
  if (!systemVariables.value) return ''

  const cleared = systemVariables.value.variables.segmentVariables.clearedSegmentCount
  const total = systemVariables.value.variables.segmentVariables.segmentCount

  if (cleared === total) return '所有路段已清空'
  if (cleared === 0) return '所有路段未清空'
  return `${total - cleared} 个路段等待清空`
})

// 方法
const refreshStatus = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await monitoringApiService.getSystemVariables()
    systemVariables.value = response
    lastUpdateTime.value = response.timestamp

    // 发出状态变化事件
    if (systemStatusClass.value === 'error') {
      emit('statusChange', 'error')
    } else if (systemStatusClass.value === 'warning') {
      emit('statusChange', 'warning')
    } else {
      emit('statusChange', 'normal')
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取系统状态失败'
    error.value = errorMessage
    emit('error', errorMessage)
  } finally {
    isLoading.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value

  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh() // 先停止现有的定时器

  refreshTimer.value = setInterval(() => {
    refreshStatus()
  }, props.autoRefreshInterval) as unknown as number
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const formatTime = (timeString: string | null): string => {
  if (!timeString) return '未知'

  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN')
  } catch {
    return timeString
  }
}

const getPerformanceClass = (value: number): string => {
  if (value <= 0.1) return 'good'
  if (value <= 0.3) return 'warning'
  return 'error'
}

// 生命周期
onMounted(() => {
  refreshStatus()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 监听自动刷新变化
watch(() => props.autoRefreshInterval, (newInterval) => {
  if (autoRefresh.value) {
    stopAutoRefresh()
    refreshTimer.value = setInterval(() => {
      refreshStatus()
    }, newInterval) as unknown as number
  }
})
</script>

<style scoped>
.system-status-monitor {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.monitor-title {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.5rem;
}

.monitor-controls {
  display: flex;
  gap: 0.75rem;
}

.refresh-btn, .auto-refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auto-refresh-btn {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.auto-refresh-btn.active {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.auto-refresh-btn:hover {
  background: #f1f5f9;
}

.auto-refresh-btn.active:hover {
  background: #059669;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 系统总览 */
.system-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.overview-card {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.overview-card.good {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
}

.overview-card.warning {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.overview-card.error {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2, #fecaca);
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.card-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.card-value.good {
  color: #059669;
}

.card-value.warning {
  color: #d97706;
}

.card-value.error {
  color: #dc2626;
}

.card-score, .card-description {
  font-size: 0.75rem;
  color: #64748b;
}

/* 详细状态信息 */
.status-details {
  margin-top: 2rem;
}

.details-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.section-title {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 1.25rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.item-label {
  font-size: 0.875rem;
  color: #64748b;
}

.item-value {
  font-weight: 600;
  color: #1e293b;
}

/* 错误统计 */
.error-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.error-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  flex: 1;
}

.error-item.has-errors {
  border-color: #ef4444;
  background: #fef2f2;
}

.error-type {
  font-size: 0.875rem;
  color: #64748b;
}

.error-count {
  font-weight: 600;
  color: #1e293b;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.error-item.has-errors .error-count {
  background: #fee2e2;
  color: #dc2626;
}

/* 错误历史 */
.error-history {
  margin-top: 1rem;
}

.history-title {
  margin: 0 0 0.75rem 0;
  color: #1e293b;
  font-size: 0.875rem;
  font-weight: 600;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-record {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
}

.error-time {
  color: #64748b;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.error-desc {
  color: #1e293b;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.error-source {
  color: #64748b;
  font-size: 0.75rem;
}

/* 性能指标 */
.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.metric-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.metric-value {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 200px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-fill.good {
  background: #10b981;
}

.progress-fill.warning {
  background: #f59e0b;
}

.progress-fill.error {
  background: #ef4444;
}

.percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  min-width: 40px;
  text-align: right;
}

/* 错误和加载状态 */
.error-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
  font-weight: 500;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.retry-btn:hover {
  background: #dc2626;
}

.loading-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  color: #64748b;
  font-size: 0.875rem;
}

/* 更新信息 */
.update-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.update-text {
  font-size: 0.75rem;
  color: #64748b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-overview {
    grid-template-columns: 1fr;
  }

  .monitor-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .monitor-controls {
    justify-content: center;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .error-stats {
    flex-direction: column;
  }

  .metric-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .metric-value {
    max-width: none;
  }
}
</style>
