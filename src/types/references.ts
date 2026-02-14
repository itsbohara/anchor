/**
 * Represents a reference (folder or file) tracked by Anchor.
 * Matches the Rust Reference struct schema.
 */
export interface Reference {
  /** Unique identifier for the reference. */
  id: string;

  /** User-defined name for the reference. */
  referenceName: string;

  /** Absolute path to the folder or file. */
  absolutePath: string;

  /** Type: "folder" or "file". */
  type: "folder" | "file";

  /** Status: "active", "paused", "completed", "idea", or "archived". */
  status: "active" | "paused" | "completed" | "idea" | "archived";

  /** Tags associated with the reference. */
  tags: string[];

  /** Optional description. */
  description: string | null;

  /** Creation timestamp (ISO8601). */
  createdAt: string;

  /** Last opened timestamp (ISO8601). */
  lastOpenedAt: string;

  /** Whether the reference is pinned to the top. */
  pinned: boolean;
}

/**
 * Root structure of the data.json file.
 */
export interface StorageFile {
  references: Reference[];
}
