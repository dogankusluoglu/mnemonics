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
  HelpCircle,
  GitBranch,
  Sun,
  Moon
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
    future,
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    theme,
    toggleTheme
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
    <>
      <div className="relative flex items-center gap-4 p-4 bg-white dark:bg-[#0a0a0a] border-b-2 border-black dark:border-white z-50">
        {/* Mobile Drawer Toggles */}
        <button 
          onClick={toggleLeftPanel}
          className={`md:hidden flex items-center justify-center p-2 border-2 border-black dark:border-white transition-colors ${leftPanelOpen ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-transparent text-black dark:text-white'}`}
          title="Toggle Roots Panel"
        >
          <GitBranch size={20} />
        </button>

        <div className="flex flex-col shrink-0">
          <h1 className="text-xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">Mnemonic Ladder</h1>
          <div className="text-[10px] font-bold tracking-widest opacity-40 uppercase text-black dark:text-white">Memory Encoding Tool</div>
        </div>

        <div className="h-10 w-px bg-black dark:bg-white mx-2 opacity-20 shrink-0" />

        {/* Presets Dropdown */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setPresetsOpen(!presetsOpen)}
            className={`flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-white font-black uppercase text-xs tracking-wider transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black ${presetsOpen ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-transparent text-black dark:text-white'}`}
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Presets</span>
            <ChevronDown size={14} className={`transition-transform ${presetsOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {presetsOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setPresetsOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] z-[60]">
                <div className="p-2 border-b-2 border-black dark:border-white bg-gray-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-black dark:text-white">
                  Select a Preset
                </div>
                <div className="flex flex-col">
                  {presets.map((preset) => (
                    <button
                      key={preset.path}
                      onClick={() => handleLoadPreset(preset.path)}
                      className="flex items-center gap-3 px-3 py-3 text-left hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors border-b last:border-b-0 border-black/10 dark:border-white/10 text-black dark:text-white"
                    >
                      <div className="font-bold text-sm uppercase tracking-tight">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 overflow-x-auto thin-scrollbar whitespace-nowrap">
          <div className="h-10 w-px bg-black dark:bg-white mx-2 opacity-20 shrink-0" />

          {/* Stability Score Display */}
          <div className="flex flex-col min-w-[120px] shrink-0">
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-50 text-black dark:text-white">Stability</div>
              <div className={`text-[9px] px-1 font-bold rounded border border-black dark:border-white ${
                status === 'ASCENDED' ? 'bg-yellow-400 text-black' : 
                status === 'CRYSTALLIZED' ? 'bg-blue-400 text-white' : 
                status === 'STABLE' ? 'bg-green-400 text-black' :
                status === 'UNSTABLE' ? 'bg-red-400 text-white' : 'bg-gray-200 dark:bg-white/10 text-black dark:text-white'
              }`}>
                {status}
              </div>
            </div>
            <div className="text-2xl font-black tracking-tighter tabular-nums leading-none text-black dark:text-white">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="h-10 w-px bg-black dark:bg-white mx-2 opacity-20 shrink-0" />

          <button 
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-white font-black uppercase text-[10px] tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors shrink-0 text-black dark:text-white"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">What am I looking at?</span>
          </button>

          <div className="h-10 w-px bg-black dark:bg-white mx-2 opacity-20 shrink-0" />
          
          <div className="flex border-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white shrink-0">
            <button 
              onClick={undo}
              disabled={past.length === 0}
              className={`p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black dark:disabled:hover:text-white text-black dark:text-white`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={20} />
            </button>
            <button 
              onClick={redo}
              disabled={future.length === 0}
              className={`p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black dark:disabled:hover:text-white text-black dark:text-white`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={20} />
            </button>
          </div>

          <div className="flex border-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white shrink-0">
            <button 
              onClick={toggleDirection}
              className={`p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors ${activeDirection === 'across' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-black dark:text-white'}`}
              title="Direction: Across"
            >
              <ArrowRight size={20} />
            </button>
            <button 
              onClick={toggleDirection}
              className={`p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors ${activeDirection === 'down' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-black dark:text-white'}`}
              title="Direction: Down"
            >
              <ArrowDown size={20} />
            </button>
          </div>

          <div className="flex border-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white shrink-0">
            <button 
              onClick={() => setPathViewEnabled(!pathViewEnabled)}
              className={`p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors ${pathViewEnabled ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-black dark:text-white'}`}
              title="Toggle Path View"
            >
              {pathViewEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button 
              onClick={() => setCommentsVisible(!commentsVisible)}
              className={`p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors ${commentsVisible ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-black dark:text-white'}`}
              title="Toggle Grid Comments"
            >
              {commentsVisible ? <MessageSquare size={20} /> : <MessageSquareOff size={20} />}
            </button>
          </div>

          <div className="flex border-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white shrink-0">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-black dark:text-white"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>

          {selectedWord && (
            <div className="flex border-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white shrink-0">
              <button 
                onClick={() => toggleLadder(selectedWord.id)}
                className={`p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors ${selectedWord.ladderLayerId ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-black dark:text-white'}`}
                title="Toggle Ladder (Sub-grid)"
              >
                <Layers size={20} />
              </button>
              <button 
                onClick={() => deleteWord(selectedWord.id)}
                className="p-2 hover:bg-red-500 hover:text-white transition-colors text-black dark:text-white"
                title="Delete Word"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

          <div className="flex-grow min-w-[20px]" />

          <div className="flex border-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white shrink-0">
            <label className="p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer text-black dark:text-white" title="Import JSON">
              <Upload size={20} />
              <input type="file" className="hidden" onChange={handleImport} accept=".json" />
            </label>
            <button 
              onClick={handleExport}
              className="p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-black dark:text-white"
              title="Export JSON"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={resetDoc}
              className="p-2 hover:bg-red-500 hover:text-white transition-colors text-black dark:text-white"
              title="Clear All"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Mobile Drawer Toggle (Right) */}
          <button 
            onClick={toggleRightPanel}
            className={`md:hidden flex items-center justify-center p-2 border-2 border-black dark:border-white transition-colors ${rightPanelOpen ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-transparent text-black dark:text-white'}`}
            title="Toggle Word List"
          >
            <Layers size={20} />
          </button>
        </div>
      </div>

      {helpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
          <div 
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" 
            onClick={() => setHelpOpen(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0a0a0a] border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b-4 border-black dark:border-white bg-gray-100 dark:bg-white/5">
              <h2 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">About Mnemonic Ladder</h2>
              <button 
                onClick={() => setHelpOpen(false)}
                className="p-1 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors border-2 border-black dark:border-white text-black dark:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 font-mono text-sm leading-relaxed text-black dark:text-white/80">
              <div className="space-y-8">
                <section>
                  <h1 className="text-3xl font-black uppercase tracking-tighter border-b-2 border-black dark:border-white pb-2 mb-4 text-black dark:text-white">Mnemonic Ladder</h1>
                  <p className="text-lg font-bold italic">
                    A web-based visual memory encoding tool that merges the ancient <span className="underline">Loci Method (Memory Palace)</span> with modern <span className="underline">Graph Theory</span> and <span className="underline">Linked Data</span> principles.
                  </p>
                  <div className="mt-4 p-4 border-2 border-black dark:border-white bg-blue-50 dark:bg-blue-900/20 space-y-3">
                    <p className="text-xs">
                      <strong className="uppercase tracking-widest">🪜 The Ladder Rule:</strong> To drill into a word and create a sub-layer, you must first click the <strong>Enable Ladder (<Layers size={14} className="inline mb-1" />)</strong> icon in the toolbar or word list. Once enabled, double-click (or double-tap on mobile) the word in the grid to dive in.
                    </p>
                    <p className="text-xs">
                      <strong className="uppercase tracking-widest">👁️ Path View:</strong> Click the <strong>Toggle Path View (<Eye size={14} className="inline mb-1" />)</strong> icon to see the "Synapse Path"—a visual connection between words that reinforces the sequential nature of your memory engram.
                    </p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-black uppercase tracking-tight bg-black dark:bg-white text-white dark:text-black px-2 py-1 w-fit">🧠 The Concept</h2>
                  <p>
                    <strong>Mnemonic Ladder</strong> is a grid-based workspace where you "interlock" words like a crossword. The goal isn't to solve a puzzle, but to create a physical "shape" (engram) for memory encoding. It transforms abstract information into a spatial, navigable structure.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                      <h3 className="font-black mb-2 uppercase text-xs tracking-widest">🧱 The Backbone</h3>
                      <p className="text-[11px]">Instead of memorizing a list of words, you "interlock" them. The spatial relationship creates a unique visual <strong>engram</strong>. Your brain encodes the shape of the grid just as strongly as the words.</p>
                    </div>
                    <div className="p-4 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                      <h3 className="font-black mb-2 uppercase text-xs tracking-widest">🧵 The Hamiltonian Path</h3>
                      <p className="text-[11px]">Enforces a "single path" rule. Every word must touch the one before it. This turns information into a <strong>directed data stream</strong> or narrative arc.</p>
                    </div>
                    <div className="p-4 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                      <h3 className="font-black mb-2 uppercase text-xs tracking-widest">🪜 Infinite Nesting</h3>
                      <p className="text-[11px]">Any word acts as a "Ladder" to a new sub-layer. Mirrors how hyperlinked thoughts work, but visualized as a 2D recursive grid.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 border-2 border-black dark:border-white p-6 bg-yellow-50 dark:bg-yellow-900/20">
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
            
            <div className="p-4 border-t-4 border-black dark:border-white bg-gray-100 dark:bg-white/5 flex justify-end">
              <button 
                onClick={() => setHelpOpen(false)}
                className="px-8 py-2 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white transition-colors border-2 border-black dark:border-white"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
