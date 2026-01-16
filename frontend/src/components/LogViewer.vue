<template>
  <el-card class="log-viewer log-page" shadow="hover">
    <template #header>
      <div class="log-header">
        <h3 class="log-title">实时访问日志</h3>
        <div class="log-actions">
          <el-text type="info" size="small" class="log-count">
            共 {{ totalLogCount }} 条（显示最近 {{ displayLogs.length }} 条）
          </el-text>
          <el-button
            v-if="!realtimeEnabled"
            @click="refreshLogs"
            type="primary"
            size="small"
          >
            刷新
          </el-button>
          <el-button 
            @click="clearLogs" 
            type="danger"
            size="small"
            :disabled="displayLogs.length === 0"
          >
            清除日志
          </el-button>
        </div>
      </div>
    </template>
    <div class="log-content text-selectable" ref="logBox">
      <div 
        v-for="(line, index) in displayLogs" 
        :key="index" 
        class="log-line"
      >
        {{ line }}
      </div>
      <el-empty v-if="displayLogs.length === 0" description="暂无日志，启动服务后显示..." />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ClearLogs, EventsOn, GetConfig, GetLogs } from '../api'

// 最大显示的日志条数（前端限制，只保留最近3000条以节省内存）
const MAX_DISPLAY_LOGS = 3000

const allLogs = ref<string[]>([])
const logBox = ref<HTMLElement | null>(null)

let unsubscribeLogLine: (() => void) | null = null
let unsubscribeLogs: (() => void) | null = null
let dragEventHandlers: {
  element: HTMLElement
  preventDrag: (e: DragEvent) => boolean
} | null = null

// 限制显示的日志数量（只显示最近的）
const displayLogs = computed(() => {
  return allLogs.value.slice(-MAX_DISPLAY_LOGS)
})

// 总日志数量（包括未显示的）
const totalLogCount = computed(() => allLogs.value.length)

const realtimeEnabled = ref(true)

const refreshLogs = async () => {
  try {
    const existing = await GetLogs()
    if (Array.isArray(existing)) {
      allLogs.value = existing.slice(-MAX_DISPLAY_LOGS)
    } else {
      allLogs.value = []
    }
    nextTick(() => {
      scrollToBottom()
    })
  } catch {
    // ignore
  }
}

onMounted(async () => {
  // 读取配置：决定是否订阅实时 log-line
  try {
    const cfg = (await GetConfig()) as any
    realtimeEnabled.value = cfg.show_realtime_logs !== false
  } catch {
    realtimeEnabled.value = true
  }

  if (realtimeEnabled.value) {
    // 监听单行日志（实时推送）
    unsubscribeLogLine = await EventsOn('log-line', (line: string) => {
      allLogs.value.push(line)

      // 如果日志数量超过限制，删除最旧的
      if (allLogs.value.length > MAX_DISPLAY_LOGS * 2) {
        allLogs.value = allLogs.value.slice(-MAX_DISPLAY_LOGS)
      }

      // 如果滚动到底部，自动滚动
      if (logBox.value) {
        const isNearBottom =
          logBox.value.scrollHeight - logBox.value.scrollTop - logBox.value.clientHeight < 100
        if (isNearBottom) {
          nextTick(() => {
            scrollToBottom()
          })
        }
      }
    })

    // 监听全部日志（如果后端有推送）
    unsubscribeLogs = await EventsOn('logs', (data: string[]) => {
      if (Array.isArray(data)) {
        allLogs.value = data.slice(-MAX_DISPLAY_LOGS)
      } else {
        allLogs.value = []
      }
      nextTick(() => {
        scrollToBottom()
      })
    })
  }

  // 初始化拉取一次（关闭实时推送时也可用）
  await refreshLogs()

  // 禁止拖动选中的文本
  if (logBox.value) {
    const preventDrag = (e: DragEvent) => {
      e.preventDefault()
      return false
    }
    logBox.value.addEventListener('dragstart', preventDrag)
    logBox.value.addEventListener('drag', preventDrag)
    logBox.value.addEventListener('dragend', preventDrag)
    dragEventHandlers = { element: logBox.value, preventDrag }
  }
})

onUnmounted(() => {
  if (unsubscribeLogLine) unsubscribeLogLine()
  if (unsubscribeLogs) unsubscribeLogs()
  
  // 清理拖动事件监听器
  if (dragEventHandlers) {
    dragEventHandlers.element.removeEventListener('dragstart', dragEventHandlers.preventDrag)
    dragEventHandlers.element.removeEventListener('drag', dragEventHandlers.preventDrag)
    dragEventHandlers.element.removeEventListener('dragend', dragEventHandlers.preventDrag)
    dragEventHandlers = null
  }
})

const scrollToBottom = () => {
  if (logBox.value) {
    logBox.value.scrollTop = logBox.value.scrollHeight
  }
}

const clearLogs = () => {
  allLogs.value = []
  ClearLogs()
}
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.log-viewer :deep(.el-card__body) {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-page {
  height: 100%;
}

.text-selectable {
  user-select: text;
  -webkit-user-drag: none;
  -moz-user-select: text;
  -ms-user-select: text;
}

.log-viewer :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  transition: color 0.3s;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.log-count {
  font-size: 13px;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px;
  background: var(--bg);
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 20px;
  color: var(--text-muted);
  min-height: 0;
  position: relative;
  transition: background-color 0.3s, color 0.3s;
}

.log-line {
  white-space: pre-wrap;
  word-break: break-all;
  padding: 4px 8px;
  color: var(--text);
  line-height: 1.8;
  border-radius: 4px;
  transition: all 0.2s;
  margin-bottom: 2px;
}

.log-line:hover {
  background: var(--btn-bg);
  padding-left: 12px;
}

.empty-log {
  color: var(--text-muted);
  text-align: center;
  padding: 60px 20px;
  font-size: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 滚动条样式 */
.log-content::-webkit-scrollbar {
  width: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: var(--card-bg);
}

.log-content::-webkit-scrollbar-thumb {
  background: var(--btn-bg);
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: var(--border);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .log-viewer {
    border-radius: 16px;
  }

  .log-header {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .log-title {
    font-size: 16px;
  }

  .log-actions {
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
  }

  .log-count {
    font-size: 12px;
  }

  .log-content {
    padding: 10px 12px;
    font-size: 11px;
    line-height: 18px;
  }
}

@media (max-width: 480px) {
  .log-viewer {
    border-radius: 12px;
  }

  .log-header {
    padding: 10px 12px;
    flex-direction: column;
    align-items: flex-start;
  }

  .log-title {
    font-size: 14px;
  }

  .log-actions {
    width: 100%;
    justify-content: space-between;
  }

  .log-count {
    font-size: 11px;
  }

  .log-content {
    padding: 8px 10px;
    font-size: 10px;
    line-height: 16px;
  }

  .log-line {
    padding: 3px 6px;
    font-size: 10px;
  }
}
</style>
