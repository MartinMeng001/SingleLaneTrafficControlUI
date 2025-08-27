<template>
  <div class="monitoring-view">
    <div class="view-header">
      <h1 class="view-title">系统状态监控</h1>
      <div class="status-info">
        <div class="connection-status" :class="connectionStatusClass">
          <div class="status-indicator"></div>
          <span>{{ connectionStatusText }}</span>
        </div>
        <div class="last-update">
          最后更新: {{ formatTime(lastUpdateTime) }}
        </div>
      </div>
    </div>

    <div class="monitoring-content">
      <!-- 系统控制面板 -->
      <div class="control-panel">
        <h2 class="panel-title">系统控制</h2>

        <div class="control-section">
          <div class="control-item">
            <h3 class="control-title">系统重置</h3>
            <p class="control-description">
              执行系统重置操作，将清除所有缓存数据并重新初始化系统状态
            </p>

            <button
              class="reset-button"
              :class="{ 'loading': isResetting }"
              :disabled="isResetting"
              @click="handleReset"
            >
              <span v-if="!isResetting" class="button-icon">🔄</span>
              <span v-if="isResetting" class="loading-spinner"></span>
              {{ isResetting ? '重置中...' : '执行重置' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 操作历史记录 -->
      <div class="history-panel" v-if="operationHistory.length > 0">
        <h2 class="panel-title">操作历史</h2>

        <div class="history-list">
          <div
            v-for="operation in recentOperations"
            :key="operation.id"
            class="history-item"
            :class="operation.status"
          >
            <div class="operation-info">
              <div class="operation-title">{{ operation.operation }}</div>
              <div class="operation-time">{{ formatTime(operation.timestamp) }}</div>
            </div>

            <div class="operation-details">
              <div class="operation-message">{{ operation.message }}</div>
              <div v-if="operation.eventCode" class="operation-code">
                事件代码: {{ operation.eventCode }}
              </div>
              <div v-if="operation.eventCounter" class="operation-counter">
                事件计数: {{ operation.eventCounter }}
              </div>
            </div>

            <div class="operation-status">
              <span class="status-badge" :class="operation.status">
                {{ getStatusText(operation.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="history-actions" v-if="operationHistory.length > 5">
          <button class="view-all-button" @click="showAllHistory = !showAllHistory">
            {{ showAllHistory ? '收起' : `查看全部 (${operationHistory.length})` }}
          </button>
        </div>
      </div>

      <!-- 系统状态卡片 -->
      <div class="status-cards">
        <div class="status-card">
          <h3 class="card-title">系统状态</h3>
          <div class="card-value" :class="systemHealthClass">
            {{ systemStatusText }}
          </div>
          <div class="card-description">
            {{ systemHealthDescription }}
          </div>
        </div>

        <div class="status-card">
          <h3 class="card-title">连接状态</h3>
          <div class="card-value" :class="connectionStatusClass">
            {{ connectionStatusText }}
          </div>
          <div class="card-description">
            API服务连接状态
          </div>
        </div>

        <div class="status-card">
          <h3 class="card-title">操作统计</h3>
          <div class="card-value success">
            {{ operationHistory.length }}
          </div>
          <div class="card-description">
            总操作次数
          </div>
        </div>
      </div>
    </div>

    <!-- 确认对话框 -->
    <div v-if="showConfirmDialog" class="dialog-overlay" @click="closeConfirmDialog">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">确认系统重置</h3>
          <button class="dialog-close" @click="closeConfirmDialog">×</button>
        </div>

        <div class="dialog-content">
          <div class="warning-icon">⚠️</div>
          <p class="dialog-message">
            您确定要执行系统重置吗？此操作将：
          </p>
          <ul class="dialog-list">
            <li>清除所有缓存数据</li>
            <li>重新初始化系统状态</li>
            <li>可能会中断当前正在进行的操作</li>
          </ul>
          <p class="dialog-warning">
            <strong>注意：此操作不可撤销，请谨慎操作。</strong>
          </p>
        </div>

        <div class="dialog-actions">
          <button class="dialog-button cancel" @click="closeConfirmDialog">
            取消
          </button>
          <button
            class="dialog-button confirm"
            @click="confirmReset"
            :disabled="isResetting"
          >
            <span v-if="!isResetting">确认重置</span>
            <span v-if="isResetting" class="button-loading">
              <span class="loading-spinner"></span>
              重置中...
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" class="message-toast" :class="message.type">
      <span class="message-icon">{{ getMessageIcon(message.type) }}</span>
      <span class="message-text">{{ message.text }}</span>
      <button class="message-close" @click="message = null">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { monitoringApiService, type ResetEventResponse } from '@/api/monitoring'

// 响应式数据
const isResetting = ref(false)
const lastUpdateTime = ref(new Date())
const showAllHistory = ref(false)
const showConfirmDialog = ref(false)
const connectionStatus = ref<'connected' | 'disconnected' | 'connecting'>('connected')
const systemHealth = ref<'normal' | 'warning' | 'error'>('normal')

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

// 消息提示
interface Message {
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
}

const message = ref<Message | null>(null)

// 计算属性
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

const systemHealthDescription = computed(() => {
  switch (systemHealth.value) {
    case 'normal': return '所有服务正常运行'
    case 'warning': return '部分功能可能受影响'
    case 'error': return '系统存在严重问题'
    default: return ''
  }
})

const recentOperations = computed(() => {
  if (showAllHistory.value) {
    return operationHistory.value
  }
  return operationHistory.value.slice(0, 5)
})

// 方法
const formatTime = (time: Date): string => {
  return time.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'success': return '成功'
    case 'error': return '失败'
    case 'pending': return '执行中'
    default: return '未知'
  }
}

const getMessageIcon = (type: string): string => {
  switch (type) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    default: return 'ℹ️'
  }
}

const showMessage = (type: Message['type'], text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const addOperationRecord = (operation: Omit<OperationRecord, 'id' | 'timestamp'>) => {
  const newRecord: OperationRecord = {
    ...operation,
    id: Date.now(),
    timestamp: new Date()
  }
  operationHistory.value.unshift(newRecord)

  // 限制历史记录数量
  if (operationHistory.value.length > 50) {
    operationHistory.value = operationHistory.value.slice(0, 50)
  }
}

const handleReset = () => {
  // 显示确认对话框
  showConfirmDialog.value = true
}

const closeConfirmDialog = () => {
  if (!isResetting.value) {
    showConfirmDialog.value = false
  }
}

const confirmReset = async () => {
  if (isResetting.value) return

  try {
    isResetting.value = true
    connectionStatus.value = 'connecting'

    // 添加待处理记录
    addOperationRecord({
      operation: '系统重置',
      message: '正在执行系统重置...',
      status: 'pending'
    })

    // 调用重置API
    const response: ResetEventResponse = await monitoringApiService.reset()

    // 更新操作记录
    operationHistory.value[0].status = 'success'
    operationHistory.value[0].message = response.message
    operationHistory.value[0].eventCode = response.eventCode
    operationHistory.value[0].eventCounter = response.eventCounter

    // 显示成功消息
    showMessage('success', '系统重置成功！')

    // 更新系统状态
    connectionStatus.value = 'connected'
    systemHealth.value = 'normal'
    lastUpdateTime.value = new Date()

    // 关闭确认对话框
    showConfirmDialog.value = false

  } catch (error) {
    console.error('系统重置失败:', error)

    // 更新操作记录
    if (operationHistory.value[0]) {
      operationHistory.value[0].status = 'error'
      operationHistory.value[0].message = `重置失败: ${error instanceof Error ? error.message : '未知错误'}`
    }

    // 显示错误消息
    showMessage('error', `系统重置失败: ${error instanceof Error ? error.message : '未知错误'}`)

    // 更新系统状态
    connectionStatus.value = 'disconnected'
    systemHealth.value = 'error'

  } finally {
    isResetting.value = false
  }
}

// 模拟系统状态检查
const checkSystemHealth = () => {
  // 这里可以添加实际的健康检查逻辑
  lastUpdateTime.value = new Date()
}

let healthCheckInterval: number | null = null

onMounted(() => {
  // 定期检查系统状态
  healthCheckInterval = setInterval(checkSystemHealth, 30000)
  checkSystemHealth()
})

onUnmounted(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
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

.monitoring-content {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
}

.control-panel,
.history-panel {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.panel-title {
  color: #2d3748;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.control-section {
  margin-top: 1.5rem;
}

.control-item {
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.control-item:hover {
  border-color: #667eea;
  background: #f7fafc;
}

.control-title {
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.control-description {
  color: #718096;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.reset-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  justify-content: center;
}

.reset-button:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
}

.reset-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.reset-button.loading {
  background: #a0aec0;
}

.button-icon {
  font-size: 1.1rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.history-item.success {
  border-left: 4px solid #48bb78;
  background: rgba(72, 187, 120, 0.05);
}

.history-item.error {
  border-left: 4px solid #f56565;
  background: rgba(245, 101, 101, 0.05);
}

.history-item.pending {
  border-left: 4px solid #ed8936;
  background: rgba(237, 137, 54, 0.05);
}

.operation-info {
  min-width: 120px;
}

.operation-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.operation-time {
  font-size: 0.85rem;
  color: #718096;
}

.operation-details {
  flex: 1;
}

.operation-message {
  color: #4a5568;
  margin-bottom: 0.25rem;
}

.operation-code,
.operation-counter {
  font-size: 0.85rem;
  color: #718096;
}

.operation-status {
  min-width: 80px;
  text-align: right;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.success {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.error {
  background: #fed7d7;
  color: #742a2a;
}

.status-badge.pending {
  background: #feebc8;
  color: #7b341e;
}

.history-actions {
  margin-top: 1rem;
  text-align: center;
}

.view-all-button {
  padding: 0.5rem 1rem;
  background: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-all-button:hover {
  background: #e2e8f0;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
}

.status-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.card-title {
  color: #718096;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.card-value.success {
  color: #48bb78;
}

.card-value.warning {
  color: #ed8936;
}

.card-value.error {
  color: #f56565;
}

.card-description {
  color: #a0aec0;
  font-size: 0.9rem;
}

.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1001;
  animation: slideInRight 0.3s ease-out;
  min-width: 300px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.message-toast.success {
  background: #48bb78;
}

.message-toast.error {
  background: #f56565;
}

.message-toast.warning {
  background: #ed8936;
}

.message-toast.info {
  background: #4299e1;
}

.message-icon {
  font-size: 1.25rem;
}

.message-text {
  flex: 1;
}

.message-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.message-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 确认对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideInUp 0.3s ease-out;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
}

.dialog-title {
  color: #2d3748;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.dialog-close:hover {
  background: #e2e8f0;
  color: #4a5568;
}

.dialog-content {
  padding: 2rem;
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.dialog-message {
  color: #4a5568;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.dialog-list {
  text-align: left;
  margin: 1.5rem 0;
  padding-left: 1.5rem;
  color: #4a5568;
}

.dialog-list li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.dialog-warning {
  color: #e53e3e;
  font-size: 0.95rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fed7d7;
  border-radius: 8px;
  border: 1px solid #feb2b2;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: #f8f9fa;
  border-top: 1px solid #e2e8f0;
}

.dialog-button {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.dialog-button.cancel {
  background: #e2e8f0;
  color: #4a5568;
}

.dialog-button.cancel:hover {
  background: #cbd5e0;
}

.dialog-button.confirm {
  background: #e53e3e;
  color: white;
}

.dialog-button.confirm:hover:not(:disabled) {
  background: #c53030;
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(229, 62, 62, 0.3);
}

.dialog-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .monitoring-view {
    padding: 1rem;
  }

  .view-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 1rem;
  }

  .view-title {
    font-size: 1.5rem;
  }

  .status-info {
    align-items: center;
  }

  .control-panel,
  .history-panel {
    padding: 1.5rem;
  }

  .history-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .operation-status {
    text-align: left;
  }

  .message-toast {
    left: 10px;
    right: 10px;
    min-width: auto;
  }

  .confirm-dialog {
    margin: 1rem;
    width: auto;
  }

  .dialog-header,
  .dialog-actions {
    padding: 1rem 1.5rem;
  }

  .dialog-content {
    padding: 1.5rem;
  }

  .dialog-actions {
    flex-direction: column;
  }
}
</style>
