import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Reference } from "../types/references";

interface ReferenceState {
    references: Reference[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadReferences: () => Promise<void>;
    setReferences: (references: Reference[]) => void;
    addReference: (
        reference: Omit<Reference, "id" | "createdAt" | "lastOpenedAt">,
    ) => Promise<Reference>;
    updateReference: (
        id: string,
        reference: Omit<Reference, "id" | "createdAt" | "lastOpenedAt">,
    ) => Promise<Reference>;
    deleteReference: (id: string) => Promise<void>;
}

export const useReferenceStore = create<ReferenceState>((set, get) => ({
    references: [],
    isLoading: false,
    error: null,

    loadReferences: async () => {
        set({ isLoading: true, error: null });
        try {
            const refs = await invoke<Reference[]>("get_references");
            set({ references: refs, isLoading: false });
        } catch (err) {
            set({
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to load references",
                isLoading: false,
            });
        }
    },

    setReferences: (references) => set({ references }),

    addReference: async (reference) => {
        set({ isLoading: true, error: null });
        try {
            // Transform to match Rust field names
            const payload = {
                id: "", // Will be generated on backend
                referenceName: reference.referenceName,
                absolutePath: reference.absolutePath,
                reference_type: reference.type,
                status: reference.status,
                tags: reference.tags,
                description: reference.description,
                createdAt: "", // Will be set on backend
                lastOpenedAt: "", // Will be set on backend
                pinned: reference.pinned,
            };

            const newRef = await invoke<Reference>("add_reference", {
                reference: payload,
            });

            // Update local state
            set({
                references: [...get().references, newRef],
                isLoading: false,
            });

            return newRef;
        } catch (err) {
            set({
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to add reference",
                isLoading: false,
            });
            throw err;
        }
    },

    updateReference: async (id, reference) => {
        set({ isLoading: true, error: null });
        try {
            // Transform to match Rust field names
            const payload = {
                id,
                referenceName: reference.referenceName,
                absolutePath: reference.absolutePath,
                reference_type: reference.type,
                status: reference.status,
                tags: reference.tags,
                description: reference.description,
                createdAt: "", // Will be preserved on backend
                lastOpenedAt: "", // Will be updated on backend
                pinned: reference.pinned,
            };

            const updatedRef = await invoke<Reference>("update_reference", {
                id,
                reference: payload,
            });

            // Update local state - replace the existing reference
            set({
                references: get().references.map((ref) =>
                    ref.id === id ? updatedRef : ref,
                ),
                isLoading: false,
            });

            return updatedRef;
        } catch (err) {
            set({
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to update reference",
                isLoading: false,
            });
            throw err;
        }
    },

    deleteReference: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await invoke<void>("delete_reference", { id });

            // Remove from local state
            set({
                references: get().references.filter((ref) => ref.id !== id),
                isLoading: false,
            });
        } catch (err) {
            set({
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to delete reference",
                isLoading: false,
            });
            throw err;
        }
    },
}));
