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
}

export const useReferenceStore = create<ReferenceState>((set) => ({
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
        error: err instanceof Error ? err.message : "Failed to load references",
        isLoading: false,
      });
    }
  },

  setReferences: (references) => set({ references }),
}));
