use std::fs;
use std::io;
use std::path::PathBuf;
use tauri::AppHandle;

/// Returns the Anchor data directory path: ~/Library/Application Support/Anchor/
pub fn anchor_data_dir(app_handle: &AppHandle) -> PathBuf {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    app_data_dir.join("Anchor")
}

/// Ensures the Anchor data directory exists, creating it if necessary.
/// Returns the path to the directory.
pub fn ensure_anchor_data_dir(app_handle: &AppHandle) -> Result<PathBuf, io::Error> {
    let dir = anchor_data_dir(app_handle);
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    Ok(dir)
}

/// Returns the full path to data.json file.
pub fn data_file_path(app_handle: &AppHandle) -> PathBuf {
    anchor_data_dir(app_handle).join("data.json")
}
