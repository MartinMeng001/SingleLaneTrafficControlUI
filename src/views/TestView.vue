<!-- src/views/TestView.vue -->
<template>
  <div class="test-view">
    <div class="view-header">
      <h1 class="view-title">车辆测试控制台</h1>
      <div class="connection-status">
        <div class="status-indicator" :class="connectionStatus"></div>
        <span class="status-text">{{ connectionStatusText }}</span>
        <span class="update-time">{{ lastUpdateText }}</span>
      </div>
    </div>

    <!-- 测试说明 -->
    <div class="test-description">
      <strong>测试说明：</strong
      >本页面提供车辆全程测试功能，可以模拟车辆在单车道交通系统中的完整行程。 <br /><strong
        >注意：</strong
      >测试功能需要WebSocket连接正常才能使用，请确保系统连接状态正常。
    </div>

    <!-- 车辆测试面板 -->
    <VehicleTestPanel :signals="signals" :initialSignalIds="SIGNAL_IDS" />

    <!-- 信号状态概览 -->
    <div class="signals-overview">
      <h3 class="overview-title">当前信号状态</h3>
      <div class="signals-grid">
        <div
          v-for="signalId in SIGNAL_IDS"
          :key="signalId"
          class="signal-status-card"
          :class="getSignalStatusClass(signalId)"
        >
          <div class="signal-header">
            <span class="signal-id">信号机 {{ signalId }}</span>
            <span class="signal-indicator" :class="getSignalIndicatorClass(signalId)">
              {{ getSignalIndicator(signalId) }}
            </span>
          </div>
          <div class="signal-details">
            <div class="signal-status">{{ getSignalStatus(signalId) }}</div>
            <div class="signal-description">{{ getSignalDescription(signalId) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试日志 -->
    <div class="test-logs">
      <div class="logs-header">
        <h3>测试日志</h3>
        <div class="logs-controls">
          <button @click="clearTestLogs" class="clear-logs-btn">清空日志</button>
          <label class="filter-toggle">
            <input type="checkbox" v-model="showTestLogsOnly" />
            只显示测试日志
          </label>
        </div>
      </div>
      <div class="logs-panel" ref="logsPanel">
        <div v-if="filteredTestLogs.length === 0" class="no-logs">暂无日志</div>
        <div
          v-for="log in filteredTestLogs"
          :key="log.id"
          class="log-message"
          :class="`log-${log.type}`"
        >
          <span class="log-time">[{{ log.timestamp }}]</span>
          <span class="log-content">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { formatTimeAgo } from '@/utils/format'
import { useWebSocket } from '@/services/websocket.ts'
import {
  WebSocketMessage,
  //SegmentMessageData,
  TrafficLightMessageData,
  //WaitingAreaMessageData,
  //LaneStatusMessageData,
  Signal,
} from '@/types/websocket'

// 导入车辆测试面板组件
import VehicleTestPanel from '@/components/realtime/VehicleTestPanel.vue'

// WebSocket 连接
const { isConnected, subscribe, connect, lastUpdateTime } = useWebSocket()

// 定义信号机 ID 数组
const SIGNAL_IDS = ['37', '38', '41', '42', '43']

// 数据状态
const initialSignalsState: Record<string, Signal> = SIGNAL_IDS.reduce(
  (acc, id) => {
    acc[id] = { status: 'ALL_RED', description: '', phase: null }
    return acc
  },
  {} as Record<string, Signal>,
)

const signals = ref<Record<string, Signal>>(initialSignalsState)

// 日志相关
interface TestLogMessage {
  id: number
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  messageType: string
}

const testLogs = ref<TestLogMessage[]>([])
const logsPanel = ref<HTMLElement>()
const showTestLogsOnly = ref(true)

// 计算属性
const connectionStatus = computed(() => {
  return isConnected.value ? 'connected' : 'disconnected'
})

const connectionStatusText = computed(() => {
  return isConnected.value ? 'WebSocket已连接' : 'WebSocket未连接'
})

const lastUpdateText = computed(() => {
  return formatTimeAgo(lastUpdateTime.value)
})

const filteredTestLogs = computed(() => {
  if (showTestLogsOnly.value) {
    return testLogs.value
      .filter((log) => log.messageType === 'VEHICLE_TEST')
      .slice()
      .reverse()
      .slice(0, 100)
  }
  return testLogs.value.slice().reverse().slice(0, 100)
})

// 信号状态相关方法
const getSignalStatus = (signalId: string) => {
  return signals.value[signalId]?.status || 'ALL_RED'
}

const getSignalDescription = (signalId: string) => {
  return signals.value[signalId]?.description || ''
}

const getSignalStatusClass = (signalId: string) => {
  const status = getSignalStatus(signalId)
  switch (status) {
    case 'UPDOWN':
      return 'signal-upstream'
    case 'UPSTREAM':
      return 'signal-upstream'
    case 'DOWNSTREAM':
      return 'signal-downstream'
    case 'YELLOW_FLASH':
      return 'signal-yellow'
    case 'ALL_RED':
    default:
      return 'signal-red'
  }
}

const getSignalIndicatorClass = (signalId: string) => {
  const status = getSignalStatus(signalId)
  switch (status) {
    case 'UPDOWN': return 'indicator-green'
    case 'UPSTREAM':
      return 'indicator-green'
    case 'DOWNSTREAM':
      return 'indicator-green'
    case 'YELLOW_FLASH':
      return 'indicator-yellow'
    case 'ALL_RED':
    default:
      return 'indicator-red'
  }
}

const getSignalIndicator = (signalId: string) => {
  const status = getSignalStatus(signalId)
  switch (status) {
    case 'UPDOWN':
      return '↑↓'
    case 'UPSTREAM':
      return '↑'
    case 'DOWNSTREAM':
      return '↓'
    case 'YELLOW_FLASH':
      return '⚠'
    case 'ALL_RED':
    default:
      return '●'
  }
}

// 日志相关方法
const addTestLog = (
  message: string,
  type: TestLogMessage['type'] = 'info',
  messageType: string = 'VEHICLE_TEST',
) => {
  const logId = Date.now() + Math.random()
  const timestamp = new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  testLogs.value.push({
    id: logId,
    timestamp,
    message,
    type,
    messageType,
  })

  // 自动滚动到底部
  nextTick(() => {
    if (logsPanel.value) {
      logsPanel.value.scrollTop = logsPanel.value.scrollHeight
    }
  })
}

const clearTestLogs = () => {
  testLogs.value = []
}

// 消息处理
const handleMessage = (message: WebSocketMessage) => {
  addTestLog(
    `收到消息: ${message.messageType}, 内容: ${JSON.stringify(message.data)}`,
    'info',
    message.messageType,
  )

  switch (message.messageType) {
    case 'TRAFFIC_LIGHT':
      handleTrafficLightMessage(message.data)
      break
    case 'WELCOME':
      addTestLog('服务器欢迎消息: ' + message.data, 'success', message.messageType)
      break
    // 可以根据需要添加其他消息类型的处理
  }
}

const handleTrafficLightMessage = (data: TrafficLightMessageData) => {
  const signalId = data.sigid
  if (signals.value[signalId]) {
    const oldStatus = signals.value[signalId].status
    signals.value[signalId] = {
      status: data.status,
      description: data.statusDescription || '',
      phase: data.phase || null,
    }

    if (oldStatus !== data.status) {
      addTestLog(
        `信号机${signalId}状态变更: ${oldStatus} → ${data.status}`,
        'info',
        'TRAFFIC_LIGHT',
      )
    }
  }
}

// 生命周期
onMounted(() => {
  // 连接WebSocket
  connect()

  // 订阅消息
  subscribe(handleMessage)

  // 添加初始日志
  addTestLog('测试页面已加载', 'success')
})

onUnmounted(() => {
  // 这里可以添加清理逻辑
})
</script>

<style scoped>
.test-view {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
  color: #333;
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
  color: #0056b3;
  margin: 0;
  font-size: 1.8rem;
  text-align: center;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-indicator.connected {
  background: #28a745;
  animation: pulse 2s infinite;
}

.status-indicator.disconnected {
  background: #dc3545;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.test-description {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #0d47a1;
}

.signals-overview {
  margin: 2rem 0;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.overview-title {
  color: #0056b3;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.signal-status-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #dee2e6;
  transition: all 0.3s ease;
}

.signal-status-card.signal-upstream {
  border-left-color: #28a745;
}

.signal-status-card.signal-downstream {
  border-left-color: #28a745;
}

.signal-status-card.signal-yellow {
  border-left-color: #ffc107;
}

.signal-status-card.signal-red {
  border-left-color: #dc3545;
}

.signal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.signal-id {
  font-weight: 600;
  color: #495057;
}

.signal-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.indicator-green {
  background: #28a745;
  color: white;
}

.indicator-yellow {
  background: #ffc107;
  color: #333;
}

.indicator-red {
  background: #dc3545;
  color: white;
}

.signal-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.signal-status {
  font-weight: 500;
  color: #0056b3;
}

.signal-description {
  font-size: 0.9rem;
  color: #6c757d;
}

.test-logs {
  margin-top: 2rem;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logs-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logs-header h3 {
  margin: 0;
  color: #495057;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.clear-logs-btn {
  padding: 0.25rem 0.75rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.3s ease;
}

.clear-logs-btn:hover {
  background: #c82333;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.logs-panel {
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f8f9fa;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-message {
  margin: 3px 0;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 0.5rem;
}

.log-time {
  color: #6c757d;
  font-weight: 500;
}

.log-content {
  flex: 1;
}

.log-message.log-info .log-content {
  color: #333;
}

.log-message.log-success .log-content {
  color: #28a745;
}

.log-message.log-warning .log-content {
  color: #ffc107;
}

.log-message.log-error .log-content {
  color: #dc3545;
}

.no-logs {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .view-title {
    font-size: 1.5rem;
  }

  .signals-grid {
    grid-template-columns: 1fr;
  }

  .logs-header {
    flex-direction: column;
    align-items: stretch;
  }

  .logs-controls {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .test-view {
    padding: 1rem;
  }
}
</style>
