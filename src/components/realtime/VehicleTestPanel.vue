<!-- src/components/realtime/VehicleTestPanel.vue -->
<template>
  <div class="test-control-panel">
    <h3>🚗 车辆全程测试功能</h3>

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
          @click="startUpstreamTest"
          :disabled="isQueueRunning || !canStartUpstreamTest || !isApiHealthy"
          class="start-btn"
        >
          {{ isQueueRunning ? '测试进行中...' : '开始上行测试' }}
        </button>

        <button
          @click="startDownstreamTest"
          :disabled="isQueueRunning || !canStartDownstreamTest || !isApiHealthy"
          class="start-btn"
        >
          开始下行测试
        </button>

        <button
          @click="startCombinedTest"
          :disabled="isQueueRunning || !canStartCombinedTest || !isApiHealthy"
          class="start-btn combined-btn"
        >
          开始上行+下行联合测试
        </button>

        <button
          @click="cancelTest"
          :disabled="!isQueueRunning"
          class="cancel-btn"
        >
          取消测试
        </button>
      </div>
    </div>

    <div v-if="testQueue.length > 0" class="test-queue-panel">
      <h4>测试任务队列:</h4>
      <ul>
        <li v-for="task in testQueue" :key="task.id" :class="`task-item task-${task.state.toLowerCase()}`">
          <span>{{ task.name }}</span>
          <span class="task-status">
            {{ task.state === TaskState.RUNNING ? '运行中...' : task.state === TaskState.COMPLETED ? '完成' : task.state === TaskState.FAILED ? '失败' : '排队中' }}
          </span>
        </li>
      </ul>
    </div>

    <div class="test-progress" v-if="testSteps.length > 0">
      <div class="progress-title">
        <span class="step-icon">▶️</span>
        <h4 class="test-step-header">进度跟踪</h4>
      </div>
      <div class="progress-steps-container">
        <div
          v-for="step in testSteps"
          :key="step.id"
          class="progress-step"
          :class="{ 'completed': step.completed, 'active': step.active, 'waiting': step.waiting }"
        >
          <div class="step-content">
            <span class="step-icon">{{ step.icon }}</span>
            <span class="step-text">{{ step.text }}</span>
          </div>
          <span v-if="step.timestamp" class="step-time">{{ formatTime(step.timestamp) }}</span>
        </div>
      </div>
    </div>

    <div class="test-logs">
      <div class="logs-header">
        <h4>日志 <span class="log-count">({{ logs.length }})</span></h4>
        <button @click="clearLogs" class="clear-btn">清空</button>
      </div>
      <div class="logs-content" ref="logsContainer">
        <div v-for="(log, index) in logs" :key="index" :class="`log-entry log-${log.type}`">
          <span class="log-timestamp">[{{ formatTime(log.timestamp) }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineProps } from 'vue'
import {
  VehicleTestApiService,
  //type VehicleEventResponse,
  //type StatusResponse,
  //type EventHistoryItem,
  ApiHealthChecker
} from '@/services/vehicleTestApi'
import { format } from 'date-fns'
import { TimerManager} from '@/utils/timerManager.ts'
import { Signal } from '@/types/websocket';

// ======== 枚举和类型定义 ========
// 新增: 定义测试模式
enum TestMode {
  UPSTREAM = 'upstream',
  DOWNSTREAM = 'downstream',
}

// 新增: 定义测试任务状态
enum TaskState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// 步骤类型保持不变
interface Step {
  id: string
  text: string
  icon: string
  completed: boolean
  active: boolean
  waiting: boolean
  timestamp?: number
}

// 新增: 定义测试任务类型，包含所有测试所需的状态
interface TestTask {
  id: string;
  mode: TestMode;
  name: string;
  state: TaskState;
  vehiclePlate: string;
  steps: Step[];
  run: () => Promise<void>;
}

// ======== 响应式状态 ========
const isTestRunning = ref(false)
const testState = ref('idle') // idle | running | completed | error | waiting
const testSteps = ref<Step[]>([]) // 步骤将根据任务动态设置
const currentTestVehicle = ref('')
const currentLocation = ref('NONE')
const logs = ref<{ message: string; type: string; timestamp: number }[]>([])
const isApiHealthy = ref(false)
const isCheckingHealth = ref(true)
const logsContainer = ref<HTMLElement | null>(null)
//const signalWatchers = ref(new Map<string, Function>())
const signalWatchers = ref(new Map<string, () => void>())
//const vehicleHistory = ref<EventHistoryItem[]>([])
//const canStartTest = ref(false)
const unsubscribeHealthCheck = ref<(() => void) | null>(null);

// 新增: 任务队列相关状态
const testQueue = ref<TestTask[]>([]);
const currentTask = ref<TestTask | null>(null);
const isQueueRunning = ref(false);

// 定义props
interface Props {
  signals: Record<string, Signal>;
  initialSignalIds: string[]; // 明确声明为字符串数组
}

const props = defineProps<Props>();
// ======== 预定义测试步骤常量 ========
// 新增: 上行测试步骤常量
const UPSTREAM_STEPS: Step[] = [
  { id: 'start', text: '检查起点信号机状态', icon: '🚦', completed: false, active: false, waiting: false },
  { id: 'segment1_enter', text: '车辆进入路段1', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment1_exit', text: '车辆离开路段1', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting2', text: '车辆在等待区2', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment2_enter', text: '车辆进入路段2', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment2_exit', text: '车辆离开路段2', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting3', text: '车辆在等待区3', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment3_enter', text: '车辆进入路段3', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment3_exit', text: '车辆离开路段3', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting4', text: '车辆在等待区4', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment4_enter', text: '车辆进入路段4', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment4_exit', text: '车辆离开路段4', icon: '✅', completed: false, active: false, waiting: false }
]
// 新增: 下行测试步骤常量
const DOWNSTREAM_STEPS: Step[] = [
  { id: 'start', text: '检查终点信号机状态', icon: '🚦', completed: false, active: false, waiting: false },
  { id: 'segment4_enter', text: '车辆进入路段4', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment4_exit', text: '车辆离开路段4', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting3', text: '车辆在等待区3', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment3_enter', text: '车辆进入路段3', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment3_exit', text: '车辆离开路段3', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting2', text: '车辆在等待区2', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment2_enter', text: '车辆进入路段2', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment2_exit', text: '车辆离开路段2', icon: '➡️', completed: false, active: false, waiting: false },
  { id: 'waiting1', text: '车辆在等待区1', icon: '⏸️', completed: false, active: false, waiting: false },
  { id: 'segment1_enter', text: '车辆进入路段1', icon: '🚗', completed: false, active: false, waiting: false },
  { id: 'segment1_exit', text: '车辆离开路段1', icon: '✅', completed: false, active: false, waiting: false }
]

// ======== 计算属性 ========
const apiStatusClass = computed(() => isApiHealthy.value ? 'healthy' : 'unhealthy')
const apiStatusText = computed(() => isApiHealthy.value ? '正常' : '异常')

// 在计算属性部分添加
const canStartUpstreamTest = computed(() => {
  // 1. 检查 API 是否健康
  if (!isApiHealthy.value) {
    return false;
  }

  // 2. 检查 props.initialSignalIds 数组是否存在且不为空
  const signalIds = props.initialSignalIds;
  if (!signalIds || signalIds.length === 0) {
    // 如果数组为空或不存在，则无法开始测试
    return false;
  }

  // 3. 检查起点信号机状态
  const signal1Status = getSignalStatus(signalIds[0]);
  return ['UPSTREAM'].includes(signal1Status)
});

const canStartDownstreamTest = computed(() => {
  if (!isApiHealthy.value) {
    return false;
  }

  const signalIds = props.initialSignalIds;
  if (!signalIds || signalIds.length === 0) {
    return false;
  }

  // 下行测试的起点是终点信号机，所以这里应该是最后一个元素
  const lastSignalId = signalIds[signalIds.length - 1];
  const signalStatus = getSignalStatus(lastSignalId);
  return ['DOWNSTREAM'].includes(signalStatus)
});

const canStartCombinedTest = computed(() => {
  return true;
});

const testStatusClass = computed(() => {
  if (testState.value === 'running') return 'running'
  if (testState.value === 'completed') return 'completed'
  if (testState.value === 'error') return 'error'
  return 'idle'
})

const testStatusText = computed(() => {
  if (isTestRunning.value) return '运行中...'
  if (testState.value === 'completed') return '已完成'
  if (testState.value === 'error') return '测试失败'
  if (testState.value === 'waiting') return '等待中...'
  return '空闲'
})

const currentVehicleLocation = computed(() => {
  switch (currentLocation.value) {
    case 'SEGMENT_1': return '路段1'
    case 'SEGMENT_2': return '路段2'
    case 'SEGMENT_3': return '路段3'
    case 'SEGMENT_4': return '路段4'
    case 'WAITING_1': return '等待区1'
    case 'WAITING_2': return '等待区2'
    case 'WAITING_3': return '等待区3'
    case 'WAITING_4': return '等待区4'
    default: return '未知'
  }
})

// ======== 辅助函数 ========
function formatTime(timestamp: number) {
  return format(new Date(timestamp), 'HH:mm:ss')
}

function generateTestLicensePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const plate = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
    + Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * digits.length)]).join('')
  return `TEST-${plate}`
}

function updateStepStatus(steps: Step[], id: string, status: 'active' | 'completed' | 'waiting' = 'active') {
  const step = steps.find(s => s.id === id)
  if (step) {
    step.active = status === 'active'
    step.completed = status === 'completed'
    step.waiting = status === 'waiting'
    step.timestamp = Date.now()
  }
}

function addLog(message: string, type: string) {
  logs.value.push({ message, type, timestamp: Date.now() })
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight
  }
}

async function checkApiHealth() {
  isCheckingHealth.value = true
  try {
    const health = await VehicleTestApiService.checkHealth()
    isApiHealthy.value = health.status === 'UP'
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    isApiHealthy.value = false
    addLog('API健康检查失败', 'error')
  } finally {
    isCheckingHealth.value = false
  }
}

function getSignalStatus(signalId: string): string {
  return props.signals[signalId]?.status || 'ALL_RED';
}

function isSignalAllowingUpstream(signalId: string): boolean {
  //return getSignalStatus(signalId) === 'UPSTREAM'
  return ['UPSTREAM'].includes(getSignalStatus(signalId))
}

function isSignalAllowingDownstream(signalId: string): boolean {
  //return getSignalStatus(signalId) === 'DOWNSTREAM'
  return ['DOWNSTREAM'].includes(getSignalStatus(signalId))
}

function watchSignalChange(signalId: string, callback: () => void, mode: TestMode) {
  addLog(`DEBUG: 开始监听信号机 ${signalId}, 监听模式: ${mode}`, 'info');
  if (signalWatchers.value.has(signalId)) {
    // 如果已经有watcher在监听，先停止
    signalWatchers.value.get(signalId)!();
    addLog(`DEBUG: 停止旧的对信号机 ${signalId} 的监听`, 'warning');
  }

  const checkInterval = setInterval(() => {
    addLog(`DEBUG: 正在检查信号机 ${signalId} 的状态...`, 'info');

    let signalAllowed = false;
    if (mode === TestMode.UPSTREAM) {
      signalAllowed = isSignalAllowingUpstream(signalId)
    } else {
      signalAllowed = isSignalAllowingDownstream(signalId)
    }

    if (signalAllowed) {
      clearInterval(checkInterval);
      signalWatchers.value.delete(signalId);
      addLog(`检测到信号机${signalId}状态变为${mode === TestMode.UPSTREAM ? '允许上行' : '允许下行'}`, 'success');
      callback();
    }
  }, 2000);

  // 提供一个停止监听的函数
  const stopWatching = () => {
    addLog(`DEBUG: 外部请求停止对信号机 ${signalId} 的监听`, 'info');
    clearInterval(checkInterval);
  }
  signalWatchers.value.set(signalId, stopWatching);
}

// 清空日志
function clearLogs() {
  logs.value = []
}

// 取消测试
function cancelTest() {
  isQueueRunning.value = false;
  testQueue.value = [];
  testState.value = 'idle';
  currentTestVehicle.value = '';
  currentTask.value = null;
  addLog('测试已取消', 'warning');
}

// ======== 重构后的核心函数 ========

/**
 * 核心测试执行器
 * 负责从任务队列中按序执行任务，或者并行执行联合任务
 */
async function runTestQueue() {
  if (isQueueRunning.value) return;

  isQueueRunning.value = true;
  testState.value = 'running';
  currentTestVehicle.value = testQueue.value.length === 1 ? testQueue.value[0].vehiclePlate : '联合测试';

  addLog(`开始执行测试任务队列，测试车辆: ${currentTestVehicle.value}`, 'info');

  const tasksToRun = testQueue.value.map(task => {
    if (testQueue.value.length === 1) {
      testSteps.value = task.steps;
      currentTask.value = task;
    }

    // **核心修改：直接调用 task.run()，不传递参数**
    return (async () => {
      task.state = TaskState.RUNNING;
      try {
        addLog(`开始执行任务: ${task.name}，车辆: ${task.vehiclePlate}`, 'info');
        await task.run();
        task.state = TaskState.COMPLETED;
        addLog(`任务完成: ${task.name}`, 'success');
      } catch (error) {
        task.state = TaskState.FAILED;
        if (error instanceof Error) {
          addLog(`任务失败: ${task.name} - ${error.message}`, 'error');
        }
        throw error;
      }
    })();
  });

  try {
    await Promise.all(tasksToRun);
    testState.value = 'completed';
    addLog('所有测试任务已完成', 'info');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    testState.value = 'error';
    addLog('一个或多个测试任务失败，联合测试终止', 'error');
  } finally {
    isQueueRunning.value = false;
    currentTask.value = null;
    testQueue.value = [];
  }
}

/**
 * 执行车辆在单个路段的完整测试（进入、停留、离开）
 * @param segmentId 路段ID
 * @param steps
 * @param vehiclePlate 车牌
 * @param nextLocationKey 离开路段后的位置键
 * @param mode
 */
async function executeSegmentTest(segmentId: number, steps: Step[], vehiclePlate: string, nextLocationKey: string, mode: TestMode) {
  const isUpstream = mode === TestMode.UPSTREAM;
  // 核心改动在这里：使用箭头函数来调用
  const enterApi = isUpstream
    ? () => VehicleTestApiService.vehicleEnterUpstream(segmentId, vehiclePlate)
    : () => VehicleTestApiService.vehicleEnterDownstream(segmentId, vehiclePlate);

  const exitApi = isUpstream
    ? () => VehicleTestApiService.vehicleExitUpstream(segmentId, vehiclePlate)
    : () => VehicleTestApiService.vehicleExitDownstream(segmentId, vehiclePlate);
  const enterStepKey = `segment${segmentId}_enter`;
  const exitStepKey = `segment${segmentId}_exit`;

  try {
    // 进入路段
    updateStepStatus(steps, enterStepKey, 'active');
    const enterResponse = await enterApi();
    updateStepStatus(steps, enterStepKey, 'completed');
    currentLocation.value = `SEGMENT_${segmentId}`;
    addLog(`车辆成功进入路段${segmentId}: ${enterResponse.message}`, 'success');

    await delay(10000); // 停留10秒

    // 离开路段
    updateStepStatus(steps, exitStepKey, 'active');
    const exitResponse = await exitApi();
    updateStepStatus(steps, exitStepKey, 'completed');
    currentLocation.value = nextLocationKey;
    addLog(`车辆离开路段${segmentId}，进入${nextLocationKey}: ${exitResponse.message}`, 'success');

  } catch (error) {
    if(error instanceof Error) {
      addLog(`执行路段 ${segmentId} 测试失败: ${error.message}`, 'error');
    }
    throw error;
  }
}

/**
 * 封装上行测试的核心逻辑
 */
/**
 * 封装上行测试的核心逻辑
 */
// 假设这是 executeUpstreamTest 函数的开始部分
async function executeUpstreamTest(
  signalIds: string[],
  steps: Step[],
  vehiclePlate: string
) {
  try {
    // 步骤1: 检查起点信号机并进入路段1
    if (!isSignalAllowingUpstream(signalIds[0])) {
      updateStepStatus(steps, 'segment1_enter', 'waiting');
      addLog('起点信号机不允许上行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[0], () => resolve(), TestMode.UPSTREAM);
      });
    }

    // 使用封装后的函数来执行路段1的测试
    await executeSegmentTest(1, steps, vehiclePlate, 'WAITING_2', TestMode.UPSTREAM);

    // 步骤4: 检查信号机2并进入路段2
    if (!isSignalAllowingUpstream(signalIds[1])) {
      updateStepStatus(steps, 'segment2_enter', 'waiting');
      addLog('信号机2不允许上行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[1], () => resolve(), TestMode.UPSTREAM);
      });
    }

    // 使用封装后的函数来执行路段2的测试
    await executeSegmentTest(2, steps, vehiclePlate, 'WAITING_3', TestMode.UPSTREAM);

    // 步骤7: 检查信号机3并进入路段3
    if (!isSignalAllowingUpstream(signalIds[2])) {
      updateStepStatus(steps, 'segment3_enter', 'waiting');
      addLog('信号机3不允许上行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[2], () => resolve(), TestMode.UPSTREAM);
      });
    }

    // 使用封装后的函数来执行路段3的测试
    await executeSegmentTest(3, steps, vehiclePlate, 'WAITING_4', TestMode.UPSTREAM);

    // 步骤10: 检查信号机4并进入路段4
    if (!isSignalAllowingUpstream(signalIds[3])) {
      updateStepStatus(steps, 'segment4_enter', 'waiting');
      addLog('信号机4不允许上行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[3], () => resolve(), TestMode.UPSTREAM);
      });
    }

    // 使用封装后的函数来执行路段4的测试
    await executeSegmentTest(4, steps, vehiclePlate, 'COMPLETED', TestMode.UPSTREAM);
    // 任务完成
    updateStepStatus(steps, 'task_completion', 'completed');
    addLog(`车辆离开路段4，上行测试完成: ${vehiclePlate}`, 'success');

  } catch (error) {
    // 错误处理
    if(error instanceof Error) {
      updateStepStatus(steps, 'task_completion', 'completed');
      addLog(`上行测试失败: ${error.message}`, 'error');
      console.error(error);
    }
    throw error;
  }
}
// 假设这是 executeDownstreamTest 函数的开始部分
async function executeDownstreamTest(
  signalIds: string[],
  steps: Step[],
  vehiclePlate: string
) {
  try {
    // 步骤1: 检查终点信号机并进入路段4（下行）
    if (!isSignalAllowingDownstream(signalIds[4])) {
      updateStepStatus(steps, 'segment4_enter', 'waiting');
      addLog('终点信号机不允许下行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[4], () => resolve(), TestMode.DOWNSTREAM);
      });
    }

    // 使用封装后的函数来执行路段4的测试
    await executeSegmentTest(4, steps, vehiclePlate, 'WAITING_3', TestMode.DOWNSTREAM);

    // 步骤4: 检查信号机3并进入路段3
    if (!isSignalAllowingDownstream(signalIds[3])) {
      updateStepStatus(steps, 'segment3_enter', 'waiting');
      addLog('信号机3不允许下行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[3], () => resolve(), TestMode.DOWNSTREAM);
      });
    }

    // 使用封装后的函数来执行路段3的测试
    await executeSegmentTest(3, steps, vehiclePlate, 'WAITING_2', TestMode.DOWNSTREAM);

    // 步骤7: 检查信号机2并进入路段2
    if (!isSignalAllowingDownstream(signalIds[2])) {
      updateStepStatus(steps, 'segment2_enter', 'waiting');
      addLog('信号机2不允许下行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[2], () => resolve(), TestMode.DOWNSTREAM);
      });
    }

    // 使用封装后的函数来执行路段2的测试
    await executeSegmentTest(2, steps, vehiclePlate, 'WAITING_1', TestMode.DOWNSTREAM);

    // 步骤10: 检查信号机1并进入路段1
    if (!isSignalAllowingDownstream(signalIds[1])) {
      updateStepStatus(steps, 'segment1_enter', 'waiting');
      addLog('信号机1不允许下行，等待信号变化...', 'warning');
      await new Promise<void>((resolve) => {
        watchSignalChange(signalIds[1], () => resolve(), TestMode.DOWNSTREAM);
      });
    }

    // 使用封装后的函数来执行路段1的测试
    await executeSegmentTest(1, steps, vehiclePlate, 'COMPLETED', TestMode.DOWNSTREAM);

    // 任务完成
    updateStepStatus(steps, 'task_completion', 'completed');
    addLog(`车辆离开路段1，下行测试完成: ${vehiclePlate}`, 'success');

  } catch (error) {
    // 错误处理
    if(error instanceof Error) {
      updateStepStatus(steps, 'task_completion', 'completed');
      addLog(`下行测试失败: ${error.message}`, 'error');
      console.error(error);
    }
    throw error;
  }
}
// async function executeUpstreamTest(signalIds: string[], steps: Step[], vehiclePlate: string) {
//   //if (!currentTask.value) return;
//   //const steps = currentTask.value.steps;
//
//   try {
//     // 步骤1: 检查起点信号机状态
//     if (!isSignalAllowingUpstream(signalIds[0])) {
//       updateStepStatus(steps, 'start', 'waiting');
//       addLog('起点信号机不允许上行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[0], () => resolve(), TestMode.UPSTREAM);
//       });
//     }
//     updateStepStatus(steps, 'start', 'completed');
//     addLog('起点信号机允许上行，开始测试', 'success');
//
//     // 步骤2: 车辆进入路段1
//     updateStepStatus(steps, 'segment1_enter', 'active');
//     const enter1Response = await VehicleTestApiService.vehicleEnterUpstream(1, vehiclePlate);
//     updateStepStatus(steps, 'segment1_enter', 'completed');
//     currentLocation.value = 'SEGMENT_1';
//     addLog(`车辆成功进入路段1: ${enter1Response.message}`, 'success');
//     await delay(10000); // 停留10秒
//
//     // 步骤3: 车辆离开路段1
//     updateStepStatus(steps, 'segment1_exit', 'active');
//     const exit1Response = await VehicleTestApiService.vehicleExitUpstream(1, vehiclePlate);
//     updateStepStatus(steps, 'segment1_exit', 'completed');
//     currentLocation.value = 'WAITING_2';
//     updateStepStatus(steps, 'waiting2', 'completed');
//     addLog(`车辆离开路段1，进入等待区2: ${exit1Response.message}`, 'success');
//
//     // 步骤4: 检查信号机2并进入路段2
//     updateStepStatus(steps, 'segment2_enter', 'active');
//     if (!isSignalAllowingUpstream(signalIds[1])) { // 检查信号机2
//       updateStepStatus(steps, 'segment2_enter', 'waiting');
//       addLog('信号机2不允许上行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[1], () => resolve(), TestMode.UPSTREAM);
//       });
//     }
//     const enter2Response = await VehicleTestApiService.vehicleEnterUpstream(2, vehiclePlate);
//     updateStepStatus(steps, 'segment2_enter', 'completed');
//     currentLocation.value = 'SEGMENT_2';
//     addLog(`车辆成功进入路段2: ${enter2Response.message}`, 'success');
//     await delay(10000);
//
//     // 步骤5: 车辆离开路段2
//     updateStepStatus(steps, 'segment2_exit', 'active');
//     const exit2Response = await VehicleTestApiService.vehicleExitUpstream(2, vehiclePlate);
//     updateStepStatus(steps, 'segment2_exit', 'completed');
//     currentLocation.value = 'WAITING_3';
//     updateStepStatus(steps, 'waiting3', 'completed');
//     addLog(`车辆离开路段2，进入等待区3: ${exit2Response.message}`, 'success');
//
//     // 步骤6: 检查信号机3并进入路段3
//     updateStepStatus(steps, 'segment3_enter', 'active');
//     if (!isSignalAllowingUpstream(signalIds[2])) { // 检查信号机3
//       updateStepStatus(steps, 'segment3_enter', 'waiting');
//       addLog('信号机3不允许上行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[2], () => resolve(), TestMode.UPSTREAM);
//       });
//     }
//     const enter3Response = await VehicleTestApiService.vehicleEnterUpstream(3, vehiclePlate);
//     updateStepStatus(steps, 'segment3_enter', 'completed');
//     currentLocation.value = 'SEGMENT_3';
//     addLog(`车辆成功进入路段3: ${enter3Response.message}`, 'success');
//     await delay(10000);
//
//     // 步骤7: 车辆离开路段3
//     updateStepStatus(steps, 'segment3_exit', 'active');
//     const exit3Response = await VehicleTestApiService.vehicleExitUpstream(3, vehiclePlate);
//     updateStepStatus(steps, 'segment3_exit', 'completed');
//     currentLocation.value = 'WAITING_4';
//     updateStepStatus(steps, 'waiting4', 'completed');
//     addLog(`车辆离开路段3，进入等待区4: ${exit3Response.message}`, 'success');
//
//     // 步骤8: 检查信号机4并进入路段4
//     updateStepStatus(steps, 'segment4_enter', 'active');
//     if (!isSignalAllowingUpstream(signalIds[3])) { // 检查信号机4
//       updateStepStatus(steps, 'segment4_enter', 'waiting');
//       addLog('信号机4不允许上行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[3], () => resolve(), TestMode.UPSTREAM);
//       });
//     }
//     const enter4Response = await VehicleTestApiService.vehicleEnterUpstream(4, vehiclePlate);
//     updateStepStatus(steps, 'segment4_enter', 'completed');
//     currentLocation.value = 'SEGMENT_4';
//     addLog(`车辆成功进入路段4: ${enter4Response.message}`, 'success');
//     await delay(10000);
//
//     // 步骤9: 车辆离开路段4，测试结束
//     updateStepStatus(steps, 'segment4_exit', 'active');
//     const exit4Response = await VehicleTestApiService.vehicleExitUpstream(4, vehiclePlate);
//     updateStepStatus(steps, 'segment4_exit', 'completed');
//     currentLocation.value = 'NONE';
//     addLog(`车辆离开路段4，上行测试完成: ${exit4Response.message}`, 'success');
//
//   } catch (error) {
//     testState.value = 'error';
//     if (error instanceof Error) {
//       addLog(`上行测试失败: ${error.message}`, 'error');
//     }
//     throw error; // 抛出错误以停止任务队列
//   }
// }

/**
 * 封装下行测试的核心逻辑
 */
// async function executeDownstreamTest(signalIds: string[], steps: Step[], vehiclePlate: string) {
//   //if (!currentTask.value) return;
//   //const steps = currentTask.value.steps;
//
//   try {
//     // 步骤1: 检查终点信号机状态
//     if (!isSignalAllowingDownstream(signalIds[4])) {
//       updateStepStatus(steps, 'start', 'waiting');
//       addLog('终点信号机不允许下行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[4], () => resolve(), TestMode.DOWNSTREAM);
//       });
//     }
//     updateStepStatus(steps, 'start', 'completed');
//     addLog('终点信号机允许下行，开始测试', 'success');
//
//     // 步骤2: 车辆进入路段4
//     updateStepStatus(steps, 'segment4_enter', 'active');
//     const enter4Response = await VehicleTestApiService.vehicleEnterDownstream(4, vehiclePlate);
//     updateStepStatus(steps, 'segment4_enter', 'completed');
//     currentLocation.value = 'SEGMENT_4';
//     addLog(`车辆成功进入路段4（下行）: ${enter4Response.message}`, 'success');
//     await delay(10000);
//
//     // 步骤3: 车辆离开路段4
//     updateStepStatus(steps, 'segment4_exit', 'active');
//     const exit4Response = await VehicleTestApiService.vehicleExitDownstream(4, vehiclePlate);
//     updateStepStatus(steps, 'segment4_exit', 'completed');
//     currentLocation.value = 'WAITING_3';
//     updateStepStatus(steps, 'waiting3', 'completed');
//     addLog(`车辆离开路段4，进入等待区3: ${exit4Response.message}`, 'success');
//
//     // 步骤4: 检查信号机3并进入路段3
//     updateStepStatus(steps, 'segment3_enter', 'active');
//     if (!isSignalAllowingDownstream(signalIds[3])) { // 检查信号机3
//       updateStepStatus(steps, 'segment3_enter', 'waiting');
//       addLog('信号机3不允许下行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[3], () => resolve(), TestMode.DOWNSTREAM);
//       });
//     }
//     const enter3Response = await VehicleTestApiService.vehicleEnterDownstream(3, vehiclePlate);
//     updateStepStatus(steps, 'segment3_enter', 'completed');
//     currentLocation.value = 'SEGMENT_3';
//     addLog(`车辆成功进入路段3（下行）: ${enter3Response.message}`, 'success');
//     await delay(10000);
//
//     // 步骤5: 车辆离开路段3
//     updateStepStatus(steps, 'segment3_exit', 'active');
//     const exit3Response = await VehicleTestApiService.vehicleExitDownstream(3, vehiclePlate);
//     updateStepStatus(steps, 'segment3_exit', 'completed');
//     currentLocation.value = 'WAITING_2';
//     updateStepStatus(steps, 'waiting2', 'completed');
//     addLog(`车辆离开路段3，进入等待区2: ${exit3Response.message}`, 'success');
//
//     // 步骤6: 检查信号机2并进入路段2
//     updateStepStatus(steps, 'segment2_enter', 'active');
//     if (!isSignalAllowingDownstream(signalIds[2])) { // 检查信号机2
//       updateStepStatus(steps, 'segment2_enter', 'waiting');
//       addLog('信号机2不允许下行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[2], () => resolve(), TestMode.DOWNSTREAM);
//       });
//     }
//     const enter2Response = await VehicleTestApiService.vehicleEnterDownstream(2, vehiclePlate);
//     updateStepStatus(steps, 'segment2_enter', 'completed');
//     currentLocation.value = 'SEGMENT_2';
//     addLog(`车辆成功进入路段2（下行）: ${enter2Response.message}`, 'success');
//     await delay(10000);
//
//     // 步骤7: 车辆离开路段2
//     updateStepStatus(steps, 'segment2_exit', 'active');
//     const exit2Response = await VehicleTestApiService.vehicleExitDownstream(2, vehiclePlate);
//     updateStepStatus(steps, 'segment2_exit', 'completed');
//     currentLocation.value = 'WAITING_1';
//     updateStepStatus(steps, 'waiting1', 'completed');
//     addLog(`车辆离开路段2，进入等待区1: ${exit2Response.message}`, 'success');
//
//     // 步骤8: 检查信号机1并进入路段1
//     updateStepStatus(steps, 'segment1_enter', 'active');
//     if (!isSignalAllowingDownstream(signalIds[1])) { // 检查信号机1
//       updateStepStatus(steps, 'segment1_enter', 'waiting');
//       addLog('信号机1不允许下行，等待信号变化...', 'warning');
//       await new Promise<void>((resolve) => {
//         watchSignalChange(signalIds[1], () => resolve(), TestMode.DOWNSTREAM);
//       });
//     }
//     const enter1Response = await VehicleTestApiService.vehicleEnterDownstream(1, vehiclePlate);
//     updateStepStatus(steps, 'segment1_enter', 'completed');
//     currentLocation.value = 'SEGMENT_1';
//     addLog(`车辆成功进入路段1（下行）: ${enter1Response.message}`, 'success');
//     await delay(10000);
//
//     // 步骤9: 车辆离开路段1，测试结束
//     updateStepStatus(steps, 'segment1_exit', 'active');
//     const exit1Response = await VehicleTestApiService.vehicleExitDownstream(1, vehiclePlate);
//     updateStepStatus(steps, 'segment1_exit', 'completed');
//     currentLocation.value = 'NONE';
//     addLog(`车辆离开路段1，下行测试完成: ${exit1Response.message}`, 'success');
//
//   } catch (error) {
//     testState.value = 'error';
//     if (error instanceof Error) {
//       addLog(`下行测试失败: ${error.message}`, 'error');
//     }
//     throw error; // 抛出错误以停止任务队列
//   }
// }

// 辅助函数: 延迟
function delay(ms: number) {
  return new Promise(resolve => TimerManager.set(resolve, ms))
}

// ======== 启动函数 ========
/**
 * 启动单一上行测试
 */
function startUpstreamTest() {
  const vehiclePlate = generateTestLicensePlate();
  addLog(`上行测试启动，车辆: ${vehiclePlate}`, 'info');

  const upstreamTask: TestTask = {
    id: `upstream-${Date.now()}`,
    mode: TestMode.UPSTREAM,
    name: '上行测试',
    state: TaskState.PENDING,
    vehiclePlate: vehiclePlate, // 设置上行车辆牌照
    steps: JSON.parse(JSON.stringify(UPSTREAM_STEPS)),
    run: () => executeUpstreamTest(props.initialSignalIds, upstreamTask.steps, upstreamTask.vehiclePlate),
  };
  testQueue.value = [upstreamTask];
  runTestQueue();
}
/**
 * 启动单一下行测试
 */
function startDownstreamTest() {
  const vehiclePlate = generateTestLicensePlate();
  addLog(`下行测试启动，车辆: ${vehiclePlate}`, 'info');

  const downstreamTask: TestTask = {
    id: `downstream-${Date.now()}`,
    mode: TestMode.DOWNSTREAM,
    name: '下行测试',
    state: TaskState.PENDING,
    vehiclePlate: vehiclePlate, // 设置下行车辆牌照
    steps: JSON.parse(JSON.stringify(DOWNSTREAM_STEPS)),
    run: () => executeDownstreamTest(props.initialSignalIds, downstreamTask.steps, downstreamTask.vehiclePlate),
  };
  testQueue.value = [downstreamTask];
  runTestQueue();
}

/**
 * 启动联合测试 (占位符，待实现)
 */
/**
 * 启动联合测试
 */
function startCombinedTest() {
  const upstreamVehiclePlate = generateTestLicensePlate();
  const downstreamVehiclePlate = generateTestLicensePlate();

  addLog(`联合测试启动，上行车辆: ${upstreamVehiclePlate}，下行车辆: ${downstreamVehiclePlate}`, 'info');

  const upstreamTask: TestTask = {
    id: `upstream-${Date.now()}`,
    mode: TestMode.UPSTREAM,
    name: '上行测试',
    state: TaskState.PENDING,
    vehiclePlate: upstreamVehiclePlate, // 这里设置上行车辆牌照
    steps: JSON.parse(JSON.stringify(UPSTREAM_STEPS)),
    run: () => executeUpstreamTest(props.initialSignalIds, upstreamTask.steps, upstreamTask.vehiclePlate),
  };

  const downstreamTask: TestTask = {
    id: `downstream-${Date.now()}`,
    mode: TestMode.DOWNSTREAM,
    name: '下行测试',
    state: TaskState.PENDING,
    vehiclePlate: downstreamVehiclePlate, // 这里设置下行车辆牌照
    steps: JSON.parse(JSON.stringify(DOWNSTREAM_STEPS)),
    run: () => executeDownstreamTest(props.initialSignalIds, downstreamTask.steps, downstreamTask.vehiclePlate),
  };

  testQueue.value = [upstreamTask, downstreamTask];
  runTestQueue();
}

// ======== 生命周期钩子 ========
onMounted(async () => {
  // 启动后台持续检查
  ApiHealthChecker.startHealthCheck(30000)

  // 订阅健康状态变化，并将取消订阅函数保存起来
  unsubscribeHealthCheck.value = ApiHealthChecker.onHealthChange((healthy) => {
    isApiHealthy.value = healthy
    addLog(`API健康状态变化: ${healthy ? '健康' : '异常'}`, healthy ? 'success' : 'error')
  })

  // 立即执行一次健康检查
  await checkApiHealth()
})

onUnmounted(() => {
  // 停止健康检查
  ApiHealthChecker.stopHealthCheck()

  // 取消订阅
  if (unsubscribeHealthCheck.value) { // 注意：这里需要加上 .value
    unsubscribeHealthCheck.value()
  }

  // 清理定时器
  // 在你的代码中，watchSignalChange 函数使用了 setInterval
  // 所以在组件销毁时，需要确保这些定时器被清理
  // 你可以遍历 signalWatchers map 来停止所有监听器
  signalWatchers.value.forEach(stopFunction => stopFunction());
  signalWatchers.value.clear();

  // 如果你还有其他任何手动创建的定时器，也需要在这里清理
  TimerManager.clearAll(); // 新增这行
})

watch(() => testState.value, (newVal) => {
  if (newVal === 'completed' || newVal === 'error') {
    isTestRunning.value = false
  } else if (newVal === 'running') {
    isTestRunning.value = true
  }
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

.test-queue-panel {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.test-queue-panel ul {
  list-style-type: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px dashed #ccc;
}

.task-item:last-child {
  border-bottom: none;
}

.task-status {
  font-weight: bold;
}

.task-running {
  color: #3498db;
}

.task-completed {
  color: #2ecc71;
}

.task-failed {
  color: #e74c3c;
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
