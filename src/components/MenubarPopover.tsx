import { useEffect, useMemo, useRef, useState } from "react";
import { useReferenceStore } from "../stores/referenceStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Reference } from "../types/references";
import "./MenubarPopover.css";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Status order for grouping
const STATUS_ORDER = [
    "active",
    "paused",
    "idea",
    "completed",
    "archived",
] as const;

// Status labels for display
const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    paused: "Paused",
    idea: "Idea",
    completed: "Completed",
    archived: "Archived",
};

export function MenubarPopover() {
    const { references, isLoading, loadReferences } = useReferenceStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const openAnchorButtonRef = useRef<HTMLButtonElement>(null);

    // Load references on mount and when window becomes visible
    useEffect(() => {
        loadReferences();

        // Listen for window visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                loadReferences();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Listen for references_changed events from backend
        let unlisten: (() => void) | undefined;
        const setupEventListener = async () => {
            unlisten = await listen("references_changed", () => {
                loadReferences();
            });
        };
        setupEventListener();

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (unlisten) {
                unlisten();
            }
        };
    }, [loadReferences]);

    // Focus search input on mount
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Filter and group references
    const filteredReferences = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return references.filter(
            (ref) =>
                ref.referenceName.toLowerCase().includes(query) ||
                ref.tags.some((tag) => tag.toLowerCase().includes(query)),
        );
    }, [references, searchQuery]);

    const pinnedReferences = useMemo(
        () => filteredReferences.filter((ref) => ref.pinned),
        [filteredReferences],
    );

    const groupedReferences = useMemo(() => {
        const groups: Record<string, Reference[]> = {};
        STATUS_ORDER.forEach((status) => {
            groups[status] = filteredReferences.filter(
                (ref) => !ref.pinned && ref.status === status,
            );
        });
        return groups;
    }, [filteredReferences]);

    // Flat list for keyboard navigation
    const flatList = useMemo(() => {
        const list: (Reference | { type: "header"; label: string })[] = [];

        if (pinnedReferences.length > 0) {
            list.push({ type: "header", label: "Pinned" });
            list.push(...pinnedReferences);
        }

        STATUS_ORDER.forEach((status) => {
            const refs = groupedReferences[status];
            if (refs.length > 0) {
                list.push({ type: "header", label: STATUS_LABELS[status] });
                list.push(...refs);
            }
        });

        return list;
    }, [pinnedReferences, groupedReferences]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const referenceItems = flatList.filter(
            (item): item is Reference => "id" in item,
        );

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    Math.min(prev + 1, referenceItems.length - 1),
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case "Enter":
                e.preventDefault();
                if (e.metaKey) {
                    // Cmd+Enter - open in Terminal
                    const ref = referenceItems[selectedIndex];
                    if (ref) {
                        invoke("open_in_terminal", { path: ref.absolutePath });
                    }
                } else if (e.altKey) {
                    // Option+Enter - open in VSCode
                    const ref = referenceItems[selectedIndex];
                    if (ref) {
                        invoke("open_in_vscode", { path: ref.absolutePath });
                    }
                } else {
                    // Enter - open in Finder
                    const ref = referenceItems[selectedIndex];
                    if (ref) {
                        invoke("open_in_finder", { path: ref.absolutePath });
                    }
                }
                break;
            case "Escape":
                e.preventDefault();
                // Hide popover window
                invoke("hide_popover").catch(() => {});
                break;
            case "Tab":
                // Focus trap: cycle between search input and Open Anchor button
                if (e.shiftKey) {
                    // Shift+Tab: if at search, go to Open Anchor button
                    if (document.activeElement === searchInputRef.current) {
                        e.preventDefault();
                        openAnchorButtonRef.current?.focus();
                    }
                } else {
                    // Tab: if at Open Anchor button, go to search
                    if (
                        document.activeElement === openAnchorButtonRef.current
                    ) {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                    }
                }
                break;
        }
    };

    const handleOpenAnchor = () => {
        invoke("show_dashboard");
    };

    if (isLoading) {
        return <div className="popover-container">Loading...</div>;
    }

    return (
        <div
            ref={containerRef}
            className="popover-container dark"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Search bar */}
            <div className="search-section">
                <input
                    ref={searchInputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search references..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedIndex(0);
                    }}
                />
            </div>

            {/* Pinned section */}
            {pinnedReferences.length > 0 && (
                <div className="pinned-section">
                    <div className="section-label">Pinned</div>
                    {pinnedReferences.map((ref) => (
                        <ReferenceRow
                            key={ref.id}
                            reference={ref}
                            isSelected={
                                flatList.findIndex(
                                    (item) =>
                                        "id" in item && item.id === ref.id,
                                ) === selectedIndex
                            }
                            activeRowId={activeRowId}
                            onHoverChange={setActiveRowId}
                        />
                    ))}
                </div>
            )}

            {/* Grouped list by status */}
            <div className="grouped-list">
                {STATUS_ORDER.map((status) => {
                    const refs = groupedReferences[status];
                    if (refs.length === 0) return null;

                    return (
                        <div key={status} className="status-group">
                            <div className="section-label">
                                {STATUS_LABELS[status]}
                            </div>
                            {refs.map((ref) => (
                                <ReferenceRow
                                    key={ref.id}
                                    reference={ref}
                                    isSelected={
                                        flatList.findIndex(
                                            (item) =>
                                                "id" in item &&
                                                item.id === ref.id,
                                        ) === selectedIndex
                                    }
                                    activeRowId={activeRowId}
                                    onHoverChange={setActiveRowId}
                                />
                            ))}
                        </div>
                    );
                })}

                {filteredReferences.length === 0 && (
                    <div className="empty-state">No references found</div>
                )}
            </div>

            {/* Footer */}
            <div className="footer">
                <Button
                    ref={openAnchorButtonRef}
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenAnchor}
                >
                    Open Anchor
                </Button>
            </div>
        </div>
    );
}

interface ReferenceRowProps {
    reference: Reference;
    isSelected: boolean;
    activeRowId: string | null;
    onHoverChange: (rowId: string | null) => void;
}

function ReferenceRow({ reference, isSelected, activeRowId, onHoverChange }: ReferenceRowProps) {
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const isThisRowActive = activeRowId === reference.id;

    // Show Open button if: row is hovered, row is selected with no other hover, OR dropdown is open
    const isOpenVisible = isThisRowActive || (isSelected && activeRowId === null) || dropdownOpen;

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        onHoverChange(reference.id);
    };

    const handleMouseLeave = () => {
        // Delay clearing the hover so user can move to dropdown
        hoverTimeoutRef.current = setTimeout(() => {
            onHoverChange(null);
        }, 200);
    };

    const handleDropdownMouseEnter = () => {
        // Keep this row active when hovering over the dropdown
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        onHoverChange(reference.id);
    };

    const handleRowClick = () => {
        invoke("open_in_finder", { path: reference.absolutePath });
    };

    const handleOpenInFinder = () => {
        invoke("open_in_finder", { path: reference.absolutePath });
    };

    const handleOpenInVSCode = () => {
        invoke("open_in_vscode", { path: reference.absolutePath });
    };

    const handleOpenInTerminal = () => {
        invoke("open_in_terminal", { path: reference.absolutePath });
    };

    const handleCopyPath = () => {
        invoke("copy_path_to_clipboard", { path: reference.absolutePath });
    };

    // Prevent row click when clicking the dropdown area
    const handleDropdownContainerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className={`reference-row ${isSelected ? "selected" : ""}`}
            onClick={handleRowClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="reference-name">{reference.referenceName}</div>
            <div className="reference-meta">
                <span className={`type-badge ${reference.type}`}>
                    {reference.type}
                </span>
                {reference.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="tag-badge">
                        {tag}
                    </span>
                ))}
            </div>
            <div
                className={`open-dropdown-container ${isOpenVisible ? "visible" : ""}`}
                onMouseEnter={handleDropdownMouseEnter}
                onClick={handleDropdownContainerClick}
            >
                <DropdownMenu modal={false} open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="xs" onClick={(e) => e.stopPropagation()}>
                            Open ▼
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleOpenInFinder}>
                            <span className="mr-2">📁</span>
                            Finder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleOpenInVSCode}>
                            <span className="mr-2">📝</span>
                            VS Code:
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleOpenInTerminal}>
                            <span className="mr-2">💻</span>
                            Terminal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyPath}>
                            <span className="mr-2">📋</span>
                            Copy path
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
