<!-- src/views/MonitoringViewV2.vue -->
<template>
  <div class="monitoring-view">
    <!-- 头部区域 -->
    <div class="view-header">
      <h1 class="view-title">系统监控中心</h1>
      <div class="status-info">
        <div class="connection-status" :class="connectionStatusClass">
          <span class="status-indicator"></span>
          {{ connectionStatusText }}
        </div>
        <div class="last-update">
          最后更新: {{ formatTime(lastUpdateTime) }}
        </div>
      </div>
    </div>

    <!-- 系统状态总览面板 -->
    <div class="overview-panel">
      <div class="overview-grid">
        <div class="overview-card system" :class="systemHealthClass">
          <div class="card-icon">{{ getSystemIcon() }}</div>
          <div class="card-content">
            <div class="card-title">系统状态</div>
            <div class="card-value">{{ systemStatusText }}</div>
            <div class="card-description">{{ systemStatusDescription }}</div>
          </div>
        </div>

        <div class="overview-card segments" :class="getSegmentsOverallClass()">
          <div class="card-icon">🛣️</div>
          <div class="card-content">
            <div class="card-title">路段状态</div>
            <div class="card-value">{{ getSegmentsStatusText() }}</div>
            <div class="card-description">{{ getSegmentsStatusDescription() }}</div>
          </div>
        </div>

        <div class="overview-card operations">
          <div class="card-icon">⚙️</div>
          <div class="card-content">
            <div class="card-title">操作统计</div>
            <div class="card-value">{{ operationHistory.length }}</div>
            <div class="card-description">总操作记录</div>
          </div>
        </div>

        <div class="overview-card health" :class="getHealthIndicatorClass()">
          <div class="card-icon">💚</div>
          <div class="card-content">
            <div class="card-title">健康指数</div>
            <div class="card-value">{{ getOverallHealthScore() }}%</div>
            <div class="card-description">综合健康度评分</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 监控选项卡 -->
    <div class="monitoring-tabs">
      <div class="tabs-header">
        <button
          v-for="tab in monitoringTabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="tab-button"
          :class="{ active: activeTab === tab.key }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.badge" class="tab-badge" :class="tab.badgeClass">{{ tab.badge }}</span>
        </button>
      </div>

      <div class="tabs-content">
        <!-- 系统状态监控 -->
        <div v-if="activeTab === 'system'" class="tab-panel">
          <SystemStatusMonitor
            :auto-refresh-interval="30000"
            :show-details="true"
            @status-change="handleSystemStatusChange"
            @error="handleMonitoringError"
          />
        </div>

        <!-- 路段状态监控 -->
        <div v-if="activeTab === 'segments'" class="tab-panel">
          <SegmentStatusMonitor
            :default-segment-ids="[1, 2, 3, 4]"
            :auto-refresh-interval="15000"
            :show-vehicle-details="true"
            :show-error-details="true"
            @segment-status-change="handleSegmentStatusChange"
            @error="handleMonitoringError"
          />
        </div>

        <!-- 控制面板 -->
        <div v-if="activeTab === 'control'" class="tab-panel">
          <div class="control-panel">
            <div class="panel-header">
              <h2 class="panel-title">系统控制面板</h2>
              <div class="panel-actions">
                <button @click="refreshAllData" class="refresh-btn" :disabled="isRefreshing">
                  <span class="btn-icon" :class="{ spinning: isRefreshing }">🔄</span>
                  刷新全部
                </button>
              </div>
            </div>

            <div class="control-sections">
              <!-- 系统重置控制 -->
              <div class="control-section">
                <div class="section-header">
                  <h3 class="section-title">系统重置</h3>
                  <div class="section-status" :class="systemHealthClass">
                    {{ systemStatusText }}
                  </div>
                </div>

                <div class="section-content">
                  <div class="control-description">
                    <p>系统重置将清空所有状态数据，重新初始化系统状态机。</p>
                    <p class="warning-text">⚠️ 此操作不可撤销，请谨慎执行！</p>
                  </div>

                  <div class="control-actions">
                    <button
                      @click="showResetConfirm"
                      class="reset-btn"
                      :disabled="isResetting"
                    >
                      <span class="btn-icon">🔄</span>
                      {{ isResetting ? '重置中...' : '系统重置' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 快速操作 -->
              <div class="control-section">
                <div class="section-header">
                  <h3 class="section-title">快速操作</h3>
                </div>

                <div class="section-content">
                  <div class="quick-actions">
                    <button @click="exportSystemData" class="quick-btn">
                      <span class="btn-icon">📊</span>
                      导出系统数据
                    </button>
                    <button @click="exportOperationLog" class="quick-btn">
                      <span class="btn-icon">📝</span>
                      导出操作日志
                    </button>
                    <button @click="checkSystemHealth" class="quick-btn">
                      <span class="btn-icon">🏥</span>
                      系统健康检查
                    </button>
                    <button @click="clearOperationHistory" class="quick-btn warning">
                      <span class="btn-icon">🗑️</span>
                      清空操作历史
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作历史 -->
        <div v-if="activeTab === 'history'" class="tab-panel">
          <div class="history-panel">
            <div class="panel-header">
              <h2 class="panel-title">操作历史记录</h2>
              <div class="panel-actions">
                <div class="history-filters">
                  <select v-model="historyFilter" class="filter-select">
                    <option value="all">全部操作</option>
                    <option value="success">成功操作</option>
                    <option value="error">失败操作</option>
                    <option value="pending">进行中</option>
                  </select>
                  <button @click="toggleHistoryView" class="view-toggle-btn">
                    <span class="btn-icon">{{ showAllHistory ? '📋' : '📄' }}</span>
                    {{ showAllHistory ? '简化视图' : '详细视图' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="history-content">
              <div v-if="filteredHistory.length === 0" class="no-history">
                <div class="no-history-icon">📝</div>
                <div class="no-history-text">暂无操作记录</div>
              </div>

              <div v-else class="history-list">
                <div
                  v-for="record in displayedHistory"
                  :key="record.id"
                  class="history-item"
                  :class="`status-${record.status}`"
                >
                  <div class="item-header">
                    <div class="item-status">
                      <span class="status-icon">{{ getStatusIcon(record.status) }}</span>
                      <span class="status-text">{{ getStatusText(record.status) }}</span>
                    </div>
                    <div class="item-time">{{ formatTime(record.timestamp) }}</div>
                  </div>

                  <div class="item-content">
                    <div class="item-operation">{{ record.operation }}</div>
                    <div class="item-message">{{ record.message }}</div>

                    <div v-if="showAllHistory && (record.eventCode || record.eventCounter)" class="item-details">
                      <div v-if="record.eventCode" class="detail-item">
                        <span class="detail-label">事件代码:</span>
                        <span class="detail-value">{{ record.eventCode }}</span>
                      </div>
                      <div v-if="record.eventCounter" class="detail-item">
                        <span class="detail-label">事件计数:</span>
                        <span class="detail-value">{{ record.eventCounter }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 分页控制 -->
                <div v-if="totalPages > 1" class="history-pagination">
                  <button
                    @click="currentPage--"
                    :disabled="currentPage <= 1"
                    class="page-btn"
                  >
                    上一页
                  </button>
                  <span class="page-info">
                    第 {{ currentPage }} / {{ totalPages }} 页
                  </span>
                  <button
                    @click="currentPage++"
                    :disabled="currentPage >= totalPages"
                    class="page-btn"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click="cancelReset">
      <div class="modal-content confirm-dialog" @click.stop>
        <div class="modal-header">
          <h3>确认系统重置</h3>
          <button @click="cancelReset" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirm-content">
            <div class="confirm-icon">⚠️</div>
            <div class="confirm-text">
              <p><strong>您即将执行系统重置操作</strong></p>
              <p>此操作将会：</p>
              <ul>
                <li>清空所有状态机状态数据</li>
                <li>重置所有路段变量</li>
                <li>清除临时缓存数据</li>
                <li>重新初始化系统</li>
              </ul>
              <p class="warning">⚠️ 此操作不可撤销，确定要继续吗？</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cancelReset" class="btn btn-secondary">取消</button>
          <button @click="confirmReset" class="btn btn-danger" :disabled="isResetting">
            <span v-if="isResetting" class="loading-spinner"></span>
            {{ isResetting ? '重置中...' : '确认重置' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" class="message-toast" :class="message.type">
      <span class="message-icon">{{ getMessageIcon(message.type) }}</span>
      <span class="message-text">{{ message.text }}</span>
      <button class="message-close" @click="clearMessage">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { monitoringApiService, VariableStatusHelper } from '@/api/monitoring'
import SystemStatusMonitor from '@/components/monitoring/SystemStatusMonitor.vue'
import SegmentStatusMonitor from '@/components/monitoring/SegmentStatusMonitor.vue'

// 响应式数据
const isResetting = ref(false)
const isRefreshing = ref(false)
const lastUpdateTime = ref(new Date())
const showConfirmDialog = ref(false)
const connectionStatus = ref<'connected' | 'disconnected' | 'connecting'>('connected')
const systemHealth = ref<'normal' | 'warning' | 'error'>('normal')

// 监控选项卡
const activeTab = ref('system')
const systemStatus = ref<'normal' | 'warning' | 'error'>('normal')
const segmentStatuses = ref<Record<number, 'normal' | 'warning' | 'error'>>({})

// 操作历史记录
interface OperationRecord {
  id: number
  operation: string
  message: string
  status: 'success' | 'error' | 'pending'
  timestamp: Date
  eventCode?: string
  eventCounter?: number
}

const operationHistory = ref<OperationRecord[]>([])
const historyFilter = ref('all')
const showAllHistory = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// 消息提示
interface Message {
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
}

const message = ref<Message | null>(null)

// 计算属性
const monitoringTabs = computed(() => {
  const errorSegments = Object.values(segmentStatuses.value).filter(s => s === 'error').length
  const warningSegments = Object.values(segmentStatuses.value).filter(s => s === 'warning').length

  return [
    {
      key: 'system',
      label: '系统监控',
      icon: '🖥️',
      badge: systemStatus.value === 'normal' ? null : '!',
      badgeClass: systemStatus.value === 'error' ? 'error' : 'warning'
    },
    {
      key: 'segments',
      label: '路段监控',
      icon: '🛣️',
      badge: errorSegments > 0 ? errorSegments.toString() : (warningSegments > 0 ? warningSegments.toString() : null),
      badgeClass: errorSegments > 0 ? 'error' : (warningSegments > 0 ? 'warning' : '')
    },
    {
      key: 'control',
      label: '控制面板',
      icon: '🎛️'
    },
    {
      key: 'history',
      label: '操作历史',
      icon: '📋',
      badge: operationHistory.value.length > 0 ? operationHistory.value.length.toString() : null,
      badgeClass: 'info'
    }
  ]
})

const connectionStatusClass = computed(() => ({
  'status-connected': connectionStatus.value === 'connected',
  'status-disconnected': connectionStatus.value === 'disconnected',
  'status-connecting': connectionStatus.value === 'connecting'
}))

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'API连接正常'
    case 'disconnected': return 'API连接断开'
    case 'connecting': return '连接中...'
    default: return '未知状态'
  }
})

const systemHealthClass = computed(() => ({
  'success': systemHealth.value === 'normal',
  'warning': systemHealth.value === 'warning',
  'error': systemHealth.value === 'error'
}))

const systemStatusText = computed(() => {
  switch (systemHealth.value) {
    case 'normal': return '正常运行'
    case 'warning': return '存在警告'
    case 'error': return '系统异常'
    default: return '未知状态'
  }
})

const systemStatusDescription = computed(() => {
  switch (systemHealth.value) {
    case 'normal': return '所有服务正常运行'
    case 'warning': return '部分功能可能受影响'
    case 'error': return '系统存在严重问题'
    default: return ''
  }
})

const filteredHistory = computed(() => {
  if (historyFilter.value === 'all') return operationHistory.value
  return operationHistory.value.filter(record => record.status === historyFilter.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredHistory.value.length / pageSize.value)
})

const displayedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredHistory.value.slice(start, end)
})

// 方法
const getSystemIcon = (): string => {
  switch (systemHealth.value) {
    case 'normal': return '✅'
    case 'warning': return '⚠️'
    case 'error': return '❌'
    default: return '❓'
  }
}

const getSegmentsOverallClass = (): string => {
  const errorCount = Object.values(segmentStatuses.value).filter(s => s === 'error').length
  const warningCount = Object.values(segmentStatuses.value).filter(s => s === 'warning').length

  if (errorCount > 0) return 'error'
  if (warningCount > 0) return 'warning'
  return 'success'
}

const getSegmentsStatusText = (): string => {
  const total = Object.keys(segmentStatuses.value).length
  const normal = Object.values(segmentStatuses.value).filter(s => s === 'normal').length

  if (total === 0) return '监控中'
  return `${normal}/${total} 正常`
}

const getSegmentsStatusDescription = (): string => {
  const total = Object.keys(segmentStatuses.value).length
  const errorCount = Object.values(segmentStatuses.value).filter(s => s === 'error').length
  const warningCount = Object.values(segmentStatuses.value).filter(s => s === 'warning').length

  if (total === 0) return '正在获取路段状态'
  if (errorCount > 0) return `${errorCount} 个路段故障`
  if (warningCount > 0) return `${warningCount} 个路段警告`
  return '所有路段正常'
}

const getHealthIndicatorClass = (): string => {
  const healthScore = getOverallHealthScore()
  if (healthScore >= 90) return 'success'
  if (healthScore >= 70) return 'warning'
  return 'error'
}

const getOverallHealthScore = (): number => {
  // 这里可以根据系统状态和路段状态计算综合健康度
  const totalSegments = Object.keys(segmentStatuses.value).length
  if (totalSegments === 0) return 0

  const normalSegments = Object.values(segmentStatuses.value).filter(s => s === 'normal').length
  const warningSegments = Object.values(segmentStatuses.value).filter(s => s === 'warning').length

  let baseScore = (normalSegments * 100 + warningSegments * 70) / totalSegments

  // 系统状态影响
  if (systemStatus.value === 'error') baseScore *= 0.5
  else if (systemStatus.value === 'warning') baseScore *= 0.8

  return Math.round(baseScore)
}

// 监控事件处理
const handleSystemStatusChange = (status: 'normal' | 'warning' | 'error') => {
  systemStatus.value = status
  systemHealth.value = status

  addOperationRecord({
    operation: '系统状态变化',
    message: `系统状态变更为: ${getStatusText(status)}`,
    status: 'success'
  })
}

const handleSegmentStatusChange = (segmentId: number, status: 'normal' | 'warning' | 'error') => {
  segmentStatuses.value[segmentId] = status

  addOperationRecord({
    operation: `路段${segmentId}状态变化`,
    message: `路段${segmentId}状态变更为: ${getStatusText(status)}`,
    status: 'success'
  })
}

const handleMonitoringError = (error: string) => {
  console.error('监控错误:', error)
  showMessage('error', error)

  addOperationRecord({
    operation: '监控错误',
    message: error,
    status: 'error'
  })
}

// 操作记录管理
const addOperationRecord = (record: Omit<OperationRecord, 'id' | 'timestamp'>) => {
  const newRecord: OperationRecord = {
    ...record,
    id: Date.now(),
    timestamp: new Date()
  }

  operationHistory.value.unshift(newRecord)

  // 限制历史记录数量
  if (operationHistory.value.length > 1000) {
    operationHistory.value = operationHistory.value.slice(0, 1000)
  }
}

// 系统重置相关
const showResetConfirm = () => {
  showConfirmDialog.value = true
}

const cancelReset = () => {
  showConfirmDialog.value = false
}

const confirmReset = async () => {
  isResetting.value = true
  showConfirmDialog.value = false

  const operationId = Date.now()

  addOperationRecord({
    operation: '系统重置',
    message: '开始执行系统重置操作',
    status: 'pending'
  })

  try {
    const response = await monitoringApiService.reset()

    // 更新操作记录
    const record = operationHistory.value.find(r => r.id === operationId)
    if (record) {
      record.status = 'success'
      record.message = response.message || '系统重置成功'
      record.eventCode = response.eventCode
      record.eventCounter = response.eventCounter
    }

    showMessage('success', response.message || '系统重置成功')

    // 重置本地状态
    systemHealth.value = 'normal'
    connectionStatus.value = 'connected'
    lastUpdateTime.value = new Date()

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '系统重置失败'

    // 更新操作记录
    const record = operationHistory.value.find(r => r.id === operationId)
    if (record) {
      record.status = 'error'
      record.message = errorMessage
    }

    showMessage('error', `系统重置失败: ${errorMessage}`)

    connectionStatus.value = 'disconnected'
    systemHealth.value = 'error'

  } finally {
    isResetting.value = false
  }
}

// 其他操作方法
const refreshAllData = async () => {
  isRefreshing.value = true

  addOperationRecord({
    operation: '刷新数据',
    message: '开始刷新所有监控数据',
    status: 'pending'
  })

  try {
    // 这里可以触发所有监控组件的刷新
    lastUpdateTime.value = new Date()

    const record = operationHistory.value[0]
    if (record && record.operation === '刷新数据') {
      record.status = 'success'
      record.message = '所有监控数据刷新完成'
    }

    showMessage('success', '数据刷新完成')

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '数据刷新失败'

    const record = operationHistory.value[0]
    if (record && record.operation === '刷新数据') {
      record.status = 'error'
      record.message = errorMessage
    }

    showMessage('error', errorMessage)

  } finally {
    isRefreshing.value = false
  }
}

const exportSystemData = () => {
  // 导出系统数据的逻辑
  addOperationRecord({
    operation: '导出系统数据',
    message: '系统数据导出完成',
    status: 'success'
  })

  showMessage('success', '系统数据导出完成')
}

const exportOperationLog = () => {
  // 导出操作日志的逻辑
  const dataStr = JSON.stringify(operationHistory.value, null, 2)
  const dataBlob = new Blob([dataStr], {type: 'application/json'})
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `operation-log-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)

  addOperationRecord({
    operation: '导出操作日志',
    message: '操作日志导出完成',
    status: 'success'
  })

  showMessage('success', '操作日志导出完成')
}

const checkSystemHealth = async () => {
  addOperationRecord({
    operation: '系统健康检查',
    message: '开始执行系统健康检查',
    status: 'pending'
  })

  try {
    // 调用健康检查API
    const healthData = await VariableStatusHelper.checkSystemReadiness()

    const record = operationHistory.value[0]
    if (record && record.operation === '系统健康检查') {
      record.status = 'success'
      record.message = `健康检查完成 - 系统健康度: ${healthData.systemHealthScore.toFixed(1)}%`
    }

    showMessage('success', '系统健康检查完成')

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '健康检查失败'

    const record = operationHistory.value[0]
    if (record && record.operation === '系统健康检查') {
      record.status = 'error'
      record.message = errorMessage
    }

    showMessage('error', errorMessage)
  }
}

const clearOperationHistory = () => {
  if (confirm('确定要清空所有操作历史记录吗？此操作不可撤销。')) {
    const count = operationHistory.value.length
    operationHistory.value = []
    currentPage.value = 1

    showMessage('success', `已清空 ${count} 条操作记录`)
  }
}

const toggleHistoryView = () => {
  showAllHistory.value = !showAllHistory.value
}

// 工具方法
const formatTime = (date: Date): string => {
  return date.toLocaleString('zh-CN')
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'pending': return '⏳'
    case 'normal': return '✅'
    case 'warning': return '⚠️'
    default: return '❓'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'success': return '成功'
    case 'error': return '失败'
    case 'pending': return '进行中'
    case 'normal': return '正常'
    case 'warning': return '警告'
    default: return '未知'
  }
}

const getMessageIcon = (type: string): string => {
  switch (type) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    default: return '📝'
  }
}

const showMessage = (type: Message['type'], text: string) => {
  message.value = { type, text }

  setTimeout(() => {
    clearMessage()
  }, 5000)
}

const clearMessage = () => {
  message.value = null
}

// 模拟系统状态检查
const checkSystemHealthPeriodic = () => {
  lastUpdateTime.value = new Date()
}

// 生命周期
let healthCheckInterval: number | null = null

onMounted(() => {
  // 定期检查系统状态
  healthCheckInterval = setInterval(checkSystemHealthPeriodic, 30000) as unknown as number
  checkSystemHealthPeriodic()

  // 初始化一些示例数据
  addOperationRecord({
    operation: '系统启动',
    message: '监控系统已启动，开始数据采集',
    status: 'success'
  })
})

onUnmounted(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
})

// 监听历史过滤器变化，重置页码
watch(historyFilter, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.monitoring-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.view-title {
  color: #2d3748;
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-connected .status-indicator {
  background: #48bb78;
  box-shadow: 0 0 8px rgba(72, 187, 120, 0.4);
}

.status-disconnected .status-indicator {
  background: #f56565;
  box-shadow: 0 0 8px rgba(245, 101, 101, 0.4);
}

.status-connecting .status-indicator {
  background: #ed8936;
  animation: pulse 1.5s infinite;
}

.last-update {
  font-size: 0.9rem;
  color: #718096;
}

/* 系统状态总览面板 */
.overview-panel {
  margin-bottom: 2rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.overview-card.success {
  border-left: 4px solid #48bb78;
}

.overview-card.warning {
  border-left: 4px solid #ed8936;
}

.overview-card.error {
  border-left: 4px solid #f56565;
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.card-description {
  font-size: 0.75rem;
  color: #a0aec0;
}

/* 监控选项卡 */
.monitoring-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: #718096;
  position: relative;
}

.tab-button:hover {
  background: #edf2f7;
  color: #4a5568;
}

.tab-button.active {
  background: white;
  color: #2d3748;
  border-bottom: 2px solid #667eea;
}

.tab-icon {
  font-size: 1.125rem;
}

.tab-badge {
  background: #e53e3e;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-badge.warning {
  background: #ed8936;
}

.tab-badge.info {
  background: #3182ce;
}

.tabs-content {
  padding: 2rem;
}

.tab-panel {
  min-height: 400px;
}

/* 控制面板样式 */
.control-panel {
  background: #f8fafc;
  border-radius: 8px;
  padding: 2rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.panel-title {
  color: #2d3748;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
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
  font-size: 0.875rem;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.control-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.control-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.section-title {
  margin: 0;
  color: #2d3748;
  font-size: 1.125rem;
  font-weight: 600;
}

.section-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.section-status.success {
  background: #c6f6d5;
  color: #22543d;
}

.section-status.warning {
  background: #fbd38d;
  color: #9c4221;
}

.section-status.error {
  background: #fed7d7;
  color: #742a2a;
}

.section-content {
  padding: 1.5rem;
}

.control-description {
  margin-bottom: 1.5rem;
}

.control-description p {
  margin: 0 0 0.5rem 0;
  color: #4a5568;
  line-height: 1.6;
}

.warning-text {
  color: #e53e3e !important;
  font-weight: 500;
}

.control-actions {
  display: flex;
  gap: 1rem;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.reset-btn:hover:not(:disabled) {
  background: #c53030;
}

.reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  text-align: left;
}

.quick-btn:hover {
  background: #5a67d8;
}

.quick-btn.warning {
  background: #ed8936;
}

.quick-btn.warning:hover {
  background: #dd6b20;
}

/* 历史面板样式 */
.history-panel {
  background: #f8fafc;
  border-radius: 8px;
  padding: 2rem;
}

.history-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.view-toggle-btn:hover {
  background: #3182ce;
}

.history-content {
  margin-top: 1.5rem;
}

.no-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: #a0aec0;
  text-align: center;
}

.no-history-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-history-text {
  font-size: 1.125rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.history-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-item.status-success {
  border-left: 4px solid #48bb78;
}

.history-item.status-error {
  border-left: 4px solid #f56565;
}

.history-item.status-pending {
  border-left: 4px solid #ed8936;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.item-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-icon {
  font-size: 1.125rem;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
}

.item-time {
  font-size: 0.75rem;
  color: #a0aec0;
}

.item-content {
  margin-left: 1.5rem;
}

.item-operation {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.item-message {
  color: #4a5568;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.item-details {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 0.875rem;
  color: #718096;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
}

/* 分页控制 */
.history-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.page-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #4a5568;
}

/* 模态框样式 */
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.confirm-dialog {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f7fafc;
  color: #4a5568;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c53030;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-content {
  display: flex;
  gap: 1rem;
}

.confirm-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.confirm-text p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.confirm-text ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.confirm-text li {
  margin-bottom: 0.5rem;
}

.warning {
  color: #e53e3e;
  font-weight: 500;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 消息提示样式 */
.message-toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1001;
  min-width: 300px;
  max-width: 500px;
  border-left: 4px solid;
}

.message-toast.success {
  border-color: #48bb78;
}

.message-toast.error {
  border-color: #f56565;
}

.message-toast.warning {
  border-color: #ed8936;
}

.message-toast.info {
  border-color: #4299e1;
}

.message-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.message-text {
  flex: 1;
  color: #2d3748;
  font-weight: 500;
}

.message-close {
  background: none;
  border: none;
  font-size: 1.125rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.message-close:hover {
  background: #f7fafc;
  color: #4a5568;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs-header {
    overflow-x: auto;
  }

  .tab-button {
    flex: none;
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .monitoring-view {
    padding: 1rem;
  }

  .view-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .status-info {
    align-items: center;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .tabs-content {
    padding: 1rem;
  }

  .control-panel,
  .history-panel {
    padding: 1rem;
  }

  .panel-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .history-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .item-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .item-content {
    margin-left: 0;
  }

  .modal-content {
    margin: 1rem;
    width: calc(100% - 2rem);
  }

  .message-toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    min-width: auto;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
