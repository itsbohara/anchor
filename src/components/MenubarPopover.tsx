import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReferenceStore } from "../stores/referenceStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Reference } from "../types/references";
import "./MenubarPopover.css";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Clipboard,
    Code2,
    FileCode,
    FolderOpen,
    Terminal,
    Zap,
} from "lucide-react";

const OPEN_MENU_ICON_CLASS = "open-menu-icon";

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

const COPY_NOTICE_MS = 2200;

export function MenubarPopover() {
    const { references, isLoading, loadReferences } = useReferenceStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(
        null,
    );
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const hoverLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const searchInputRef = useRef<HTMLInputElement>(null);
    const tagFilterTriggerRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const openAnchorButtonRef = useRef<HTMLButtonElement>(null);
    const copyNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const [copyNotice, setCopyNotice] = useState<string | null>(null);

    const focusSearchInput = useCallback(() => {
        // Defer until after show/focus + any loading UI swap
        requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });
    }, []);

    const handlePopoverShown = useCallback(() => {
        setSelectedIndex(0);
        setActiveRowId(null);
        void loadReferences().finally(focusSearchInput);
    }, [loadReferences, focusSearchInput]);

    // Load references on mount and when popover is shown again
    useEffect(() => {
        handlePopoverShown();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                handlePopoverShown();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        let unlistenRefs: (() => void) | undefined;
        let unlistenFocus: (() => void) | undefined;

        const setupListeners = async () => {
            unlistenRefs = await listen("references_changed", () => {
                loadReferences();
            });
            unlistenFocus = await getCurrentWindow().onFocusChanged(
                ({ payload: focused }) => {
                    if (focused) {
                        handlePopoverShown();
                    }
                },
            );
        };
        void setupListeners();

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            unlistenRefs?.();
            unlistenFocus?.();
        };
    }, [handlePopoverShown, loadReferences]);

    // Focus after initial load when search input is back in the DOM
    useEffect(() => {
        if (!isLoading) {
            focusSearchInput();
        }
    }, [isLoading, focusSearchInput]);

    useEffect(() => {
        return () => {
            if (hoverLeaveTimeoutRef.current) {
                clearTimeout(hoverLeaveTimeoutRef.current);
            }
            if (copyNoticeTimeoutRef.current) {
                clearTimeout(copyNoticeTimeoutRef.current);
            }
        };
    }, []);

    const showCopyNotice = useCallback((referenceName: string) => {
        if (copyNoticeTimeoutRef.current) {
            clearTimeout(copyNoticeTimeoutRef.current);
        }
        setCopyNotice(`${referenceName} path copied!`);
        copyNoticeTimeoutRef.current = setTimeout(() => {
            setCopyNotice(null);
            copyNoticeTimeoutRef.current = null;
        }, COPY_NOTICE_MS);
    }, []);

    const handleRowHoverStart = (rowId: string) => {
        if (hoverLeaveTimeoutRef.current) {
            clearTimeout(hoverLeaveTimeoutRef.current);
            hoverLeaveTimeoutRef.current = null;
        }
        setActiveRowId(rowId);
    };

    const handleRowHoverEnd = (rowId: string) => {
        if (hoverLeaveTimeoutRef.current) {
            clearTimeout(hoverLeaveTimeoutRef.current);
        }
        hoverLeaveTimeoutRef.current = setTimeout(() => {
            setActiveRowId((current) => (current === rowId ? null : current));
            hoverLeaveTimeoutRef.current = null;
        }, 200);
    };

    const availableTags = useMemo(() => {
        const tagSet = new Set<string>();
        for (const ref of references) {
            for (const tag of ref.tags) {
                tagSet.add(tag);
            }
        }
        return Array.from(tagSet).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
        );
    }, [references]);

    useEffect(() => {
        if (
            selectedTagFilter &&
            !availableTags.includes(selectedTagFilter)
        ) {
            setSelectedTagFilter(null);
        }
    }, [availableTags, selectedTagFilter]);

    // Filter and group references (text search AND tag filter)
    const filteredReferences = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return references.filter((ref) => {
            const matchesTag =
                selectedTagFilter === null ||
                ref.tags.includes(selectedTagFilter);
            if (!matchesTag) return false;

            if (!query) return true;

            return (
                ref.referenceName.toLowerCase().includes(query) ||
                ref.tags.some((tag) => tag.toLowerCase().includes(query))
            );
        });
    }, [references, searchQuery, selectedTagFilter]);

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
            case "Enter": {
                e.preventDefault();
                const ref = referenceItems[selectedIndex];
                if (!ref) break;
                if (e.metaKey) {
                    invoke("open_in_terminal", { path: ref.absolutePath });
                } else if (e.altKey) {
                    invoke("open_in_vscode", { path: ref.absolutePath });
                }
                break;
            }
            case "Escape":
                e.preventDefault();
                // Hide popover window
                invoke("hide_popover").catch(() => {});
                break;
            case "Tab": {
                const focusables = [
                    searchInputRef.current,
                    tagFilterTriggerRef.current,
                    openAnchorButtonRef.current,
                ].filter((el) => el != null);

                const activeIndex = focusables.findIndex(
                    (el) => el === document.activeElement,
                );
                if (activeIndex === -1) break;

                e.preventDefault();
                const nextIndex = e.shiftKey
                    ? (activeIndex - 1 + focusables.length) % focusables.length
                    : (activeIndex + 1) % focusables.length;
                focusables[nextIndex]?.focus();
                break;
            }
        }
    };

    const handleOpenAnchor = () => {
        invoke("show_dashboard");
    };

    if (isLoading && references.length === 0) {
        return <div className="popover-container">Loading...</div>;
    }

    return (
        <div
            ref={containerRef}
            className="popover-container dark"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Search bar + tag filter */}
            <div className="search-section">
                <div className="search-bar-shell">
                    {copyNotice && (
                        <div
                            className="copy-notice"
                            role="status"
                            aria-live="polite"
                        >
                            {copyNotice}
                        </div>
                    )}
                    <div className="search-bar">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="search-input"
                        autoFocus
                        placeholder="Search references..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    {availableTags.length > 0 && (
                        <>
                            <div
                                className="search-bar-divider"
                                aria-hidden
                            />
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        ref={tagFilterTriggerRef}
                                        type="button"
                                        className={`tag-filter-trigger ${selectedTagFilter ? "active" : ""}`}
                                        aria-label={
                                            selectedTagFilter
                                                ? `Filter by tag: ${selectedTagFilter}`
                                                : "Filter by tag: All"
                                        }
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        <span className="tag-filter-label">
                                            {selectedTagFilter ?? "All"}
                                        </span>
                                        <span
                                            className="tag-filter-chevron"
                                            aria-hidden
                                        >
                                            ▾
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="tag-filter-menu"
                                >
                                    <DropdownMenuLabel>Tag</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={
                                            selectedTagFilter ?? "__all__"
                                        }
                                        onValueChange={(value) => {
                                            setSelectedTagFilter(
                                                value === "__all__"
                                                    ? null
                                                    : value,
                                            );
                                            setSelectedIndex(0);
                                        }}
                                    >
                                        <DropdownMenuRadioItem value="__all__">
                                            All
                                        </DropdownMenuRadioItem>
                                        {availableTags.map((tag) => (
                                            <DropdownMenuRadioItem
                                                key={tag}
                                                value={tag}
                                            >
                                                {tag}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                    </div>
                </div>
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
                            onHoverStart={handleRowHoverStart}
                            onHoverEnd={handleRowHoverEnd}
                            onPathCopied={showCopyNotice}
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
                                    onHoverStart={handleRowHoverStart}
                                    onHoverEnd={handleRowHoverEnd}
                                    onPathCopied={showCopyNotice}
                                />
                            ))}
                        </div>
                    );
                })}

                {filteredReferences.length === 0 && (
                    <div className="empty-state">
                        {selectedTagFilter
                            ? `No references tagged “${selectedTagFilter}”`
                            : "No references found"}
                    </div>
                )}
            </div>

            <div className="popover-bottom">
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
        </div>
    );
}

interface ReferenceRowProps {
    reference: Reference;
    isSelected: boolean;
    activeRowId: string | null;
    onHoverStart: (rowId: string) => void;
    onHoverEnd: (rowId: string) => void;
    onPathCopied: (referenceName: string) => void;
}

function ReferenceRow({
    reference,
    isSelected,
    activeRowId,
    onHoverStart,
    onHoverEnd,
    onPathCopied,
}: ReferenceRowProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const isThisRowActive = activeRowId === reference.id;

    // Keyboard-selected row when nothing else is hovered; dropdown keeps actions visible
    const isOpenVisible =
        isThisRowActive ||
        (isSelected && activeRowId === null) ||
        dropdownOpen;

    const handleMouseEnter = () => {
        onHoverStart(reference.id);
    };

    const handleMouseLeave = () => {
        onHoverEnd(reference.id);
    };

    const handleDropdownMouseEnter = () => {
        onHoverStart(reference.id);
    };

    const handleOpenInFinder = () => {
        invoke("open_in_finder", { path: reference.absolutePath });
    };

    const handleOpenInCursor = () => {
        invoke("open_in_cursor", { path: reference.absolutePath });
    };

    const handleOpenInVSCode = () => {
        invoke("open_in_vscode", { path: reference.absolutePath });
    };

    const handleOpenInTerminal = () => {
        invoke("open_in_terminal", { path: reference.absolutePath });
    };

    const handleOpenInWarp = () => {
        invoke("open_in_warp", { path: reference.absolutePath });
    };

    const handleCopyPath = () => {
        void invoke("copy_path_to_clipboard", {
            path: reference.absolutePath,
        }).then(() => {
            onPathCopied(reference.referenceName);
        });
    };

    const handleOpenMenuKeyDown = (e: React.KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const key = e.key.toLowerCase();
        if (key !== "c" && key !== "w") return;
        e.preventDefault();
        e.stopPropagation();
        if (key === "c") {
            void handleCopyPath();
        } else {
            handleOpenInWarp();
        }
        setDropdownOpen(false);
    };

    // Prevent row click when clicking the dropdown area
    const handleDropdownContainerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className={`reference-row ${isSelected ? "selected" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="reference-row-main">
                <span className="reference-name">{reference.referenceName}</span>
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
                    <DropdownMenuContent
                        align="end"
                        onKeyDown={handleOpenMenuKeyDown}
                    >
                        <DropdownMenuItem onClick={handleOpenInFinder}>
                            <FolderOpen
                                className={OPEN_MENU_ICON_CLASS}
                                aria-hidden
                            />
                            Finder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleOpenInCursor}>
                            <Code2 className={OPEN_MENU_ICON_CLASS} aria-hidden />
                            Cursor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleOpenInVSCode}>
                            <FileCode
                                className={OPEN_MENU_ICON_CLASS}
                                aria-hidden
                            />
                            VS Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleOpenInTerminal}>
                            <Terminal
                                className={OPEN_MENU_ICON_CLASS}
                                aria-hidden
                            />
                            Terminal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleOpenInWarp}>
                            <Zap className={OPEN_MENU_ICON_CLASS} aria-hidden />
                            Warp Terminal
                            <DropdownMenuShortcut>W</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyPath}>
                            <Clipboard
                                className={OPEN_MENU_ICON_CLASS}
                                aria-hidden
                            />
                            Copy path
                            <DropdownMenuShortcut>C</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
