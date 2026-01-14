<!-- frontend/src/components/BlacklistManager.vue -->
<template>
  <el-card class="config-card config-page" shadow="hover">
    <template #header>
      <div class="header-content">
        <h3>IP黑名单管理</h3>
        <div class="header-actions">
          <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
            添加黑名单
          </el-button>
          <el-button @click="refreshList" :loading="loading" :icon="Refresh">
            刷新列表
          </el-button>
          <el-button @click="refreshCache" :loading="refreshingCache" :icon="RefreshRight">
            刷新缓存
          </el-button>
        </div>
      </div>
    </template>

    <!-- 数据库状态提示 -->
    <el-alert
      v-if="dbStatus && !dbStatus.enabled"
      title="数据库未启用"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template #default>
        <div>
          <p>黑名单功能需要启用数据持久化才能使用。</p>
          <p>请前往 <strong>"数据持久化"</strong> 标签页启用数据库功能。</p>
        </div>
      </template>
    </el-alert>

    <!-- 黑名单列表 -->
    <el-table 
      :data="blacklist" 
      v-loading="loading" 
      stripe 
      border 
      style="width: 100%;"
    >
      <el-table-column prop="ip" label="IP地址" width="180" sortable />
      <el-table-column prop="reason" label="拉黑原因" min-width="200" show-overflow-tooltip />
      <el-table-column prop="expires_at" label="过期时间" width="180" sortable>
        <template #default="{ row }">
          <span v-if="row.expires_at === 0">永久</span>
          <span v-else>
            {{ formatTime(row.expires_at) }}
            <el-tag 
              v-if="isExpired(row.expires_at)" 
              type="danger" 
              size="small" 
              style="margin-left: 8px;"
            >
              已过期
            </el-tag>
            <el-tag 
              v-else 
              type="success" 
              size="small" 
              style="margin-left: 8px;"
            >
              有效
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable>
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="danger" 
            size="small" 
            @click="handleRemove(row.ip)"
            :icon="Delete"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加黑名单对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      title="添加黑名单" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" label-width="120px" :rules="addRules" ref="addFormRef">
        <el-form-item label="IP地址" prop="ip">
          <el-input 
            v-model="addForm.ip" 
            placeholder="请输入IP地址，例如：192.168.1.1"
            clearable
          />
          <el-text type="info" size="small" class="hint">
            支持IPv4和IPv6地址
          </el-text>
        </el-form-item>
        <el-form-item label="拉黑原因" prop="reason">
          <el-input 
            v-model="addForm.reason" 
            type="textarea" 
            :rows="3"
            placeholder="请输入拉黑原因（可选）"
            clearable
          />
        </el-form-item>
        <el-form-item label="拉黑时长">
          <el-radio-group v-model="addForm.durationType">
            <el-radio label="permanent">永久</el-radio>
            <el-radio label="temporary">临时</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item 
          v-if="addForm.durationType === 'temporary'" 
          label="时长（小时）" 
          prop="durationHours"
        >
          <el-input-number 
            v-model="addForm.durationHours" 
            :min="1" 
            :max="8760"
            placeholder="请输入小时数"
            style="width: 100%;"
          />
          <el-text type="info" size="small" class="hint">
            范围：1-8760小时（1年）
          </el-text>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="adding">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, RefreshRight, Delete } from '@element-plus/icons-vue'
// @ts-ignore
import { AddBlacklistEntry, RemoveBlacklistEntry, GetBlacklistEntries, RefreshBlacklistCache, GetMetricsDBStatus } from '../api'

interface BlacklistEntry {
  id: number
  ip: string
  reason?: string | null
  expires_at: number
  created_at: number
}

const blacklist = ref<BlacklistEntry[]>([])
const loading = ref(false)
const refreshingCache = ref(false)
const adding = ref(false)
const showAddDialog = ref(false)
const addFormRef = ref()
const dbStatus = ref<any>(null)

const addForm = ref({
  ip: '',
  reason: '',
  durationType: 'permanent' as 'permanent' | 'temporary',
  durationHours: 24
})

const addRules = {
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback(new Error('请输入IP地址'))
          return
        }
        // 简单的IP格式验证
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
        if (!ipv4Regex.test(value) && !ipv6Regex.test(value)) {
          callback(new Error('请输入有效的IP地址'))
          return
        }
        callback()
      }, 
      trigger: 'blur' 
    }
  ],
  durationHours: [
    { 
      validator: (rule: any, value: number, callback: Function) => {
        // 如果是永久，不需要验证
        if (addForm.value.durationType === 'permanent') {
          callback()
          return
        }
        // 临时拉黑需要验证
        if (!value || value < 1 || value > 8760) {
          callback(new Error('时长范围：1-8760小时'))
          return
        }
        callback()
      }, 
      trigger: 'blur' 
    }
  ]
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const isExpired = (expiresAt: number) => {
  if (expiresAt === 0) return false
  return Date.now() / 1000 > expiresAt
}

const refreshList = async () => {
  loading.value = true
  try {
    // @ts-ignore
    const entries = await GetBlacklistEntries()
    blacklist.value = entries || []
    ElMessage.success('黑名单列表已刷新')
  } catch (error: any) {
    console.error('获取黑名单失败:', error)
    ElMessage.error('获取黑名单失败: ' + (error.message || String(error)))
  } finally {
    loading.value = false
  }
}

const refreshCache = async () => {
  refreshingCache.value = true
  try {
    // @ts-ignore
    await RefreshBlacklistCache()
    ElMessage.success('缓存已刷新')
    // 刷新后重新加载列表
    await refreshList()
  } catch (error: any) {
    console.error('刷新缓存失败:', error)
    ElMessage.error('刷新缓存失败: ' + (error.message || String(error)))
  } finally {
    refreshingCache.value = false
  }
}

const handleAdd = async () => {
  if (!addFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  
  // 检查数据库状态
  const status = await checkDBStatus()
  if (!status || !status.enabled) {
    ElMessage.error({
      message: '数据库未启用！请先在"数据持久化"标签页中启用数据库功能。',
      duration: 5000,
      showClose: true,
    })
    return
  }
  
  if (!status.initialized) {
    ElMessage.error({
      message: '数据库未初始化！请检查数据库配置和路径。',
      duration: 5000,
      showClose: true,
    })
    return
  }
  
  try {
    await addFormRef.value.validate()
  } catch (error: any) {
    console.error('表单验证失败:', error)
    ElMessage.warning('请检查表单输入')
    return
  }

  adding.value = true
  try {
    const durationHours = addForm.value.durationType === 'permanent' ? 0 : addForm.value.durationHours
    
    console.log('准备添加黑名单:', {
      ip: addForm.value.ip,
      reason: addForm.value.reason,
      durationHours: durationHours
    })
    
    // @ts-ignore
    const result = await AddBlacklistEntry(addForm.value.ip, addForm.value.reason || '', durationHours)
    
    console.log('添加黑名单成功:', result)
    ElMessage.success('黑名单已添加')
    showAddDialog.value = false
    
    // 重置表单
    addForm.value = {
      ip: '',
      reason: '',
      durationType: 'permanent',
      durationHours: 24
    }
    
    // 重置表单验证状态
    if (addFormRef.value) {
      addFormRef.value.resetFields()
    }
    
    // 刷新列表
    await refreshList()
  } catch (error: any) {
    console.error('添加黑名单失败:', error)
    let errorMsg = error?.message || error?.toString() || '未知错误'
    
    // 如果是数据库相关错误，提供更友好的提示
    if (errorMsg.includes('数据库未启用') || errorMsg.includes('数据库未初始化')) {
      errorMsg = '数据库未启用或未初始化。请先在"数据持久化"标签页中启用数据库功能。'
    }
    
    ElMessage.error({
      message: '添加黑名单失败: ' + errorMsg,
      duration: 5000,
      showClose: true,
    })
  } finally {
    adding.value = false
  }
}

const handleRemove = async (ip: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除IP "${ip}" 的黑名单记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // @ts-ignore
    await RemoveBlacklistEntry(ip)
    ElMessage.success('黑名单已删除')
    // 刷新列表
    await refreshList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除黑名单失败:', error)
      ElMessage.error('删除黑名单失败: ' + (error.message || String(error)))
    }
  }
}

onMounted(async () => {
  await refreshList()
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h3 {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.hint {
  margin-left: 12px;
  font-size: 12px;
  display: block;
  margin-top: 4px;
}
</style>
