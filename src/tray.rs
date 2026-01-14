use tauri::{AppHandle, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

pub fn create_tray() -> SystemTray {
    let menu = SystemTrayMenu::new()
        .add_item(SystemTrayMenuItem::new("显示窗口", "show"))
        .add_item(SystemTrayMenuItem::new("隐藏窗口", "hide"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(SystemTrayMenuItem::new("退出", "quit"));

    SystemTray::new().with_menu(menu)
}

pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app.get_window("main") {
                if window.is_visible().unwrap_or(false) {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        window.hide().unwrap();
                    }
                }
                "quit" => {
                    // 发送退出事件到前端，让前端处理确认
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("request-quit", ());
                    }
                }
                _ => {}
            }
        }
        _ => {}
    }
}
