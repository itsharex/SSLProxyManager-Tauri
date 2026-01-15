// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod commands;
mod config;
mod metrics;
mod proxy;
mod single_instance;
mod tray;
mod update;

fn main() {
    // 初始化日志
    tracing_subscriber::fmt::init();

    // 单实例检查
    // 目标：第二次启动时给用户明确提示“程序已运行”，然后退出。
    let instance = single_instance::SingleInstance::new("SSLProxyManager")
        .expect("failed to initialize single instance lock");
    if !instance.is_single() {
        // 第二实例不应该启动任何 tauri runtime（会影响已运行实例），这里改用 rfd 弹原生提示框。
        // 如果 rfd 初始化失败则回退到 stderr。
        let _ = rfd::MessageDialog::new()
            .set_title("SSLProxyManager")
            .set_description("程序已经运行，请勿重复启动。")
            .set_buttons(rfd::MessageButtons::Ok)
            .show();

        eprintln!("程序已经运行，请勿重复启动。");
        std::process::exit(1);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::get_version,
            commands::check_update,
            commands::open_url,
            commands::start_server,
            commands::stop_server,
            commands::get_status,
            commands::get_logs,
            commands::clear_logs,
            commands::get_metrics,
            commands::get_listen_addrs,
            commands::query_historical_metrics,
            commands::query_request_logs,
            commands::add_blacklist_entry,
            commands::remove_blacklist_entry,
            commands::get_blacklist_entries,
            commands::refresh_blacklist_cache,
            commands::get_metrics_db_status,
            commands::test_metrics_db_connection,
            commands::open_cert_file_dialog,
            commands::open_key_file_dialog,
            commands::open_directory_dialog,
            commands::hide_to_tray,
            commands::quit_app,
            commands::get_dashboard_stats,
        ])
        .setup(|app| {
            // 初始化应用
            app::init(app.handle())?;

            // 初始化托盘
            tray::init_tray(app.handle())?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                // 点击关闭按钮时不退出，改为隐藏到托盘
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
