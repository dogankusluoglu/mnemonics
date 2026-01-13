/** @author Dogan Kusluoglu */
import { create } from 'zustand';
import { 
  updateLayerCells, 
} from '../model/validator';
import { exportDoc, importDoc } from '../model/serialize';

export interface Coord {
  x: number;
  y: number;
}

export type Direction = 'across' | 'down';

export interface Cell {
  coord: Coord;
  char: string;
  wordIds: string[];
}

export interface WordPlacement {
  id: string;
  layerId: string;
  createdAt: number;
  start: Coord;
  direction: Direction;
  text: string;
  ladderLayerId?: string;
}

export interface Layer {
  id: string;
  name?: string;
  comment?: string;
  // Position of the layer memo on the grid, in grid (cell) coordinates.
  // If unset, UI will compute a default anchor.
  commentPos?: Coord;
  cellsByKey: Record<string, Cell>;
  words: WordPlacement[];
}

export interface MnemonicDoc {
  version: 1;
  rootLayerId: string;
  layersById: Record<string, Layer>;
}

interface MnemonicState {
  doc: MnemonicDoc;
  activeLayerId: string;
  navStack: string[]; // for breadcrumbs
  
  // UI State
  activeCell: Coord | null;
  activeDirection: Direction;
  selectedWordId: string | null;
  pathViewEnabled: boolean;
  commentsVisible: boolean;
  helpVisible: boolean;
  
  // Drafting state (current word being typed)
  currentDraft: string;
  
  // Camera state
  camera: { scale: number; positionX: number; positionY: number };
  
  // Dictionary
  dictionary: Set<string>;

  // History
  past: MnemonicDoc[];
  future: MnemonicDoc[];
}

interface MnemonicActions {
  loadDictionary: () => Promise<void>;
  
  // Navigation
  setActiveLayer: (layerId: string) => void;
  pushLayer: (layerId: string) => void;
  popLayer: () => void;
  
  // UI Interaction
  setActiveCell: (coord: Coord | null) => void;
  toggleDirection: () => void;
  setSelectedWord: (wordId: string | null) => void;
  setPathViewEnabled: (enabled: boolean) => void;
  setCommentsVisible: (visible: boolean) => void;
  setHelpVisible: (visible: boolean) => void;
  setCamera: (camera: Partial<MnemonicState['camera']>) => void;
  
  // Editing
  typeChar: (char: string) => void;
  backspace: () => void;
  commitWord: () => void;
  cancelDraft: () => void;
  
  // Word/Ladder Management
  toggleLadder: (wordId: string) => void;
  deleteWord: (wordId: string) => void;
  setLayerComment: (layerId: string, comment: string) => void;
  setLayerCommentPos: (layerId: string, pos: Coord | null) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Persistence
  importDoc: (json: string) => void;
  exportDoc: () => string;
  resetDoc: () => void;
}

const INITIAL_LAYER_ID = 'root';

const createInitialDoc = (): MnemonicDoc => {
  const rootLayer: Layer = {
    id: INITIAL_LAYER_ID,
    cellsByKey: {},
    words: [],
  };
  return {
    version: 1,
    rootLayerId: INITIAL_LAYER_ID,
    layersById: {
      [INITIAL_LAYER_ID]: rootLayer,
    },
  };
};

export const useMnemonicStore = create<MnemonicState & MnemonicActions>((set, get) => ({
  doc: createInitialDoc(),
  activeLayerId: INITIAL_LAYER_ID,
  navStack: [INITIAL_LAYER_ID],
  
  activeCell: null,
  activeDirection: 'across',
  selectedWordId: null,
  pathViewEnabled: false,
  commentsVisible: true,
  helpVisible: true,
  currentDraft: '',
  camera: { scale: 1, positionX: 0, positionY: 0 },
  dictionary: new Set(),
  past: [],
  future: [],

  loadDictionary: async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt');
      const text = await response.text();
      const words = new Set(text.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length > 0));
      set({ dictionary: words });
    } catch (e) {
      console.error('Failed to load dictionary', e);
    }
  },

  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  
  pushLayer: (layerId) => set((state) => ({ 
    navStack: [...state.navStack, layerId],
    activeLayerId: layerId,
    activeCell: null,
    currentDraft: '',
  })),
  
  popLayer: () => set((state) => {
    if (state.navStack.length <= 1) return state;
    const newStack = state.navStack.slice(0, -1);
    return {
      navStack: newStack,
      activeLayerId: newStack[newStack.length - 1],
      activeCell: null,
      currentDraft: '',
    };
  }),

  setActiveCell: (coord) => set({ activeCell: coord, currentDraft: '' }),
  
  toggleDirection: () => set((state) => ({ 
    activeDirection: state.activeDirection === 'across' ? 'down' : 'across' 
  })),

  setSelectedWord: (wordId) => set({ selectedWordId: wordId }),
  
  setPathViewEnabled: (enabled) => set({ pathViewEnabled: enabled }),
  
  setCommentsVisible: (visible) => set({ commentsVisible: visible }),
  
  setHelpVisible: (visible) => set({ helpVisible: visible }),
  
  setCamera: (cameraUpdate) => set((state) => ({ 
    camera: { ...state.camera, ...cameraUpdate } 
  })),

  typeChar: (char) => set((state) => {
    if (!state.activeCell) return state;
    return { currentDraft: state.currentDraft + char };
  }),

  backspace: () => set((state) => ({
    currentDraft: state.currentDraft.slice(0, -1)
  })),

  cancelDraft: () => set({ currentDraft: '', activeCell: null }),

  commitWord: () => set((state) => {
    if (!state.activeCell || !state.currentDraft) return state;
    
    const activeLayer = state.doc.layersById[state.activeLayerId];
    const newWord: WordPlacement = {
      id: Math.random().toString(36).substr(2, 9),
      layerId: state.activeLayerId,
      createdAt: Date.now(),
      start: state.activeCell,
      direction: state.activeDirection,
      text: state.currentDraft,
    };

    const updatedLayer = updateLayerCells({
      ...activeLayer,
      words: [...activeLayer.words, newWord],
    });

    return {
      doc: {
        ...state.doc,
        layersById: {
          ...state.doc.layersById,
          [state.activeLayerId]: updatedLayer,
        },
      },
      past: [...state.past, state.doc],
      future: [],
      currentDraft: '',
      activeCell: null,
    };
  }),

  toggleLadder: (wordId) => set((state) => {
    const activeLayer = state.doc.layersById[state.activeLayerId];
    const wordIndex = activeLayer.words.findIndex(w => w.id === wordId);
    if (wordIndex === -1) return state;

    const word = activeLayer.words[wordIndex];
    let updatedWord = { ...word };
    let updatedLayers = { ...state.doc.layersById };

    if (word.ladderLayerId) {
      delete updatedWord.ladderLayerId;
    } else {
      const newLayerId = `layer-${Math.random().toString(36).substr(2, 9)}`;
      updatedWord.ladderLayerId = newLayerId;
      updatedLayers[newLayerId] = {
        id: newLayerId,
        name: word.text,
        cellsByKey: {},
        words: [],
      };
    }

    const updatedWords = [...activeLayer.words];
    updatedWords[wordIndex] = updatedWord;

    return {
      doc: {
        ...state.doc,
        layersById: {
          ...updatedLayers,
          [state.activeLayerId]: {
            ...activeLayer,
            words: updatedWords,
          },
        },
      },
      past: [...state.past, state.doc],
      future: [],
    };
  }),

  deleteWord: (wordId) => set((state) => {
    const activeLayer = state.doc.layersById[state.activeLayerId];
    const updatedWords = activeLayer.words.filter(w => w.id !== wordId);
    const updatedLayer = updateLayerCells({ ...activeLayer, words: updatedWords });

    return {
      doc: {
        ...state.doc,
        layersById: {
          ...state.doc.layersById,
          [state.activeLayerId]: updatedLayer,
        },
      },
      past: [...state.past, state.doc],
      future: [],
      selectedWordId: state.selectedWordId === wordId ? null : state.selectedWordId,
    };
  }),

  setLayerComment: (layerId, comment) => set((state) => {
    const layer = state.doc.layersById[layerId];
    if (!layer) return state;

    return {
      doc: {
        ...state.doc,
        layersById: {
          ...state.doc.layersById,
          [layerId]: {
            ...layer,
            comment,
          },
        },
      },
      past: [...state.past, state.doc],
      future: [],
    };
  }),

  setLayerCommentPos: (layerId, pos) => set((state) => {
    const layer = state.doc.layersById[layerId];
    if (!layer) return state;

    return {
      doc: {
        ...state.doc,
        layersById: {
          ...state.doc.layersById,
          [layerId]: {
            ...layer,
            commentPos: pos || undefined,
          },
        },
      },
      past: [...state.past, state.doc],
      future: [],
    };
  }),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    return {
      doc: previous,
      past: newPast,
      future: [state.doc, ...state.future],
      activeCell: null,
      currentDraft: '',
      selectedWordId: null,
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      doc: next,
      past: [...state.past, state.doc],
      future: newFuture,
      activeCell: null,
      currentDraft: '',
      selectedWordId: null,
    };
  }),

  importDoc: (json) => {
    const doc = importDoc(json);
    set((state) => ({ 
      doc, 
      past: [...state.past, state.doc],
      future: [],
      activeLayerId: doc.rootLayerId, 
      navStack: [doc.rootLayerId],
      activeCell: null,
      currentDraft: '',
      selectedWordId: null,
    }));
  },

  exportDoc: () => {
    return exportDoc(get().doc);
  },

  resetDoc: () => {
    set((state) => ({
      doc: createInitialDoc(),
      past: [...state.past, state.doc],
      future: [],
      activeLayerId: INITIAL_LAYER_ID,
      navStack: [INITIAL_LAYER_ID],
      activeCell: null,
      currentDraft: '',
      selectedWordId: null,
      camera: { scale: 1, positionX: 0, positionY: 0 }
    }));
  }
}));
