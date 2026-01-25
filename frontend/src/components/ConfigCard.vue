<!-- frontend/src/components/ConfigCard.vue -->
<template>
  <el-card class="config-card config-page" shadow="hover">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <h3>代理配置</h3>
        <el-button type="primary" @click="exportConfigToml">
          导出当前配置
        </el-button>
      </div>
    </template>

    <!-- 规则配置 -->
    <TransitionGroup name="list" tag="div" class="rules-section">
      <el-card 
        v-for="(rule, ruleIndex) in rules" 
        :key="rule.ID || ruleIndex"
        class="rule-card"
        shadow="hover"
      >
        <template #header>
          <div class="rule-header">
            <h4>规则 {{ ruleIndex + 1 }}</h4>
            <div style="display: flex; align-items: center; gap: 12px;">
              <el-switch v-model="rule.Enabled" @change="() => onToggleListenRuleEnabled(rule)" />
              <el-button 
                @click="removeRule(ruleIndex)" 
                type="danger"
                size="small"
                :disabled="rules.length <= 1"
              >
                删除规则
              </el-button>
            </div>
          </div>
        </template>

        <el-form :model="rule" label-width="120px" class="form-grid">
          <el-form-item label="监听地址">
            <el-input v-model="rule.ListenAddr" placeholder="0.0.0.0:8888" style="width: 260px;"/>
          </el-form-item>

          <el-form-item label="路由规则" required>
            <TransitionGroup name="list" tag="div" class="routes-section">
              <el-card 
                v-for="(rt, routeIndex) in rule.Routes" 
                :key="rt.ID || routeIndex"
                class="route-card"
                shadow="never"
              >
                <template #header>
                  <div class="route-header">
                    <div class="route-title">路由 {{ routeIndex + 1 }}</div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <el-switch v-model="rt.Enabled" @change="() => onToggleRouteEnabled(rule, rt)" />
                      <el-button
                        @click="removeRoute(ruleIndex, routeIndex)"
                        type="danger"
                        size="small"
                        :disabled="rule.Routes.length <= 1"
                      >
                        删除路由
                      </el-button>
                    </div>
                  </div>
                </template>

                <el-form :model="rt" label-width="160px" class="route-form">
                  <el-row :gutter="20" class="route-match">
                    <el-col :span="10">
                      <el-form-item label="Host（可选）">
                        <el-input v-model="rt.Host" placeholder="Host 匹配未实现；如需修改上游 Host 请在 proxy_set_header 中设置 Host" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="10">
                      <el-form-item label="Path 前缀（location）">
                        <el-input v-model="rt.Path" placeholder="/ 或 /api" />
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="22">
                    <el-col :span="10">
                      <el-form-item label="proxy_pass_path（可选）">
                        <el-input v-model="rt.ProxyPassPath" placeholder="/v1 （留空表示不重写）" />
                        <el-text type="info" size="small" class="mini-hint">
                          等价 nginx: proxy_pass http://upstream&lt;这里&gt;;
                        </el-text>
                      </el-form-item>

                      <el-form-item label="follow_redirects" style="margin-top: 10px;">
                        <el-switch v-model="rt.FollowRedirects" />
                        <el-text type="info" size="small" class="mini-hint">
                          开启：由代理端跟随上游 30x 并返回最终响应（客户端通常不会再跳转）；关闭：直接把 30x 原样返回给客户端（浏览器会自动跳转）。网站类反代建议关闭，API 如需可开启
                        </el-text>
                      </el-form-item>
                    </el-col>
                    <el-col :span="10">
                      <el-form-item label="静态文件目录（可选）">
                        <div class="file-selector">
                          <el-input v-model="rt.StaticDir" placeholder="./frontend/dist 或绝对路径" readonly />
                        </div>
                        <el-text type="info" size="small" class="mini-hint">
                          优先提供静态文件，不存在时回退到上游服务器
                        </el-text>
                      </el-form-item>
                    </el-col>
                    <el-col :span="2">
                      <el-button @click="selectDirectory(ruleIndex, routeIndex)" size="small" type="primary" :icon="Folder">
                            选择目录
                          </el-button>
                    </el-col>
                  </el-row>

                  <el-row :gutter="20">
                    <el-col :span="10">
                      <el-form-item>
                        <el-checkbox v-model="rt.ExcludeBasicAuth">
                          排除 Basic Auth 验证
                        </el-checkbox>
                        <el-text type="info" size="small" class="mini-hint">
                          勾选后，此路由将跳过 Basic Auth 验证
                        </el-text>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>

                <div class="sub-section">
                  <div class="sub-section-header">上游服务器</div>
                  <div class="sub-section-body">
                    <TransitionGroup name="list" tag="div">
                      <div v-for="(upstream, index) in rt.Upstreams" :key="index" class="upstream-item">
                          <el-input
                            v-model="upstream.URL"
                            :placeholder="index === 0 ? 'http://127.0.0.1:8080' : 'https://example.com'"
                          />
                          <el-input-number
                            v-model="upstream.Weight"
                            :min="1"
                            placeholder="权重"
                          />
                          <el-button
                            @click="removeUpstream(ruleIndex, routeIndex, index)"
                            type="danger"
                            size="small"
                            :disabled="rt.Upstreams.length <= 1 && !(rt.StaticDir && rt.StaticDir.trim() !== '')"
                          >
                            删除
                          </el-button>
                      </div>
                    </TransitionGroup>
                    <el-button @click="addUpstream(ruleIndex, routeIndex)" type="primary" style="margin-top: 12px;">
                      <el-icon><Plus /></el-icon> 添加新的上游服务器
                    </el-button>
                  </div>
                </div>

                <div class="sub-section">
                  <div class="sub-section-header">proxy_set_header（可选）</div>
                  <div class="sub-section-body">
                    <el-text type="info" size="small" class="headers-hint">
                      支持变量：$remote_addr / $proxy_add_x_forwarded_for / $scheme
                    </el-text>
                    <div class="headers-actions">
                      <el-button @click="applyCommonHeaders(rt)" type="primary" size="small">
                        <el-icon><MagicStick /></el-icon> 快速应用常用 Nginx Headers
                      </el-button>
                    </div>
                    <TransitionGroup name="list" tag="div">
                      <div v-for="(kv, hIndex) in (rt.SetHeadersList || [])" :key="hIndex" class="header-item">
                        <el-input v-model="kv.Key" placeholder="Header-Key (如 Host)" />
                        <el-input v-model="kv.Value" placeholder="Header-Value (如 $remote_addr)" />
                        <el-button @click="(rt.SetHeadersList || []).splice(hIndex, 1)" type="danger" size="small">删除</el-button>
                      </div>
                    </TransitionGroup>
                    <el-button @click="(rt.SetHeadersList ||= []).push({ Key: '', Value: '' })" type="primary" size="small" style="margin-top: 12px;">
                      <el-icon><Plus /></el-icon> 添加自定义 Header
                    </el-button>
                  </div>
                </div>

                <div class="sub-section">
                  <div class="sub-section-header">请求/响应修改</div>
                  <div class="sub-section-body">
                    <!-- URL 重写规则 -->
                    <el-form-item label="URL 重写规则">
                      <TransitionGroup name="list" tag="div">
                        <div v-for="(rule, idx) in (rt.UrlRewriteRules || [])" :key="idx" class="rewrite-rule-item">
                          <el-input v-model="rule.Pattern" placeholder="正则表达式，如: ^/api/(.*)$" style="flex: 1;" />
                          <el-input v-model="rule.Replacement" placeholder="替换为，如: /v1/$1" style="flex: 1;" />
                          <el-switch v-model="rule.Enabled" />
                          <el-button @click="(rt.UrlRewriteRules || []).splice(idx, 1)" type="danger" size="small">删除</el-button>
                        </div>
                      </TransitionGroup>
                      <el-button @click="(rt.UrlRewriteRules ||= []).push({ Pattern: '', Replacement: '', Enabled: true })" type="primary" size="small" style="margin-top: 12px;">
                        <el-icon><Plus /></el-icon> 添加 URL 重写规则
                      </el-button>
                      <el-text type="info" size="small" class="mini-hint">
                        使用正则表达式匹配 URL，支持 $1, $2 等捕获组。例如：^/api/(.*)$ 替换为 /v1/$1
                      </el-text>
                    </el-form-item>

                    <!-- 请求体替换规则 -->
                    <el-form-item label="请求体替换规则">
                      <TransitionGroup name="list" tag="div">
                        <div v-for="(rule, idx) in (rt.RequestBodyReplace || [])" :key="idx" class="replace-rule-item">
                          <el-input v-model="rule.Find" placeholder="查找文本（支持正则）" style="flex: 1;" />
                          <el-input v-model="rule.Replace" placeholder="替换为" style="flex: 1;" />
                          <el-checkbox v-model="rule.UseRegex">正则</el-checkbox>
                          <el-switch v-model="rule.Enabled" />
                          <el-button @click="(rt.RequestBodyReplace || []).splice(idx, 1)" type="danger" size="small">删除</el-button>
                        </div>
                      </TransitionGroup>
                      <el-button @click="(rt.RequestBodyReplace ||= []).push({ Find: '', Replace: '', UseRegex: false, Enabled: true })" type="primary" size="small" style="margin-top: 12px;">
                        <el-icon><Plus /></el-icon> 添加请求体替换规则
                      </el-button>
                      <el-text type="info" size="small" class="mini-hint">
                        对请求体进行文本替换，支持正则表达式。仅对文本类型的请求体有效。
                      </el-text>
                    </el-form-item>

                    <!-- 响应体替换规则 -->
                    <el-form-item label="响应体替换规则">
                      <el-alert
                        type="warning"
                        :closable="false"
                        style="margin-bottom: 12px;"
                      >
                        <template #title>
                          <strong>⚠️ 法律风险提示</strong>
                        </template>
                        <template #default>
                          <div style="font-size: 12px; line-height: 1.6;">
                            响应体修改功能可用于合法用途（如内容定制、广告过滤等），但请确保：
                            <br />• 仅在你拥有或已获得授权的设备/网络上使用
                            <br />• 不用于欺诈、钓鱼或其他非法用途
                            <br />• 遵守相关法律法规和网站服务条款
                            <br />• 任何非法使用产生的法律责任由使用者自行承担
                          </div>
                        </template>
                      </el-alert>
                      <TransitionGroup name="list" tag="div">
                        <div v-for="(rule, idx) in (rt.ResponseBodyReplace || [])" :key="idx" class="replace-rule-item">
                          <el-input v-model="rule.Find" placeholder="查找文本（支持正则）" style="flex: 1;" />
                          <el-input v-model="rule.Replace" placeholder="替换为" style="flex: 1;" />
                          <el-checkbox v-model="rule.UseRegex">正则</el-checkbox>
                          <el-switch v-model="rule.Enabled" />
                          <el-button @click="(rt.ResponseBodyReplace || []).splice(idx, 1)" type="danger" size="small">删除</el-button>
                        </div>
                      </TransitionGroup>
                      <el-button @click="(rt.ResponseBodyReplace ||= []).push({ Find: '', Replace: '', UseRegex: false, Enabled: true })" type="primary" size="small" style="margin-top: 12px;">
                        <el-icon><Plus /></el-icon> 添加响应体替换规则
                      </el-button>
                      <el-text type="info" size="small" class="mini-hint">
                        对响应体进行文本替换，支持正则表达式。仅对文本类型的响应体有效。
                      </el-text>
                    </el-form-item>

                    <!-- 移除请求/响应头 -->
                    <el-form-item label="移除请求/响应头">
                      <TransitionGroup name="list" tag="div">
                        <div v-for="(header, idx) in (rt.RemoveHeaders || [])" :key="idx" class="header-item">
                          <el-input v-model="rt.RemoveHeaders[idx]" placeholder="Header 名称，如: X-API-Key" />
                          <el-button @click="(rt.RemoveHeaders || []).splice(idx, 1)" type="danger" size="small">删除</el-button>
                        </div>
                      </TransitionGroup>
                      <el-button @click="(rt.RemoveHeaders ||= []).push('')" type="primary" size="small" style="margin-top: 12px;">
                        <el-icon><Plus /></el-icon> 添加要移除的 Header
                      </el-button>
                      <el-text type="info" size="small" class="mini-hint">
                        指定要从请求和响应中移除的 Header 名称。
                      </el-text>
                    </el-form-item>
                  </div>
                </div>
              </el-card>
            </TransitionGroup>
              <el-button @click="addRoute(ruleIndex)" type="primary" style="margin-top: 10px;">
                <el-icon><Plus /></el-icon> 添加新的路由规则
              </el-button>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="rule.SSLEnable">该规则启用 SSL/HTTPS</el-checkbox>
          </el-form-item>

          <template v-if="rule.SSLEnable">
            <el-form-item label="证书文件 (cert)">
              <div class="file-selector">
                <el-input v-model="rule.CertFile" placeholder="ssl/server.crt" readonly />
                <el-button @click="selectCertFile(ruleIndex)" type="primary" :icon="Folder">
                  选择文件
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="私钥文件 (key)">
              <div class="file-selector">
                <el-input v-model="rule.KeyFile" placeholder="ssl/server.key" readonly />
                <el-button @click="selectKeyFile(ruleIndex)" type="primary" :icon="Folder">
                  选择文件
                </el-button>
              </div>
            </el-form-item>
          </template>

          <el-form-item>
            <el-checkbox v-model="rule.BasicAuthEnable">启用 Basic Auth 认证</el-checkbox>
          </el-form-item>

          <template v-if="rule.BasicAuthEnable">
            <el-form-item label="用户名">
              <el-input v-model="rule.BasicAuthUsername" placeholder="admin" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="rule.BasicAuthPassword" type="password" placeholder="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="rule.BasicAuthForwardHeader">
                将 Basic Auth 头转发到上游服务器
              </el-checkbox>
              <el-text type="info" size="small" class="mini-hint">
                默认不转发，避免影响后端 API 的认证（如 JWT、OAuth 等）
              </el-text>
            </el-form-item>
          </template>

          <el-divider />

          <el-form-item>
            <el-checkbox v-model="rule.RateLimitEnabled">启用速率限制</el-checkbox>
            <el-text type="info" size="small" class="mini-hint" style="margin-left: 10px;">
              按IP限制请求频率，防止DDoS攻击和滥用。
            </el-text>
          </el-form-item>

          <template v-if="rule.RateLimitEnabled">
            <el-form-item label="每秒请求数限制">
              <el-input-number 
                v-model="rule.RateLimitRequestsPerSecond" 
                :min="1" 
                :max="10000" 
                :step="1" 
                controls-position="right"
                style="width: 200px;"
              />
              <el-text type="info" size="small" class="mini-hint" style="margin-left: 10px;">
                每个IP每秒允许的最大请求数。推荐值：10-100。
              </el-text>
            </el-form-item>

            <el-form-item label="突发请求数">
              <el-input-number 
                v-model="rule.RateLimitBurstSize" 
                :min="1" 
                :max="1000" 
                :step="1" 
                controls-position="right"
                style="width: 200px;"
              />
              <el-text type="info" size="small" class="mini-hint" style="margin-left: 10px;">
                令牌桶容量，允许短时间内的突发请求。推荐值：20-100。
              </el-text>
            </el-form-item>

            <el-form-item label="超过限制封禁秒数">
              <el-input-number 
                v-model="rule.RateLimitBanSeconds" 
                :min="0" 
                :max="86400" 
                :step="1" 
                controls-position="right"
                style="width: 200px;"
              />
              <el-text type="info" size="small" class="mini-hint" style="margin-left: 10px;">
                超过速率限制后自动封禁的秒数。0表示不封禁，只返回429错误。推荐值：60-3600。
              </el-text>
            </el-form-item>
          </template>
        </el-form>
      </el-card>
    </TransitionGroup>

      <el-button @click="addRule" type="primary" style="margin-top: 10px;">
        <el-icon><Plus /></el-icon> 添加新的监听规则
      </el-button>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GetConfig, OpenCertFileDialog, OpenKeyFileDialog, OpenDirectoryDialog, ExportCurrentConfigToml, SetListenRuleEnabled, SetRouteEnabled } from '../api'
import { Plus, MagicStick, Folder } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Upstream {
  URL: string
  Weight: number
}

interface HeaderKV {
  Key: string
  Value: string
}

interface Route {
  ID?: string
  Enabled?: boolean
  Host: string
  Path: string

  ProxyPassPath?: string
  FollowRedirects?: boolean
  SetHeaders?: Record<string, string>
  SetHeadersList?: HeaderKV[]

  StaticDir?: string
  ExcludeBasicAuth?: boolean
  UrlRewriteRules?: UrlRewriteRule[]
  RequestBodyReplace?: BodyReplaceRule[]
  ResponseBodyReplace?: BodyReplaceRule[]
  RemoveHeaders?: string[]

  Upstreams: Upstream[]
}

interface UrlRewriteRule {
  Pattern: string
  Replacement: string
  Enabled?: boolean
}

interface BodyReplaceRule {
  Find: string
  Replace: string
  UseRegex?: boolean
  Enabled?: boolean
}

interface ListenRule {
  ID?: string
  Enabled?: boolean
  ListenAddr: string
  SSLEnable: boolean
  CertFile: string
  KeyFile: string
  BasicAuthEnable?: boolean
  BasicAuthUsername?: string
  BasicAuthPassword?: string
  BasicAuthForwardHeader?: boolean
  RateLimitEnabled?: boolean
  RateLimitRequestsPerSecond?: number
  RateLimitBurstSize?: number
  RateLimitBanSeconds?: number
  Routes: Route[]
}

// Tauri 后端返回的文件选择结果可能是 string | null
// 这里兼容 ElementPlus v-model 以及 OpenDirectoryDialog 返回类型

const rules = ref<ListenRule[]>([
  {
    ListenAddr: '0.0.0.0:8888',
    SSLEnable: false,
    CertFile: '',
    KeyFile: '',
    BasicAuthEnable: false,
    BasicAuthUsername: '',
    BasicAuthPassword: '',
    Routes: [
      {
        Host: '',
        Path: '/',
        ProxyPassPath: '',
        SetHeaders: {} as Record<string, string>,
        SetHeadersList: [],
        StaticDir: '',
        ExcludeBasicAuth: false,
        Upstreams: [{ URL: '', Weight: 1 }],
      },
    ],
  },
])

const onToggleListenRuleEnabled = async (rule: ListenRule) => {
  try {
    if (!rule.ID) {
      ElMessage.warning('请先保存配置以生成规则 ID')
      rule.Enabled = true
      return
    }
    const next = !!rule.Enabled
    const cfg = (await SetListenRuleEnabled(rule.ID, next)) as any
    // 用后端返回的最新配置回填，保证持久化状态与 UI 一致
    if (cfg && Array.isArray(cfg.rules)) {
      const found = cfg.rules.find((r: any) => (r.id || '') === rule.ID)
      if (found && found.enabled !== undefined) {
        rule.Enabled = !!found.enabled
      }
    }
    ElMessage.success(next ? '监听规则已启用' : '监听规则已禁用')
  } catch (error: any) {
    ElMessage.error(`切换监听规则失败: ${error?.message || error}`)
    rule.Enabled = !rule.Enabled
  }
}

const onToggleRouteEnabled = async (rule: ListenRule, rt: Route) => {
  try {
    if (!rule.ID || !rt.ID) {
      ElMessage.warning('请先保存配置以生成规则/路由 ID')
      rt.Enabled = true
      return
    }
    const next = !!rt.Enabled
    const cfg = (await SetRouteEnabled(rule.ID, rt.ID, next)) as any
    if (cfg && Array.isArray(cfg.rules)) {
      const foundRule = cfg.rules.find((r: any) => (r.id || '') === rule.ID)
      const foundRt = (foundRule?.routes || []).find((r: any) => (r.id || '') === rt.ID)
      if (foundRt && foundRt.enabled !== undefined) {
        rt.Enabled = !!foundRt.enabled
      }
    }
    ElMessage.success(next ? '路由已启用' : '路由已禁用')
  } catch (error: any) {
    ElMessage.error(`切换路由失败: ${error?.message || error}`)
    rt.Enabled = !rt.Enabled
  }
}

onMounted(async () => {
  const configData = (await GetConfig()) as any;

  if (Array.isArray(configData.rules) && configData.rules.length > 0) {
    rules.value = configData.rules.map((rule: any) => {
      const routes = (rule.routes || []).map((rt: any) => ({
        ID: rt.id || '',
        Enabled: rt.enabled !== undefined ? !!rt.enabled : true,
        Host: rt.host || '',
        Path: rt.path || '/',
        ProxyPassPath: rt.proxy_pass_path || '',
        FollowRedirects: !!rt.follow_redirects,
        SetHeaders: rt.set_headers || {},
        SetHeadersList: Object.entries(rt.set_headers || {}).map(([Key, Value]) => ({
          Key,
          Value: String(Value ?? ''),
        })),
        StaticDir: rt.static_dir || '',
        ExcludeBasicAuth: !!rt.exclude_basic_auth,
        UrlRewriteRules: (rt.url_rewrite_rules || []).map((r: any) => ({
          Pattern: r.pattern || '',
          Replacement: r.replacement || '',
          Enabled: r.enabled !== undefined ? !!r.enabled : true,
        })),
        RequestBodyReplace: (rt.request_body_replace || []).map((r: any) => ({
          Find: r.find || '',
          Replace: r.replace || '',
          UseRegex: !!r.use_regex,
          Enabled: r.enabled !== undefined ? !!r.enabled : true,
        })),
        ResponseBodyReplace: (rt.response_body_replace || []).map((r: any) => ({
          Find: r.find || '',
          Replace: r.replace || '',
          UseRegex: !!r.use_regex,
          Enabled: r.enabled !== undefined ? !!r.enabled : true,
        })),
        RemoveHeaders: rt.remove_headers || [],
        Upstreams: (rt.upstreams || []).map((u: any) => ({
          URL: u.url || '',
          Weight: u.weight || 1,
        })),
      }));

      return {
        ID: rule.id || '',
        Enabled: rule.enabled !== undefined ? !!rule.enabled : true,
        ListenAddr: rule.listen_addr || '0.0.0.0:8888',
        SSLEnable: !!rule.ssl_enable,
        CertFile: rule.cert_file || '',
        KeyFile: rule.key_file || '',
        BasicAuthEnable: !!rule.basic_auth_enable,
        BasicAuthUsername: rule.basic_auth_username || '',
        BasicAuthPassword: rule.basic_auth_password || '',
        BasicAuthForwardHeader: !!rule.basic_auth_forward_header,
    RateLimitEnabled: rule.rate_limit_enabled !== undefined ? !!rule.rate_limit_enabled : undefined,
    RateLimitRequestsPerSecond: rule.rate_limit_requests_per_second !== undefined ? Number(rule.rate_limit_requests_per_second) : undefined,
    RateLimitBurstSize: rule.rate_limit_burst_size !== undefined ? Number(rule.rate_limit_burst_size) : undefined,
    RateLimitBanSeconds: rule.rate_limit_ban_seconds !== undefined ? Number(rule.rate_limit_ban_seconds) : undefined,
        Routes: routes.length > 0 ? routes : [{
          Host: '',
          Path: '/',
          ProxyPassPath: '',
          SetHeaders: {} as Record<string, string>,
          SetHeadersList: [],
          StaticDir: '',
          ExcludeBasicAuth: false,
          Upstreams: [{ URL: '', Weight: 1 }],
        }],
      } as ListenRule;
    });
  } else {
    // 如果没有规则，则使用默认的空规则
    rules.value = [
      {
        ListenAddr: '0.0.0.0:8888',
        SSLEnable: false,
        CertFile: '',
        KeyFile: '',
        BasicAuthEnable: false,
        BasicAuthUsername: '',
        BasicAuthPassword: '',
        BasicAuthForwardHeader: false,
        RateLimitEnabled: undefined,
        RateLimitRequestsPerSecond: undefined,
        RateLimitBurstSize: undefined,
        RateLimitBanSeconds: undefined,
        Routes: [
          {
            Host: '',
            Path: '/',
            ProxyPassPath: '',
            SetHeaders: {} as Record<string, string>,
            SetHeadersList: [],
            StaticDir: '',
            ExcludeBasicAuth: false,
            Upstreams: [{ URL: '', Weight: 1 }],
          },
        ],
      },
    ];
  }
})

const addRule = () => {
  rules.value.push({
    ID: `new-rule-${Date.now()}`,
    ListenAddr: '0.0.0.0:8888',
    SSLEnable: false,
    CertFile: '',
    KeyFile: '',
    BasicAuthEnable: false,
    BasicAuthUsername: '',
    BasicAuthPassword: '',
    BasicAuthForwardHeader: false,
    RateLimitEnabled: undefined,
    RateLimitRequestsPerSecond: undefined,
    RateLimitBurstSize: undefined,
    RateLimitBanSeconds: undefined,
    Routes: [
      {
        ID: `new-route-${Date.now()}`,
        Host: '',
        Path: '/',
        ProxyPassPath: '',
        SetHeaders: {} as Record<string, string>,
        SetHeadersList: [],
        StaticDir: '',
        ExcludeBasicAuth: false,
        Upstreams: [{ URL: '', Weight: 1 }],
      },
    ],
  })
}

const removeRule = (index: number) => {
  if (rules.value.length > 1) {
    rules.value.splice(index, 1)
  }
}

const addUpstream = (ruleIndex: number, routeIndex: number) => {
  rules.value[ruleIndex].Routes[routeIndex].Upstreams.push({ URL: '', Weight: 1 })
}

const removeUpstream = (ruleIndex: number, routeIndex: number, upstreamIndex: number) => {
  const rt = rules.value[ruleIndex].Routes[routeIndex]
  const list = rt.Upstreams
  const hasStaticDir = !!(rt.StaticDir && rt.StaticDir.trim() !== '')

  // 如果配置了静态目录，则允许删到 0 个上游
  const minLen = hasStaticDir ? 0 : 1
  if (list.length > minLen) {
    list.splice(upstreamIndex, 1)
  }
}

const applyCommonHeaders = (rt: Route) => {
  rt.SetHeadersList ||= []

  const common: HeaderKV[] = [
    { Key: 'Host', Value: '' },
    { Key: 'X-Real-IP', Value: '$remote_addr' },
    { Key: 'X-Forwarded-For', Value: '$proxy_add_x_forwarded_for' },
    { Key: 'X-Forwarded-Proto', Value: '$scheme' },
  ]

  const hostVal = (rt.Host || '').trim()

  const existing = new Map<string, number>()
  for (let i = 0; i < rt.SetHeadersList.length; i++) {
    const k = (rt.SetHeadersList[i].Key || '').trim().toLowerCase()
    if (!k) continue
    existing.set(k, i)
  }

  for (const kv of common) {
    const keyLower = kv.Key.toLowerCase()
    const value = kv.Key === 'Host' ? (hostVal || kv.Value) : kv.Value

    if (existing.has(keyLower)) {
      const idx = existing.get(keyLower)!
      if (!rt.SetHeadersList[idx].Value || rt.SetHeadersList[idx].Value.trim() === '') {
        rt.SetHeadersList[idx].Value = value
      }
    } else {
      rt.SetHeadersList.push({ Key: kv.Key, Value: value })
      existing.set(keyLower, rt.SetHeadersList.length - 1)
    }
  }
}

const addRoute = (ruleIndex: number) => {
  rules.value[ruleIndex].Routes.push({
    ID: `new-route-${Date.now()}`,
    Host: '',
    Path: '/',
    ProxyPassPath: '',
    SetHeaders: {} as Record<string, string>,
    SetHeadersList: [],
    StaticDir: '',
    ExcludeBasicAuth: false,
    UrlRewriteRules: [],
    RequestBodyReplace: [],
    ResponseBodyReplace: [],
    RemoveHeaders: [],
    Upstreams: [{ URL: '', Weight: 1 }],
  })
}

const removeRoute = (ruleIndex: number, routeIndex: number) => {
  const list = rules.value[ruleIndex].Routes
  if (list.length > 1) {
    list.splice(routeIndex, 1)
  }
}

const selectCertFile = async (ruleIndex: number) => {
  try {
    const filePath = await OpenCertFileDialog()
    if (filePath) {
      rules.value[ruleIndex].CertFile = String(filePath)
    }
  } catch (error: any) {
    ElMessage.error(`选择证书文件失败: ${error.message || error}`)
  }
}

const selectKeyFile = async (ruleIndex: number) => {
  try {
    const filePath = await OpenKeyFileDialog()
    if (filePath) {
      rules.value[ruleIndex].KeyFile = String(filePath)
    }
  } catch (error: any) {
    ElMessage.error(`选择私钥文件失败: ${error.message || error}`)
  }
}

const selectDirectory = async (ruleIndex: number, routeIndex: number) => {
  try {
    const dirPath = await OpenDirectoryDialog()
    if (dirPath) {
      const rt = rules.value[ruleIndex].Routes[routeIndex]
      rt.StaticDir = String(dirPath)

      // 如果选择了静态目录，允许上游为空：自动清理掉仅用于占位的空上游
      rt.Upstreams = (rt.Upstreams || []).filter((u) => (u.URL || '').trim() !== '')
    }
  } catch (error: any) {
    ElMessage.error(`选择目录失败: ${error.message || error}`)
  }
}

const normalizePath = (p: string) => {
  const v = (p || '').trim()
  if (!v) return '/'
  return v.startsWith('/') ? v : '/' + v
}

const exportConfigToml = async () => {
  try {
    const savedPath = (await ExportCurrentConfigToml()) as string | null
    if (savedPath) {
      ElMessage.success(`已导出到: ${savedPath}`)
    }
  } catch (error: any) {
    ElMessage.error(`导出失败: ${error?.message || error}`)
  }
}


// 获取配置（供父组件调用）
const getConfig = () => {
  const currentRules = [...rules.value]

  const cleanedRules: ListenRule[] = currentRules.map((rule) => ({
    ID: (rule.ID || '').trim(),
    Enabled: rule.Enabled !== undefined ? !!rule.Enabled : true,
    ListenAddr: rule.ListenAddr.trim(),
    SSLEnable: !!rule.SSLEnable,
    CertFile: rule.CertFile || '',
    KeyFile: rule.KeyFile || '',
    BasicAuthEnable: !!rule.BasicAuthEnable,
    BasicAuthUsername: (rule.BasicAuthUsername || '').trim(),
    BasicAuthPassword: (rule.BasicAuthPassword || '').trim(),
    BasicAuthForwardHeader: !!rule.BasicAuthForwardHeader,
    RateLimitEnabled: rule.RateLimitEnabled !== undefined ? !!rule.RateLimitEnabled : undefined,
    RateLimitRequestsPerSecond: rule.RateLimitRequestsPerSecond !== undefined ? Number(rule.RateLimitRequestsPerSecond) : undefined,
    RateLimitBurstSize: rule.RateLimitBurstSize !== undefined ? Number(rule.RateLimitBurstSize) : undefined,
    RateLimitBanSeconds: rule.RateLimitBanSeconds !== undefined ? Number(rule.RateLimitBanSeconds) : undefined,
    Routes: rule.Routes.map((rt) => {
      const list = Array.isArray(rt.SetHeadersList) ? rt.SetHeadersList : []
      const setHeaders: Record<string, string> = {}
      for (const kv of list) {
        const k = (kv.Key || '').trim()
        if (!k) continue
        setHeaders[k] = (kv.Value || '').trim()
      }
      return {
        ID: (rt.ID || '').trim(),
        Enabled: rt.Enabled !== undefined ? !!rt.Enabled : true,
        Host: (rt.Host || '').trim(),
        Path: normalizePath(rt.Path),
        ProxyPassPath: rt.ProxyPassPath ? normalizePath(rt.ProxyPassPath) : '',
        FollowRedirects: !!rt.FollowRedirects,
        SetHeaders: setHeaders,
        StaticDir: (rt.StaticDir || '').trim(),
        ExcludeBasicAuth: !!rt.ExcludeBasicAuth,
        UrlRewriteRules: (rt.UrlRewriteRules || []).filter((r) => r.Pattern.trim() !== '').map((r) => ({
          Pattern: r.Pattern.trim(),
          Replacement: r.Replacement.trim(),
          Enabled: r.Enabled !== undefined ? !!r.Enabled : true,
        })),
        RequestBodyReplace: (rt.RequestBodyReplace || []).filter((r) => r.Find.trim() !== '').map((r) => ({
          Find: r.Find.trim(),
          Replace: r.Replace.trim(),
          UseRegex: !!r.UseRegex,
          Enabled: r.Enabled !== undefined ? !!r.Enabled : true,
        })),
        ResponseBodyReplace: (rt.ResponseBodyReplace || []).filter((r) => r.Find.trim() !== '').map((r) => ({
          Find: r.Find.trim(),
          Replace: r.Replace.trim(),
          UseRegex: !!r.UseRegex,
          Enabled: r.Enabled !== undefined ? !!r.Enabled : true,
        })),
        RemoveHeaders: (rt.RemoveHeaders || []).filter((h) => h.trim() !== '').map((h) => h.trim()),
        Upstreams: rt.Upstreams.filter((u) => u.URL.trim() !== '').map((u) => ({
          URL: u.URL.trim(),
          Weight: u.Weight > 0 ? u.Weight : 1,
        })),
      }
    }),
  }))

  for (let i = 0; i < cleanedRules.length; i++) {
    const rule = cleanedRules[i]
    if (!rule.ListenAddr) {
      throw new Error(`规则 ${i + 1}：监听地址不能为空`)
    }
    if (!rule.Routes || rule.Routes.length === 0) {
      throw new Error(`规则 ${i + 1}：请至少配置一个路由（routes）`)
    }

    for (let j = 0; j < rule.Routes.length; j++) {
      const rt: any = rule.Routes[j]
      if (!rt.Path) {
        throw new Error(`规则 ${i + 1} / 路由 ${j + 1}：Path 不能为空（至少为 /）`)
      }
      const hasUpstreams = rt.Upstreams && rt.Upstreams.length > 0
      const hasStaticDir = rt.StaticDir && rt.StaticDir.trim() !== ''
      if (!hasUpstreams && !hasStaticDir) {
        throw new Error(`规则 ${i + 1} / 路由 ${j + 1}：请至少配置一个上游服务器地址或静态文件目录`)
      }
    }

    if (rule.SSLEnable && (!rule.CertFile || !rule.KeyFile)) {
      throw new Error(`规则 ${i + 1}：启用SSL时证书文件和私钥文件不能为空`)
    }
    if (rule.BasicAuthEnable && (!rule.BasicAuthUsername || !rule.BasicAuthPassword)) {
      throw new Error(`规则 ${i + 1}：启用Basic Auth时用户名和密码不能为空`)
    }
  }

  // 关键：输出为 Rust 后端需要的 snake_case 结构
  const mappedRules = cleanedRules.map((r: any) => ({
    id: r.ID || undefined,
    enabled: r.Enabled !== undefined ? !!r.Enabled : true,
    listen_addr: r.ListenAddr,
    ssl_enable: !!r.SSLEnable,
    cert_file: r.CertFile,
    key_file: r.KeyFile,
    basic_auth_enable: !!r.BasicAuthEnable,
    basic_auth_username: r.BasicAuthUsername || '',
    basic_auth_password: r.BasicAuthPassword || '',
    basic_auth_forward_header: !!r.BasicAuthForwardHeader,
    rate_limit_enabled: r.RateLimitEnabled !== undefined ? !!r.RateLimitEnabled : undefined,
    rate_limit_requests_per_second: r.RateLimitRequestsPerSecond !== undefined ? Number(r.RateLimitRequestsPerSecond) : undefined,
    rate_limit_burst_size: r.RateLimitBurstSize !== undefined ? Number(r.RateLimitBurstSize) : undefined,
    rate_limit_window_seconds: r.RateLimitWindowSeconds !== undefined ? Number(r.RateLimitWindowSeconds) : 1,
    rate_limit_ban_seconds: r.RateLimitBanSeconds !== undefined ? Number(r.RateLimitBanSeconds) : undefined,
    routes: (r.Routes || []).map((rt: any) => ({
      id: rt.ID || undefined,
      enabled: rt.Enabled !== undefined ? !!rt.Enabled : true,
      host: rt.Host || undefined,
      path: rt.Path,
      proxy_pass_path: rt.ProxyPassPath || undefined,
      follow_redirects: !!rt.FollowRedirects,
      set_headers: rt.SetHeaders || {},
      static_dir: rt.StaticDir || undefined,
      exclude_basic_auth: !!rt.ExcludeBasicAuth,
      url_rewrite_rules: (rt.UrlRewriteRules || []).filter((r: any) => r.Pattern.trim() !== '').map((r: any) => ({
        pattern: r.Pattern.trim(),
        replacement: r.Replacement.trim(),
        enabled: r.Enabled !== undefined ? !!r.Enabled : true,
      })),
      request_body_replace: (rt.RequestBodyReplace || []).filter((r: any) => r.Find.trim() !== '').map((r: any) => ({
        find: r.Find.trim(),
        replace: r.Replace.trim(),
        use_regex: !!r.UseRegex,
        enabled: r.Enabled !== undefined ? !!r.Enabled : true,
      })),
      response_body_replace: (rt.ResponseBodyReplace || []).filter((r: any) => r.Find.trim() !== '').map((r: any) => ({
        find: r.Find.trim(),
        replace: r.Replace.trim(),
        use_regex: !!r.UseRegex,
        enabled: r.Enabled !== undefined ? !!r.Enabled : true,
      })),
      remove_headers: (rt.RemoveHeaders || []).filter((h: any) => h.trim() !== '').map((h: any) => h.trim()),
      upstreams: (rt.Upstreams || []).map((u: any) => ({
        url: u.URL,
        weight: u.Weight,
      })),
    })),
  }))

  return {
    rules: mappedRules,
  }
}

defineExpose({
  getConfig,
})
</script>

<style scoped>
.config-page {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.config-page :deep(.el-card__header) {
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
}

.config-page :deep(.el-card__body) {
  padding: 20px;
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

.form-grid :deep(.el-form-item) {
  margin-bottom: 22px;
}

.mini-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-muted);
}

.rules-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rule-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--card-bg);
  overflow: visible; /* For transition effects */
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.routes-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 12px;
}

.route-card {
  border-radius: var(--radius-md);
  background: var(--input-bg);
  border: 1px solid transparent;
  transition: all 0.3s;
}

.route-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.route-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.sub-section {
  margin-top: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--card-bg);
}

.sub-section-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.sub-section-body {
  padding: 16px;
}

.file-selector {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.header-item, .upstream-item {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.upstream-item {
  grid-template-columns: 2fr 1fr auto;
}

.rewrite-rule-item {
  grid-template-columns: 2fr 2fr auto auto;
}

.replace-rule-item {
  grid-template-columns: 2fr 2fr auto auto auto;
}

.headers-hint {
  display: block;
  margin-bottom: 12px;
}

.headers-actions {
  margin-bottom: 16px;
}

/* Transition styles */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

.list-leave-active {
  position: absolute;
}
</style>
