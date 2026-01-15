<!-- frontend/src/components/BaseConfig.vue -->
<template>
  <el-card class="config-card config-page" shadow="hover">
    <template #header>
      <h3>基础配置</h3>
    </template>
    <el-form label-width="120px">
      <el-form-item label="开机自启">
        <el-switch v-model="autoStart" />
        <el-text type="info" size="small" class="mini-hint" style="margin-left: 10px;">
          启用后，应用将在您登录系统时自动启动。
        </el-text>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GetConfig } from '../api'

const autoStart = ref(false)

onMounted(async () => {
  try {
    const configData = (await GetConfig()) as any
    autoStart.value = !!configData.auto_start
  } catch {
    // ignore
  }
})

const getConfig = () => {
  return {
    auto_start: !!autoStart.value,
  }
}

defineExpose({
  getConfig,
})
</script>

<style scoped>
.config-card {
  height: 100%;
  overflow-y: auto;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.config-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--border);
  padding: 20px;
}

.config-card :deep(.el-card__body) {
  padding: 24px;
}

.config-card h3 {
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

.mini-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
