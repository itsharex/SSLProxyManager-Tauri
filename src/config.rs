use anyhow::{Context, Result};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use once_cell::sync::Lazy;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhitelistEntry {
    pub ip: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Upstream {
    pub url: String,
    pub weight: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Route {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy_pass_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub set_headers: Option<std::collections::HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub static_dir: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclude_basic_auth: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub basic_auth_enable: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub basic_auth_username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub basic_auth_password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub basic_auth_forward_header: Option<bool>,
    pub upstreams: Vec<Upstream>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListenRule {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub listen_addr: String,
    pub ssl_enable: bool,
    pub cert_file: String,
    pub key_file: String,
    pub basic_auth_enable: bool,
    pub basic_auth_username: String,
    pub basic_auth_password: String,
    pub basic_auth_forward_header: bool,
    pub routes: Vec<Route>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsStorage {
    pub enabled: bool,
    pub db_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfig {
    pub enabled: bool,
    pub server_url: String,
    pub auto_check: bool,
    pub timeout_ms: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channel: Option<String>,
    pub ignore_prerelease: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub rules: Vec<ListenRule>,
    pub allow_all_lan: bool,
    pub whitelist: Vec<WhitelistEntry>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metrics_storage: Option<MetricsStorage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub update: Option<UpdateConfig>,
}

static CONFIG: Lazy<RwLock<Config>> = Lazy::new(|| {
    RwLock::new(Config {
        rules: vec![],
        allow_all_lan: true,
        whitelist: vec![],
        metrics_storage: None,
        update: None,
    })
});

fn get_config_path() -> PathBuf {
    // 开发模式优先读取当前工作目录下的 config.toml（便于调试时直接改项目根目录配置）
    #[cfg(debug_assertions)]
    {
        let cwd_cfg = PathBuf::from("config.toml");
        if cwd_cfg.exists() {
            return cwd_cfg;
        }
    }

    // 生产模式读取可执行文件同目录的 config.toml
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            return dir.join("config.toml");
        }
    }

    PathBuf::from("config.toml")
}

pub fn load_config() -> Result<()> {
    let path = get_config_path();
    let content = fs::read_to_string(&path)
        .with_context(|| format!("无法读取配置文件: {}", path.display()))?;

    let mut config: Config = toml::from_str(&content)
        .context("解析配置文件失败")?;

    // 确保所有 ID 都存在（加载时补齐，并写回内存）
    ensure_config_ids(&mut config);

    *CONFIG.write() = config;
    Ok(())
}

pub fn save_config() -> Result<()> {
    let path = get_config_path();
    let config = CONFIG.read().clone();
    let content = toml::to_string_pretty(&config)
        .context("序列化配置失败")?;
    fs::write(&path, content)
        .with_context(|| format!("写入配置文件失败: {}", path.display()))?;
    Ok(())
}

pub fn get_config() -> Config {
    CONFIG.read().clone()
}

pub fn set_config(config: Config) {
    *CONFIG.write() = config;
}

pub fn ensure_config_ids_for_save(config: &mut Config) {
    ensure_config_ids(config);
}

fn ensure_config_ids(config: &mut Config) {
    use uuid::Uuid;

    let need_new = |v: &Option<String>| match v {
        None => true,
        Some(s) => s.trim().is_empty(),
    };

    for rule in &mut config.rules {
        if need_new(&rule.id) {
            rule.id = Some(Uuid::new_v4().to_string());
        }
        for route in &mut rule.routes {
            if need_new(&route.id) {
                route.id = Some(Uuid::new_v4().to_string());
            }
        }
    }
}
