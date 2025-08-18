<!-- src/components/realtime/TrafficSignal.vue -->
<template>
  <div class="traffic-signal" :class="signalClasses">
    <div class="signal-label">{{ signalLabel }}</div>
    <div class="signal-content">
      <!-- 信号灯主体 -->
      <div class="signal-light" :class="lightClasses">
        <!-- 状态图标 -->
        <div class="status-icon">{{ statusIcon }}</div>
      </div>

      <!-- 状态描述 -->
      <div class="status-description">{{ statusDescription }}</div>

      <!-- 相位信息 -->
      <div class="phase-info" v-if="phase !== null">
        <span class="phase-label">相位:</span>
        <span class="phase-value">{{ phase }}</span>
      </div>
    </div>

    <!-- 状态历史指示器 -->
    <div class="status-history" v-if="showHistory">
      <div
        v-for="(historyItem, index) in statusHistory.slice(-3)"
        :key="index"
        class="history-dot"
        :class="getHistoryDotClass(historyItem.status)"
        :title="formatHistoryTime(historyItem.timestamp)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'

interface Props {
  signalId: string
  status: 'UPSTREAM' | 'DOWNSTREAM' | 'ALL_RED' | 'YELLOW_FLASH'
  statusDescription?: string
  phase?: number | null
  showHistory?: boolean
  size?: 'small' | 'medium' | 'large'
}

interface StatusHistoryItem {
  status: string
  timestamp: Date
}

const props = withDefaults(defineProps<Props>(), {
  statusDescription: '',
  phase: null,
  showHistory: false,
  size: 'medium'
})

const statusHistory = ref<StatusHistoryItem[]>([])

// 计算信号灯标签
const signalLabel = computed(() => {
  const signalNames: Record<string, string> = {
    '37': '起点信号机',
    '38': '信号机2',
    '41': '信号机3',
    '42': '信号机4',
    '43': '终点信号机'
  }
  return signalNames[props.signalId] || props.signalId
})

// 计算整体样式类
const signalClasses = computed(() => {
  const classes = [`signal-${props.size}`]

  if (props.status === 'YELLOW_FLASH') {
    classes.push('blinking')
  }

  return classes
})

// 计算信号灯样式类
const lightClasses = computed(() => {
  const baseClass = 'signal-base'

  switch (props.status) {
    case 'UPSTREAM':
      return `${baseClass} status-upstream`
    case 'DOWNSTREAM':
      return `${baseClass} status-downstream`
    case 'ALL_RED':
      return `${baseClass} status-all-red`
    case 'YELLOW_FLASH':
      return `${baseClass} status-yellow-flash`
    default:
      return `${baseClass} status-unknown`
  }
})

// 计算状态图标
const statusIcon = computed(() => {
  switch (props.status) {
    case 'UPSTREAM':
      return '↑'
    case 'DOWNSTREAM':
      return '↓'
    case 'ALL_RED':
      return '●'
    case 'YELLOW_FLASH':
      return '⚠'
    default:
      return '?'
  }
})

// 计算状态描述
const statusDescription = computed(() => {
  if (props.statusDescription) {
    return props.statusDescription
  }

  const descriptions: Record<string, string> = {
    'UPSTREAM': '上行',
    'DOWNSTREAM': '下行',
    'ALL_RED': '全红',
    'YELLOW_FLASH': '黄闪'
  }

  return descriptions[props.status] || '未知状态'
})

// 监听状态变化，记录历史
watch(() => props.status, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus && oldStatus !== undefined) {
    statusHistory.value.push({
      status: newStatus,
      timestamp: new Date()
    })

    // 限制历史记录数量
    if (statusHistory.value.length > 10) {
      statusHistory.value = statusHistory.value.slice(-10)
    }
  }
})

// 获取历史点样式
const getHistoryDotClass = (status: string) => {
  switch (status) {
    case 'UPSTREAM':
      return 'history-upstream'
    case 'DOWNSTREAM':
      return 'history-downstream'
    case 'ALL_RED':
      return 'history-red'
    case 'YELLOW_FLASH':
      return 'history-yellow'
    default:
      return 'history-unknown'
  }
}

// 格式化历史时间
const formatHistoryTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.traffic-signal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  transition: all 0.3s ease;
}

.traffic-signal:hover {
  transform: translateY(-2px);
}

.signal-label {
  font-size: 11px;
  color: #666;
  font-weight: bold;
  white-space: nowrap;
  text-align: center;
  margin-bottom: 4px;
}

.signal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.signal-light {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  border: 3px solid #333;
  flex-shrink: 0;
}

/* 尺寸变体 */
.signal-small .signal-light {
  width: 50px;
  height: 50px;
  font-size: 16px;
}

.signal-medium .signal-light {
  width: 70px;
  height: 70px;
  font-size: 20px;
}

.signal-large .signal-light {
  width: 90px;
  height: 90px;
  font-size: 24px;
}

/* 状态颜色 */
.signal-base {
  background-color: #555;
}

.status-upstream {
  background-color: #28a745;
  border-color: #1e7e34;
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.5);
}

.status-downstream {
  background-color: #28a745;
  border-color: #1e7e34;
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.5);
}

.status-all-red {
  background-color: #dc3545;
  border-color: #bd2130;
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.5);
}

.status-yellow-flash {
  background-color: #ffc107;
  border-color: #e0a800;
  color: #333;
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
}

.status-unknown {
  background-color: #6c757d;
  border-color: #545b62;
}

/* 黄闪动画 */
.signal-yellow-flash.blinking .signal-light {
  animation: blink-yellow 1s infinite;
}

@keyframes blink-yellow {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.4; }
}

.status-icon {
  font-size: inherit;
  line-height: 1;
}

.status-description {
  font-size: 10px;
  color: #495057;
  font-weight: 600;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.phase-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: #6c757d;
}

.phase-label {
  font-weight: 500;
}

.phase-value {
  font-weight: bold;
  background-color: rgba(0, 123, 255, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  color: #007bff;
}

.status-history {
  display: flex;
  gap: 3px;
  margin-top: 4px;
}

.history-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.history-dot:hover {
  opacity: 1;
  transform: scale(1.5);
}

.history-upstream {
  background-color: #28a745;
}

.history-downstream {
  background-color: #28a745;
}

.history-red {
  background-color: #dc3545;
}

.history-yellow {
  background-color: #ffc107;
}

.history-unknown {
  background-color: #6c757d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .signal-small .signal-light {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }

  .signal-medium .signal-light {
    width: 60px;
    height: 60px;
    font-size: 18px;
  }

  .signal-large .signal-light {
    width: 80px;
    height: 80px;
    font-size: 22px;
  }

  .signal-label {
    font-size: 10px;
  }

  .status-description {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .signal-small .signal-light {
    width: 35px;
    height: 35px;
    font-size: 12px;
  }

  .signal-medium .signal-light {
    width: 50px;
    height: 50px;
    font-size: 16px;
  }

  .signal-large .signal-light {
    width: 70px;
    height: 70px;
    font-size: 20px;
  }

  .signal-label {
    font-size: 9px;
  }

  .status-description {
    font-size: 8px;
    padding: 1px 4px;
  }

  .phase-info {
    font-size: 8px;
  }
}
</style>
