<!-- frontend/src/components/MetricsStorage.vue -->
<template>
  <el-card class="config-card config-page" shadow="hover">
    <template #header>
      <h3>数据持久化</h3>
    </template>

    <el-form :model="localConfig" label-width="180px">
      <el-form-item label="启用数据持久化">
        <el-switch v-model="localConfig.enabled" />
        <el-text type="info" size="small" class="hint">
          启用后，系统将定期将指标数据保存到数据库，可用于查看历史数据
        </el-text>
      </el-form-item>

      <el-form-item v-if="localConfig.enabled" label="数据库文件路径">
        <el-input 
          v-model="localConfig.db_path" 
          placeholder="留空使用默认路径：程序目录/data/metrics.db"
          style="max-width: 500px;"
        />
        <el-text type="info" size="small" class="hint">
          留空则使用默认路径。支持绝对路径或相对路径
        </el-text>
      </el-form-item>

      <!-- 数据库状态显示 -->
      <el-card v-if="localConfig.enabled" class="status-card" shadow="never">
        <template #header>
          <span>数据库状态</span>
        </template>
        <div v-if="dbStatus" class="status-content">
          <el-alert
            v-if="dbStatus.initialized && dbStatus.file_exists"
            title="数据库已就绪"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="status-detail">
                <p><strong>数据库路径：</strong>{{ dbStatus.path }}</p>
                <p><strong>文件状态：</strong>已创建</p>
                <p v-if="dbStatus.db_file_size_bytes != null"><strong>文件大小：</strong>{{ formatBytes(dbStatus.db_file_size_bytes) }}</p>
                <p v-if="dbStatus.request_logs_count != null"><strong>记录行数：</strong>{{ formatNumber(dbStatus.request_logs_count) }}</p>
                <p v-if="dbStatus.request_logs_min_ts != null"><strong>最早记录：</strong>{{ formatTs(dbStatus.request_logs_min_ts) }}</p>
                <p v-if="dbStatus.request_logs_max_ts != null"><strong>最新记录：</strong>{{ formatTs(dbStatus.request_logs_max_ts) }}</p>
              </div>
            </template>
          </el-alert>
          
          <el-alert
            v-else-if="dbStatus.initialized && !dbStatus.file_exists && dbStatus.dir_exists && dbStatus.dir_writable"
            title="数据库就绪（等待首次写入）"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="status-detail">
                <p><strong>数据库路径：</strong>{{ dbStatus.path }}</p>
                <p><strong>目录状态：</strong>目录存在且可写</p>
                <p v-if="dbStatus.message" class="info-hint">{{ dbStatus.message }}</p>
              </div>
            </template>
          </el-alert>
          
          <el-alert
            v-else-if="dbStatus.error"
            :title="dbStatus.initialized ? '数据库配置异常' : '数据库初始化失败'"
            type="error"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="status-detail">
                <p v-if="dbStatus.path"><strong>数据库路径：</strong>{{ dbStatus.path }}</p>
                <p v-if="dbStatus.error"><strong>错误信息：</strong>{{ dbStatus.error }}</p>
                <p v-if="!dbStatus.dir_exists" class="error-hint">
                  目录不存在，请检查路径是否正确，或手动创建目录
                </p>
                <p v-else-if="!dbStatus.dir_writable" class="error-hint">
                  目录存在但无写入权限，请检查目录权限设置
                </p>
                <p v-else class="error-hint">请检查路径配置和权限设置</p>
              </div>
            </template>
          </el-alert>
          
          <el-alert
            v-else
            title="正在检查数据库状态..."
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        
        <el-button 
          type="primary" 
          size="small" 
          @click="handleCheckDBStatus" 
          :loading="checkingStatus"
          style="margin-top: 10px;"
        >
          刷新状态
        </el-button>
      </el-card>

      <el-card v-if="localConfig.enabled" class="info-card" shadow="never">
        <template #header>
          <span>数据说明</span>
        </template>
        <ul class="info-list">
          <li>数据每30秒自动保存一次</li>
          <li>数据库自动清理3年前的旧数据</li>
          <li>数据写入采用异步方式，不会影响代理服务性能</li>
          <li>数据库使用连接池管理，最大1个连接（SQLite限制）</li>
          <li>全0数据不会保存到数据库，节省存储空间</li>
        </ul>
      </el-card>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDBStatus } from '../composables/useDBStatus'

const props = defineProps<{
  config: any
}>()

const localConfig = ref({
  enabled: false,
  db_path: '',
})

const { dbStatus, loading: checkingStatus, checkDBStatus } = useDBStatus()
const formatNumber = (n: number) => {
  try {
    return new Intl.NumberFormat('zh-CN').format(n)
  } catch {
    return String(n)
  }
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return String(bytes)
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

const formatTs = (ts: number) => {
  if (!Number.isFinite(ts)) return String(ts)
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false })
}


watch(() => props.config, (newConfig) => {
  if (!newConfig) return
  
  if (newConfig.metrics_storage) {
    localConfig.value.enabled = newConfig.metrics_storage.enabled || false
    localConfig.value.db_path = newConfig.metrics_storage.db_path || ''
  } else {
    localConfig.value.enabled = false
    localConfig.value.db_path = ''
  }
}, { immediate: true, deep: true })

// 检查数据库状态（使用共享的 composable）
const handleCheckDBStatus = async () => {
  await checkDBStatus(true) // true 表示显示消息提示
}

// 获取配置（供父组件调用）
const getConfig = () => {
  return {
    metrics_storage: {
      enabled: localConfig.value.enabled || false,
      db_path: localConfig.value.db_path || '',
    }
  }
}

// 监听配置变化，自动检查状态
watch(() => localConfig.value.enabled, (enabled) => {
  if (enabled) {
    // 延迟一下，等待后端配置更新
    setTimeout(() => {
      checkDBStatus(false) // false 表示不显示消息提示
    }, 1000)
  } else {
    dbStatus.value = null
  }
})

// 监听路径变化
watch(() => localConfig.value.db_path, () => {
  if (localConfig.value.enabled) {
    // 路径变化后延迟检查状态
    setTimeout(() => {
      checkDBStatus(true) // false 表示不显示消息提示
    }, 1000)
  }
})

onMounted(() => {
  
})

defineExpose({
  getConfig
})
</script>

<style scoped>
.config-page {
  height: 100%;
  overflow-y: auto;
}

.config-page :deep(.el-card__header) {
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
}

.config-page :deep(.el-card__body) {
  padding: 24px;
  max-width: 800px;
}

.config-page h3 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  margin: 0;
}

.el-form-item {
  margin-bottom: 24px;
}

:deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

.status-card, .info-card {
  margin-top: 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--input-bg);
}

.status-card :deep(.el-card__header),
.info-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.8;
}

.info-list li {
  margin-bottom: 8px;
}

.status-detail {
  font-size: 13px;
  line-height: 1.8;
}

.status-detail p {
  margin: 5px 0;
}

.error-hint {
  color: var(--el-color-danger);
}

.info-hint {
  color: var(--el-color-info);
  font-style: italic;
}
</style>
