import { useEffect, useState, useRef, useMemo } from "react";
import { useReferenceStore } from "../stores/referenceStore";
import { invoke } from "@tauri-apps/api/core";
import type { Reference } from "../types/references";
import "./MenubarPopover.css";

// Status order for grouping
const STATUS_ORDER = ["active", "paused", "idea", "completed", "archived"] as const;

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load references on mount
  useEffect(() => {
    loadReferences();
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
        ref.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [references, searchQuery]);

  const pinnedReferences = useMemo(
    () => filteredReferences.filter((ref) => ref.pinned),
    [filteredReferences]
  );

  const groupedReferences = useMemo(() => {
    const groups: Record<string, Reference[]> = {};
    STATUS_ORDER.forEach((status) => {
      groups[status] = filteredReferences.filter(
        (ref) => !ref.pinned && ref.status === status
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
      (item): item is Reference => "id" in item
    );

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, referenceItems.length - 1)
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
        // Hide window
        invoke("show_dashboard").catch(() => {});
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
    <div className="popover-container" onKeyDown={handleKeyDown} tabIndex={0}>
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
          {pinnedReferences.map((ref, index) => (
            <ReferenceRow
              key={ref.id}
              reference={ref}
              isSelected={
                flatList.findIndex(
                  (item) => "id" in item && item.id === ref.id
                ) === selectedIndex
              }
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
              <div className="section-label">{STATUS_LABELS[status]}</div>
              {refs.map((ref) => (
                <ReferenceRow
                  key={ref.id}
                  reference={ref}
                  isSelected={
                    flatList.findIndex(
                      (item) => "id" in item && item.id === ref.id
                    ) === selectedIndex
                  }
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
        <button className="open-anchor-btn" onClick={handleOpenAnchor}>
          Open Anchor
        </button>
      </div>
    </div>
  );
}

interface ReferenceRowProps {
  reference: Reference;
  isSelected: boolean;
}

function ReferenceRow({ reference, isSelected }: ReferenceRowProps) {
  const handleClick = () => {
    invoke("open_in_finder", { path: reference.absolutePath });
  };

  const handleTerminalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    invoke("open_in_terminal", { path: reference.absolutePath });
  };

  const handleVSCodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    invoke("open_in_vscode", { path: reference.absolutePath });
  };

  const handleRevealClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    invoke("reveal_in_finder", { path: reference.absolutePath });
  };

  return (
    <div
      className={`reference-row ${isSelected ? "selected" : ""}`}
      onClick={handleClick}
    >
      <div className="reference-name">{reference.referenceName}</div>
      <div className="reference-meta">
        <span className={`type-badge ${reference.type}`}>{reference.type}</span>
        {reference.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="tag-badge">
            {tag}
          </span>
        ))}
      </div>
      {isSelected && (
        <div className="quick-actions">
          <button title="Open in Terminal" onClick={handleTerminalClick}>
            ⌘
          </button>
          <button title="Open in VS Code" onClick={handleVSCodeClick}>
            ⌥
          </button>
          <button title="Reveal in Finder" onClick={handleRevealClick}>
            R
          </button>
        </div>
      )}
    </div>
  );
}
