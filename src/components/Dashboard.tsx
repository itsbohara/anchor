import { useEffect, useState, useCallback } from "react";
import { useReferenceStore } from "../stores/referenceStore";
import { invoke } from "@tauri-apps/api/core";
import type { Reference } from "../types/references";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ReferenceForm } from "./ReferenceForm";
import "./Dashboard.css";

// Status order and labels for display
const STATUS_ORDER = [
    "active",
    "paused",
    "idea",
    "completed",
    "archived",
] as const;

const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    paused: "Paused",
    idea: "Idea",
    completed: "Completed",
    archived: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
    active: "#22c55e", // green
    paused: "#f59e0b", // amber
    idea: "#3b82f6", // blue
    completed: "#8b5cf6", // purple
    archived: "#6b7280", // gray
};

export function Dashboard() {
    const { references, isLoading, loadReferences, addReference } =
        useReferenceStore();
    const [sortField, setSortField] = useState<keyof Reference>("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load references on mount
    useEffect(() => {
        loadReferences();
    }, [loadReferences]);

    // Reload on window focus
    useEffect(() => {
        const appWindow = getCurrentWindow();

        const handleFocus = () => {
            loadReferences();
        };

        // Listen for focus events
        const unlisten = appWindow.listen("tauri://focus", handleFocus);

        return () => {
            unlisten.then((fn) => fn());
        };
    }, [loadReferences]);

    // Handle sorting
    const handleSort = useCallback(
        (field: keyof Reference) => {
            if (sortField === field) {
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            } else {
                setSortField(field);
                setSortDirection("asc");
            }
        },
        [sortField],
    );

    // Handle opening add modal
    const handleOpenAddModal = useCallback(() => {
        setSubmitError(null);
        setIsModalOpen(true);
    }, []);

    // Handle closing modal
    const handleCloseModal = useCallback(() => {
        if (!isSubmitting) {
            setIsModalOpen(false);
            setSubmitError(null);
        }
    }, [isSubmitting]);

    // Handle form submit
    const handleAddReference = useCallback(
        async (
            reference: Omit<Reference, "id" | "createdAt" | "lastOpenedAt">,
        ) => {
            setIsSubmitting(true);
            setSubmitError(null);

            try {
                await addReference(reference);
                setIsModalOpen(false);
            } catch (err) {
                setSubmitError(
                    err instanceof Error
                        ? err.message
                        : "Failed to add reference",
                );
            } finally {
                setIsSubmitting(false);
            }
        },
        [addReference],
    );

    // Sort and filter references
    const sortedReferences = [...references].sort((a, b) => {
        let comparison = 0;

        if (sortField === "createdAt" || sortField === "lastOpenedAt") {
            comparison =
                new Date(a[sortField]).getTime() -
                new Date(b[sortField]).getTime();
        } else if (sortField === "pinned") {
            comparison = a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1;
        } else {
            const aValue = String(a[sortField]).toLowerCase();
            const bValue = String(b[sortField]).toLowerCase();
            comparison = aValue.localeCompare(bValue);
        }

        return sortDirection === "asc" ? comparison : -comparison;
    });

    // Group by status (within sorted order)
    const groupedReferences = sortedReferences.reduce(
        (groups, ref) => {
            const status = ref.status;
            if (!groups[status]) {
                groups[status] = [];
            }
            groups[status].push(ref);
            return groups;
        },
        {} as Record<string, Reference[]>,
    );

    // Status sort order
    const sortedStatuses = STATUS_ORDER.filter(
        (status) => groupedReferences[status]?.length > 0,
    );

    // Sort within each group by pinned first, then by sort field
    sortedStatuses.forEach((status) => {
        groupedReferences[status].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });
    });

    const handleOpenReference = (ref: Reference) => {
        invoke("open_in_finder", { path: ref.absolutePath });
    };

    const handleOpenInTerminal = (e: React.MouseEvent, ref: Reference) => {
        e.stopPropagation();
        invoke("open_in_terminal", { path: ref.absolutePath });
    };

    const handleOpenInVSCode = (e: React.MouseEvent, ref: Reference) => {
        e.stopPropagation();
        invoke("open_in_vscode", { path: ref.absolutePath });
    };

    const handleRevealInFinder = (e: React.MouseEvent, ref: Reference) => {
        e.stopPropagation();
        invoke("reveal_in_finder", { path: ref.absolutePath });
    };

    if (isLoading && references.length === 0) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading references...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title">Anchor</h1>
                    <span className="reference-count">
                        {references.length}{" "}
                        {references.length === 1 ? "reference" : "references"}
                    </span>
                </div>
                <div className="header-right">
                    <button
                        className="add-reference-btn"
                        onClick={handleOpenAddModal}
                    >
                        + Add Reference
                    </button>
                </div>
            </header>

            {/* Empty State */}
            {references.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📁</div>
                    <h2>No references yet</h2>
                    <p>
                        Add your first reference to get started tracking
                        projects and files.
                    </p>
                    <button
                        className="add-reference-btn-primary"
                        onClick={handleOpenAddModal}
                    >
                        Add Your First Reference
                    </button>
                </div>
            )}

            {/* Reference Table */}
            {references.length > 0 && (
                <div className="table-container">
                    <table className="reference-table">
                        <thead>
                            <tr>
                                <th
                                    className="col-name"
                                    onClick={() => handleSort("referenceName")}
                                >
                                    Name{" "}
                                    {sortField === "referenceName" &&
                                        (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="col-path">Path</th>
                                <th
                                    className="col-type"
                                    onClick={() => handleSort("type")}
                                >
                                    Type{" "}
                                    {sortField === "type" &&
                                        (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="col-status"
                                    onClick={() => handleSort("status")}
                                >
                                    Status{" "}
                                    {sortField === "status" &&
                                        (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="col-tags">Tags</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStatuses.map((status) => (
                                <>
                                    <tr
                                        key={`header-${status}`}
                                        className="status-header-row"
                                    >
                                        <td colSpan={6}>
                                            <div className="status-header">
                                                <span
                                                    className="status-dot"
                                                    style={{
                                                        backgroundColor:
                                                            STATUS_COLORS[
                                                                status
                                                            ],
                                                    }}
                                                />
                                                {STATUS_LABELS[status]}
                                                <span className="status-count">
                                                    {
                                                        groupedReferences[
                                                            status
                                                        ].length
                                                    }
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {groupedReferences[status].map((ref) => (
                                        <tr
                                            key={ref.id}
                                            className={`reference-row ${ref.pinned ? "pinned" : ""}`}
                                            onClick={() =>
                                                handleOpenReference(ref)
                                            }
                                        >
                                            <td className="cell-name">
                                                <div className="name-cell">
                                                    {ref.pinned && (
                                                        <span className="pin-indicator">
                                                            📌
                                                        </span>
                                                    )}
                                                    <span className="reference-name">
                                                        {ref.referenceName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="cell-path">
                                                <span
                                                    className="path-text"
                                                    title={ref.absolutePath}
                                                >
                                                    {truncatePath(
                                                        ref.absolutePath,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="cell-type">
                                                <span
                                                    className={`type-badge ${ref.type}`}
                                                >
                                                    {ref.type}
                                                </span>
                                            </td>
                                            <td className="cell-status">
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor: `${STATUS_COLORS[status]}20`,
                                                        color: STATUS_COLORS[
                                                            status
                                                        ],
                                                        borderColor:
                                                            STATUS_COLORS[
                                                                status
                                                            ],
                                                    }}
                                                >
                                                    {STATUS_LABELS[status]}
                                                </span>
                                            </td>
                                            <td className="cell-tags">
                                                <div className="tags-container">
                                                    {ref.tags
                                                        .slice(0, 3)
                                                        .map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="tag-pill"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    {ref.tags.length > 3 && (
                                                        <span className="tag-more">
                                                            +
                                                            {ref.tags.length -
                                                                3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="cell-actions">
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn"
                                                        title="Open in Terminal"
                                                        onClick={(e) =>
                                                            handleOpenInTerminal(
                                                                e,
                                                                ref,
                                                            )
                                                        }
                                                    >
                                                        ⌘
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        title="Open in VS Code"
                                                        onClick={(e) =>
                                                            handleOpenInVSCode(
                                                                e,
                                                                ref,
                                                            )
                                                        }
                                                    >
                                                        ⌥
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        title="Reveal in Finder"
                                                        onClick={(e) =>
                                                            handleRevealInFinder(
                                                                e,
                                                                ref,
                                                            )
                                                        }
                                                    >
                                                        R
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Reference Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>Add Reference</h2>
                            <button
                                className="modal-close"
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <ReferenceForm
                                mode="add"
                                onSave={handleAddReference}
                                onCancel={handleCloseModal}
                                isSubmitting={isSubmitting}
                                error={submitError}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to truncate long paths
function truncatePath(path: string, maxLength: number = 40): string {
    if (path.length <= maxLength) return path;

    const parts = path.split("/");
    if (parts.length <= 2) return path.slice(-maxLength);

    // Keep the last 2 parts and prefix with ...
    const truncated = ".../" + parts.slice(-2).join("/");
    return truncated.length > maxLength ? path.slice(-maxLength) : truncated;
}
