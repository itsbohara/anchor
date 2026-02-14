use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

use crate::models::{Reference, StorageFile};

/// Get the path to the Anchor data directory.
/// Creates it if it doesn't exist.
pub fn ensure_anchor_data_dir(app_handle: &AppHandle) -> Result<PathBuf, io::Error> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;

    let anchor_dir = app_data_dir.join("Anchor");

    if !anchor_dir.exists() {
        fs::create_dir_all(&anchor_dir)?;
    }

    Ok(anchor_dir)
}

/// Get the path to the data.json file.
pub fn data_file_path(app_handle: &AppHandle) -> Result<PathBuf, io::Error> {
    let data_dir = ensure_anchor_data_dir(app_handle)?;
    Ok(data_dir.join("data.json"))
}

/// Read all references from data.json.
/// Returns empty vector if file doesn't exist.
pub fn read_references(app_handle: &AppHandle) -> Result<Vec<Reference>, io::Error> {
    let file_path = data_file_path(app_handle)?;

    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&file_path)?;
    let storage: StorageFile = serde_json::from_str(&content).unwrap_or_default();

    Ok(storage.references)
}

/// Write all references to data.json.
pub fn write_references(app_handle: &AppHandle, references: &[Reference]) -> Result<(), io::Error> {
    let file_path = data_file_path(app_handle)?;

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }

    let storage = StorageFile {
        references: references.to_vec(),
    };

    let content = serde_json::to_string_pretty(&storage)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    fs::write(&file_path, content)
}

/// Read references directly from a file path (for testing or external access).
pub fn read_references_from_path<P: AsRef<Path>>(path: P) -> Result<Vec<Reference>, io::Error> {
    if !path.as_ref().exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)?;
    let storage: StorageFile = serde_json::from_str(&content).unwrap_or_default();

    Ok(storage.references)
}
