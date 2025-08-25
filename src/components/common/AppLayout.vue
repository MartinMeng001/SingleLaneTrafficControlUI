<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <div class="content-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
</script>

<style scoped>
/*
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}*/
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;  /* 内容区域独立滚动 */
}
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.content-container {
  width: 100%;
  max-width: 1200px;
  overflow-y: auto;      /* 滚动条在这里，会靠边显示 */
  padding: 2rem;         /* 内容间距 */
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
  transition: background var(--animation-duration-base);
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
/* 6. 可选：添加顶部阴影指示滚动状态 */
.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: linear-gradient(to bottom,
  rgba(0,0,0,0.1) 0%,
  transparent 100%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.main-content.scrolled::before {
  opacity: 1;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
