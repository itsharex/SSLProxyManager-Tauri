<template>
  <div ref="titleBarRef" class="title-bar" :class="{ 'is-maximized': isMaximized, 'is-dragging': isDragging }">
    <div class="title-bar-drag-region">
      <div class="title-bar-left">
        <div class="app-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <span class="app-title">SSLProxyManager</span>
      </div>
      <div class="title-bar-right">
        <div class="window-controls">
          <button 
            class="window-control-btn minimize-btn" 
            @click="handleMinimize"
            title="最小化"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M 0 6 L 12 6" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </button>
          <button 
            class="window-control-btn maximize-btn" 
            @click="handleMaximize"
            :title="isMaximized ? '还原' : '最大化'"
          >
            <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12">
              <path d="M 1 1 L 11 1 L 11 11 L 1 11 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            <svg v-else width="12" height="12" viewBox="0 0 12 12">
              <path d="M 2 4 L 10 4 L 10 10 L 2 10 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M 4 2 L 10 2 L 10 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </button>
          <button 
            class="window-control-btn close-btn" 
            @click="handleClose"
            title="关闭"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M 1 1 L 11 11 M 11 1 L 1 11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { HideToTray } from '../api'
import { getCurrentWindow } from '@tauri-apps/api/window'

const isMaximized = ref(false)
const titleBarRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// 双击相关变量
let clickTimer: number | null = null
let clickCount = 0
const DOUBLE_CLICK_DELAY = 300 // 双击间隔时间（毫秒）

// 检查窗口是否最大化
const checkMaximized = async () => {
  try {
    const appWindow = getCurrentWindow()
    isMaximized.value = await appWindow.isMaximized()
  } catch (e) {
    console.error('检查窗口状态失败:', e)
  }
}

// 最小化窗口
const handleMinimize = async () => {
  const appWindow = getCurrentWindow()
  await appWindow.minimize()
}

// 最大化/还原窗口
const handleMaximize = async () => {
  const appWindow = getCurrentWindow()
  if (await appWindow.isMaximized()) {
    await appWindow.unmaximize()
  } else {
    await appWindow.maximize()
  }
  // 等待一下再检查状态
  setTimeout(() => {
    checkMaximized()
  }, 100)
}

// 关闭窗口（隐藏到托盘）
const handleClose = () => {
  HideToTray()
}

// 监听窗口大小变化（用于检测最大化状态变化）
let resizeTimer: number | null = null
const handleResize = () => {
  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }
  resizeTimer = window.setTimeout(() => {
    checkMaximized()
  }, 200)
}

// 监听窗口显示事件（当窗口从最小化恢复时）
const handleWindowFocus = () => {
  // 窗口获得焦点时，重新检查最大化状态
  setTimeout(() => {
    checkMaximized()
  }, 100)
}

// 监听窗口可见性变化（当窗口从最小化恢复时）
const handleVisibilityChange = () => {
  if (!document.hidden) {
    // 窗口变为可见时，重新检查最大化状态
    setTimeout(() => {
      checkMaximized()
    }, 100)
  }
}

// 处理鼠标按下并拖动（用于检测拖拽）
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null
let mouseUpHandler: (() => void) | null = null

const handleMouseDown = (e: MouseEvent) => {
  // 如果点击的是按钮区域，不处理
  const target = e.target as HTMLElement
  if (target.closest('.window-controls')) {
    return
  }
  
  // 清理之前的事件监听器（如果存在）
  if (mouseMoveHandler) {
    window.removeEventListener('mousemove', mouseMoveHandler)
  }
  if (mouseUpHandler) {
    window.removeEventListener('mouseup', mouseUpHandler)
  }
  
  // 定义鼠标移动处理函数（只有在移动时才显示移动光标）
  mouseMoveHandler = () => {
    isDragging.value = true
  }
  
  // 定义鼠标释放处理函数（清理监听器，状态由 mouseleave 处理）
  mouseUpHandler = () => {
    if (mouseMoveHandler) {
      window.removeEventListener('mousemove', mouseMoveHandler)
      mouseMoveHandler = null
    }
    if (mouseUpHandler) {
      window.removeEventListener('mouseup', mouseUpHandler)
      mouseUpHandler = null
    }
  }
  
  window.addEventListener('mousemove', mouseMoveHandler)
  window.addEventListener('mouseup', mouseUpHandler)
}

// 处理鼠标进入标题栏（确保光标状态正确）
const handleTitleBarMouseEnter = () => {
  if (!mouseMoveHandler) {
    isDragging.value = false
  }
}

// 处理鼠标离开标题栏
const handleTitleBarMouseLeave = () => {
  // 鼠标离开标题栏时，立即重置为默认光标
  isDragging.value = false
  
  // 清理事件监听器
  if (mouseMoveHandler) {
    window.removeEventListener('mousemove', mouseMoveHandler)
    mouseMoveHandler = null
  }
  if (mouseUpHandler) {
    window.removeEventListener('mouseup', mouseUpHandler)
    mouseUpHandler = null
  }
}

// 处理标题栏点击（用于双击最大化/还原）
const handleTitleBarClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('.window-controls')) {
    return
  }
  
  // 重置光标状态
  isDragging.value = false
  
  clickCount++
  
  if (clickCount === 1) {
    clickTimer = window.setTimeout(() => {
      clickCount = 0
      clickTimer = null
    }, DOUBLE_CLICK_DELAY)
  } else if (clickCount === 2) {
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
    clickCount = 0
    handleMaximize()
    e.stopPropagation()
  }
}

onMounted(() => {
  checkMaximized()
  window.addEventListener('resize', handleResize)
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 添加事件监听
  if (titleBarRef.value) {
    titleBarRef.value.addEventListener('click', handleTitleBarClick)
    titleBarRef.value.addEventListener('mousedown', handleMouseDown)
    titleBarRef.value.addEventListener('mouseenter', handleTitleBarMouseEnter)
    titleBarRef.value.addEventListener('mouseleave', handleTitleBarMouseLeave)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  
  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }
  
  // 清理事件监听
  if (titleBarRef.value) {
    titleBarRef.value.removeEventListener('click', handleTitleBarClick)
    titleBarRef.value.removeEventListener('mousedown', handleMouseDown)
    titleBarRef.value.removeEventListener('mouseenter', handleTitleBarMouseEnter)
    titleBarRef.value.removeEventListener('mouseleave', handleTitleBarMouseLeave)
  }
  
  if (clickTimer) {
    clearTimeout(clickTimer)
  }
  
  // 清理拖拽相关的事件监听器
  if (mouseMoveHandler) {
    window.removeEventListener('mousemove', mouseMoveHandler)
  }
  if (mouseUpHandler) {
    window.removeEventListener('mouseup', mouseUpHandler)
  }
  
  // 强制重置状态
  isDragging.value = false
})
</script>

<style scoped>
.title-bar {
  height: 32px;
  background: var(--card-bg, #1e293b);
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  display: flex;
  align-items: center;
  user-select: none;
  /* 使用 Wails 原生的拖拽支持，比 -webkit-app-region 更流畅 */
  --wails-draggable: drag;
  position: relative;
  z-index: 1000;
  flex-shrink: 0;
  cursor: default; /* 默认光标 */
}

.title-bar.is-dragging {
  cursor: move !important; /* 拖拽时显示移动光标 */
}

.title-bar-drag-region {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  --wails-draggable: drag;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  --wails-draggable: drag;
}

.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--primary, #3b82f6);
  flex-shrink: 0;
  --wails-draggable: drag;
  pointer-events: none;
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text, #e2e8f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  --wails-draggable: drag;
  pointer-events: none;
}

.title-bar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  --wails-draggable: no-drag;
}

.window-controls {
  display: flex;
  align-items: center;
  --wails-draggable: no-drag;
  gap: 2px;
}

.window-control-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text, #e2e8f0);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  padding: 0;
  margin: 0;
  outline: none;
  --wails-draggable: no-drag;
}

.window-control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.window-control-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

.close-btn:hover {
  background: #e81123;
  color: white;
}

.close-btn:active {
  background: #c50e1f;
}

.window-control-btn svg {
  display: block;
  pointer-events: none;
}

/* 暗色主题适配 */
.light-mode .title-bar {
  background: var(--card-bg, #ffffff);
  border-bottom-color: var(--border, rgba(0, 0, 0, 0.1));
}

.light-mode .title-bar .app-title {
  color: var(--text, #1e293b);
}

.light-mode .window-control-btn {
  color: var(--text, #1e293b);
}

.light-mode .window-control-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.light-mode .close-btn:hover {
  background: #e81123;
  color: white;
}
</style>
