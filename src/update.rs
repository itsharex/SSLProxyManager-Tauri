use crate::config;
use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use semver::Version;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub latest_version: String,
    pub download_url: String,
    pub release_notes: String,
    pub is_mandatory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckResult {
    pub has_update: bool,
    pub is_prerelease: bool,
    pub current_version: String,
    pub update_info: Option<UpdateInfo>,
    pub error: Option<String>,
}

pub async fn check_for_updates(
    current_version: &str,
    cfg: config::UpdateConfig,
) -> Result<CheckResult> {
    if !cfg.enabled || cfg.server_url.is_empty() {
        return Ok(CheckResult {
            has_update: false,
            is_prerelease: false,
            current_version: current_version.to_string(),
            update_info: None,
            error: Some("更新检查未启用或服务器地址未配置".to_string()),
        });
    }

    let timeout = if cfg.timeout_ms > 0 {
        Duration::from_millis(cfg.timeout_ms as u64)
    } else {
        Duration::from_secs(10)
    };

    let client = Client::builder()
        .timeout(timeout)
        .build()
        .context("创建 HTTP 客户端失败")?;

    let mut url = reqwest::Url::parse(&cfg.server_url)
        .context("解析服务器 URL 失败")?;

    url.query_pairs_mut()
        .append_pair("v", current_version)
        .append_pair("os", std::env::consts::OS)
        .append_pair("arch", std::env::consts::ARCH);

    let response = client
        .get(url)
        .header("User-Agent", "SSLProxyManager-Update-Checker/1.0")
        .send()
        .await
        .context("请求更新服务器失败")?;

    if !response.status().is_success() {
        return Err(anyhow::anyhow!(
            "更新服务器返回错误状态: {}",
            response.status()
        ));
    }

    let update_info: UpdateInfo = response
        .json()
        .await
        .context("解析更新信息失败")?;

    let latest_version = Version::parse(&update_info.latest_version)
        .context("无效的最新版本号")?;

    let is_prerelease = !latest_version.pre.is_empty();

    // 如果配置了忽略预发布版本，且最新版是预发布版，则认为没有更新
    if cfg.ignore_prerelease && is_prerelease {
        return Ok(CheckResult {
            has_update: false,
            is_prerelease: true,
            current_version: current_version.to_string(),
            update_info: Some(update_info),
            error: None,
        });
    }

    let has_update = if current_version == "dev" {
        true
    } else {
        let current = Version::parse(current_version)
            .context("无效的当前版本号")?;
        latest_version > current
    };

    Ok(CheckResult {
        has_update,
        is_prerelease,
        current_version: current_version.to_string(),
        update_info: Some(update_info),
        error: None,
    })
}
