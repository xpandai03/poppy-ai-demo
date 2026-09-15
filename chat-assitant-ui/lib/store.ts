"use client"

import { create } from "zustand"
import { defaultItems, type LibraryCreative } from "@/lib/library-items"

interface LibraryState {
  items: LibraryCreative[]
  selectedId: string | null
  isGenerating: boolean
  /** Bumped to ask the carousel to rotate a card front-and-centre. */
  focusRequest: { index: number; nonce: number } | null

  setSelected: (id: string | null) => void
  setGenerating: (v: boolean) => void
  requestFocus: (index: number) => void

  addItem: (item: LibraryCreative) => void
  removeItem: (id: string) => void
  updateItem: (id: string, patch: Partial<LibraryCreative>) => void
  duplicateItem: (id: string) => LibraryCreative | null

  /** Find by the "variation N" number the user types in chat. */
  byVariation: (n: number) => LibraryCreative | undefined
}

let seq = 100

/**
 * Chat (left pane) writes, carousel (right pane) reads.
 *
 * Deliberately does NOT hold `messages` — those stay local to ChatShell so the
 * per-token streaming updates never reach the GSAP ticker driving the carousel.
 */
export const useLibrary = create<LibraryState>((set, get) => ({
  items: defaultItems,
  selectedId: null,
  isGenerating: false,
  focusRequest: null,

  setSelected: (id) => set({ selectedId: id }),
  setGenerating: (v) => set({ isGenerating: v }),
  requestFocus: (index) =>
    set((s) => ({ focusRequest: { index, nonce: (s.focusRequest?.nonce ?? 0) + 1 } })),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),

  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  updateItem: (id, patch) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

  duplicateItem: (id) => {
    const src = get().items.find((i) => i.id === id)
    if (!src) return null
    const nextVariation = Math.max(0, ...get().items.map((i) => i.variation)) + 1
    const copy: LibraryCreative = {
      ...src,
      id: `cr-${++seq}`,
      variation: nextVariation,
      status: "ready",
      flash: true,
    }
    set((s) => ({ items: [...s.items, copy] }))
    return copy
  },

  byVariation: (n) => get().items.find((i) => i.variation === n),
}))
