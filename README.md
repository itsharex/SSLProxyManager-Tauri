# SSLProxyManager

SSLProxyManager 是一个基于 **Tauri 2 + Rust** 的 SSL 代理管理工具，提供桌面端管理界面（前端：**Vue 3 + Vite + Element Plus**），用于配置与管理反向代理/静态资源托管/访问控制等能力。

## 免责声明

本项目仅用于学习与合法合规的网络代理/反向代理配置管理场景。使用本软件可能涉及网络访问控制、证书管理、流量转发等操作，存在但不限于数据泄露、服务中断、配置错误导致安全风险等潜在风险。你在使用本项目时需自行评估并承担全部风险与责任。

- **合法合规**：请确保你的使用行为符合当地法律法规及相关网络服务条款。禁止将本项目用于任何未授权的渗透、攻击、绕过访问控制、窃取数据、传播恶意软件、侵犯他人隐私或其他任何违法违规用途。任何因你使用本项目从事违法违规或未授权行为所产生的法律责任、行政处罚、第三方索赔及相关后果，均由你自行承担，作者与贡献者不承担任何责任。
- **无担保**：本项目按“现状”提供，不提供任何形式的明示或暗示担保（包括但不限于适用性、可靠性、准确性、可用性、无错误/无漏洞等）。
- **责任限制**：对于因使用或无法使用本项目导致的任何直接或间接损失（包括但不限于利润损失、数据丢失、业务中断、设备或系统损坏等），作者与贡献者不承担任何责任。

如果你不同意上述条款，请勿使用、分发或基于本项目进行二次开发。

## 功能概览

- 规则（Rule）管理：监听地址、TLS 证书、Basic Auth 等
- 路由（Route）配置：
  - 反向代理（Upstream）
  - 静态目录（static_dir）
  - Header 注入（set_headers）
- IP 白名单/访问控制（以配置为准）
- 桌面端 GUI 管理

## 技术栈

- 后端：Rust（Tauri 2）
- 前端：Vue 3、Vite、Element Plus、ECharts

## 程序界面

![ScreenShot1](./screenshots/1.jpg)

![ScreenShot2](./screenshots/2.jpg)

![ScreenShot3](./screenshots/3.jpg)

![ScreenShot4](./screenshots/4.jpg)

![ScreenShot5](./screenshots/5.jpg)


## 目录结构

- `src/`：Rust 业务代码
- `frontend/`：前端项目（Vite）
- `tauri.conf.json`：Tauri 配置（dev/build 命令、devUrl、frontendDist 等）
- `config.toml`：运行配置（本地使用）
- `config.toml.example`：配置示例

## 环境要求

- Node.js + npm（用于前端开发/构建）
- Rust 工具链（stable，含 Cargo）

## 本地开发

### 1) 安装前端依赖

```bash
cd frontend
npm install
```

### 2) 启动 Tauri 开发模式

在项目根目录执行：

```bash
npm run tauri:dev
```

该命令会根据 `tauri.conf.json`：

- 先进入 `frontend` 并执行 `npm run dev`
- 然后启动 Tauri 并加载 `http://localhost:5173`

## 构建发布

在项目根目录执行：

```bash
npm run tauri:build
```

该命令会：

- 先进入 `frontend` 并执行 `npm run build`（产物：`frontend/dist`）
- 再由 Tauri 进行打包

## 配置说明（config.toml）

项目使用 TOML 进行规则配置，示例参考 `config.toml.example`。

- `allow_all_lan`：是否允许局域网访问（示例中为 `false`）
- `[[rules]]`：规则列表
  - `listen_addr`：监听地址，如 `:8888` 或 `0.0.0.0:1024`
  - `ssl_enable`：是否启用 TLS
  - `cert_file` / `key_file`：证书与私钥路径
  - `basic_auth_enable` / `basic_auth_username` / `basic_auth_password`：Basic Auth
- `[[rules.routes]]`：路由列表
  - `path`：匹配路径
  - `static_dir`：静态目录（可选）
  - `proxy_pass_path`：转发路径改写（可选）
  - `exclude_basic_auth`：是否跳过 Basic Auth（可选）
  - `[rules.routes.set_headers]`：注入 Header（可选）
  - `[[rules.routes.upstreams]]`：上游列表（可选）

## 常见问题

- 前端开发服务器端口默认是 `5173`（见 `tauri.conf.json` 的 `devUrl`）。
- 如果你需要更改前端 dev/build 命令，请修改根目录 `tauri.conf.json` 的 `build.beforeDevCommand` / `build.beforeBuildCommand`。

