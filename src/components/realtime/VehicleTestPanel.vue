<!-- src/components/realtime/VehicleTestPanel.vue -->
<template>
  <div class="test-control-panel">
    <h3>🚗 车辆全程测试功能</h3>

    <!-- API连接状态 -->
    <div class="api-status" :class="apiStatusClass">
      <div class="status-indicator" :class="{ 'healthy': isApiHealthy, 'unhealthy': !isApiHealthy }"></div>
      <span>API状态: {{ apiStatusText }}</span>
      <button @click="checkApiHealth" class="refresh-btn" :disabled="isCheckingHealth">
        {{ isCheckingHealth ? '检查中...' : '🔄' }}
      </button>
    </div>

    <div class="test-controls">
      <div class="test-status">
        <div class="status-item">
          <span class="status-label">测试状态:</span>
          <span class="status-value" :class="testStatusClass">{{ testStatusText }}</span>
        </div>
        <div class="status-item" v-if="currentTestVehicle">
          <span class="status-label">测试车辆:</span>
          <span class="status-value">{{ currentTestVehicle }}</span>
        </div>
        <div class="status-item" v-if="currentTestVehicle">
          <span class="status-label">当前位置:</span>
          <span class="status-value">{{ currentVehicleLocation }}</span>
        </div>
      </div>

      <div class="test-buttons">
        <button
          @click="startVehicleTest"
          :disabled="isTestRunning || !canStartTest || !isApiHealthy"
          class="start-btn"
        >
          {{ isTestRunning ? '测试进行中...' : '开始全程测试' }}
        </button>

        <button
          @click="stopVehicleTest"
          :disabled="!isTestRunning"
          class="stop-btn"
        >
          停止测试
        </button>

        <button
          @click="clearTestHistory"
          class="clear-btn"
          :disabled="isApiActionRunning"
        >
          清除历史
        </button>

        <button
          @click="getApiStatus"
          class="status-btn"
          :disabled="isApiActionRunning"
        >
          {{ isApiActionRunning ? '查询中...' : '查询状态' }}
        </button>
      </div>
    </div>

    <!-- 测试进度显示 -->
    <div class="test-progress" v-if="isTestRunning || testState === TestState.COMPLETED">
      <div class="progress-title">测试进度</div>
      <div class="progress-steps">
        <div
          v-for="step in testSteps"
          :key="step.id"
          class="progress-step"
          :class="{
            'completed': step.completed,
            'active': step.active,
            'waiting': step.waiting
          }"
        >
          <div class="step-icon">{{ step.icon }}</div>
          <div class="step-text">{{ step.text }}</div>
          <div class="step-time" v-if="step.timestamp">{{ formatTime(step.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- 测试日志 -->
    <div class="test-logs" v-if="testLogs.length > 0">
      <div class="logs-header">
        <span class="logs-title">测试日志 (最近{{ Math.min(testLogs.length, 10) }}条)</span>
        <button @click="exportLogs" class="export-btn" v-if="testLogs.length > 0">
          📄 导出
        </button>
      </div>
      <div class="logs-content">
        <div
          v-for="log in testLogs.slice(-10)"
          :key="log.id"
          class="log-entry"
          :class="log.type"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- API信息显示 -->
    <div class="api-info" v-if="apiInfo">
      <div class="info-title">🔧 API信息</div>
      <div class="info-content">
        <div class="info-item">
          <span class="info-label">功能:</span>
          <span class="info-value">{{ apiInfo.feature }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">支持路段:</span>
          <span class="info-value">{{ apiInfo.supported_segments?.join(', ') }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">默认车牌:</span>
          <span class="info-value">{{ apiInfo.test_license_plate_1 }}, {{ apiInfo.test_license_plate_2 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import VehicleTestApiService, {
  ApiHealthChecker,
  type TestInfoResponse,
  //type VehicleEventResponse,
  type StatusResponse
} from '@/services/vehicleTestApi'

// Props 定义
interface Props {
  signals: Record<string, { status: string; description: string; phase: string | null }>
  canStartTest: boolean
}

// Emits 定义
interface Emits {
  (e: 'test-log', message: string, type: 'info' | 'success' | 'warning' | 'error'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 测试状态枚举
enum TestState {
  IDLE = 'idle',
  RUNNING = 'running',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 车辆位置枚举
enum VehicleLocation {
  NONE = 'none',
  SEGMENT_1 = 'segment_1',
  WAITING_1 = 'waiting_1',
  SEGMENT_2 = 'segment_2',
  WAITING_2 = 'waiting_2',
  SEGMENT_3 = 'segment_3',
  WAITING_3 = 'waiting_3',
  SEGMENT_4 = 'segment_4',
  COMPLETED = 'completed'
}

// 测试步骤接口
interface TestStep {
  id: string
  text: string
  icon: string
  completed: boolean
  active: boolean
  waiting: boolean
  timestamp?: Date
}

// 测试日志接口
interface TestLog {
  id: number
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

// 响应式数据
const testState = ref<TestState>(TestState.IDLE)
const currentTestVehicle = ref<string>('')
const currentLocation = ref<VehicleLocation>(VehicleLocation.NONE)
const testLogs = ref<TestLog[]>([])
const logIdCounter = ref(0)

// API相关状态
const isApiHealthy = ref<boolean>(false)
const isCheckingHealth = ref<boolean>(false)
const isApiActionRunning = ref<boolean>(false)
const apiInfo = ref<TestInfoResponse | null>(null)
const systemStatus = ref<StatusResponse | null>(null)

// 定时器引用
const timeouts = ref<Set<NodeJS.Timeout>>(new Set())
const intervals = ref<Set<NodeJS.Timer>>(new Set())

// 信号机状态监听
const signalWatchers = ref<Map<string, () => void>>(new Map())

// 取消健康检查订阅的函数
let unsubscribeHealthCheck: (() => void) | null = null

// 测试步骤配置
const testSteps = ref<TestStep[]>([
  { id: 'start', text: '检查起点信号机状态', icon: '🚦', completed: false, active: false, waiting: false },
  { id: 'segment1_enter', text: '车辆进入路段1', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment1_exit', text: '车辆离开路段1', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting1', text: '车辆在等待区1', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment2_enter', text: '车辆进入路段2', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment2_exit', text: '车辆离开路段2', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting2', text: '车辆在等待区2', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment3_enter', text: '车辆进入路段3', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment3_exit', text: '车辆离开路段3', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting3', text: '车辆在等待区3', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment4_enter', text: '车辆进入路段4', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment4_exit', text: '车辆离开路段4', icon: '✅', completed: false, active: false, waiting: false }
])

// 计算属性
const isTestRunning = computed(() =>
  testState.value === TestState.RUNNING || testState.value === TestState.WAITING
)

const testStatusText = computed(() => {
  switch (testState.value) {
    case TestState.IDLE: return '空闲'
    case TestState.RUNNING: return '运行中'
    case TestState.WAITING: return '等待信号'
    case TestState.COMPLETED: return '已完成'
    case TestState.ERROR: return '出错'
    default: return '未知'
  }
})

const testStatusClass = computed(() => {
  switch (testState.value) {
    case TestState.IDLE: return 'status-idle'
    case TestState.RUNNING: return 'status-running'
    case TestState.WAITING: return 'status-waiting'
    case TestState.COMPLETED: return 'status-completed'
    case TestState.ERROR: return 'status-error'
    default: return ''
  }
})

const currentVehicleLocation = computed(() => {
  switch (currentLocation.value) {
    case VehicleLocation.NONE: return '无'
    case VehicleLocation.SEGMENT_1: return '路段1'
    case VehicleLocation.WAITING_1: return '等待区1'
    case VehicleLocation.SEGMENT_2: return '路段2'
    case VehicleLocation.WAITING_2: return '等待区2'
    case VehicleLocation.SEGMENT_3: return '路段3'
    case VehicleLocation.WAITING_3: return '等待区3'
    case VehicleLocation.SEGMENT_4: return '路段4'
    case VehicleLocation.COMPLETED: return '已通过'
    default: return '未知'
  }
})

const apiStatusText = computed(() => {
  return isApiHealthy.value ? '连接正常' : '连接异常'
})

const apiStatusClass = computed(() => {
  return isApiHealthy.value ? 'api-healthy' : 'api-unhealthy'
})

// 添加日志
function addLog(message: string, type: TestLog['type'] = 'info') {
  const log: TestLog = {
    id: ++logIdCounter.value,
    timestamp: new Date(),
    message,
    type
  }

  testLogs.value.push(log)

  // 同时向父组件发送日志
  emit('test-log', message, type)

  // 保持日志数量在合理范围内
  if (testLogs.value.length > 100) {
    testLogs.value = testLogs.value.slice(-50)
  }
}

// 更新测试步骤状态
function updateStepStatus(stepId: string, status: 'active' | 'completed' | 'waiting') {
  const step = testSteps.value.find(s => s.id === stepId)
  if (step) {
    // 重置所有状态
    step.active = false
    step.completed = false
    step.waiting = false

    // 设置新状态
    step[status] = true

    if (status === 'completed') {
      step.timestamp = new Date()
    }
  }
}

// 生成测试车牌号
function generateTestLicensePlate(): string {
  const timestamp = Date.now().toString().slice(-6)
  return `TEST${timestamp}`
}

// 延迟执行函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, ms)
    timeouts.value.add(timeout)
  })
}

// 清除所有定时器
function clearAllTimeouts() {
  timeouts.value.forEach(timeout => clearTimeout(timeout))
  timeouts.value.clear()
  intervals.value.forEach(interval => clearInterval(interval as unknown as number))
  intervals.value.clear()
  signalWatchers.value.clear()
}

// 获取信号机状态
function getSignalStatus(signalId: string): string {
  return props.signals[signalId]?.status || 'ALL_RED'
}

// 检查信号机是否允许上行
function isSignalAllowingUpstream(signalId: string): boolean {
  const status = getSignalStatus(signalId)
  return status === 'UPSTREAM'
}

function isSignalAllowingDownstream(signalId: string): boolean {
  const status = getSignalStatus(signalId)
  return status === 'DOWNSTREAM'
}

// API相关方法
async function checkApiHealth(): Promise<void> {
  if (isCheckingHealth.value) return

  isCheckingHealth.value = true
  try {
    const health = await VehicleTestApiService.checkHealth()
    isApiHealthy.value = health.status === 'UP'
    addLog(`API健康检查: ${health.status}`, isApiHealthy.value ? 'success' : 'error')
  } catch (error) {
    isApiHealthy.value = false
    if(error instanceof Error) {
      addLog(`API健康检查失败: ${error.message}`, 'error')
    }

  } finally {
    isCheckingHealth.value = false
  }
}

async function loadApiInfo(): Promise<void> {
  try {
    apiInfo.value = await VehicleTestApiService.getTestInfo()
    addLog('API信息加载成功', 'success')
  } catch (error) {
    if(error instanceof Error) {
      addLog(`API信息加载失败: ${error.message}`, 'error')
    }

  }
}

async function getApiStatus(): Promise<void> {
  if (isApiActionRunning.value) return

  isApiActionRunning.value = true
  try {
    systemStatus.value = await VehicleTestApiService.getSystemStatus()
    addLog(`系统状态: ${systemStatus.value.status}, 已触发事件: ${systemStatus.value.totalTriggeredEvents}`, 'info')
  } catch (error) {
    if(error instanceof Error) {
      addLog(`获取系统状态失败: ${error.message}`, 'error')
    }

  } finally {
    isApiActionRunning.value = false
  }
}

// 开始车辆测试
async function startVehicleTest() {
  if (!props.canStartTest) {
    addLog('起点信号机不允许上行，无法开始测试', 'warning')
    return
  }

  if (!isApiHealthy.value) {
    addLog('API连接异常，无法开始测试', 'error')
    return
  }

  try {
    // 重置状态
    testState.value = TestState.RUNNING
    currentTestVehicle.value = generateTestLicensePlate()
    currentLocation.value = VehicleLocation.NONE

    // 重置步骤状态
    testSteps.value.forEach(step => {
      step.completed = false
      step.active = false
      step.waiting = false
      step.timestamp = undefined
    })

    addLog(`开始全程测试，测试车辆: ${currentTestVehicle.value}`, 'info')

    // 步骤1: 检查起点信号机
    updateStepStatus('start', 'completed')
    addLog('起点信号机允许上行，开始测试', 'success')

    // 步骤2: 车辆进入路段1
    await executeVehicleEnterSegment1()

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`测试启动失败: ${error.message}`, 'error')
    }

  }
}

// 执行车辆进入路段1
async function executeVehicleEnterSegment1() {
  if (testState.value === TestState.ERROR) return

  updateStepStatus('segment1_enter', 'active')

  try {
    const response = await VehicleTestApiService.vehicleEnterUpstream(1, currentTestVehicle.value)

    updateStepStatus('segment1_enter', 'completed')
    currentLocation.value = VehicleLocation.SEGMENT_1
    addLog(`车辆成功进入路段1: ${response.message}`, 'success')

    // 10秒后车辆离开路段1
    updateStepStatus('segment1_exit', 'waiting')
    addLog('等待10秒后车辆离开路段1...', 'info')

    await delay(10000)

    //if (testState.value !== TestState.ERROR) {
      await executeVehicleExitSegment1()
    //}

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆进入路段1失败: ${error.message}`, 'error')
    }
  }
}

// 执行车辆离开路段1
async function executeVehicleExitSegment1() {
  if (testState.value === TestState.ERROR) return

  updateStepStatus('segment1_exit', 'active')

  try {
    const response = await VehicleTestApiService.vehicleExitUpstream(1, currentTestVehicle.value)

    updateStepStatus('segment1_exit', 'completed')
    currentLocation.value = VehicleLocation.WAITING_1
    updateStepStatus('waiting1', 'completed')
    addLog(`车辆离开路段1，进入等待区1: ${response.message}`, 'success')

    // 检查信号机2状态
    await checkSignal2AndProceed()

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆离开路段1失败: ${error.message}`, 'error')
    }
  }
}

// 检查信号机2状态并决定下一步
async function checkSignal2AndProceed() {
  if (testState.value === TestState.ERROR) return

  if (isSignalAllowingUpstream('38')) { // 信号机2 ID
    addLog('信号机2允许上行，车辆继续前进', 'success')
    await executeVehicleEnterSegment2()
  } else {
    testState.value = TestState.WAITING
    updateStepStatus('segment2_enter', 'waiting')
    addLog('信号机2不允许上行，等待信号变化...', 'warning')

    watchSignalChange('38', () => executeVehicleEnterSegment2())
  }
}

// 执行车辆进入路段2
async function executeVehicleEnterSegment2() {
  if (testState.value === TestState.ERROR) return

  testState.value = TestState.RUNNING
  updateStepStatus('segment2_enter', 'active')

  try {
    const response = await VehicleTestApiService.vehicleEnterUpstream(2, currentTestVehicle.value)

    updateStepStatus('segment2_enter', 'completed')
    currentLocation.value = VehicleLocation.SEGMENT_2
    addLog(`车辆成功进入路段2: ${response.message}`, 'success')

    updateStepStatus('segment2_exit', 'waiting')
    addLog('等待10秒后车辆离开路段2...', 'info')

    await delay(10000)

    //if (testState.value !== TestState.ERROR) {
      await executeVehicleExitSegment2()
    //}

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆进入路段2失败: ${error.message}`, 'error')
    }

  }
}

// 执行车辆离开路段2
async function executeVehicleExitSegment2() {
  if (testState.value === TestState.ERROR) return

  updateStepStatus('segment2_exit', 'active')

  try {
    const response = await VehicleTestApiService.vehicleExitUpstream(2, currentTestVehicle.value)

    updateStepStatus('segment2_exit', 'completed')
    currentLocation.value = VehicleLocation.WAITING_2
    updateStepStatus('waiting2', 'completed')
    addLog(`车辆离开路段2，进入等待区2: ${response.message}`, 'success')

    // 检查信号机3状态
    await checkSignal3AndProceed()

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆离开路段2失败: ${error.message}`, 'error')
    }

  }
}

// 检查信号机3状态并决定下一步
async function checkSignal3AndProceed() {
  if (testState.value === TestState.ERROR) return

  if (isSignalAllowingUpstream('41')) { // 信号机3 ID
    addLog('信号机3允许上行，车辆继续前进', 'success')
    await executeVehicleEnterSegment3()
  } else {
    testState.value = TestState.WAITING
    updateStepStatus('segment3_enter', 'waiting')
    addLog('信号机3不允许上行，等待信号变化...', 'warning')

    watchSignalChange('41', () => executeVehicleEnterSegment3())
  }
}

// 执行车辆进入路段3
async function executeVehicleEnterSegment3() {
  if (testState.value === TestState.ERROR) return

  testState.value = TestState.RUNNING
  updateStepStatus('segment3_enter', 'active')

  try {
    const response = await VehicleTestApiService.vehicleEnterUpstream(3, currentTestVehicle.value)

    updateStepStatus('segment3_enter', 'completed')
    currentLocation.value = VehicleLocation.SEGMENT_3
    addLog(`车辆成功进入路段3: ${response.message}`, 'success')

    updateStepStatus('segment3_exit', 'waiting')
    addLog('等待10秒后车辆离开路段3...', 'info')

    await delay(10000)

    //if (testState.value !== TestState.ERROR) {
      await executeVehicleExitSegment3()
    //}

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆进入路段3失败: ${error.message}`, 'error')
    }

  }
}

// 执行车辆离开路段3
async function executeVehicleExitSegment3() {
  if (testState.value === TestState.ERROR) return

  updateStepStatus('segment3_exit', 'active')

  try {
    const response = await VehicleTestApiService.vehicleExitUpstream(3, currentTestVehicle.value)

    updateStepStatus('segment3_exit', 'completed')
    currentLocation.value = VehicleLocation.WAITING_3
    updateStepStatus('waiting3', 'completed')
    addLog(`车辆离开路段3，进入等待区3: ${response.message}`, 'success')

    // 检查信号机4状态
    await checkSignal4AndProceed()

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆离开路段3失败: ${error.message}`, 'error')
    }

  }
}

// 检查信号机4状态并决定下一步
async function checkSignal4AndProceed() {
  if (testState.value === TestState.ERROR) return

  if (isSignalAllowingUpstream('42')) { // 信号机4 ID
    addLog('信号机4允许上行，车辆继续前进', 'success')
    await executeVehicleEnterSegment4()
  } else {
    testState.value = TestState.WAITING
    updateStepStatus('segment4_enter', 'waiting')
    addLog('信号机4不允许上行，等待信号变化...', 'warning')

    watchSignalChange('42', () => executeVehicleEnterSegment4())
  }
}

// 执行车辆进入路段4
async function executeVehicleEnterSegment4() {
  if (testState.value === TestState.ERROR) return

  testState.value = TestState.RUNNING
  updateStepStatus('segment4_enter', 'active')

  try {
    const response = await VehicleTestApiService.vehicleEnterUpstream(4, currentTestVehicle.value)

    updateStepStatus('segment4_enter', 'completed')
    currentLocation.value = VehicleLocation.SEGMENT_4
    addLog(`车辆成功进入路段4: ${response.message}`, 'success')

    updateStepStatus('segment4_exit', 'waiting')
    addLog('等待10秒后车辆离开路段4...', 'info')

    await delay(10000)

    //if (testState.value !== TestState.ERROR) {
      await executeVehicleExitSegment4()
    //}

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆进入路段4失败: ${error.message}`, 'error')
    }

  }
}

// 执行车辆离开路段4
async function executeVehicleExitSegment4() {
  if (testState.value === TestState.ERROR) return

  updateStepStatus('segment4_exit', 'active')

  try {
    const response = await VehicleTestApiService.vehicleExitUpstream(4, currentTestVehicle.value)

    updateStepStatus('segment4_exit', 'completed')
    currentLocation.value = VehicleLocation.COMPLETED
    testState.value = TestState.COMPLETED
    addLog(`🎉 车辆成功离开路段4，全程测试完成！响应: ${response.message}`, 'success')

  } catch (error) {
    testState.value = TestState.ERROR
    if(error instanceof Error) {
      addLog(`车辆离开路段4失败: ${error.message}`, 'error')
    }

  }
}

// 监听信号机状态变化
function watchSignalChange(signalId: string, callback: () => void) {
  // 清除可能存在的旧监听器
  if (signalWatchers.value.has(signalId)) {
    signalWatchers.value.delete(signalId)
  }

  // 设置新的监听器
  const checkInterval = setInterval(() => {
    if (testState.value === TestState.ERROR || testState.value === TestState.IDLE) {
      clearInterval(checkInterval)
      signalWatchers.value.delete(signalId)
      return
    }

    if (isSignalAllowingUpstream(signalId)) {
      clearInterval(checkInterval)
      signalWatchers.value.delete(signalId)
      addLog(`信号机${signalId}状态变为允许上行`, 'success')
      callback()
    }
  }, 2000) // 每2秒检查一次

  // 将定时器添加到集合中以便清理
  intervals.value.add(checkInterval)
  signalWatchers.value.set(signalId, callback)
}

// 停止测试
function stopVehicleTest() {
  const wasRunning = isTestRunning.value

  testState.value = TestState.IDLE
  currentTestVehicle.value = ''
  currentLocation.value = VehicleLocation.NONE
  clearAllTimeouts()

  // 重置步骤状态
  testSteps.value.forEach(step => {
    step.completed = false
    step.active = false
    step.waiting = false
    step.timestamp = undefined
  })

  if (wasRunning) {
    addLog('测试已停止', 'warning')
  }
}

// 清除测试历史
async function clearTestHistory() {
  if (isApiActionRunning.value) return

  isApiActionRunning.value = true
  try {
    const response = await VehicleTestApiService.clearEventHistory()
    testLogs.value = []
    logIdCounter.value = 0
    addLog(`API历史已清除: ${response.message} (${response.clearedCount}条记录)`, 'success')
  } catch (error) {
    if(error instanceof Error) {
      addLog(`清除API历史失败: ${error.message}`, 'error')
    }

  } finally {
    isApiActionRunning.value = false
  }
}

// 导出日志
function exportLogs() {
  try {
    const logsData = testLogs.value.map(log => ({
      时间: formatTime(log.timestamp),
      类型: log.type.toUpperCase(),
      消息: log.message
    }))

    const csvContent = [
      ['时间', '类型', '消息'].join(','),
      ...logsData.map(log => [
        `"${log.时间}"`,
        `"${log.类型}"`,
        `"${log.消息}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `车辆测试日志_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addLog('日志导出成功', 'success')
  } catch (error) {
    if(error instanceof Error) {
      addLog(`日志导出失败: ${error.message}`, 'error')
    }

  }
}

// 格式化时间
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 监听 props 变化
watch(() => props.signals, (newSignals, oldSignals) => {
  // 检查信号机状态变化，触发等待中的回调
  for (const [signalId, callback] of signalWatchers.value) {
    const oldStatus = oldSignals?.[signalId]?.status
    const newStatus = newSignals[signalId]?.status

    if (oldStatus !== newStatus && isSignalAllowingUpstream(signalId)) {
      signalWatchers.value.delete(signalId)
      addLog(`检测到信号机${signalId}状态变化: ${oldStatus} → ${newStatus}`, 'info')
      callback()
    }
  }
}, { deep: true })

// 组件生命周期
onMounted(async () => {
  // 启动API健康检查
  ApiHealthChecker.startHealthCheck(30000) // 30秒检查一次

  // 订阅健康状态变化
  unsubscribeHealthCheck = ApiHealthChecker.onHealthChange((healthy) => {
    isApiHealthy.value = healthy
    addLog(`API健康状态变化: ${healthy ? '健康' : '异常'}`, healthy ? 'success' : 'error')
  })

  // 初始健康检查
  await checkApiHealth()

  // 加载API信息
  if (isApiHealthy.value) {
    await loadApiInfo()
  }
})

onUnmounted(() => {
  // 停止健康检查
  ApiHealthChecker.stopHealthCheck()

  // 取消订阅
  if (unsubscribeHealthCheck) {
    unsubscribeHealthCheck()
  }

  // 清理定时器
  clearAllTimeouts()
})

// 暴露给模板使用
defineExpose({
  TestState
})
</script>

<style scoped>
.test-control-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.test-control-panel h3 {
  margin: 0 0 1.5rem 0;
  color: white;
  font-size: 1.2rem;
  text-align: center;
}

/* API状态指示器 */
.api-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.api-status.api-healthy {
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.4);
}

.api-status.api-unhealthy {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-indicator.healthy {
  background: #28a745;
  animation: pulse 2s infinite;
}

.status-indicator.unhealthy {
  background: #dc3545;
}

.refresh-btn {
  margin-left: auto;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.test-status {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-label {
  font-weight: 500;
  font-size: 0.9rem;
}

.status-value {
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.status-idle {
  background: rgba(108, 117, 125, 0.3);
  color: #f8f9fa;
}

.status-running {
  background: rgba(40, 167, 69, 0.4);
  color: #d4edda;
  animation: pulse 2s infinite;
}

.status-waiting {
  background: rgba(255, 193, 7, 0.4);
  color: #fff3cd;
  animation: blink 1.5s infinite;
}

.status-completed {
  background: rgba(40, 167, 69, 0.4);
  color: #d4edda;
}

.status-error {
  background: rgba(220, 53, 69, 0.4);
  color: #f8d7da;
}

.test-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.test-buttons button {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  min-width: 100px;
}

.start-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1ea080);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.start-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.stop-btn {
  background: linear-gradient(135deg, #dc3545, #e74c3c);
  color: white;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
}

.stop-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c82333, #c0392b);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

.stop-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.clear-btn, .status-btn {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
}

.clear-btn:hover:not(:disabled), .status-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6268, #495057);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.clear-btn:disabled, .status-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.test-progress {
  margin-top: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-title {
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1rem;
  text-align: center;
  color: #f8f9fa;
}

.progress-steps {
  display: grid;
  gap: 0.75rem;
}

.progress-step {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
}

.progress-step.completed {
  background: rgba(40, 167, 69, 0.2);
  border-color: rgba(40, 167, 69, 0.4);
  color: #d4edda;
}

.progress-step.active {
  background: rgba(0, 123, 255, 0.2);
  border-color: rgba(0, 123, 255, 0.4);
  color: #cce7ff;
  animation: pulse 2s infinite;
}

.progress-step.waiting {
  background: rgba(255, 193, 7, 0.2);
  border-color: rgba(255, 193, 7, 0.4);
  color: #fff3cd;
  animation: blink 1.5s infinite;
}

.step-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.step-text {
  font-weight: 500;
  font-size: 0.9rem;
}

.step-time {
  font-size: 0.8rem;
  opacity: 0.8;
  font-family: 'Courier New', monospace;
}

.test-logs {
  margin-top: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.logs-title {
  font-weight: 600;
  color: #f8f9fa;
}

.export-btn {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.export-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.logs-content {
  max-height: 250px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.logs-content::-webkit-scrollbar {
  width: 6px;
}

.logs-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.logs-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.logs-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.log-entry {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.25rem;
}

.log-entry:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.log-time {
  opacity: 0.7;
  font-size: 0.75rem;
  color: #adb5bd;
  min-width: 60px;
}

.log-message {
  color: #f8f9fa;
  line-height: 1.4;
}

.log-entry.success .log-message {
  color: #90ee90;
}

.log-entry.warning .log-message {
  color: #ffd700;
}

.log-entry.error .log-message {
  color: #ff6b6b;
}

.log-entry.info .log-message {
  color: #87ceeb;
}

/* API信息面板 */
.api-info {
  margin-top: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-title {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #f8f9fa;
  font-size: 0.9rem;
}

.info-content {
  display: grid;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.info-label {
  color: #adb5bd;
  font-weight: 500;
}

.info-value {
  color: #f8f9fa;
  font-weight: 600;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-control-panel {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .test-control-panel h3 {
    font-size: 1.1rem;
  }

  .api-status {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .refresh-btn {
    margin-left: 0;
    margin-top: 0.5rem;
    align-self: center;
  }

  .test-status {
    flex-direction: column;
    align-items: center;
  }

  .status-item {
    width: 100%;
    justify-content: space-between;
  }

  .test-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }

  .test-buttons button {
    width: 100%;
    min-width: unset;
  }

  .progress-step {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    gap: 0.5rem;
  }

  .step-time {
    grid-column: 1 / -1;
    justify-self: end;
    font-size: 0.75rem;
  }

  .test-progress {
    padding: 1rem;
  }

  .test-logs {
    padding: 1rem;
  }

  .logs-content {
    max-height: 200px;
    font-size: 0.8rem;
  }

  .logs-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .export-btn {
    align-self: center;
  }
}

@media (max-width: 480px) {
  .test-control-panel {
    padding: 1rem;
  }

  .test-control-panel h3 {
    font-size: 1rem;
  }

  .status-item {
    padding: 0.4rem 0.8rem;
  }

  .status-label,
  .status-value {
    font-size: 0.85rem;
  }

  .test-buttons button {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }

  .step-text {
    font-size: 0.85rem;
  }

  .step-icon {
    font-size: 1rem;
  }

  .api-status {
    font-size: 0.85rem;
  }
}
</style>
