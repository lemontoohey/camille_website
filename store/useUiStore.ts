import { create } from 'zustand';

interface UiState {
  isCanvasPaused: boolean;
  setCanvasPaused: (paused: boolean) => void;
  // Cursor states
  isHoveringArtwork: boolean;
  setHoveringArtwork: (hovering: boolean) => void;
  // Loader states
  hasLoaded: boolean;
  setHasLoaded: (loaded: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCanvasPaused: false,
  setCanvasPaused: (paused) => set({ isCanvasPaused: paused }),
  isHoveringArtwork: false,
  setHoveringArtwork: (hovering) => set({ isHoveringArtwork: hovering }),
  hasLoaded: false,
  setHasLoaded: (loaded) => set({ hasLoaded: loaded }),
}));
