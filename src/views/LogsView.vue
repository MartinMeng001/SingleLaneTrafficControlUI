<template>
  <div class="logs-view">
    <div class="view-header">
      <h1 class="view-title">系统日志</h1>
      <div class="header-actions">
        <div class="log-stats">
          <span class="stat-item">
            总计: <strong>{{ logsStore.logStats.total }}</strong>
          </span>
          <span class="stat-item error">
            错误: <strong>{{ logsStore.logStats.errors }}</strong>
          </span>
          <span class="stat-item warning">
            警告: <strong>{{ logsStore.logStats.warnings }}</strong>
          </span>
        </div>
        <button @click="logsStore.exportLogs" class="export-btn">
          📥 导出日志
        </button>
      </div>
    </div>

    <LogFilter
      :filter="logsStore.filter"
      @update="logsStore.updateFilter"
    />

    <LogList
      :logs="logsStore.filteredLogs"
      :loading="isLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLogsStore } from '@/stores/logs'
import LogFilter from '@/components/logs/LogFilter.vue'
import LogList from '@/components/logs/LogList.vue'

const logsStore = useLogsStore()
const isLoading = ref(false)

// 模拟加载日志数据
const loadLogs = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  isLoading.value = false
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.logs-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-title {
  color: #667eea;
  margin: 0;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.log-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.stat-item {
  color: #666;
}

.stat-item.error {
  color: #dc3545;
}

.stat-item.warning {
  color: #ffc107;
}

.export-btn {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.export-btn:hover {
  background: #218838;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .log-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
