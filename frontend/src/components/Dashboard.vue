<template>
  <div class="config-card config-page">
    <div class="header">
        <div>
          <h3>仪表盘</h3>
          <el-text type="info" size="small" class="hint">每2秒更新；仅在仪表盘激活时订阅并渲染</el-text>
        </div>

        <div class="controls">
          <el-form-item label="监听地址" style="margin-bottom: 0;">
            <el-select v-model="selectedListen" style="width: 200px;">
              <el-option v-for="a in listenAddrs" :key="a" :label="a" :value="a" />
            </el-select>
          </el-form-item>

          <el-form-item label="显示周期" style="margin-bottom: 0;">
            <el-select v-model.number="selectedWindow" style="width: 150px;">
              <el-option label="1分钟" :value="60" />
              <el-option label="15分钟" :value="900" />
              <el-option label="30分钟" :value="1800" />
              <el-option label="1小时" :value="3600" />
              <el-option label="3小时" :value="10800" />
              <el-option label="6小时" :value="21600" />
              <el-option label="12小时" :value="43200" />
              <el-option label="24小时" :value="86400" />
            </el-select>
          </el-form-item>

          <el-form-item label="历史数据" style="margin-bottom: 0;">
            <el-config-provider :locale="zhCn">
              <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="x"
                :shortcuts="dateShortcuts"
                style="width: 380px;"
              />
            </el-config-provider>
          </el-form-item>

          <el-form-item style="margin-bottom: 0;">
            <el-button type="primary" @click="loadHistoricalData" :loading="loadingHistorical">
              载入历史数据
            </el-button>
            <el-button v-if="historicalData" @click="clearHistoricalData">
              显示实时数据
            </el-button>
          </el-form-item>
        </div>
      </div>

    <div class="grid">
      <el-card class="panel panel--stats" shadow="hover">
        <div class="stats">
          <div class="stat">
            <div class="stat-label">总请求</div>
            <div class="stat-value">{{ totalReq }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">成功率</div>
            <div class="stat-value">{{ successRate }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">错误率(5xx+err)</div>
            <div class="stat-value">{{ errorRate }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">平均延迟(ms)</div>
            <div class="stat-value">{{ avgLatency }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="panel panel--qps" shadow="hover">
        <template #header>
          <div class="panel-title">请求数趋势（QPS）</div>
        </template>
        <v-chart v-if="isActive" :option="qpsOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--status" shadow="hover">
        <template #header>
          <div class="panel-title">状态码分布</div>
        </template>
        <v-chart v-if="isActive" :option="statusOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--latency" shadow="hover">
        <template #header>
          <div class="panel-title">延迟趋势（ms）</div>
        </template>
        <v-chart v-if="isActive" :option="latencyOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--percentile" shadow="hover">
        <template #header>
          <div class="panel-title">P50 / P95 / P99 延迟（ms）</div>
        </template>
        <v-chart v-if="isActive" :option="pOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--upstream" shadow="hover">
        <template #header>
          <div class="panel-title">Upstream 请求分布（Top 20）</div>
        </template>
        <v-chart v-if="isActive" :option="upDistOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--errors" shadow="hover">
        <template #header>
          <div class="panel-title">Top 错误（Route / Upstream）</div>
        </template>
        <div class="tables">
          <el-card class="table" shadow="never">
            <template #header>
              <div class="table-title">Top Route 错误</div>
            </template>
            <div class="rows">
              <div v-for="(it, idx) in topRouteErr" :key="idx" class="row">
                <div class="k">{{ it.key }}</div>
                <div class="v">{{ it.value }}</div>
              </div>
              <el-empty v-if="topRouteErr.length===0" description="暂无" :image-size="60" />
            </div>
          </el-card>
          <el-card class="table" shadow="never">
            <template #header>
              <div class="table-title">Top Upstream 错误</div>
            </template>
            <div class="rows">
              <div v-for="(it, idx) in topUpErr" :key="idx" class="row">
                <div class="k">{{ it.key }}</div>
                <div class="v">{{ it.value }}</div>
              </div>
              <el-empty v-if="topUpErr.length===0" description="暂无" :image-size="60" />
            </div>
          </el-card>
        </div>
      </el-card>

      <el-card class="panel panel--rate" shadow="hover">
        <template #header>
          <div class="panel-title">错误率 / 成功率趋势</div>
        </template>
        <v-chart v-if="isActive" :option="rateOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--pie" shadow="hover">
        <template #header>
          <div class="panel-title">状态码分布（饼图）</div>
        </template>
        <v-chart v-if="isActive" :option="statusPieOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--throughput" shadow="hover">
        <template #header>
          <div class="panel-title">吞吐量趋势（累计请求数）</div>
        </template>
        <v-chart v-if="isActive" :option="throughputOption" class="chart" autoresize />
      </el-card>

      <el-card class="panel panel--latency-dist" shadow="hover">
        <template #header>
          <div class="panel-title">延迟分布对比</div>
        </template>
        <v-chart v-if="isActive" :option="latencyDistOption" class="chart" autoresize />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { EventsOn, EventsOff } from '../api'
import { GetListenAddrs, GetMetrics, QueryHistoricalMetrics } from '../api'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ isActive: boolean }>()

type KV = { key: string; value: number }

// 临时类型定义
type MetricsSeries = {
  timestamps: number[]
  counts: number[]
  s2xx: number[]
  s3xx: number[]
  s4xx: number[]
  s5xx: number[]
  s0: number[]
  avgLatencyMs: number[]
  maxLatencyMs: number[]

  p50?: number[]
  p95?: number[]
  p99?: number[]

  upstreamDist?: KV[]
  topRouteErr?: KV[]
  topUpErr?: KV[]
  latencyDist?: KV[]
}

type MetricsPayload = {
  windowSeconds: number
  listenAddrs: string[]
  byListenAddr: Record<string, MetricsSeries>

  minuteWindowSeconds?: number
  byListenMinute?: Record<string, MetricsSeries>
}

const listenAddrs = ref<string[]>(['全局'])
const selectedListen = ref<string>('全局')
const selectedWindow = ref<number>(900)

const latest = ref<MetricsPayload | null>(null)

// 历史数据相关
const dateRange = ref<[number, number] | null>(null)
const loadingHistorical = ref(false)
const historicalData = ref<MetricsSeries | null>(null)

// 日期快捷选项
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '昨天',
    value: () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0)
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '最近30天',
    value: () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '本月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '上一月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '最近半年',
    value: () => {
      const now = new Date()
      const start = new Date(now)
      start.setMonth(start.getMonth() - 6)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '去年',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0)
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
      return [start.getTime(), end.getTime()]
    }
  },
  {
    text: '今年',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      return [start.getTime(), end.getTime()]
    }
  }
]

const maxPoints = 1200

const formatTime = (tsSec: number) => {
  const d = new Date(tsSec * 1000)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const sliceTail = <T,>(arr: T[], n: number): T[] => {
  if (!Array.isArray(arr)) return []
  if (n <= 0) return []
  return arr.length <= n ? arr : arr.slice(arr.length - n)
}

const getRawWindowSeries = () => {
  const p = latest.value
  if (!p) return null

  // 1小时及以上（>= 3600秒）使用分钟级数据
  const useMinute = selectedWindow.value >= 3600
  const dict = useMinute ? (p.byListenMinute || {}) : p.byListenAddr
  const maxWin = useMinute ? (p.minuteWindowSeconds || p.windowSeconds || 0) : (p.windowSeconds || 0)

  const all = dict?.[selectedListen.value]
  if (!all) return null

  const winSec = maxWin > 0 ? Math.min(selectedWindow.value, maxWin) : selectedWindow.value
  const pointWin = useMinute ? Math.ceil(winSec / 60) : winSec

  const tsTail = sliceTail(all.timestamps || [], pointWin)
  const len = tsTail.length
  if (len === 0) {
    return {
      timestamps: [] as number[],
      counts: [] as number[],
      s2xx: [] as number[],
      s3xx: [] as number[],
      s4xx: [] as number[],
      s5xx: [] as number[],
      s0: [] as number[],
      avgLatencyMs: [] as number[],
      upstreamDist: all.upstreamDist || [],
      topRouteErr: all.topRouteErr || [],
      topUpErr: all.topUpErr || [],
    }
  }

  const cut = <T,>(arr: T[] | undefined, fallback: T) => {
    const tail = sliceTail(arr || [], pointWin)
    if (tail.length === len) return tail
    const padded = new Array(len).fill(fallback) as T[]
    const startAt = padded.length - tail.length
    for (let i = 0; i < tail.length; i++) padded[startAt + i] = tail[i]
    return padded
  }

  return {
    timestamps: tsTail,
    counts: cut(all.counts, 0),
    s2xx: cut(all.s2xx, 0),
    s3xx: cut(all.s3xx, 0),
    s4xx: cut(all.s4xx, 0),
    s5xx: cut(all.s5xx, 0),
    s0: cut(all.s0, 0),
    avgLatencyMs: cut(all.avgLatencyMs, 0),
    upstreamDist: all.upstreamDist || [],
    topRouteErr: all.topRouteErr || [],
    topUpErr: all.topUpErr || [],
  }
}

// 保存上一次有效的数据视图，避免切换窗口时闪烁
// 同时保存窗口大小和监听地址，只有当这些匹配时才使用缓存
let lastValidView: { x: string[]; series: MetricsSeries; window: number; listen: string } | null = null

const buildAlignedView = () => {
  const p = latest.value
  if (!p) {
    // 只有当窗口大小和监听地址匹配时才返回缓存视图
    if (lastValidView && lastValidView.window === selectedWindow.value && lastValidView.listen === selectedListen.value) {
      return lastValidView
    }
    return null
  }

  // 1小时及以上（>= 3600秒）使用分钟级数据
  const useMinute = selectedWindow.value >= 3600
  const dict = useMinute ? (p.byListenMinute || {}) : p.byListenAddr
  const maxWin = useMinute ? (p.minuteWindowSeconds || p.windowSeconds || 0) : (p.windowSeconds || 0)

  const all = dict?.[selectedListen.value]
  if (!all) {
    // 只有当窗口大小和监听地址匹配时才返回缓存视图
    if (lastValidView && lastValidView.window === selectedWindow.value && lastValidView.listen === selectedListen.value) {
      return lastValidView
    }
    return null
  }

  const winSec = maxWin > 0 ? Math.min(selectedWindow.value, maxWin) : selectedWindow.value
  const pointWin = useMinute ? Math.ceil(winSec / 60) : winSec

  const tsTail = sliceTail(all.timestamps || [], pointWin)
  if (tsTail.length === 0) {
    // 只有当窗口大小和监听地址匹配时才返回缓存视图
    if (lastValidView && lastValidView.window === selectedWindow.value && lastValidView.listen === selectedListen.value) {
      return lastValidView
    }
    return null
  }

  const step = tsTail.length > maxPoints ? Math.ceil(tsTail.length / maxPoints) : 1
  const idx: number[] = []
  for (let i = 0; i < tsTail.length; i += step) idx.push(i)

  const pick = <T,>(arr: T[] | undefined, fallback: T): T[] => {
    const tail = sliceTail(arr || [], pointWin)
    if (tail.length !== tsTail.length) {
      const padded = new Array(tsTail.length).fill(fallback) as T[]
      const startAt = padded.length - tail.length
      for (let i = 0; i < tail.length; i++) padded[startAt + i] = tail[i]
      return idx.map(i => padded[i])
    }
    return idx.map(i => tail[i])
  }

  const x = idx.map(i => formatTime(tsTail[i]))

  const view: MetricsSeries = {
    timestamps: idx.map(i => tsTail[i]),
    counts: pick(all.counts, 0),
    s2xx: pick(all.s2xx, 0),
    s3xx: pick(all.s3xx, 0),
    s4xx: pick(all.s4xx, 0),
    s5xx: pick(all.s5xx, 0),
    s0: pick(all.s0, 0),
    avgLatencyMs: pick(all.avgLatencyMs, 0),
    maxLatencyMs: pick(all.maxLatencyMs, 0),
    p50: pick(all.p50, 0),
    p95: pick(all.p95, 0),
    p99: pick(all.p99, 0),

    upstreamDist: all.upstreamDist || [],
    topRouteErr: all.topRouteErr || [],
    topUpErr: all.topUpErr || [],
  }

  const result = { 
    x, 
    series: view,
    window: selectedWindow.value,
    listen: selectedListen.value
  }
  lastValidView = result // 保存有效视图（包含窗口大小和监听地址）
  return result
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)

const totalReq = computed(() => {
  // 如果有历史数据，使用历史数据
  if (historicalData.value) {
    return sum(historicalData.value.counts || [])
  }
  const raw = getRawWindowSeries()
  if (!raw) return 0
  return sum(raw.counts)
})

const successRate = computed(() => {
  // 如果有历史数据，使用历史数据
  if (historicalData.value) {
    const t = sum(historicalData.value.counts || [])
    if (t <= 0) return '0%'
    return `${((sum(historicalData.value.s2xx || []) / t) * 100).toFixed(2)}%`
  }
  const raw = getRawWindowSeries()
  if (!raw) return '0%'
  const t = sum(raw.counts)
  if (t <= 0) return '0%'
  return `${((sum(raw.s2xx) / t) * 100).toFixed(2)}%`
})

const errorRate = computed(() => {
  // 如果有历史数据，使用历史数据
  if (historicalData.value) {
    const t = sum(historicalData.value.counts || [])
    if (t <= 0) return '0%'
    return `${(((sum(historicalData.value.s5xx || []) + sum(historicalData.value.s0 || [])) / t) * 100).toFixed(2)}%`
  }
  const raw = getRawWindowSeries()
  if (!raw) return '0%'
  const t = sum(raw.counts)
  if (t <= 0) return '0%'
  return `${(((sum(raw.s5xx) + sum(raw.s0)) / t) * 100).toFixed(2)}%`
})

const avgLatency = computed(() => {
  // 如果有历史数据，使用历史数据
  if (historicalData.value && historicalData.value.avgLatencyMs.length > 0) {
    return Math.round(sum(historicalData.value.avgLatencyMs) / historicalData.value.avgLatencyMs.length)
  }
  const raw = getRawWindowSeries()
  if (!raw || raw.avgLatencyMs.length === 0) return 0
  return Number((sum(raw.avgLatencyMs) / raw.avgLatencyMs.length).toFixed(4))
})

const topRouteErr = computed(() => {
  // 如果有历史数据，只使用历史数据
  if (historicalData.value && historicalData.value.topRouteErr && historicalData.value.topRouteErr.length > 0) {
    return historicalData.value.topRouteErr
  }
  const raw = getRawWindowSeries()
  return raw?.topRouteErr || []
})
const topUpErr = computed(() => {
  // 如果有历史数据，只使用历史数据
  if (historicalData.value && historicalData.value.topUpErr && historicalData.value.topUpErr.length > 0) {
    return historicalData.value.topUpErr
  }
  const raw = getRawWindowSeries()
  return raw?.topUpErr || []
})

// 加载历史数据
const loadHistoricalData = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  const [startTime, endTime] = dateRange.value
  if (startTime >= endTime) {
    ElMessage.warning('开始时间必须小于结束时间')
    return
  }

  // 转换为秒级时间戳
  const startSec = Math.floor(startTime / 1000)
  const endSec = Math.floor(endTime / 1000)

  loadingHistorical.value = true
  try {
    const listenAddr = selectedListen.value === '全局' ? '' : selectedListen.value
    
    // @ts-ignore
    const response = await QueryHistoricalMetrics({
      start_time: startSec,
      end_time: endSec,
      listen_addr: listenAddr,
    })

    if (response && response.series) {
      const series: MetricsSeries = {
        timestamps: response.series.timestamps || [],
        counts: response.series.counts || [],
        s2xx: response.series.s2xx || [],
        s3xx: response.series.s3xx || [],
        s4xx: response.series.s4xx || [],
        s5xx: response.series.s5xx || [],
        s0: response.series.s0 || [],
        avgLatencyMs: response.series.avgLatencyMs || [],
        maxLatencyMs: response.series.maxLatencyMs || [],
        p50: response.series.p50 || [],
        p95: response.series.p95 || [],
        p99: response.series.p99 || [],
        upstreamDist: (response.series.upstreamDist || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })),
        topRouteErr: (response.series.topRouteErr || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })),
        topUpErr: (response.series.topUpErr || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })),
        latencyDist: (response.series.latencyDist || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })), 
      }
      historicalData.value = series
      ElMessage.success(`历史数据加载成功，共 ${series.timestamps.length} 个数据点`)
    } else {
      ElMessage.warning('未找到历史数据')
      historicalData.value = null
    }
  } catch (error: any) {
    console.error('加载历史数据失败:', error)
    ElMessage.error('加载历史数据失败: ' + (error.message || String(error)))
    historicalData.value = null
  } finally {
    loadingHistorical.value = false
  }
}

// 清除历史数据
const clearHistoricalData = () => {
  historicalData.value = null
  ElMessage.info('已清除历史数据')
}

const chartColors = ref({
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border)',
  primary: 'var(--primary)',
  primaryLight: 'var(--primary-light)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: '#0ea5e9',
  gray: '#6b7280',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
});

const updateChartColors = () => {
  const style = getComputedStyle(document.documentElement);
  chartColors.value = {
    text: style.getPropertyValue('--text').trim(),
    textMuted: style.getPropertyValue('--text-muted').trim(),
    border: style.getPropertyValue('--border').trim(),
    primary: style.getPropertyValue('--primary').trim(),
    primaryLight: style.getPropertyValue('--primary-light').trim(),
    success: style.getPropertyValue('--success').trim(),
    warning: style.getPropertyValue('--warning').trim(),
    danger: style.getPropertyValue('--danger').trim(),
    info: '#0ea5e9', // Assuming this is static
    gray: '#6b7280', // Assuming this is static
    purple: '#8b5cf6', // Assuming this is static
    pink: '#ec4899', // Assuming this is static
    orange: '#f97316', // Assuming this is static
  };
};

const baseOption = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  textStyle: { color: chartColors.value.text },
  animation: false,
  renderer: 'canvas',
}));

const commonAxis = computed(() => ({
  axisLabel: { color: chartColors.value.textMuted },
  axisLine: { lineStyle: { color: chartColors.value.border } },
  splitLine: { lineStyle: { color: chartColors.value.border, type: 'dashed', opacity: 0.5 } },
}));

// 获取对齐后的视图数据（历史数据优先，如果有历史数据则不显示实时数据）
const alignedView = computed(() => {
  if (!props.isActive) return null
  
  // 如果有历史数据，只显示历史数据
  if (historicalData.value) {
    const histSeries = historicalData.value
    if (histSeries.timestamps.length === 0) {
      return null
    }
    
    const step = histSeries.timestamps.length > maxPoints ? Math.ceil(histSeries.timestamps.length / maxPoints) : 1
    const idx: number[] = []
    for (let i = 0; i < histSeries.timestamps.length; i += step) idx.push(i)

    const x = idx.map(i => formatTime(histSeries.timestamps[i]))
    const view: MetricsSeries = {
      timestamps: idx.map(i => histSeries.timestamps[i]),
      counts: idx.map(i => histSeries.counts[i] || 0),
      s2xx: idx.map(i => histSeries.s2xx[i] || 0),
      s3xx: idx.map(i => histSeries.s3xx[i] || 0),
      s4xx: idx.map(i => histSeries.s4xx[i] || 0),
      s5xx: idx.map(i => histSeries.s5xx[i] || 0),
      s0: idx.map(i => histSeries.s0[i] || 0),
      avgLatencyMs: idx.map(i => histSeries.avgLatencyMs[i] || 0),
      maxLatencyMs: idx.map(i => histSeries.maxLatencyMs[i] || 0),
      p50: idx.map(i => histSeries.p50?.[i] || 0),
      p95: idx.map(i => histSeries.p95?.[i] || 0),
      p99: idx.map(i => histSeries.p99?.[i] || 0),
      upstreamDist: histSeries.upstreamDist || [],
      topRouteErr: histSeries.topRouteErr || [],
      topUpErr: histSeries.topUpErr || [],
    }

    return {
      x,
      series: view,
      window: selectedWindow.value,
      listen: selectedListen.value,
    }
  }
  
  // 没有历史数据时，显示实时数据
  return buildAlignedView()
})

const qpsOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    grid: { left: 44, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: v.x, boundaryGap: false, ...commonAxis.value },
    yAxis: { type: 'value', ...commonAxis.value },
    series: [
      { 
        name: 'QPS', 
        type: 'line', 
        smooth: false,
        showSymbol: false, 
        large: true,
        largeThreshold: 200,
        lineStyle: { width: 2, color: chartColors.value.primary }, 
        areaStyle: { opacity: 0.18, color: chartColors.value.primaryLight }, 
        data: v.series.counts || [],
        sampling: 'lttb',
      },
    ],
  }
})

const statusOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  const s = v.series
  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    legend: { top: 0, textStyle: { color: chartColors.value.textMuted } },
    grid: { left: 44, right: 20, top: 44, bottom: 30 },
    xAxis: { type: 'category', data: v.x, boundaryGap: false, ...commonAxis.value },
    yAxis: { type: 'value', ...commonAxis.value },
    series: [
      { name: '2xx', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.s2xx, lineStyle: { width: 2, color: chartColors.value.success }, sampling: 'lttb' },
      { name: '3xx', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.s3xx, lineStyle: { width: 2, color: chartColors.value.info }, sampling: 'lttb' },
      { name: '4xx', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.s4xx, lineStyle: { width: 2, color: chartColors.value.warning }, sampling: 'lttb' },
      { name: '5xx', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.s5xx, lineStyle: { width: 2, color: chartColors.value.danger }, sampling: 'lttb' },
      { name: 'err', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.s0, lineStyle: { width: 2, color: chartColors.value.gray }, sampling: 'lttb' },
    ],
  }
})

const latencyOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  const s = v.series
  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    legend: { top: 0, textStyle: { color: chartColors.value.textMuted } },
    grid: { left: 44, right: 20, top: 44, bottom: 30 },
    xAxis: { type: 'category', data: v.x, boundaryGap: false, ...commonAxis.value },
    yAxis: { type: 'value', ...commonAxis.value },
    series: [
      { name: 'avg', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.avgLatencyMs, lineStyle: { width: 2, color: chartColors.value.purple }, sampling: 'lttb' },
      { name: 'max', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.maxLatencyMs, lineStyle: { width: 2, color: chartColors.value.pink }, sampling: 'lttb' },
    ],
  }
})

const pOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  const s = v.series
  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    legend: { top: 0, textStyle: { color: chartColors.value.textMuted } },
    grid: { left: 44, right: 20, top: 44, bottom: 30 },
    xAxis: { type: 'category', data: v.x, boundaryGap: false, ...commonAxis.value },
    yAxis: { type: 'value', ...commonAxis.value },
    series: [
      { name: 'p50', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.p50 || [], lineStyle: { width: 2, color: chartColors.value.primary }, sampling: 'lttb' },
      { name: 'p95', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.p95 || [], lineStyle: { width: 2, color: chartColors.value.orange }, sampling: 'lttb' },
      { name: 'p99', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: s.p99 || [], lineStyle: { width: 2, color: chartColors.value.danger }, sampling: 'lttb' },
    ],
  }
})

const upDistOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: [] },
      series: [],
    }
  }
  const upstreamDist = historicalData.value?.upstreamDist || v.series.upstreamDist || []
  const data = upstreamDist.map(it => ({ name: it.key, value: it.value })).sort((a, b) => a.value - b.value)
  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 20, right: 40, top: 20, bottom: 20, containLabel: true },
    xAxis: { type: 'value', ...commonAxis.value },
    yAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: chartColors.value.textMuted, fontSize: 10 } },
    series: [{ name: 'requests', type: 'bar', data: data.map(d => d.value), itemStyle: { color: chartColors.value.primary, borderRadius: [0, 4, 4, 0] } }],
  }
})

const rateOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  const s = v.series
  const total = s.counts.map((c) => (Number.isFinite(c) ? c : 0))
  const err = s.s5xx.map((v, i) => (Number.isFinite(v) ? v : 0) + (Number.isFinite(s.s0[i]) ? s.s0[i] : 0))
  const ok = s.s2xx.map((v) => (Number.isFinite(v) ? v : 0))
  const errRate = total.map((t, i) => (t > 0 ? (err[i] / t) * 100 : 0))
  const okRate = total.map((t, i) => (t > 0 ? (ok[i] / t) * 100 : 0))
  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, valueFormatter: (v: any) => `${Number(v).toFixed(2)}%` },
    legend: { top: 0, textStyle: { color: chartColors.value.textMuted } },
    grid: { left: 50, right: 20, top: 44, bottom: 30 },
    xAxis: { type: 'category', data: v.x, boundaryGap: false, ...commonAxis.value },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { color: chartColors.value.textMuted, formatter: (v: number) => `${v}%` }, ...commonAxis.value },
    series: [
      { name: '成功率', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: okRate, lineStyle: { width: 2, color: chartColors.value.success }, sampling: 'lttb' },
      { name: '错误率(5xx+err)', type: 'line', smooth: false, showSymbol: false, large: true, largeThreshold: 200, data: errRate, lineStyle: { width: 2, color: chartColors.value.danger }, sampling: 'lttb' },
    ],
  }
})

const statusPieOption = computed<EChartsOption>(() => {
  let raw = historicalData.value ? {
    s2xx: historicalData.value.s2xx || [],
    s3xx: historicalData.value.s3xx || [],
    s4xx: historicalData.value.s4xx || [],
    s5xx: historicalData.value.s5xx || [],
    s0: historicalData.value.s0 || [],
  } : getRawWindowSeries()
  if (!raw) {
    return {
      ...baseOption.value,
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '暂无数据',
          fontSize: 14,
          fill: chartColors.value.textMuted,
        },
      },
      series: [{ type: 'pie', data: [] }],
    }
  }
  const total2xx = sum(raw.s2xx || [])
  const total3xx = sum(raw.s3xx || [])
  const total4xx = sum(raw.s4xx || [])
  const total5xx = sum(raw.s5xx || [])
  const total0 = sum(raw.s0 || [])
  const total = total2xx + total3xx + total4xx + total5xx + total0
  
  if (total === 0) {
    return {
      ...baseOption.value,
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '暂无数据',
          fontSize: 14,
          fill: chartColors.value.textMuted,
        },
      },
      series: [{ type: 'pie', data: [] }],
    }
  }
  
  const data: Array<{ name: string; value: number; itemStyle: { color: string } }> = []
  if (total2xx > 0) data.push({ name: '2xx', value: total2xx, itemStyle: { color: chartColors.value.success } })
  if (total3xx > 0) data.push({ name: '3xx', value: total3xx, itemStyle: { color: chartColors.value.info } })
  if (total4xx > 0) data.push({ name: '4xx', value: total4xx, itemStyle: { color: chartColors.value.warning } })
  if (total5xx > 0) data.push({ name: '5xx', value: total5xx, itemStyle: { color: chartColors.value.danger } })
  if (total0 > 0) data.push({ name: '错误', value: total0, itemStyle: { color: chartColors.value.gray } })
  
  return {
    ...baseOption.value,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (!params || !params.value) return ''
        const percent = total > 0 ? ((params.value / total) * 100).toFixed(2) : '0.00'
        return `${params.name}<br/>${params.value} 次 (${percent}%)`
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: { color: chartColors.value.textMuted },
    },
    series: [
      {
        name: '状态码',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--card-bg)',
          borderWidth: 4,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            if (!params || !params.value) return ''
            const percent = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0'
            return `${params.name}\n${percent}%`
          },
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data,
      },
    ],
  }
})

const throughputOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  const s = v.series
  let cumulative = 0
  const cumulativeData = s.counts.map((c) => {
    cumulative += Number.isFinite(c) ? c : 0
    return cumulative
  })
  
  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    grid: { left: 44, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: v.x, boundaryGap: false, ...commonAxis.value },
    yAxis: { type: 'value', ...commonAxis.value },
    series: [
      {
        name: '累计请求数',
        type: 'line',
        smooth: false,
        showSymbol: false,
        large: true,
        largeThreshold: 200,
        data: cumulativeData,
        lineStyle: { width: 2, color: chartColors.value.purple },
        areaStyle: { opacity: 0.2, color: chartColors.value.purple },
        sampling: 'lttb',
      },
    ],
  }
})

const latencyDistOption = computed<EChartsOption>(() => {
  const v = alignedView.value
  if (!v) {
    return {
      ...baseOption.value,
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  const dist = (historicalData.value?.latencyDist || v.series.latencyDist || [])
  const names = dist.map(d => d.key)
  const vals = dist.map(d => d.value)

  return {
    ...baseOption.value,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 44, right: 20, top: 30, bottom: 50 },
    xAxis: { type: 'category', data: names, ...commonAxis.value, axisLabel: { ...commonAxis.value.axisLabel, rotate: 30 } },
    yAxis: { type: 'value', ...commonAxis.value },
    series: [
      { name: '请求数', type: 'bar', data: vals, itemStyle: { color: chartColors.value.purple }, barWidth: '60%' },
    ],
  }
})

// ---- 订阅/轮询策略（已按后端推送优化） ----
let subscribed = false
let metricsUnlisten: (() => void) | null = null
let pollingTimer: number | null = null
let heartbeatCleanup: (() => void) | null = null

let lastEventTime = 0
let eventEverReceived = false

const POLLING_INTERVAL = 3000 // 轮询兜底间隔
const EVENT_TIMEOUT = 6000 // 6 秒收不到事件则启动轮询兜底

const processMetricsPayload = (payload: MetricsPayload) => {
  if (!props.isActive) return
  latest.value = payload
  lastEventTime = Date.now()
  eventEverReceived = true

  if (selectedListen.value !== '全局' && !listenAddrs.value.includes(selectedListen.value)) {
    selectedListen.value = '全局'
  }

  const maxWin = selectedWindow.value >= 3600
    ? (payload.minuteWindowSeconds || payload.windowSeconds)
    : payload.windowSeconds
  if (maxWin && selectedWindow.value > maxWin) {
    selectedWindow.value = maxWin
  }
}

const onMetrics = (payload: MetricsPayload) => {
  processMetricsPayload(payload)
  // 收到事件立即停轮询（事件为主）
  stopPolling()
}

const convertMetricsSeriesMap = (map: Record<string, any> | undefined): Record<string, MetricsSeries> => {
  if (!map) return {}
  const result: Record<string, MetricsSeries> = {}
  for (const [key, value] of Object.entries(map)) {
    result[key] = {
      timestamps: value.timestamps || [],
      counts: value.counts || [],
      s2xx: value.s2xx || [],
      s3xx: value.s3xx || [],
      s4xx: value.s4xx || [],
      s5xx: value.s5xx || [],
      s0: value.s0 || [],
      avgLatencyMs: value.avgLatencyMs || [],
      maxLatencyMs: value.maxLatencyMs || [],
      p50: value.p50,
      p95: value.p95,
      p99: value.p99,
      upstreamDist: (value.upstreamDist || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })),
      topRouteErr: (value.topRouteErr || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })),
      topUpErr: (value.topUpErr || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })),
      latencyDist: (value.latencyDist || []).map((kv: any) => ({ key: kv.key || kv.Key || '', value: kv.value || kv.Value || 0 })),
    }
  }
  return result
}

const startPolling = () => {
  if (pollingTimer) return
  
  const poll = async () => {
    if (!props.isActive) {
      stopPolling()
      return
    }
    
    try {
      const payload = await GetMetrics()
      const converted: MetricsPayload = {
        windowSeconds: payload.windowSeconds,
        listenAddrs: payload.listenAddrs || [],
        byListenAddr: convertMetricsSeriesMap(payload.byListenAddr),
        minuteWindowSeconds: payload.minuteWindowSeconds,
        byListenMinute: convertMetricsSeriesMap(payload.byListenMinute),
      }
      processMetricsPayload(converted)
    } catch (err) {
      console.error('轮询获取 metrics 失败:', err)
    }
    
    pollingTimer = window.setTimeout(poll, POLLING_INTERVAL)
  }
  
  poll()
}

const stopPolling = () => {
  if (pollingTimer) {
    clearTimeout(pollingTimer)
    pollingTimer = null
  }
}

const startHeartbeat = () => {
  const heartbeatInterval = setInterval(() => {
    if (!props.isActive) return
    
    const now = Date.now()

    // 已经收过事件，但长时间收不到：启用轮询兜底
    if (subscribed && eventEverReceived && now - lastEventTime > EVENT_TIMEOUT) {
      startPolling()
    }
    
    // 从未收到事件：给一点时间等待后端首次推送，再启用轮询兜底
    if (subscribed && !eventEverReceived && now - lastEventTime > EVENT_TIMEOUT) {
      startPolling()
    }
  }, 2000)

  return () => clearInterval(heartbeatInterval)
  }

const refreshListenAddrs = async () => {
  try {
    const addrs = await GetListenAddrs()
    const list = ['全局', ...(Array.isArray(addrs) ? addrs : [])]
    const uniq = Array.from(new Set(list))
    listenAddrs.value = uniq

    if (!listenAddrs.value.includes(selectedListen.value)) {
      selectedListen.value = '全局'
    }
  } catch (err) {
    console.error('获取监听地址列表失败:', err)
    listenAddrs.value = ['全局']
    selectedListen.value = '全局'
  }
}

const startSubscription = () => {
  if (subscribed) return

  lastEventTime = Date.now()
  eventEverReceived = false

  EventsOn('metrics', onMetrics)
    .then((unlisten) => {
          metricsUnlisten = unlisten
          subscribed = true
    })
    .catch((err) => {
      console.error('EventsOn 订阅失败，启用轮询兜底:', err)
          subscribed = false
      startPolling()
        })
}

const stopSubscription = () => {
  if (metricsUnlisten) {
    try {
      EventsOff(metricsUnlisten)
      } catch (err) {
      console.error('EventsOff 失败:', err)
    }
    metricsUnlisten = null
  }
        subscribed = false
      }

watch([selectedListen, selectedWindow], () => {
  if (!props.isActive) return
  if (lastValidView && (lastValidView.window !== selectedWindow.value || lastValidView.listen !== selectedListen.value)) {
    lastValidView = null
  }
})

watch(() => props.isActive, (active) => {
  if (active) {
    refreshListenAddrs()
    startSubscription()

    if (!heartbeatCleanup) {
      heartbeatCleanup = startHeartbeat()
    }
    
    // 首次激活：等事件；若超时 heartbeat 会自动启动轮询
  } else {
    stopPolling()
    stopSubscription()
    
    if (heartbeatCleanup) {
      heartbeatCleanup()
      heartbeatCleanup = null
    }
  }
}, { immediate: true })

let themeObserver: MutationObserver | null = null;

onMounted(() => {
  updateChartColors();

  themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateChartColors();
      }
    });
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
  });
})

onBeforeUnmount(() => {
  stopPolling()
  stopSubscription()
  
  if (heartbeatCleanup) {
    heartbeatCleanup()
    heartbeatCleanup = null
  }
  if (themeObserver) {
    themeObserver.disconnect();
  }
})
</script>

<style scoped>
.config-card {
  background: transparent;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  border: none;
}

.config-page {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--text);
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.hint {
  color: var(--text-muted);
  font-size: 13px;
}

.controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  grid-column: span 12;
}

.panel:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow);
  border-color: var(--border-hover);
}

.panel--stats {
  grid-column: span 12;
}

.panel--qps {
  grid-column: span 6;
}

.panel--status {
  grid-column: span 6;
}

.panel--latency {
  grid-column: span 8;
}

.panel--percentile {
  grid-column: span 4;
}

.panel--upstream {
  grid-column: span 12;
}

.panel--errors {
  grid-column: span 12;
}

.panel--rate {
  grid-column: span 6;
}

.panel--pie {
  grid-column: span 6;
}

.panel--throughput {
  grid-column: span 6;
}

.panel--latency-dist {
  grid-column: span 6;
}


.panel :deep(.el-card__header) {
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
}

.panel :deep(.el-card__body) {
  padding: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.chart {
  height: 280px;
  width: 100%;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
}

.tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.table :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.table-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow: auto;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  transition: background-color 0.2s;
}

.row:hover {
  background: var(--input-focus);
}

.row .k {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row .v {
  font-weight: 600;
  color: var(--text);
  font-size: 14px;
}

/* Responsive Grid */
@media (max-width: 1200px) {
  .panel--qps,
  .panel--status,
  .panel--rate,
  .panel--pie,
  .panel--throughput,
  .panel--latency-dist {
    grid-column: span 12;
  }

  .panel--latency {
    grid-column: span 7;
  }

  .panel--percentile {
    grid-column: span 5;
  }
}

@media (max-width: 768px) {
  .config-page { padding: 8px; }
  .grid { gap: 16px; }
  .header { margin-bottom: 16px; }
  h3 { font-size: 20px; }
  .chart { height: 240px; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .tables { grid-template-columns: 1fr; }
  
  .panel--latency,
  .panel--percentile {
    grid-column: span 12;
  }
}

@media (max-width: 480px) {
  .config-page { padding: 4px; }
  .grid { gap: 12px; }
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  h3 { font-size: 18px; }
  .controls {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  .controls .el-form-item {
    width: 100%;
  }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .stat-value { font-size: 22px; }
  .panel :deep(.el-card__body) {
    padding: 12px;
  }
}
</style>
