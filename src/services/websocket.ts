// src/services/websocket.ts
import { ref } from 'vue'
import type { WebSocketMessage} from '@/types/websocket.ts'

// export interface WebSocketMessage {
//   messageType: string
//   timestamp: string
//   data: unknown
// }

export interface WebSocketService {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  lastUpdateTime: Date
  connect(): void
  disconnect(): void
  subscribe(callback: (message: WebSocketMessage) => void): () => void
  unsubscribe(callback: (message: WebSocketMessage) => void): void
}

type TimeoutHandle = ReturnType<typeof setTimeout>;
class WebSocketManager {

  private ws: WebSocket | null = null
  private reconnectTimer: TimeoutHandle | null = null
  private subscribers: Set<(message: WebSocketMessage) => void> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 5000

  public isConnected = ref(false)
  public lastMessage = ref<WebSocketMessage | null>(null)
  public lastUpdateTime = ref(new Date())

  constructor(private url: string) {}

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('WebSocket连接已建立')
        this.isConnected.value = true
        this.reconnectAttempts = 0
        this.lastUpdateTime.value = new Date()

        // 清除重连定时器
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.lastMessage.value = message
          this.lastUpdateTime.value = new Date()

          // 通知所有订阅者
          this.subscribers.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('消息处理回调错误:', error)
            }
          })
        } catch (error) {
          console.error('WebSocket消息解析错误:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket连接已关闭', event.code, event.reason)
        this.isConnected.value = false

        // 如果不是主动关闭，则尝试重连
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error)
        this.isConnected.value = false
      }

    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.scheduleReconnect()
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.isConnected.value = false
  }

  subscribe(callback: (message: WebSocketMessage) => void): () => void {
    this.subscribers.add(callback)

    // 返回取消订阅函数
    return () => {
      this.subscribers.delete(callback)
    }
  }

  unsubscribe(callback: (message: WebSocketMessage) => void) {
    this.subscribers.delete(callback)
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)

    console.log(`WebSocket将在${delay / 1000}秒后尝试第${this.reconnectAttempts}次重连`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  // 手动重置重连计数
  resetReconnectAttempts() {
    this.reconnectAttempts = 0
  }

  // 获取连接状态信息
  getStatus() {
    return {
      isConnected: this.isConnected.value,
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts,
      lastUpdateTime: this.lastUpdateTime.value,
      subscriberCount: this.subscribers.size
    }
  }
}

// 创建全局WebSocket实例
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/traffic'
const wsManager = new WebSocketManager(wsUrl)

// 导出服务接口
export const useWebSocket = () => {
  return {
    isConnected: wsManager.isConnected,
    lastMessage: wsManager.lastMessage,
    lastUpdateTime: wsManager.lastUpdateTime,

    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    subscribe: (callback: (message: WebSocketMessage) => void) => wsManager.subscribe(callback),
    unsubscribe: (callback: (message: WebSocketMessage) => void) => wsManager.unsubscribe(callback),
    resetReconnectAttempts: () => wsManager.resetReconnectAttempts(),
    getStatus: () => wsManager.getStatus()
  }
}

// 自动连接（可选）
export const initWebSocket = () => {
  wsManager.connect()
}

// 在页面卸载时断开连接
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    wsManager.disconnect()
  })
}
