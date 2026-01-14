<template>
  <el-card class="config-card config-page" shadow="hover">
    <template #header>
      <h3>关于</h3>
    </template>

    <div class="about-content">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="产品名称">SSLProxyManager</el-descriptions-item>
        <el-descriptions-item label="当前版本">{{ version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="版权">© 2026</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-form :model="updateForm" label-width="180px">
        <el-form-item label="启用更新检查">
          <el-switch v-model="updateForm.Enabled" />
        </el-form-item>

        <el-form-item v-if="updateForm.Enabled" label="升级服务器地址">
          <el-input
            v-model="updateForm.ServerURL"
            placeholder="例如：https://example.com/api/update/check"
            style="max-width: 520px;"
          />
        </el-form-item>

        <el-form-item v-if="updateForm.Enabled" label="启动后自动检查">
          <el-switch v-model="updateForm.AutoCheck" />
        </el-form-item>

        <el-form-item v-if="updateForm.Enabled" label="超时(毫秒)">
          <el-input-number v-model="updateForm.TimeoutMs" :min="1000" :max="60000" />
        </el-form-item>

        <el-form-item v-if="updateForm.Enabled" label="忽略预发布版本">
          <el-switch v-model="updateForm.IgnorePrerelease" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleCheckUpdate" :loading="checking">
            检查新版本
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="checkResult"
        :title="resultTitle"
        :type="checkResult.has_update ? 'warning' : 'success'"
        :closable="false"
        show-icon
      >
        <template #default>
          <div v-if="checkResult.update_info">
            <div style="margin-bottom: 6px;"><strong>最新版本：</strong>{{ checkResult.update_info.latest_version }}</div>
            <div style="margin-bottom: 6px;" v-if="checkResult.update_info.release_notes">
              <strong>更新说明：</strong>{{ checkResult.update_info.release_notes }}
            </div>
            <div v-if="checkResult.has_update && checkResult.update_info.download_url">
              <strong>下载地址：</strong>
              <el-link type="primary" @click.prevent="handleOpenDownload(checkResult.update_info.download_url)">
                打开下载链接
              </el-link>
            </div>
          </div>
        </template>
      </el-alert>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { GetConfig, GetVersion, CheckUpdate, OpenURL } from '../api'

const version = ref<string>('')
const checking = ref(false)
const checkResult = ref<any>(null)

const updateForm = ref({
  Enabled: false,
  ServerURL: '',
  AutoCheck: false,
  TimeoutMs: 10000,
  IgnorePrerelease: true,
})

const resultTitle = computed(() => {
  if (!checkResult.value) return ''
  if (checkResult.value.error) return `检查失败：${checkResult.value.error}`
  if (checkResult.value.has_update) return '发现新版本'
  return '当前已是最新版本'
})

const loadInfo = async () => {
  try {
    version.value = await GetVersion()
  } catch (e: any) {
    version.value = ''
  }

  try {
    const cfg: any = await GetConfig()
    if (cfg && cfg.Update) {
      updateForm.value.Enabled = !!cfg.Update.Enabled
      updateForm.value.ServerURL = cfg.Update.ServerURL || ''
      updateForm.value.AutoCheck = !!cfg.Update.AutoCheck
      updateForm.value.TimeoutMs = cfg.Update.TimeoutMs || 10000
      updateForm.value.IgnorePrerelease = cfg.Update.IgnorePrerelease !== false
    }
  } catch (e: any) {
    // ignore
  }
}

const handleOpenDownload = (url: string) => {
  if (!url) {
    ElMessage.warning('下载链接为空')
    return
  }
  OpenURL(url)
}

const handleCheckUpdate = async () => {
  if (!updateForm.value.Enabled) {
    ElMessage.warning('请先启用更新检查')
    return
  }
  if (!updateForm.value.ServerURL) {
    ElMessage.warning('请先配置升级服务器地址')
    return
  }

  checking.value = true
  checkResult.value = null
  try {
    const res = await CheckUpdate()
    checkResult.value = res
  } catch (e: any) {
    ElMessage.error(`检查失败: ${e?.message || String(e)}`)
  } finally {
    checking.value = false
  }
}

// 暴露给父组件，用于保存配置
const getConfig = () => {
  return {
    Update: { ...updateForm.value }
  }
}

defineExpose({ getConfig })

onMounted(() => {
  loadInfo()
})

watch(() => updateForm.value, () => {
  // 仅本地编辑；真正写回配置由主界面的“保存配置”按钮统一处理
}, { deep: true })
</script>

<style scoped>
.about-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
