mod models;
mod storage;

use models::Reference;
use storage::{read_references, write_references};
use tauri::AppHandle;

/// Gets all references from data.json.
#[tauri::command]
fn get_references(app_handle: AppHandle) -> Result<Vec<Reference>, String> {
    read_references(&app_handle).map_err(|e| e.to_string())
}

/// Writes all references to data.json.
#[tauri::command]
fn save_references(app_handle: AppHandle, references: Vec<Reference>) -> Result<(), String> {
    write_references(&app_handle, &references).map_err(|e| e.to_string())
}

/// Opens a path in Finder (macOS).
#[tauri::command]
fn open_in_finder(path: String) -> Result<(), String> {
    std::process::Command::new("open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Opens a path in Terminal (macOS).
#[tauri::command]
fn open_in_terminal(path: String) -> Result<(), String> {
    std::process::Command::new("open")
        .args(["-a", "Terminal", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Opens a path in VS Code.
#[tauri::command]
fn open_in_vscode(path: String) -> Result<(), String> {
    std::process::Command::new("code")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Reveals a path in Finder (selects the file).
#[tauri::command]
fn reveal_in_finder(path: String) -> Result<(), String> {
    std::process::Command::new("open")
        .args(["-R", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_references,
            save_references,
            open_in_finder,
            open_in_terminal,
            open_in_vscode,
            reveal_in_finder
        ]);

    #[cfg(target_os = "macos")]
    let builder = builder.on_window_event(|window, event| match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            // Prevent window close, hide it instead
            window.hide().unwrap();
            api.prevent_close();
        }
        _ => {}
    });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
