<template>
  <el-card class="config-card config-page" shadow="hover">
    <template #header>
      <h3>访问控制</h3>
    </template>

    <el-form label-width="180px">
      <el-form-item>
        <el-checkbox v-model="localConfig.allow_all_lan">
          允许所有局域网 IP 访问
        </el-checkbox>
        <el-text type="info" size="small" class="mini-hint">
          勾选后，所有局域网地址（如 192.168.x.x, 10.x.x.x）都将被允许访问，白名单依然有效。
        </el-text>
      </el-form-item>

      <el-form-item label="IP 白名单">
        <div class="whitelist-list">
          <div v-for="(item, index) in localConfig.whitelist" :key="index" class="whitelist-item">
            <el-input
              v-model="item.ip"
              placeholder="例如: 192.168.1.100"
              class="whitelist-input"
            />
            <el-button @click="removeWhitelistItem(index)" type="danger" size="small">删除</el-button>
          </div>
        </div>
        <el-button @click="addWhitelistItem" type="primary" style="margin-top: 10px;">
          <el-icon><Plus /></el-icon> 添加 IP 地址
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps<{ config: any }>()

const localConfig = ref({
  allow_all_lan: true,
  whitelist: [] as { ip: string }[],
})

watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      localConfig.value.allow_all_lan = newConfig.allow_all_lan ?? true
      localConfig.value.whitelist = Array.isArray(newConfig.whitelist) ? [...newConfig.whitelist] : []
    }
  },
  { immediate: true, deep: true }
)

const addWhitelistItem = () => {
  localConfig.value.whitelist.push({ ip: '' })
}

const removeWhitelistItem = (index: number) => {
  localConfig.value.whitelist.splice(index, 1)
}

// 供父组件调用
const getConfig = () => {
  return {
    allow_all_lan: localConfig.value.allow_all_lan,
    whitelist: localConfig.value.whitelist.filter((item) => item.ip.trim() !== ''),
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

.whitelist-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  width: 100%;
}

.whitelist-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.whitelist-input {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}
</style>
