/** @author Dogan Kusluoglu */
import React from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { 
  ArrowRight, 
  ArrowDown, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  Layers, 
  Eye, 
  EyeOff,
  Undo2,
  Redo2,
  MessageSquare,
  MessageSquareOff,
  BookOpen,
  ChevronDown,
  X,
  HelpCircle
} from 'lucide-react';
import { downloadJson } from '../model/serialize';
import { calculateStability } from '../model/validator';

export const Toolbar: React.FC = () => {
  const { 
    activeDirection, 
    toggleDirection, 
    pathViewEnabled, 
    setPathViewEnabled,
    commentsVisible,
    setCommentsVisible,
    exportDoc,
    importDoc,
    resetDoc,
    selectedWordId,
    toggleLadder,
    deleteWord,
    doc,
    activeLayerId,
    dictionary,
    loadDictionary,
    undo,
    redo,
    past,
    future
  } = useMnemonicStore();

  const [presetsOpen, setPresetsOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const presets = [
    { name: 'Nervous System', path: '/nervous-system-overview.json' },
    { name: 'Vehicle Operation', path: '/vehicle-overview.json' },
  ];

  const handleLoadPreset = async (path: string) => {
    try {
      const response = await fetch(path);
      const content = await response.text();
      importDoc(content);
      setPresetsOpen(false);
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  };

  const { score, status } = calculateStability(doc, activeLayerId, dictionary);

  React.useEffect(() => {
    if (dictionary.size === 0) {
      loadDictionary();
    }
  }, [dictionary.size, loadDictionary]);

  const handleExport = () => {
    const json = exportDoc();
    downloadJson('mnemonic-ladder.json', json);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const content = re.target?.result as string;
      importDoc(content);
    };
    reader.readAsText(file);
  };

  const selectedWord = doc.layersById[activeLayerId].words.find(w => w.id === selectedWordId);

  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b-2 border-black z-50">
      <div className="flex flex-col">
        <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Mnemonic Ladder</h1>
        <div className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Memory Encoding Tool</div>
      </div>

      <div className="h-10 w-px bg-black mx-2 opacity-20" />

      {/* Presets Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setPresetsOpen(!presetsOpen)}
          className={`flex items-center gap-2 px-3 py-2 border-2 border-black font-black uppercase text-xs tracking-wider transition-colors hover:bg-black hover:text-white ${presetsOpen ? 'bg-black text-white' : 'bg-white'}`}
        >
          <BookOpen size={16} />
          Presets
          <ChevronDown size={14} className={`transition-transform ${presetsOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {presetsOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setPresetsOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
              <div className="p-2 border-b-2 border-black bg-gray-100 text-[10px] font-black uppercase tracking-widest">
                Select a Preset
              </div>
              <div className="flex flex-col">
                {presets.map((preset) => (
                  <button
                    key={preset.path}
                    onClick={() => handleLoadPreset(preset.path)}
                    className="flex items-center gap-3 px-3 py-3 text-left hover:bg-black hover:text-white transition-colors border-b last:border-b-0 border-black/10"
                  >
                    <div className="font-bold text-sm uppercase tracking-tight">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-10 w-px bg-black mx-2 opacity-20" />

      {/* Stability Score Display */}
      <div className="flex flex-col min-w-[120px]">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Stability</div>
          <div className={`text-[9px] px-1 font-bold rounded border border-black ${
            status === 'ASCENDED' ? 'bg-yellow-400' : 
            status === 'CRYSTALLIZED' ? 'bg-blue-400 text-white' : 
            status === 'STABLE' ? 'bg-green-400' :
            status === 'UNSTABLE' ? 'bg-red-400 text-white' : 'bg-gray-200'
          }`}>
            {status}
          </div>
        </div>
        <div className="text-2xl font-black tracking-tighter tabular-nums leading-none">
          {score.toLocaleString()}
        </div>
      </div>

      <div className="h-10 w-px bg-black mx-2 opacity-20" />

      <button 
        onClick={() => setHelpOpen(true)}
        className="flex items-center gap-2 px-3 py-2 border-2 border-black font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-colors"
      >
        <HelpCircle size={16} />
        What am I looking at?
      </button>

      <div className="h-10 w-px bg-black mx-2 opacity-20" />
      
      <div className="flex border-2 border-black divide-x-2 divide-black">
        <button 
          onClick={undo}
          disabled={past.length === 0}
          className={`p-2 hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={20} />
        </button>
        <button 
          onClick={redo}
          disabled={future.length === 0}
          className={`p-2 hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={20} />
        </button>
      </div>

      <div className="flex border-2 border-black divide-x-2 divide-black">
        <button 
          onClick={toggleDirection}
          className={`p-2 hover:bg-black hover:text-white transition-colors ${activeDirection === 'across' ? 'bg-black text-white' : ''}`}
          title="Direction: Across (R)"
        >
          <ArrowRight size={20} />
        </button>
        <button 
          onClick={toggleDirection}
          className={`p-2 hover:bg-black hover:text-white transition-colors ${activeDirection === 'down' ? 'bg-black text-white' : ''}`}
          title="Direction: Down (R)"
        >
          <ArrowDown size={20} />
        </button>
      </div>

      <div className="flex border-2 border-black divide-x-2 divide-black">
        <button 
          onClick={() => setPathViewEnabled(!pathViewEnabled)}
          className={`p-2 hover:bg-black hover:text-white transition-colors ${pathViewEnabled ? 'bg-black text-white' : ''}`}
          title="Toggle Path View"
        >
          {pathViewEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
        <button 
          onClick={() => setCommentsVisible(!commentsVisible)}
          className={`p-2 hover:bg-black hover:text-white transition-colors ${commentsVisible ? 'bg-black text-white' : ''}`}
          title="Toggle Grid Comments"
        >
          {commentsVisible ? <MessageSquare size={20} /> : <MessageSquareOff size={20} />}
        </button>
      </div>

      {selectedWord && (
        <div className="flex border-2 border-black divide-x-2 divide-black">
          <button 
            onClick={() => toggleLadder(selectedWord.id)}
            className={`p-2 hover:bg-black hover:text-white transition-colors ${selectedWord.ladderLayerId ? 'bg-black text-white' : ''}`}
            title="Toggle Ladder (Sub-grid)"
          >
            <Layers size={20} />
          </button>
          <button 
            onClick={() => deleteWord(selectedWord.id)}
            className="p-2 hover:bg-red-500 hover:text-white transition-colors"
            title="Delete Word"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}

      <div className="flex-grow" />

      <div className="flex border-2 border-black divide-x-2 divide-black">
        <label className="p-2 hover:bg-black hover:text-white transition-colors cursor-pointer" title="Import JSON">
          <Upload size={20} />
          <input type="file" className="hidden" onChange={handleImport} accept=".json" />
        </label>
        <button 
          onClick={handleExport}
          className="p-2 hover:bg-black hover:text-white transition-colors"
          title="Export JSON"
        >
          <Download size={20} />
        </button>
        <button 
          onClick={resetDoc}
          className="p-2 hover:bg-red-500 hover:text-white transition-colors"
          title="Clear All"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {helpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setHelpOpen(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b-4 border-black bg-gray-100">
              <h2 className="text-xl font-black uppercase tracking-tighter">About Mnemonic Ladder</h2>
              <button 
                onClick={() => setHelpOpen(false)}
                className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-black"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 font-mono text-sm leading-relaxed">
              <div className="space-y-8">
                <section>
                  <h1 className="text-3xl font-black uppercase tracking-tighter border-b-2 border-black pb-2 mb-4">Mnemonic Ladder</h1>
                  <p className="text-lg font-bold italic">
                    A web-based visual memory encoding tool that merges the ancient <span className="underline">Loci Method (Memory Palace)</span> with modern <span className="underline">Graph Theory</span> and <span className="underline">Linked Data</span> principles.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-black uppercase tracking-tight bg-black text-white px-2 py-1 w-fit">🧠 The Concept</h2>
                  <p>
                    <strong>Mnemonic Ladder</strong> is a grid-based workspace where you "interlock" words like a crossword. The goal isn't to solve a puzzle, but to create a physical "shape" (engram) for memory encoding. It transforms abstract information into a spatial, navigable structure.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 border-2 border-black bg-gray-50">
                      <h3 className="font-black mb-2 uppercase text-xs tracking-widest">🧱 The Backbone</h3>
                      <p className="text-[11px]">Instead of memorizing a list of words, you "interlock" them. The spatial relationship creates a unique visual <strong>engram</strong>. Your brain encodes the shape of the grid just as strongly as the words.</p>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50">
                      <h3 className="font-black mb-2 uppercase text-xs tracking-widest">🧵 The Hamiltonian Path</h3>
                      <p className="text-[11px]">Enforces a "single path" rule. Every word must touch the one before it. This turns information into a <strong>directed data stream</strong> or narrative arc.</p>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50">
                      <h3 className="font-black mb-2 uppercase text-xs tracking-widest">🪜 Infinite Nesting</h3>
                      <p className="text-[11px]">Any word acts as a "Ladder" to a new sub-layer. Mirrors how hyperlinked thoughts work, but visualized as a 2D recursive grid.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 border-2 border-black p-6 bg-yellow-50">
                  <h2 className="text-xl font-black uppercase tracking-tight">👶 ELI5: Why this works</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold underline uppercase text-sm">1. The "Sticky" Factor</h3>
                      <p className="text-xs">Standard lists are boring. Your brain loves spatial layouts. By forcing words to interlock, you remember a unique visual shape—an engram—which is much harder to forget.</p>
                    </div>
                    <div>
                      <h3 className="font-bold underline uppercase text-sm">2. The "Breadcrumb" Rule</h3>
                      <p className="text-xs">It turns info into a movie script. Because words are physically welded together in the grid, your brain naturally follows the track. You can't get lost.</p>
                    </div>
                    <div>
                      <h3 className="font-bold underline uppercase text-sm">3. The "Inception" Effect</h3>
                      <p className="text-xs">Building a Fractal Mind Map. You can start with a 30,000-foot view and "drill down" into infinite detail without feeling overwhelmed.</p>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <h2 className="text-sm font-black uppercase tracking-widest opacity-50">🚀 Key Features</h2>
                    <ul className="text-[11px] space-y-1 list-disc list-inside">
                      <li>Infinite 2D Grid with fluid pan/zoom</li>
                      <li>Single Path real-time validator</li>
                      <li>Gamified Stability Scoring</li>
                      <li>Dictionary interlock bonuses</li>
                      <li>Animated Synapse Path overlays</li>
                      <li>Contextual Layer Memos</li>
                      <li>JSON Multi-layer Export/Import</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-sm font-black uppercase tracking-widest opacity-50">🛠️ Tech Stack</h2>
                    <p className="text-[10px] font-bold">React 19 + TypeScript + Zustand + Tailwind + Lucide</p>
                  </div>
                </section>
              </div>
            </div>
            
            <div className="p-4 border-t-4 border-black bg-gray-100 flex justify-end">
              <button 
                onClick={() => setHelpOpen(false)}
                className="px-8 py-2 bg-black text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors border-2 border-black"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
