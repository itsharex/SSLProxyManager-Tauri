use anyhow::Result;
use tauri::{AppHandle, Emitter, Manager};

pub fn init(app: &AppHandle) -> Result<()> {
    // rustls 0.23 需要显式选择 CryptoProvider（避免运行时 panic）
    let _ = rustls::crypto::aws_lc_rs::default_provider().install_default();

    // 初始化配置
    crate::config::load_config()?;


    // 初始化数据库（异步，避免在 runtime 内 block_on 导致崩溃）
    // 以及：启动请求日志异步写入 worker
    if let Some(metrics_storage) = crate::config::get_config().metrics_storage.as_ref() {
        if metrics_storage.enabled {
            let db_path = metrics_storage.db_path.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = crate::metrics::init_db(db_path).await {
                    eprintln!("初始化数据库失败: {e}");
                }
                crate::metrics::init_request_log_writer().await;
            });
        }
    }

    // 启动后自动检查更新
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        if let Some(update_config) = crate::config::get_config().update.as_ref() {
            if update_config.auto_check {
                if let Ok(result) = crate::update::check_for_updates(
                    env!("CARGO_PKG_VERSION"),
                    update_config.clone(),
                )
                .await
                {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.emit("update-check-result", result);
                    }
                }
            }
        }
    });

    Ok(())
}
