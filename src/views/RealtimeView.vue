<!-- src/views/RealtimeView.vue -->
<template>
  <div class="realtime-view">
    <div class="view-header">
      <h1 class="view-title">单车道交通系统实时监控</h1>
      <div class="connection-status">
        <div class="status-indicator" :class="connectionStatus"></div>
        <span class="status-text">{{ connectionStatusText }}</span>
        <span class="update-time">{{ lastUpdateText }}</span>
      </div>
    </div>

    <!-- 道路结构说明 -->
    <div class="road-structure">
      <strong>道路结构：</strong>终点信号机5 ← 路段4 ← 等待区3+信号机4 ← 路段3 ← 等待区2+信号机3 ← 路段2 ← 等待区1+信号机2 ← 路段1 ← 起点信号机1
      <br><strong>注意：</strong>单车道，同一路段同时只能有一个方向通行，上行方向是从下往上
    </div>

    <!-- 状态说明 -->
    <div class="status-legend">
      <div class="legend-item">
        <div class="legend-signal legend-upstream">↑</div>
        <span>允许上行</span>
      </div>
      <div class="legend-item">
        <div class="legend-signal legend-downstream">↓</div>
        <span>允许下行</span>
      </div>
      <div class="legend-item">
        <div class="legend-signal legend-red">●</div>
        <span>红灯</span>
      </div>
      <div class="legend-item">
        <div class="legend-signal legend-yellow">⚠</div>
        <span>黄闪</span>
      </div>
    </div>

    <div class="traffic-layout">
      <!-- 终点信号机 SIG005 -->
      <div class="signal-only">
        <TrafficSignal
          :signal-id="SIGNAL_IDS[4]"
          :status="getSignalStatus(SIGNAL_IDS[4])"
          :status-description="getSignalDescription(SIGNAL_IDS[4])"
          :phase="getSignalPhase(SIGNAL_IDS[4])"
          :show-history="true"
          size="medium"
        />
      </div>

      <!-- 路段4 -->
      <TrafficSegment
        :segment-id="4"
        :vehicle-count="getSegmentVehicleCount(4)"
        :direction="getSegmentDirection(4)"
        :congestion-level="getSegmentCongestion(4)"
        :last-vehicle-action="getLastVehicleAction(4)"
      />

      <!-- 等待区3 + 信号机4 -->
      <WaitingSignalGroup
        :area-id="3"
        :upstream-count="getWaitingAreaCount(3, 'upstream')"
        :downstream-count="getWaitingAreaCount(3, 'downstream')"
        :upstream-has-vehicle="getWaitingAreaHasVehicle(3, 'upstream')"
        :downstream-has-vehicle="getWaitingAreaHasVehicle(3, 'downstream')"
        :upstream-request="getWaitingAreaRequest(3, 'upstream')"
        :downstream-request="getWaitingAreaRequest(3, 'downstream')"
        :signal-id="SIGNAL_IDS[3]"
        :signal-status="getSignalStatus(SIGNAL_IDS[3])"
        :status-description="getSignalDescription(SIGNAL_IDS[3])"
        :phase="getSignalPhase(SIGNAL_IDS[3])"
        :show-history="true"
      />

      <!-- 路段3 -->
      <TrafficSegment
        :segment-id="3"
        :vehicle-count="getSegmentVehicleCount(3)"
        :direction="getSegmentDirection(3)"
        :congestion-level="getSegmentCongestion(3)"
        :last-vehicle-action="getLastVehicleAction(3)"
      />

      <!-- 等待区2 + 信号机3 -->
      <WaitingSignalGroup
        :area-id="2"
        :upstream-count="getWaitingAreaCount(2, 'upstream')"
        :downstream-count="getWaitingAreaCount(2, 'downstream')"
        :upstream-has-vehicle="getWaitingAreaHasVehicle(2, 'upstream')"
        :downstream-has-vehicle="getWaitingAreaHasVehicle(2, 'downstream')"
        :upstream-request="getWaitingAreaRequest(2, 'upstream')"
        :downstream-request="getWaitingAreaRequest(2, 'downstream')"
        :signal-id="SIGNAL_IDS[2]"
        :signal-status="getSignalStatus(SIGNAL_IDS[2])"
        :status-description="getSignalDescription(SIGNAL_IDS[2])"
        :phase="getSignalPhase(SIGNAL_IDS[2])"
        :show-history="true"
      />

      <!-- 路段2 -->
      <TrafficSegment
        :segment-id="2"
        :vehicle-count="getSegmentVehicleCount(2)"
        :direction="getSegmentDirection(2)"
        :congestion-level="getSegmentCongestion(2)"
        :last-vehicle-action="getLastVehicleAction(2)"
      />

      <!-- 等待区1 + 信号机2 -->
      <WaitingSignalGroup
        :area-id="1"
        :upstream-count="getWaitingAreaCount(1, 'upstream')"
        :downstream-count="getWaitingAreaCount(1, 'downstream')"
        :upstream-has-vehicle="getWaitingAreaHasVehicle(1, 'upstream')"
        :downstream-has-vehicle="getWaitingAreaHasVehicle(1, 'downstream')"
        :upstream-request="getWaitingAreaRequest(1, 'upstream')"
        :downstream-request="getWaitingAreaRequest(1, 'downstream')"
        :signal-id="SIGNAL_IDS[1]"
        :signal-status="getSignalStatus(SIGNAL_IDS[1])"
        :status-description="getSignalDescription(SIGNAL_IDS[1])"
        :phase="getSignalPhase(SIGNAL_IDS[1])"
        :show-history="true"
      />

      <!-- 路段1 -->
      <TrafficSegment
        :segment-id="1"
        :vehicle-count="getSegmentVehicleCount(1)"
        :direction="getSegmentDirection(1)"
        :congestion-level="getSegmentCongestion(1)"
        :last-vehicle-action="getLastVehicleAction(1)"
      />

      <!-- 起点信号机 SIG001 -->
      <div class="signal-only">
        <TrafficSignal
          :signal-id="SIGNAL_IDS[0]"
          :status="getSignalStatus(SIGNAL_IDS[0])"
          :status-description="getSignalDescription(SIGNAL_IDS[0])"
          :phase="getSignalPhase(SIGNAL_IDS[0])"
          :show-history="true"
          size="medium"
        />
      </div>
    </div>

    <div class="traffic-info-panel">
      <h3>实时消息日志</h3>
      <div class="log-controls">
        <button @click="clearLogs" class="clear-btn">清空日志</button>
        <label class="filter-label">
          <input type="checkbox" v-model="logFilters.SEGMENT"> 路段消息
        </label>
        <label class="filter-label">
          <input type="checkbox" v-model="logFilters.TRAFFIC_LIGHT"> 信号灯
        </label>
        <label class="filter-label">
          <input type="checkbox" v-model="logFilters.WAITING_AREA"> 等待区
        </label>
        <label class="filter-label">
          <input type="checkbox" v-model="logFilters.LANE_STATUS"> 车道状态
        </label>
      </div>
      <div class="log-panel" ref="logPanel">
        <div v-for="log in filteredLogs" :key="log.id"
             :class="['log-message', `log-${log.type}`]">
          <strong>[{{ log.timestamp }}]</strong> {{ log.message }}
        </div>
        <div v-if="filteredLogs.length === 0" class="no-logs">
          {{ isConnected ? '等待消息中...' : '等待连接中...' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { formatTimeAgo } from '@/utils/format'
import { useWebSocket } from '@/services/websocket'
import {
  WebSocketMessage,
  SegmentMessageData,
  TrafficLightMessageData,
  WaitingAreaMessageData,
  LaneStatusMessageData,
  Segment,
  //LastVehicleAction,
  Signal,
  WaitingArea, LastVehicleAction
} from '@/types/websocket'

// 导入组件
import TrafficSegment from '@/components/realtime/TrafficSegment.vue'
import TrafficSignal from '@/components/realtime/TrafficSignal.vue'
import WaitingSignalGroup from '@/components/realtime/WaitingSignalGroup.vue'

// WebSocket 连接
const { isConnected, subscribe, connect, lastUpdateTime } = useWebSocket()
// 定义信号机 ID 数组
const SIGNAL_IDS = ['37', '38', '41', '42', '43'];

// 数据状态
const segments = ref<Record<number, Segment>>({
  1: { vehicleCount: 0, direction: null, congestionLevel: null, lastAction: null },
  2: { vehicleCount: 0, direction: null, congestionLevel: null, lastAction: null },
  3: { vehicleCount: 0, direction: null, congestionLevel: null, lastAction: null },
  4: { vehicleCount: 0, direction: null, congestionLevel: null, lastAction: null }
})

// 使用 reduce 动态创建 signals 对象
const initialSignalsState: Record<string, Signal> = SIGNAL_IDS.reduce((acc, id) => {
  acc[id] = { status: 'ALL_RED', description: '', phase: null };
  return acc;
}, {} as Record<string, Signal>);

const signals = ref<Record<string, Signal>>(initialSignalsState);

const waitingAreas = ref<Record<number, WaitingArea>>({
  1: {
    upstreamCount: 0,
    downstreamCount: 0,
    upstreamHasVehicle: false,
    downstreamHasVehicle: false,
    upstreamRequest: false,
    downstreamRequest: false
  },
  2: {
    upstreamCount: 0,
    downstreamCount: 0,
    upstreamHasVehicle: false,
    downstreamHasVehicle: false,
    upstreamRequest: false,
    downstreamRequest: false
  },
  3: {
    upstreamCount: 0,
    downstreamCount: 0,
    upstreamHasVehicle: false,
    downstreamHasVehicle: false,
    upstreamRequest: false,
    downstreamRequest: false
  }
})

// 日志相关
interface LogMessage {
  id: number
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  messageType: string
}

const logs = ref<LogMessage[]>([])
const logPanel = ref<HTMLElement>()
const logFilters = ref({
  SEGMENT: true,
  TRAFFIC_LIGHT: true,
  WAITING_AREA: true,
  LANE_STATUS: true,
  WELCOME: true
})

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

const filteredLogs = computed(() => {
  return logs.value.filter(log => logFilters.value[log.messageType as keyof typeof logFilters.value])
    .slice().reverse().slice(0, 100)
})

// 数据获取方法
const getSegmentVehicleCount = (segmentId: number) => {
  return segments.value[segmentId]?.vehicleCount || 0
}

const getSegmentDirection = (segmentId: number) => {
  return segments.value[segmentId]?.direction
}

const getSegmentCongestion = (segmentId: number) => {
  return segments.value[segmentId]?.congestionLevel
}

const getLastVehicleAction = (segmentId: number) => {
  return segments.value[segmentId]?.lastAction
}

const getSignalStatus = (signalId: string) => {
  return signals.value[signalId]?.status || 'ALL_RED'
}

const getSignalDescription = (signalId: string) => {
  return signals.value[signalId]?.description || ''
}

const getSignalPhase = (signalId: string) => {
  return signals.value[signalId]?.phase
}

const getWaitingAreaCount = (areaId: number, direction: 'upstream' | 'downstream') => {
  const key = direction === 'upstream' ? 'upstreamCount' : 'downstreamCount'
  return waitingAreas.value[areaId]?.[key] || 0
}

const getWaitingAreaHasVehicle = (areaId: number, direction: 'upstream' | 'downstream') => {
  const key = direction === 'upstream' ? 'upstreamHasVehicle' : 'downstreamHasVehicle'
  return waitingAreas.value[areaId]?.[key] || false
}

const getWaitingAreaRequest = (areaId: number, direction: 'upstream' | 'downstream') => {
  const key = direction === 'upstream' ? 'upstreamRequest' : 'downstreamRequest'
  return waitingAreas.value[areaId]?.[key] || false
}

// 消息处理
const handleMessage = (message: WebSocketMessage) => {
  //logMessage(`收到消息: ${message.messageType}`, 'info', message.messageType)
  logMessage(`收到消息: ${message.messageType}, 内容: ${JSON.stringify(message.data)}`, 'info', message.messageType);
  switch (message.messageType) {
    case 'SEGMENT':
      handleSegmentMessage(message.data)
      break
    case 'TRAFFIC_LIGHT':
      handleTrafficLightMessage(message.data)
      break
    case 'WAITING_AREA':
      handleWaitingAreaMessage(message.data)
      break
    case 'LANE_STATUS':
      handleLaneStatusMessage(message.data)
      break
    case 'WELCOME':
      logMessage('服务器欢迎消息: ' + message.data, 'success', message.messageType)
      break
  }
}

const handleSegmentMessage = (data: SegmentMessageData) => {
  const segmentId = data.segmentId
  if (segments.value[segmentId]) {
    segments.value[segmentId].vehicleCount = data.vehicleCount
    segments.value[segmentId].direction = data.direction? data.direction : null

    // 记录最后的车辆动作
    if (data.status === 'VEHICLE_ENTER' || data.status === 'VEHICLE_LEAVE') {
      segments.value[segmentId].lastAction = {
        status: data.status,
        vehicleId: data.vehicleId ? data.vehicleId:'',
        direction: data.direction ? data.direction : null,
        timestamp: Date.now()
      }

      logMessage(`路段${segmentId} 车辆${data.vehicleId} ${data.status === 'VEHICLE_ENTER' ? '进入' : '离开'} (${data.direction === 'UPSTREAM' ? '上行' : '下行'})`, 'info', 'SEGMENT')
    } else if (data.status === 'CLEAR') {
      segments.value[segmentId].lastAction = null
      logMessage(`路段${segmentId} 清空`, 'info', 'SEGMENT')
    }
  }
}

const handleTrafficLightMessage = (data: TrafficLightMessageData) => {
  if (signals.value[data.sigid]) {
    signals.value[data.sigid].status = data.status
    signals.value[data.sigid].description = data.statusDescription
    signals.value[data.sigid].phase = data.phase

    const statusText = {
      'UPSTREAM': '允许上行通行',
      'DOWNSTREAM': '允许下行通行',
      'ALL_RED': '红灯禁行',
      'YELLOW_FLASH': '黄闪警示'
    }[data.status] || data.status

    logMessage(`信号机 ${data.sigid} ${statusText}`, 'success', 'TRAFFIC_LIGHT')
  }
}

const handleWaitingAreaMessage = (data: WaitingAreaMessageData) => {
  const areaId = data.segmentId
  if (waitingAreas.value[areaId]) {
    waitingAreas.value[areaId].upstreamCount = data.upstreamVehicleCount || 0
    waitingAreas.value[areaId].downstreamCount = data.downstreamVehicleCount || 0
    waitingAreas.value[areaId].upstreamHasVehicle = data.upstreamHasVehicle
    waitingAreas.value[areaId].downstreamHasVehicle = data.downstreamHasVehicle
    waitingAreas.value[areaId].upstreamRequest = data.upstreamRequest
    waitingAreas.value[areaId].downstreamRequest = data.downstreamRequest

    logMessage(`等待区 ${areaId} 更新: 上行${data.upstreamVehicleCount}辆, 下行${data.downstreamVehicleCount}辆`, 'info', 'WAITING_AREA')
  }
}

const handleLaneStatusMessage = (data: LaneStatusMessageData) => {
  const segmentId = data.segmentId
  if (segments.value[segmentId]) {
    segments.value[segmentId].congestionLevel = data.congestionLevel

    const totalVehicles = (data.upstreamVehicles?.length || 0) + (data.downstreamVehicles?.length || 0)
    segments.value[segmentId].vehicleCount = totalVehicles
    if(data.upstreamVehicles?.length>0) {
      segments.value[segmentId].direction = 'UPSTREAM';
      const lastAction: LastVehicleAction = {
        status: 'VEHICLE_ENTER',
        vehicleId: data?.upstreamVehicles[0].vehicleId,
        direction: 'UPSTREAM',
        timestamp: Date.now()
      };
      segments.value[segmentId].lastAction = lastAction
    }else if(data.downstreamVehicles?.length>0) {
      segments.value[segmentId].direction = 'DOWNSTREAM';
      const lastAction: LastVehicleAction = {
        status: 'VEHICLE_ENTER',
        vehicleId: data?.downstreamVehicles[0].vehicleId,
        direction: 'DOWNSTREAM',
        timestamp: Date.now()
      };
      segments.value[segmentId].lastAction = lastAction
    }else {
      segments.value[segmentId].direction = null;
      segments.value[segmentId].lastAction = null;
    }
    logMessage(`路段 ${segmentId} 状态更新: 车辆${totalVehicles}辆, 拥堵${(data.congestionLevel * 100).toFixed(0)}%`, 'info', 'LANE_STATUS')
  }
}

// 工具方法
const logMessage = (msg: string, type: 'info' | 'success' | 'warning' | 'error', messageType: string) => {
  const newLog: LogMessage = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    message: msg,
    type,
    messageType
  }

  logs.value.push(newLog)

  // 限制日志数量
  if (logs.value.length > 500) {
    logs.value = logs.value.slice(-300)
  }

  // 自动滚动到底部
  nextTick(() => {
    if (logPanel.value) {
      logPanel.value.scrollTop = logPanel.value.scrollHeight
    }
  })
}

const clearLogs = () => {
  logs.value = []
  logMessage('日志已清空', 'info', 'SYSTEM')
}

// 生命周期
onMounted(() => {
  connect()
  const unsubscribe = subscribe(handleMessage)

  // 组件卸载时取消订阅
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.realtime-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.road-structure {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #0d47a1;
}

.status-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  font-size: 11px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-signal {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
}

.legend-upstream, .legend-downstream {
  background-color: #28a745;
  color: white;
}
.legend-red {
  background-color: #dc3545;
  color: white;
}
.legend-yellow {
  background-color: #ffc107;
  color: #333;
}

.traffic-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  gap: 20px;
  margin-bottom: 2rem;
}

.signal-only {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 10px;
}

.traffic-info-panel {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fefefe;
}

.traffic-info-panel h3 {
  color: #0056b3;
  margin-bottom: 15px;
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.clear-btn:hover {
  background: #c82333;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.filter-label input[type="checkbox"] {
  margin: 0;
}

.log-panel {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 15px;
  background-color: #f8f9fa;
  font-size: 12px;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
}

.log-message {
  margin: 3px 0;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}

.log-message.log-info {
  color: #333;
}

.log-message.log-success {
  color: #28a745;
}

.log-message.log-warning {
  color: #ffc107;
}

.log-message.log-error {
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

  .status-legend {
    gap: 10px;
  }

  .log-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-label {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .realtime-view {
    padding: 1rem;
  }
}
</style>
