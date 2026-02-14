import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Reference } from "../types/references";
import "./ReferenceForm.css";

const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "idea", label: "Idea" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" },
] as const;

const TYPE_OPTIONS = [
    { value: "folder", label: "Folder" },
    { value: "file", label: "File" },
] as const;

interface ReferenceFormProps {
    mode: "add" | "edit";
    initialData?: Partial<Reference>;
    onSave: (
        reference: Omit<Reference, "id" | "createdAt" | "lastOpenedAt">,
    ) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    error?: string | null;
}

export function ReferenceForm({
    mode,
    initialData,
    onSave,
    onCancel,
    isSubmitting = false,
    error = null,
}: ReferenceFormProps) {
    const [formData, setFormData] = useState({
        referenceName: initialData?.referenceName || "",
        absolutePath: initialData?.absolutePath || "",
        type: initialData?.type || "folder",
        status: initialData?.status || "active",
        tags: initialData?.tags?.join(", ") || "",
        description: initialData?.description || "",
        pinned: initialData?.pinned || false,
    });

    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});
    const [pathWarning, setPathWarning] = useState<string | null>(null);
    const [isCheckingPath, setIsCheckingPath] = useState(false);

    // Check path existence when absolutePath changes (debounced)
    useEffect(() => {
        const path = formData.absolutePath.trim();
        if (!path) {
            setPathWarning(null);
            return;
        }

        setIsCheckingPath(true);
        const timer = setTimeout(async () => {
            try {
                const exists = await invoke<boolean>("path_exists", { path });
                if (!exists) {
                    setPathWarning(
                        "Warning: Path does not exist. You can still save this reference.",
                    );
                } else {
                    setPathWarning(null);
                }
            } catch {
                setPathWarning(null);
            } finally {
                setIsCheckingPath(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.absolutePath]);

    const validate = useCallback((): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.referenceName.trim()) {
            errors.referenceName = "Reference name is required";
        }

        if (!formData.absolutePath.trim()) {
            errors.absolutePath = "Absolute path is required";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();

            if (!validate()) {
                return;
            }

            const reference: Omit<
                Reference,
                "id" | "createdAt" | "lastOpenedAt"
            > = {
                referenceName: formData.referenceName.trim(),
                absolutePath: formData.absolutePath.trim(),
                type: formData.type as "folder" | "file",
                status: formData.status as Reference["status"],
                tags: formData.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                description: formData.description.trim() || null,
                pinned: formData.pinned,
            };

            onSave(reference);
        },
        [formData, validate, onSave],
    );

    const handleChange = useCallback(
        (field: keyof typeof formData) =>
            (
                e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >,
            ) => {
                const value =
                    e.target.type === "checkbox"
                        ? (e.target as HTMLInputElement).checked
                        : e.target.value;
                setFormData((prev) => ({ ...prev, [field]: value }));
                // Clear validation error when user types
                if (validationErrors[field]) {
                    setValidationErrors((prev) => ({ ...prev, [field]: "" }));
                }
            },
        [validationErrors],
    );

    return (
        <form onSubmit={handleSubmit} className="reference-form">
            {error && (
                <div className="form-error-banner">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            <div className="form-field">
                <label htmlFor="referenceName">
                    Reference Name <span className="required">*</span>
                </label>
                <input
                    id="referenceName"
                    type="text"
                    value={formData.referenceName}
                    onChange={handleChange("referenceName")}
                    placeholder="e.g., My Project"
                    disabled={isSubmitting}
                    className={validationErrors.referenceName ? "error" : ""}
                />
                {validationErrors.referenceName && (
                    <span className="field-error">
                        {validationErrors.referenceName}
                    </span>
                )}
            </div>

            <div className="form-field">
                <label htmlFor="absolutePath">
                    Absolute Path <span className="required">*</span>
                </label>
                <input
                    id="absolutePath"
                    type="text"
                    value={formData.absolutePath}
                    onChange={handleChange("absolutePath")}
                    placeholder="/Users/you/projects/my-project"
                    disabled={isSubmitting}
                    className={validationErrors.absolutePath ? "error" : ""}
                />
                {validationErrors.absolutePath && (
                    <span className="field-error">
                        {validationErrors.absolutePath}
                    </span>
                )}
                {isCheckingPath && (
                    <span className="field-hint">Checking path...</span>
                )}
                {pathWarning && !validationErrors.absolutePath && (
                    <span className="field-warning">{pathWarning}</span>
                )}
            </div>

            <div className="form-row">
                <div className="form-field">
                    <label htmlFor="type">
                        Type <span className="required">*</span>
                    </label>
                    <select
                        id="type"
                        value={formData.type}
                        onChange={handleChange("type")}
                        disabled={isSubmitting}
                    >
                        {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="status">
                        Status <span className="required">*</span>
                    </label>
                    <select
                        id="status"
                        value={formData.status}
                        onChange={handleChange("status")}
                        disabled={isSubmitting}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="tags">Tags (comma-separated)</label>
                <input
                    id="tags"
                    type="text"
                    value={formData.tags}
                    onChange={handleChange("tags")}
                    placeholder="work, personal, urgent"
                    disabled={isSubmitting}
                />
                <span className="field-hint">Separate tags with commas</span>
            </div>

            <div className="form-field">
                <label htmlFor="description">Description (optional)</label>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={handleChange("description")}
                    placeholder="Brief description of this reference..."
                    rows={3}
                    disabled={isSubmitting}
                />
            </div>

            <div className="form-field checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={formData.pinned}
                        onChange={handleChange("pinned")}
                        disabled={isSubmitting}
                    />
                    Pin to top
                </label>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? "Saving..."
                        : mode === "add"
                          ? "Add Reference"
                          : "Save Changes"}
                </button>
            </div>
        </form>
    );
}
