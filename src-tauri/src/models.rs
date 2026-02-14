use serde::{Deserialize, Serialize};

/// Represents a reference (folder or file) tracked by Anchor.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reference {
    /// Unique identifier for the reference.
    pub id: String,

    /// User-defined name for the reference.
    #[serde(rename = "referenceName")]
    pub reference_name: String,

    /// Absolute path to the folder or file.
    #[serde(rename = "absolutePath")]
    pub absolute_path: String,

    /// Type: "folder" or "file".
    #[serde(rename = "type")]
    pub type_: String,

    /// Status: "active", "paused", "completed", "idea", or "archived".
    pub status: String,

    /// Tags associated with the reference.
    pub tags: Vec<String>,

    /// Optional description.
    pub description: Option<String>,

    /// Creation timestamp (ISO8601).
    #[serde(rename = "createdAt")]
    pub created_at: String,

    /// Last opened timestamp (ISO8601).
    #[serde(rename = "lastOpenedAt")]
    pub last_opened_at: String,

    /// Whether the reference is pinned to the top.
    pub pinned: bool,
}

/// Root structure of the data.json file.
#[derive(Debug, Serialize, Deserialize)]
pub struct StorageFile {
    /// List of all references.
    pub references: Vec<Reference>,
}

impl StorageFile {
    /// Creates a new empty storage file.
    pub fn new() -> Self {
        Self {
            references: Vec::new(),
        }
    }
}

impl Default for StorageFile {
    fn default() -> Self {
        Self::new()
    }
}
