<!-- src/components/monitoring/SegmentStatusMonitor.vue -->
<template>
  <div class="segment-status-monitor">
    <div class="monitor-header">
      <h3 class="monitor-title">
        <span class="title-icon">🛣️</span>
        路段状态监控
      </h3>
      <div class="monitor-controls">
        <div class="segment-selector">
          <label for="segment-select">路段选择:</label>
          <select id="segment-select" v-model="selectedSegmentIds" multiple class="segment-select">
            <option v-for="id in availableSegmentIds" :key="id" :value="id">
              路段 {{ id }}
            </option>
          </select>
        </div>
        <button @click="refreshAllSegments" class="refresh-btn" :disabled="isLoading">
          <span class="btn-icon" :class="{ spinning: isLoading }">🔄</span>
          刷新全部
        </button>
        <button @click="toggleAutoRefresh" class="auto-refresh-btn" :class="{ active: autoRefresh }">
          <span class="btn-icon">{{ autoRefresh ? '⏸️' : '▶️' }}</span>
          {{ autoRefresh ? '停止' : '自动' }}
        </button>
      </div>
    </div>

    <!-- 路段总览统计 -->
    <div class="segments-overview">
      <div class="overview-stats">
        <div class="stat-card healthy">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-label">健康路段</div>
            <div class="stat-value">{{ healthySegments.length }}</div>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-label">警告路段</div>
            <div class="stat-value">{{ warningSegments.length }}</div>
          </div>
        </div>

        <div class="stat-card error">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-label">故障路段</div>
            <div class="stat-value">{{ errorSegments.length }}</div>
          </div>
        </div>

        <div class="stat-card info">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">平均健康度</div>
            <div class="stat-value">{{ averageHealthScore.toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 路段详细状态 -->
    <div class="segments-grid">
      <div
        v-for="segmentData in displayedSegments"
        :key="segmentData.segmentId"
        class="segment-card"
        :class="getSegmentStatusClass(segmentData)"
      >
        <div class="segment-header">
          <div class="segment-title">
            <span class="segment-icon">🛣️</span>
            路段 {{ segmentData.segmentId }}
          </div>
          <div class="segment-status">
            <span class="status-indicator" :class="getSegmentStatusClass(segmentData)"></span>
            <span class="status-text">{{ getSegmentStatusText(segmentData) }}</span>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="segment-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">健康度</span>
              <span class="info-value">
                <div class="health-bar">
                  <div
                    class="health-fill"
                    :class="getHealthBarClass(segmentData.variables.errorVariables.segmentHealthScore)"
                    :style="{ width: `${segmentData.variables.errorVariables.segmentHealthScore}%` }"
                  ></div>
                </div>
                {{ segmentData.variables.errorVariables.segmentHealthScore.toFixed(1) }}%
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">道路长度</span>
              <span class="info-value">{{ segmentData.variables.configParams.roadLength }}米</span>
            </div>

            <div class="info-item">
              <span class="info-label">当前决策</span>
              <span class="info-value decision" :class="segmentData.variables.clearanceVariables.overallClearanceDecision.toLowerCase()">
                {{ getClearanceDecisionText(segmentData.variables.clearanceVariables.overallClearanceDecision) }}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">上次放行</span>
              <span class="info-value traffic-direction" :class="getTrafficDirectionClass(segmentData.variables.scheduleVariables.lastServedDirection)">
                {{ getLastServedDirectionText(segmentData.variables.scheduleVariables.lastServedDirection) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 车辆状态 -->
        <div class="vehicle-status">
          <h4 class="subsection-title">车辆状态</h4>
          <div class="vehicle-grid">
            <div class="vehicle-direction">
              <div class="direction-header">
                <span class="direction-icon">⬆️</span>
                <span class="direction-title">上行</span>
              </div>
              <div class="direction-stats">
                <div class="stat-row">
                  <span class="stat-label">车辆数</span>
                  <span class="stat-value">{{ segmentData.variables.vehicleVariables.upstreamVehicleIds.length }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">进入计数</span>
                  <span class="stat-value">{{ segmentData.variables.vehicleVariables.upstreamInCounter }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">离开计数</span>
                  <span class="stat-value">{{ segmentData.variables.vehicleVariables.upstreamOutCounter }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">等待时间</span>
                  <span class="stat-value">{{ segmentData.variables.scheduleVariables.upstreamWaitingTime.toFixed(1) }}秒</span>
                </div>
              </div>
            </div>

            <div class="vehicle-direction">
              <div class="direction-header">
                <span class="direction-icon">⬇️</span>
                <span class="direction-title">下行</span>
              </div>
              <div class="direction-stats">
                <div class="stat-row">
                  <span class="stat-label">车辆数</span>
                  <span class="stat-value">{{ segmentData.variables.vehicleVariables.downstreamVehicleIds.length }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">进入计数</span>
                  <span class="stat-value">{{ segmentData.variables.vehicleVariables.downstreamInCounter }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">离开计数</span>
                  <span class="stat-value">{{ segmentData.variables.vehicleVariables.downstreamOutCounter }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">等待时间</span>
                  <span class="stat-value">{{ segmentData.variables.scheduleVariables.downstreamWaitingTime.toFixed(1) }}秒</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 配置和时间信息 -->
        <div class="config-time-info">
          <div class="config-section">
            <h4 class="subsection-title">配置参数</h4>
            <div class="config-grid">
              <div class="config-item">
                <span class="config-label">绿灯时间</span>
                <span class="config-value">
                  {{ segmentData.variables.configParams.minGreen }}-{{ segmentData.variables.configParams.maxGreen }}秒
                </span>
              </div>
              <div class="config-item">
                <span class="config-label">红灯时间</span>
                <span class="config-value">
                  {{ segmentData.variables.configParams.minRed }}-{{ segmentData.variables.configParams.maxRed }}秒
                </span>
              </div>
            </div>
          </div>

          <div class="time-section">
            <h4 class="subsection-title">时间状态</h4>
            <div class="time-grid">
              <div class="time-item">
                <span class="time-label">绿灯持续</span>
                <span class="time-value">{{ getDurationText(segmentData.variables.timeVariables.greenStartTime) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">红灯持续</span>
                <span class="time-value">{{ getDurationText(segmentData.variables.timeVariables.redStartTime) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">距离切换</span>
                <span class="time-value">{{ getDurationText(segmentData.variables.timeVariables.lastSwitchTime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误统计 -->
        <div class="error-section" v-if="hasErrors(segmentData)">
          <h4 class="subsection-title error-title">错误统计</h4>
          <div class="error-stats">
            <div class="error-stat" v-if="segmentData.variables.errorVariables.errorCountMismatch > 0">
              <span class="error-label">计数不匹配</span>
              <span class="error-count">{{ segmentData.variables.errorVariables.errorCountMismatch }}</span>
            </div>
            <div class="error-stat" v-if="segmentData.variables.errorVariables.errorCountIdLogic > 0">
              <span class="error-label">ID逻辑错误</span>
              <span class="error-count">{{ segmentData.variables.errorVariables.errorCountIdLogic }}</span>
            </div>
            <div class="error-stat" v-if="segmentData.variables.errorVariables.consecutiveErrors > 0">
              <span class="error-label">连续错误</span>
              <span class="error-count">{{ segmentData.variables.errorVariables.consecutiveErrors }}</span>
            </div>
          </div>
        </div>

        <!-- 状态标识 -->
        <div class="status-flags">
          <div class="flag-grid">
            <div class="status-flag" :class="{ active: segmentData.variables.statusVariables.faultDetected }">
              <span class="flag-icon">{{ segmentData.variables.statusVariables.faultDetected ? '❌' : '✅' }}</span>
              <span class="flag-text">故障检测</span>
            </div>
            <div class="status-flag" :class="{ active: segmentData.variables.statusVariables.criticalSensorsNormal }">
              <span class="flag-icon">{{ segmentData.variables.statusVariables.criticalSensorsNormal ? '✅' : '❌' }}</span>
              <span class="flag-text">传感器正常</span>
            </div>
            <div class="status-flag" :class="{ active: segmentData.variables.statusVariables.emptyUpstreamMeetingzone }">
              <span class="flag-icon">{{ segmentData.variables.statusVariables.emptyUpstreamMeetingzone ? '✅' : '🚗' }}</span>
              <span class="flag-text">上行会车区空</span>
            </div>
            <div class="status-flag" :class="{ active: segmentData.variables.statusVariables.emptyDownstreamMeetingzone }">
              <span class="flag-icon">{{ segmentData.variables.statusVariables.emptyDownstreamMeetingzone ? '✅' : '🚗' }}</span>
              <span class="flag-text">下行会车区空</span>
            </div>
          </div>
        </div>

        <!-- 刷新按钮 -->
        <div class="segment-actions">
          <button @click="refreshSegment(segmentData.segmentId)" class="segment-refresh-btn" :disabled="isLoading">
            <span class="btn-icon" :class="{ spinning: isLoading }">🔄</span>
            刷新路段
          </button>
          <div class="segment-update-time">
            最后更新: {{ formatTime(segmentData.timestamp) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态显示 -->
    <div v-if="error" class="error-display">
      <div class="error-icon">❌</div>
      <div class="error-message">{{ error }}</div>
      <button @click="refreshAllSegments" class="retry-btn">重试</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading && segmentData.length === 0" class="loading-display">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载路段状态...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { monitoringApiService, type SegmentVariablesResponse, VariableStatusHelper } from '@/api/monitoring'

// Props
interface Props {
  defaultSegmentIds?: number[]
  autoRefreshInterval?: number
  showVehicleDetails?: boolean
  showErrorDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultSegmentIds: () => [1, 2, 3, 4],
  autoRefreshInterval: 15000, // 15秒
  showVehicleDetails: true,
  showErrorDetails: true
})

// Emits
const emit = defineEmits<{
  segmentStatusChange: [segmentId: number, status: 'normal' | 'warning' | 'error']
  error: [error: string]
}>()

// 响应式数据
const segmentData = ref<SegmentVariablesResponse[]>([])
const selectedSegmentIds = ref<number[]>([...props.defaultSegmentIds])
const availableSegmentIds = [1, 2, 3, 4]
const isLoading = ref(false)
const error = ref<string | null>(null)
const autoRefresh = ref(false)
const refreshTimer = ref<number | null>(null)

// 计算属性
const displayedSegments = computed(() => {
  return segmentData.value.filter(segment =>
    selectedSegmentIds.value.includes(segment.segmentId)
  )
})

const healthySegments = computed(() => {
  return displayedSegments.value.filter(segment =>
    segment.variables.errorVariables.segmentHealthScore >= 90 &&
    !segment.variables.statusVariables.faultDetected
  )
})

const warningSegments = computed(() => {
  return displayedSegments.value.filter(segment => {
    const healthScore = segment.variables.errorVariables.segmentHealthScore
    const hasFault = segment.variables.statusVariables.faultDetected
    return !hasFault && healthScore >= 70 && healthScore < 90
  })
})

const errorSegments = computed(() => {
  return displayedSegments.value.filter(segment =>
    segment.variables.statusVariables.faultDetected ||
    segment.variables.errorVariables.segmentHealthScore < 70
  )
})

const averageHealthScore = computed(() => {
  if (displayedSegments.value.length === 0) return 0
  const total = displayedSegments.value.reduce((sum, segment) =>
    sum + segment.variables.errorVariables.segmentHealthScore, 0
  )
  return total / displayedSegments.value.length
})

// 方法
const refreshAllSegments = async () => {
  isLoading.value = true
  error.value = null

  try {
    const results = await VariableStatusHelper.getAllSegmentVariables(selectedSegmentIds.value)
    segmentData.value = results

    // 发出状态变化事件
    results.forEach(segment => {
      const status = getSegmentStatus(segment)
      emit('segmentStatusChange', segment.segmentId, status)
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取路段状态失败'
    error.value = errorMessage
    emit('error', errorMessage)
  } finally {
    isLoading.value = false
  }
}

const refreshSegment = async (segmentId: number) => {
  try {
    const response = await monitoringApiService.getSegmentVariables(segmentId)
    const index = segmentData.value.findIndex(s => s.segmentId === segmentId)

    if (index !== -1) {
      segmentData.value[index] = response
    } else {
      segmentData.value.push(response)
    }

    const status = getSegmentStatus(response)
    emit('segmentStatusChange', segmentId, status)

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : `刷新路段${segmentId}失败`
    error.value = errorMessage
    emit('error', errorMessage)
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
  stopAutoRefresh()

  refreshTimer.value = setInterval(() => {
    refreshAllSegments()
  }, props.autoRefreshInterval) as unknown as number
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const getSegmentStatus = (segment: SegmentVariablesResponse): 'normal' | 'warning' | 'error' => {
  if (segment.variables.statusVariables.faultDetected) return 'error'
  if (segment.variables.errorVariables.segmentHealthScore < 70) return 'error'
  if (segment.variables.errorVariables.segmentHealthScore < 90) return 'warning'
  return 'normal'
}

const getSegmentStatusClass = (segment: SegmentVariablesResponse): string => {
  const status = getSegmentStatus(segment)
  return `status-${status}`
}

const getSegmentStatusText = (segment: SegmentVariablesResponse): string => {
  const status = getSegmentStatus(segment)
  switch (status) {
    case 'normal': return '正常运行'
    case 'warning': return '存在警告'
    case 'error': return '故障异常'
    default: return '未知状态'
  }
}

const getHealthBarClass = (healthScore: number): string => {
  if (healthScore >= 90) return 'excellent'
  if (healthScore >= 70) return 'good'
  if (healthScore >= 50) return 'warning'
  return 'error'
}

const getClearanceDecisionText = (decision: string): string => {
  switch (decision) {
    case 'CLEAR': return '清空'
    case 'WAIT': return '等待'
    case 'CONFLICT': return '冲突'
    default: return decision
  }
}

const getLastServedDirectionText = (direction: string): string => {
  switch (direction) {
    case 'UPSTREAM': return '上行'
    case 'DOWNSTREAM': return '下行'
    case 'NONE': return '禁止'
    default: return direction
  }
}

const getTrafficDirectionClass = (direction: string): string => {
  switch (direction) {
    case 'UPSTREAM': return 'upstream'
    case 'DOWNSTREAM': return 'downstream'
    case 'NONE': return 'none'
    default: return ''
  }
}

// const getDirectionText = (direction: string): string => {
//   switch (direction) {
//     case 'UPSTREAM': return '上行'
//     case 'DOWNSTREAM': return '下行'
//     case 'NONE': return '无'
//     default: return direction
//   }
// }

const getDurationText = (timeString: string | null): string => {
  if (!timeString) return '0秒'

  try {
    const startTime = new Date(timeString)
    const currentTime = new Date()
    const durationMs = currentTime.getTime() - startTime.getTime()
    const durationSeconds = Math.floor(durationMs / 1000)

    if (durationSeconds < 0) return '0秒'

    if (durationSeconds < 60) {
      return `${durationSeconds}秒`
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60)
      const seconds = durationSeconds % 60
      return `${minutes}分${seconds}秒`
    } else {
      const hours = Math.floor(durationSeconds / 3600)
      const minutes = Math.floor((durationSeconds % 3600) / 60)
      const seconds = durationSeconds % 60
      return `${hours}时${minutes}分${seconds}秒`
    }
  } catch {
    return '无效时间'
  }
}

const hasErrors = (segment: SegmentVariablesResponse): boolean => {
  const errors = segment.variables.errorVariables
  return errors.errorCountMismatch > 0 ||
    errors.errorCountIdLogic > 0 ||
    errors.consecutiveErrors > 0
}

const formatTime = (timeString: string | null): string => {
  if (!timeString) return '无'

  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN')
  } catch {
    return timeString
  }
}

// 生命周期
onMounted(() => {
  refreshAllSegments()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 监听选中路段变化
watch(selectedSegmentIds, () => {
  refreshAllSegments()
}, { deep: true })

// 监听自动刷新间隔变化
watch(() => props.autoRefreshInterval, (newInterval) => {
  if (autoRefresh.value) {
    stopAutoRefresh()
    refreshTimer.value = setInterval(() => {
      refreshAllSegments()
    }, newInterval) as unknown as number
  }
})
</script>

<style scoped>
.segment-status-monitor {
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
  flex-wrap: wrap;
  gap: 1rem;
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
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.segment-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.segment-selector label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.segment-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  min-width: 120px;
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

/* 路段总览统计 */
.segments-overview {
  margin-bottom: 2rem;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid;
  background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1));
}

.stat-card.healthy {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
}

.stat-card.warning {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.stat-card.error {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2, #fecaca);
}

.stat-card.info {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.stat-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

/* 路段卡片网格 */
.segments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.segment-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.segment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.segment-card.status-normal {
  border-color: #10b981;
}

.segment-card.status-warning {
  border-color: #f59e0b;
}

.segment-card.status-error {
  border-color: #ef4444;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.segment-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.segment-icon {
  font-size: 1.25rem;
}

.segment-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.status-normal {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.status-indicator.status-warning {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.status-indicator.status-error {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

/* 路段信息 */
.segment-info {
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.info-label {
  font-size: 0.875rem;
  color: #64748b;
}

.info-value {
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.health-bar {
  width: 60px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.health-fill.excellent {
  background: #10b981;
}

.health-fill.good {
  background: #22c55e;
}

.health-fill.warning {
  background: #f59e0b;
}

.health-fill.error {
  background: #ef4444;
}

.decision {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.decision.clear {
  background: #d1fae5;
  color: #065f46;
}

.decision.wait {
  background: #fef3c7;
  color: #92400e;
}

.traffic-direction {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.traffic-direction.upstream {
  background: #d1fae5;
  color: #065f46;
}

.traffic-direction.downstream {
  background: #dbeafe;
  color: #1e40af;
}

.traffic-direction.none {
  background: #fecaca;
  color: #991b1b;
}

/* 车辆状态 */
.vehicle-status {
  margin-bottom: 1.5rem;
}

.subsection-title {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subsection-title.error-title {
  color: #dc2626;
}

.vehicle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.vehicle-direction {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.direction-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.direction-icon {
  font-size: 1.25rem;
}

.direction-title {
  font-weight: 600;
  color: #374151;
}

.direction-stats {
  padding: 0.75rem 1rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
}

/* 配置和时间信息 */
.config-time-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.config-section, .time-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
}

.config-grid, .time-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-item, .time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-label, .time-label {
  font-size: 0.875rem;
  color: #64748b;
}

.config-value, .time-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

/* 错误统计 */
.error-section {
  margin-bottom: 1.5rem;
}

.error-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.error-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  min-width: 120px;
  flex: 1;
}

.error-label {
  font-size: 0.875rem;
  color: #7f1d1d;
}

.error-count {
  font-weight: 600;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

/* 状态标识 */
.status-flags {
  margin-bottom: 1.5rem;
}

.flag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.status-flag {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: center;
  transition: all 0.2s ease;
}

.status-flag.active {
  background: #f0fdf4;
  border-color: #22c55e;
}

.flag-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.flag-text {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.status-flag.active .flag-text {
  color: #166534;
}

/* 路段操作 */
.segment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.segment-refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: 0.875rem;
}

.segment-refresh-btn:hover:not(:disabled) {
  background: #d97706;
}

.segment-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.segment-update-time {
  font-size: 0.75rem;
  color: #64748b;
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
  margin-top: 2rem;
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
  margin-top: 2rem;
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .segments-grid {
    grid-template-columns: 1fr;
  }

  .vehicle-grid {
    grid-template-columns: 1fr;
  }

  .config-time-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .monitor-header {
    flex-direction: column;
    align-items: stretch;
  }

  .monitor-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .segment-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .segment-select {
    min-width: auto;
  }

  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .segments-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .flag-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .segment-actions {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .segment-refresh-btn {
    justify-content: center;
  }

  .segment-update-time {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .overview-stats {
    grid-template-columns: 1fr;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .error-stats {
    flex-direction: column;
  }

  .flag-grid {
    grid-template-columns: 1fr;
  }
}
</style>
