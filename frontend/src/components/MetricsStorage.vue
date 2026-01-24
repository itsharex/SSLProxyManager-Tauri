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
              <div class="status-grid">
                <el-descriptions :column="3" border class="status-detail-table">
                  <template #title>文件与容量</template>
                  <el-descriptions-item label="数据库路径" :span="3">{{ dbStatus.path }}</el-descriptions-item>

                  <el-descriptions-item label="DB(MB)">{{ formatBytes(dbStatus.db_file_size_bytes) }}</el-descriptions-item>
                  <el-descriptions-item label="WAL(MB)">{{ formatBytes(dbStatus.wal_file_size_bytes) }}</el-descriptions-item>
                  <el-descriptions-item label="SHM(MB)">{{ formatBytes(dbStatus.shm_file_size_bytes) }}</el-descriptions-item>

                  <el-descriptions-item label="WAL+SHM(MB)">{{ formatBytes(walShmBytesTotal) }}</el-descriptions-item>
                  <el-descriptions-item label="总页大小(MB)">{{ formatBytes(pageBytesTotal) }}</el-descriptions-item>
                  <el-descriptions-item label="可回收(MB)">{{ formatBytes(freeBytesTotal) }}</el-descriptions-item>
                </el-descriptions>

                <el-descriptions :column="3" border class="status-detail-table">
                  <template #title>日志与时间范围</template>
                  <el-descriptions-item label="记录行数">{{ formatNumber(dbStatus.request_logs_count) }}</el-descriptions-item>
                  <el-descriptions-item label="最早记录">{{ formatTs(dbStatus.request_logs_min_ts) }}</el-descriptions-item>
                  <el-descriptions-item label="最新记录">{{ formatTs(dbStatus.request_logs_max_ts) }}</el-descriptions-item>
                </el-descriptions>

                <el-descriptions :column="3" border class="status-detail-table">
                  <template #title>SQLite 配置</template>
                  <el-descriptions-item label="SQLite 版本">{{ dbStatus.sqlite_version || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="journal_mode">{{ dbStatus.journal_mode || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="synchronous">{{ formatSynchronous(dbStatus.synchronous) }}</el-descriptions-item>

                  <el-descriptions-item label="page_size">{{ formatNumber(dbStatus.page_size) }}</el-descriptions-item>
                  <el-descriptions-item label="page_count">{{ formatNumber(dbStatus.page_count) }}</el-descriptions-item>
                  <el-descriptions-item label="freelist_count">{{ formatNumber(dbStatus.freelist_count) }}</el-descriptions-item>

                  <el-descriptions-item label="碎片率">{{ fragRateText }}</el-descriptions-item>
                  <el-descriptions-item label="cache_size">{{ formatCacheSize(dbStatus.cache_size) }}</el-descriptions-item>
                  <el-descriptions-item label="busy_timeout(ms)">{{ formatNumber(dbStatus.busy_timeout_ms) }}</el-descriptions-item>

                  <el-descriptions-item label="wal_autocheckpoint">{{ formatNumber(dbStatus.wal_autocheckpoint) }}</el-descriptions-item>
                  <el-descriptions-item label="—">—</el-descriptions-item>
                  <el-descriptions-item label="—">—</el-descriptions-item>
                </el-descriptions>
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

          <el-alert v-else title="正在检查数据库状态..." type="info" :closable="false" show-icon />
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
          <li>请求日志采用异步写入，不会阻塞代理转发</li>
          <li>写入为批量落库：最多累计 2000 条或 5 秒触发一次写入</li>
          <li>数据库保留最近 730 天的请求日志，系统每天检查并自动清理更早的数据</li>
          <li>数据库使用连接池管理，最大 3 个连接（SQLite）</li>
        </ul>
      </el-card>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useDBStatus } from '../composables/useDBStatus'

const props = defineProps<{
  config: any
}>()

const localConfig = ref({
  enabled: false,
  db_path: '',
})

const { dbStatus, loading: checkingStatus, checkDBStatus } = useDBStatus()

const formatNumber = (n: any) => {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  try {
    return new Intl.NumberFormat('zh-CN').format(num)
  } catch {
    return String(num)
  }
}

const formatBytes = (bytes: any) => {
  if (bytes === null || bytes === undefined) return '—'
  const num = Number(bytes)
  if (!Number.isFinite(num) || num < 0) return '—'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = num
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

const formatTs = (ts: any) => {
  if (ts === null || ts === undefined) return '—'
  const num = Number(ts)
  if (!Number.isFinite(num) || num <= 0) return '—'
  return new Date(num * 1000).toLocaleString('zh-CN', { hour12: false })
}

const formatSynchronous = (v: any) => {
  if (v === null || v === undefined) return '—'
  const s = String(v).trim()
  if (!s) return '—'

  // PRAGMA synchronous 可能返回数字
  const n = Number(s)
  if (Number.isFinite(n)) {
    switch (n) {
      case 0:
        return 'OFF(0)'
      case 1:
        return 'NORMAL(1)'
      case 2:
        return 'FULL(2)'
      case 3:
        return 'EXTRA(3)'
      default:
        return `${n}`
    }
  }
  return s
}

const formatCacheSize = (v: any) => {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'

  // SQLite: cache_size > 0 表示页数；< 0 表示 KB
  if (n < 0) {
    return `${Math.abs(n)} KB`
  }
  return `${n} pages`
}

const pageBytesTotal = computed(() => {
  const ps = Number(dbStatus.value?.page_size)
  const pc = Number(dbStatus.value?.page_count)
  if (!Number.isFinite(ps) || !Number.isFinite(pc) || ps <= 0 || pc <= 0) return null
  return ps * pc
})

const freeBytesTotal = computed(() => {
  const ps = Number(dbStatus.value?.page_size)
  const fc = Number(dbStatus.value?.freelist_count)
  if (!Number.isFinite(ps) || !Number.isFinite(fc) || ps <= 0 || fc <= 0) return null
  return ps * fc
})

const walShmBytesTotal = computed(() => {
  const wal = Number(dbStatus.value?.wal_file_size_bytes) || 0
  const shm = Number(dbStatus.value?.shm_file_size_bytes) || 0
  const total = wal + shm
  return total > 0 ? total : null
})

const fragRateText = computed(() => {
  const pc = Number(dbStatus.value?.page_count)
  const fc = Number(dbStatus.value?.freelist_count)
  if (!Number.isFinite(pc) || !Number.isFinite(fc) || pc <= 0) return '—'
  const rate = (fc / pc) * 100
  return `${rate.toFixed(2)}%`
})

watch(
  () => props.config,
  (newConfig) => {
    if (!newConfig) return

    if (newConfig.metrics_storage) {
      localConfig.value.enabled = newConfig.metrics_storage.enabled || false
      localConfig.value.db_path = newConfig.metrics_storage.db_path || ''
    } else {
      localConfig.value.enabled = false
      localConfig.value.db_path = ''
    }
  },
  { immediate: true, deep: true },
)

const handleCheckDBStatus = async () => {
  await checkDBStatus(true)
}

const getConfig = () => {
  return {
    metrics_storage: {
      enabled: localConfig.value.enabled || false,
      db_path: localConfig.value.db_path || '',
    },
  }
}

watch(
  () => localConfig.value.enabled,
  (enabled) => {
    if (enabled) {
      setTimeout(() => {
        checkDBStatus(false)
      }, 1000)
    } else {
      dbStatus.value = null
    }
  },
)

watch(
  () => localConfig.value.db_path,
  () => {
    if (localConfig.value.enabled) {
      setTimeout(() => {
        checkDBStatus(true)
      }, 1000)
    }
  },
)

onMounted(() => {})

defineExpose({
  getConfig,
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

.status-card,
.info-card {
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

.status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.status-detail-table :deep(.el-descriptions__label) {
  white-space: nowrap;
  width: 140px;
  color: var(--text);
}

.status-detail-table :deep(.el-descriptions__content) {
  word-break: break-all;
  color: var(--text);
}

.status-detail-table :deep(.el-descriptions__cell) {
  background: var(--card-bg);
  border-color: var(--border);
}

.status-detail-table :deep(.el-descriptions__header) {
  color: var(--text);
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
