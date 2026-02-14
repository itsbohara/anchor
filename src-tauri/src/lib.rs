mod models;
mod storage;

use std::path::Path;
use std::process::Command;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime, WebviewUrl, WebviewWindowBuilder,
};

use models::Reference;
use uuid::Uuid;

// Window labels
const POPOVER_WINDOW_LABEL: &str = "popover";
const DASHBOARD_WINDOW_LABEL: &str = "dashboard";

// Window sizes
const POPOVER_WIDTH: f64 = 320.0;
const POPOVER_HEIGHT: f64 = 400.0;

/// Get all references from storage
#[tauri::command]
async fn get_references(app_handle: AppHandle) -> Result<Vec<Reference>, String> {
    storage::read_references(&app_handle).map_err(|e| e.to_string())
}

/// Open a path in Finder
#[tauri::command]
async fn open_in_finder(path: String) -> Result<(), String> {
    Command::new("open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Open a path in Terminal
#[tauri::command]
async fn open_in_terminal(path: String) -> Result<(), String> {
    Command::new("open")
        .arg("-a")
        .arg("Terminal")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Open a path in VSCode
#[tauri::command]
async fn open_in_vscode(path: String) -> Result<(), String> {
    Command::new("code")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open VSCode: {}", e))?;
    Ok(())
}

/// Reveal a path in Finder (select it)
#[tauri::command]
async fn reveal_in_finder(path: String) -> Result<(), String> {
    Command::new("open")
        .arg("-R")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Check if a path exists
#[tauri::command]
async fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// Show or create the dashboard window
#[tauri::command]
async fn show_dashboard(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window(DASHBOARD_WINDOW_LABEL) {
        // Dashboard exists, show and focus it
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        // Create new dashboard window
        let window = WebviewWindowBuilder::new(
            &app_handle,
            DASHBOARD_WINDOW_LABEL,
            WebviewUrl::App("/dashboard".into()),
        )
        .title("Anchor - Dashboard")
        .inner_size(1000.0, 700.0)
        .min_inner_size(800.0, 500.0)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

        // Set window to close to hide (not destroy) - we'll handle this in event loop
        // For now, just let it close normally
        window.show().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Hide the popover window
#[tauri::command]
async fn hide_popover(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window(POPOVER_WINDOW_LABEL) {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Add a new reference to storage
#[tauri::command]
async fn add_reference(
    app_handle: AppHandle,
    mut reference: Reference,
) -> Result<Reference, String> {
    // Validate required fields
    if reference.reference_name.trim().is_empty() {
        return Err("Reference name is required".to_string());
    }
    if reference.absolute_path.trim().is_empty() {
        return Err("Absolute path is required".to_string());
    }
    if reference.reference_type.is_empty() {
        return Err("Type is required".to_string());
    }
    if reference.status.is_empty() {
        return Err("Status is required".to_string());
    }

    // Generate UUID
    reference.id = Uuid::new_v4().to_string();

    // Set timestamps
    let now = chrono::Utc::now().to_rfc3339();
    reference.created_at = now.clone();
    reference.last_opened_at = now;

    // Read current references
    let mut references = storage::read_references(&app_handle).map_err(|e| e.to_string())?;

    // Add new reference
    references.push(reference.clone());

    // Write back to storage
    storage::write_references(&app_handle, &references).map_err(|e| e.to_string())?;

    // Emit event to notify all windows of the change
    app_handle.emit("references_changed", ()).map_err(|e| e.to_string())?;

    Ok(reference)
}

/// Update an existing reference in storage
#[tauri::command]
async fn update_reference(
    app_handle: AppHandle,
    id: String,
    reference: Reference,
) -> Result<Reference, String> {
    // Validate required fields
    if reference.reference_name.trim().is_empty() {
        return Err("Reference name is required".to_string());
    }
    if reference.absolute_path.trim().is_empty() {
        return Err("Absolute path is required".to_string());
    }
    if reference.reference_type.is_empty() {
        return Err("Type is required".to_string());
    }
    if reference.status.is_empty() {
        return Err("Status is required".to_string());
    }

    // Read current references
    let mut references = storage::read_references(&app_handle).map_err(|e| e.to_string())?;

    // Find the reference to update
    let index = references
        .iter()
        .position(|r| r.id == id)
        .ok_or_else(|| format!("Reference with id '{}' not found", id))?;

    // Preserve the original id and created_at, update last_opened_at
    let mut updated_reference = reference;
    updated_reference.id = id;
    updated_reference.created_at = references[index].created_at.clone();
    updated_reference.last_opened_at = chrono::Utc::now().to_rfc3339();

    // Replace the reference
    references[index] = updated_reference.clone();

    // Write back to storage
    storage::write_references(&app_handle, &references).map_err(|e| e.to_string())?;

    // Emit event to notify all windows of the change
    app_handle.emit("references_changed", ()).map_err(|e| e.to_string())?;

    Ok(updated_reference)
}

/// Delete a reference from storage
#[tauri::command]
async fn delete_reference(app_handle: AppHandle, id: String) -> Result<(), String> {
    // Read current references
    let mut references = storage::read_references(&app_handle).map_err(|e| e.to_string())?;

    // Find the reference to delete
    let original_len = references.len();
    references.retain(|r| r.id != id);

    // Check if any reference was removed
    if references.len() == original_len {
        return Err(format!("Reference with id '{}' not found", id));
    }

    // Write back to storage
    storage::write_references(&app_handle, &references).map_err(|e| e.to_string())?;

    // Emit event to notify all windows of the change
    app_handle.emit("references_changed", ()).map_err(|e| e.to_string())?;

    Ok(())
}

/// Setup the system tray icon and menu
fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_item])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } => {
                let app_handle = tray.app_handle();
                toggle_popover(app_handle, Some(rect));
            }
            _ => {}
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

/// Toggle the popover window visibility
fn toggle_popover<R: Runtime>(app_handle: &AppHandle<R>, tray_rect: Option<tauri::Rect>) {
    let popover = app_handle.get_webview_window(POPOVER_WINDOW_LABEL);

    if let Some(window) = popover {
        // Window exists
        if window.is_visible().unwrap_or(false) {
            window.hide().ok();
        } else {
            position_popover_under_tray(&window, tray_rect);
            window.show().ok();
            window.set_focus().ok();
        }
    } else {
        // Create new popover window
        let window = WebviewWindowBuilder::new(
            app_handle,
            POPOVER_WINDOW_LABEL,
            WebviewUrl::App("/".into()),
        )
        .title("")
        .inner_size(POPOVER_WIDTH, POPOVER_HEIGHT)
        .decorations(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .resizable(false)
        .visible(false)
        .build()
        .ok();

        if let Some(w) = window {
            position_popover_under_tray(&w, tray_rect);
            w.show().ok();
            w.set_focus().ok();
        }
    }
}

/// Position the popover window under the system tray
fn position_popover_under_tray<R: Runtime>(window: &tauri::WebviewWindow<R>, tray_rect: Option<tauri::Rect>) {
    // Get the tray icon position if available
    if let Some(rect) = tray_rect {
        // Extract position and size values from Physical or Logical variants
        let (tray_x, tray_y) = match rect.position {
            tauri::Position::Physical(pos) => (pos.x as f64, pos.y as f64),
            tauri::Position::Logical(pos) => (pos.x, pos.y),
        };
        
        let (tray_width, tray_height) = match rect.size {
            tauri::Size::Physical(size) => (size.width as f64, size.height as f64),
            tauri::Size::Logical(size) => (size.width, size.height),
        };
        
        // Position the popover centered under the tray icon
        let tray_center_x = tray_x + (tray_width / 2.0);
        let tray_bottom_y = tray_y + tray_height;
        
        // Center the popover under the tray icon
        let popover_x = tray_center_x - (POPOVER_WIDTH / 2.0);
        let popover_y = tray_bottom_y + 8.0; // 8px gap from tray icon
        
        window
            .set_position(tauri::Position::Logical(tauri::LogicalPosition {
                x: popover_x,
                y: popover_y,
            }))
            .ok();
    } else {
        // Fallback to screen-based positioning
        if let Ok(monitors) = window.available_monitors() {
            if let Some(primary) = monitors.first() {
                let screen_size = primary.size();
                let screen_pos = primary.position();

                // Position near the top-right of the primary screen (typical tray area)
                let x = screen_pos.x + screen_size.width as i32 - POPOVER_WIDTH as i32 - 20;
                let y = 30; // Slight offset from top

                window
                    .set_position(tauri::Position::Logical(tauri::LogicalPosition {
                        x: x as f64,
                        y: y as f64,
                    }))
                    .ok();
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .on_window_event(|window, event| {
            // Only handle popover window - close when it loses focus
            if window.label() == POPOVER_WINDOW_LABEL {
                if let tauri::WindowEvent::Focused(false) = event {
                    window.hide().ok();
                }
            }
        })
        .setup(|app| {
            // Setup tray icon
            setup_tray(app.handle())?;

            // Don't show the main window on startup - only show tray
            if let Some(window) = app.get_webview_window("main") {
                window.hide().ok();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_references,
            add_reference,
            update_reference,
            delete_reference,
            path_exists,
            open_in_finder,
            open_in_terminal,
            open_in_vscode,
            reveal_in_finder,
            show_dashboard,
            hide_popover,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
