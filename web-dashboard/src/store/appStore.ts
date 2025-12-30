import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  searchQuery: string;
  selectedGroup: string | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedGroup: (group: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  searchQuery: '',
  selectedGroup: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
}));
