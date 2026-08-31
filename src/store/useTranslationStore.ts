import { create } from 'zustand';

interface TranslationStore {
    activeBookIds: number[];
    addBook: (bookId: number) => void;
    removeBook: (bookId: number) => void;
    lastCompletedBookId: number | null;
    triggerCompletion: (bookId: number) => void;
    clearCompletion: () => void;
}

export const useTranslationStore = create<TranslationStore>((set) => ({
    activeBookIds: [],
    addBook: (id) => set((state) => ({ 
        activeBookIds: state.activeBookIds.includes(id) ? state.activeBookIds : [...state.activeBookIds, id] 
    })),
    removeBook: (id) => set((state) => ({ 
        activeBookIds: state.activeBookIds.filter(b => b !== id) 
    })),
    lastCompletedBookId: null,
    triggerCompletion: (id) => set({ lastCompletedBookId: id }),
    clearCompletion: () => set({ lastCompletedBookId: null }),
}));
