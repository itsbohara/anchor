use crate::models::{Reference, StorageFile};
use std::fs;
use std::io;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

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

/// Reads all references from data.json.
/// Returns empty vector if file doesn't exist or is empty.
pub fn read_references(app_handle: &AppHandle) -> Result<Vec<Reference>, io::Error> {
    let path = data_file_path(app_handle);

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)?;
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }

    let storage_file: StorageFile = serde_json::from_str(&content)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    Ok(storage_file.references)
}

/// Writes all references to data.json.
pub fn write_references(app_handle: &AppHandle, refs: &[Reference]) -> Result<(), io::Error> {
    ensure_anchor_data_dir(app_handle)?;
    let path = data_file_path(app_handle);

    let storage_file = StorageFile {
        references: refs.to_vec(),
    };

    let json = serde_json::to_string_pretty(&storage_file)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    fs::write(&path, json)?;
    Ok(())
}
