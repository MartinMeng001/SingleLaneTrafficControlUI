<template>
  <div class="help-view">
    <div class="help-header">
      <h1 class="help-title">系统帮助</h1>
      <div class="version-badge">
        v{{ systemVersion }}
      </div>
    </div>

    <div class="help-content">
      <section class="help-section">
        <h2 class="section-title">🚦 系统概述</h2>
        <div class="section-content">
          <p>感应式单车道动态让行系统是一个智能交通控制系统，基于实时车辆检测数据，动态调整单车道路段的通行策略，确保车辆安全高效地通过单车道区间。</p>
          <p>系统采用先进的车辆感应技术，结合智能算法，能够自动识别车辆进入和离开路段的状态，并根据交通流量情况动态调整信号灯控制策略。</p>
        </div>
      </section>

      <section class="help-section">
        <h2 class="section-title">⚙️ 主要功能</h2>
        <div class="section-content">
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>实时监控</h3>
              <p>实时显示各路段的车辆状态、信号灯状态和会车区状态</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🤖</div>
              <h3>智能控制</h3>
              <p>基于车辆检测数据自动调整信号灯控制策略</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">⚠️</div>
              <h3>冲突检测</h3>
              <p>自动检测和预警可能的交通冲突情况</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">📝</div>
              <h3>日志记录</h3>
              <p>详细记录所有交通事件和系统操作</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">📈</div>
              <h3>状态统计</h3>
              <p>提供交通流量、等待时间等统计信息</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3>系统管理</h3>
              <p>支持系统配置、日志导出等管理功能</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2 class="section-title">🚗 状态说明</h2>
        <div class="section-content">
          <div class="status-table">
            <div class="status-row">
              <div class="status-type">路段状态</div>
              <div class="status-list">
                <div class="status-item">
                  <span class="status-badge status-empty">清空</span>
                  <span class="status-desc">路段内无车辆</span>
                </div>
                <div class="status-item">
                  <span class="status-badge status-normal">正常</span>
                  <span class="status-desc">路段有车但无冲突</span>
                </div>
                <div class="status-item">
                  <span class="status-badge status-warning">警告</span>
                  <span class="status-desc">路段车辆接近容量上限</span>
                </div>
                <div class="status-item">
                  <span class="status-badge status-conflict">冲突</span>
                  <span class="status-desc">检测到潜在的交通冲突</span>
                </div>
              </div>
            </div>

            <div class="status-row">
              <div class="status-type">会车区状态</div>
              <div class="status-list">
                <div class="status-item">
                  <span class="status-badge zone-empty">空闲</span>
                  <span class="status-desc">会车区内无车辆</span>
                </div>
                <div class="status-item">
                  <span class="status-badge zone-occupied">有车</span>
                  <span class="status-desc">会车区内有车辆但未满载</span>
                </div>
                <div class="status-item">
                  <span class="status-badge zone-full">满载</span>
                  <span class="status-desc">会车区已达到容量上限</span>
                </div>
              </div>
            </div>

            <div class="status-row">
              <div class="status-type">信号灯状态</div>
              <div class="status-list">
                <div class="status-item">
                  <span class="status-badge light-red">红灯</span>
                  <span class="status-desc">禁止通行</span>
                </div>
                <div class="status-item">
                  <span class="status-badge light-green">绿灯</span>
                  <span class="status-desc">允许通行</span>
                </div>
                <div class="status-item">
                  <span class="status-badge light-yellow">黄灯</span>
                  <span class="status-desc">准备停车</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2 class="section-title">📖 操作说明</h2>
        <div class="section-content">
          <div class="operation-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>状态监控</h3>
                <p>在状态监控页面可以查看实时交通状态，包括路段状态、信号灯状态和会车区状态。系统每3秒自动更新数据。</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>日志查看</h3>
                <p>在系统日志页面可以查看历史事件记录，支持按类型、级别和时间过滤，也可以按关键词搜索特定事件。</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>数据导出</h3>
                <p>在日志页面点击"导出日志"按钮可以导出当前筛选条件下的日志数据为JSON格式文件。</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>页面切换</h3>
                <p>点击顶部导航栏的标签可以在不同功能页面间切换，系统会自动保存当前的设置状态。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2 class="section-title">🔍 故障排除</h2>
        <div class="section-content">
          <div class="faq-list">
            <div class="faq-item">
              <h3>Q: 系统显示"连接断开"怎么办？</h3>
              <p>A: 请检查网络连接和后台服务状态，确保传感器设备正常工作。如问题持续存在，请联系技术支持。</p>
            </div>

            <div class="faq-item">
              <h3>Q: 路段一直显示冲突状态？</h3>
              <p>A: 这可能是传感器故障或车辆滞留导致的。请检查现场情况并重启相关传感器设备。</p>
            </div>

            <div class="faq-item">
              <h3>Q: 日志页面加载很慢？</h3>
              <p>A: 建议缩小时间范围或使用更具体的筛选条件来减少数据量。系统会自动限制显示的日志条数。</p>
            </div>

            <div class="faq-item">
              <h3>Q: 如何理解检测器错误？</h3>
              <p>A: 检测器错误包括无源注册、状态逆行、无效转义、重复存在和僵尸车辆等，通常表示传感器数据异常或设备故障。</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="version-info">
      <h2 class="version-title">版本信息</h2>
      <div class="version-details">
        <div class="version-item">
          <span class="version-label">产品名称:</span>
          <span class="version-value">感应式单车道动态让行系统</span>
        </div>
        <div class="version-item">
          <span class="version-label">版本号:</span>
          <span class="version-value">v{{ systemVersion }}</span>
        </div>
        <div class="version-item">
          <span class="version-label">构建日期:</span>
          <span class="version-value">{{ buildDate }}</span>
        </div>
        <div class="version-item">
          <span class="version-label">技术栈:</span>
          <span class="version-value">Vue 3 + Vite + TypeScript + Pinia</span>
        </div>
        <div class="version-item">
          <span class="version-label">开发团队:</span>
          <span class="version-value">智能交通系统开发组</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const systemVersion = '1.0.0'
const buildDate = computed(() => new Date().toLocaleDateString('zh-CN'))
</script>

<style scoped>
.help-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  line-height: 1.6;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #667eea;
}

.help-title {
  color: #667eea;
  margin: 0;
  font-size: 2rem;
}

.version-badge {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.help-content {
  max-width: none;
}

.help-section {
  margin-bottom: 3rem;
}

.section-title {
  color: #667eea;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-content {
  color: #343a40;
}

.section-content p {
  margin-bottom: 1rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.feature-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #667eea;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.feature-card p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.status-table {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.status-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 2rem;
  align-items: start;
}

.status-type {
  font-weight: bold;
  color: #667eea;
  font-size: 1.1rem;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.status-empty { background: #d1ecf1; color: #0c5460; }
.status-normal { background: #d4edda; color: #155724; }
.status-warning { background: #fff3cd; color: #856404; }
.status-conflict { background: #f8d7da; color: #721c24; }

.zone-empty { background: #e8f5e8; color: #2e7d32; }
.zone-occupied { background: #fff3e0; color: #ef6c00; }
.zone-full { background: #ffebee; color: #c62828; }

.light-red { background: #ffebee; color: #c62828; }
.light-green { background: #e8f5e8; color: #2e7d32; }
.light-yellow { background: #fff8e1; color: #f57c00; }

.status-desc {
  color: #666;
  font-size: 0.9rem;
}

.operation-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  background: #667eea;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h3 {
  color: #667eea;
  margin: 0 0 0.5rem 0;
}

.step-content p {
  margin: 0;
  color: #666;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.faq-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.faq-item h3 {
  color: #667eea;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.faq-item p {
  margin: 0;
  color: #666;
}

.version-info {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 2rem;
}

.version-title {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.version-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.version-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.version-label {
  font-weight: 600;
  opacity: 0.9;
}

.version-value {
  font-weight: 500;
}

@media (max-width: 768px) {
  .help-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .status-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .status-type {
    text-align: center;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .version-details {
    grid-template-columns: 1fr;
  }

  .version-item {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
