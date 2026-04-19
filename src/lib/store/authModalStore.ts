"use client";

import { create } from "zustand";

export type AuthModalMode = "login" | "register";

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
  switchTo: (mode: AuthModalMode) => void;
}

/**
 * useAuthModalStore — controls the visibility and mode of the auth modal.
 * Kept separate from authStore so UI state is never mixed with user data.
 */
export const useAuthModalStore = create<AuthModalState>()((set) => ({
  open: false,
  mode: "login",

  openLogin: () => set({ open: true, mode: "login" }),
  openRegister: () => set({ open: true, mode: "register" }),
  close: () => set({ open: false }),
  switchTo: (mode) => set({ mode }),
}));
