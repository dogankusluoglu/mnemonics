/** @author Dogan Kusluoglu */
import React from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { Layers, Trash2, Info, Keyboard, MousePointer2, Star, CheckCircle2, MessageSquare, Eye } from 'lucide-react';
import { getOverlapCount } from '../model/validator';

export const WordList: React.FC = () => {
  const { doc, activeLayerId, selectedWordId, setSelectedWord, deleteWord, dictionary, setLayerComment, helpVisible, setHelpVisible } = useMnemonicStore();
  const activeLayer = doc.layersById[activeLayerId];

  return (
    <div className="w-80 max-w-[calc(100vw-48px)] border-l-4 border-black dark:border-white bg-white dark:bg-[#0a0a0a] flex flex-col z-40 h-full overflow-hidden">
      {/* How it Works / Help Section */}
      <div className="shrink-0 flex flex-col border-b-2 border-black dark:border-white">
        <button 
          onClick={() => setHelpVisible(!helpVisible)}
          className="flex items-center justify-between p-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info size={18} />
            <h2 className="font-bold uppercase tracking-tighter text-lg">How it Works</h2>
          </div>
          <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">
            {helpVisible ? 'Hide' : 'Show'}
          </div>
        </button>

        {helpVisible && (
          <div className="p-4 bg-black dark:bg-white text-white dark:text-black space-y-3 border-t border-white/20 dark:border-black/10">
            <p className="text-[11px] leading-relaxed opacity-90 font-mono">
              Create an <span className="font-bold underline text-yellow-400 dark:text-blue-600">Engram</span>: a visual memory shape. 
              Interlock words in a sequence. <span className="underline">Stability</span> increases with chain length, extra interlocks (★), and nested layers.
            </p>

            <div className="space-y-2 border-y border-white/10 dark:border-black/10 py-2">
              <div className="flex items-center gap-2">
                <Layers size={12} className="text-blue-400" />
                <p className="text-[10px] leading-tight opacity-90 font-mono">
                  <span className="font-bold uppercase">Drill down:</span> Click the <Layers size={10} className="inline mx-0.5" /> icon on a word to enable its <span className="italic">Ladder</span> (sub-grid), then double-click/tap the word to enter.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={12} className="text-blue-400" />
                <p className="text-[10px] leading-tight opacity-90 font-mono">
                  <span className="font-bold uppercase">Path View:</span> Toggles the "Synapse Path" overlay to visualize the exact sequence of your memory chain.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-1 font-bold"><Keyboard size={10}/> KEYS</div>
                <ul className="opacity-70">
                  <li>[TYPE] Letters</li>
                  <li>[ENTER] Save</li>
                  <li>[ESC] Cancel</li>
                </ul>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 font-bold"><MousePointer2 size={10}/> MOUSE</div>
                <ul className="opacity-70">
                  <li>[ALT+DRAG] Pan</li>
                  <li>[SCROLL] Zoom</li>
                  <li>[DBL-CLK] Drill</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-b-2 border-black dark:border-white font-bold uppercase tracking-widest text-xs bg-gray-50 dark:bg-white/5 shrink-0 text-black dark:text-white">
        Active Layer ({activeLayer.words.length})
      </div>

      {/* Layer Comment */}
      <div className="shrink-0 p-3 bg-white dark:bg-[#1a1a1a] border-b-2 border-black dark:border-white">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={12} className="opacity-50 text-black dark:text-white" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-50 text-black dark:text-white">Layer Memo</span>
        </div>
        <textarea
          value={activeLayer.comment || ''}
          onChange={(e) => setLayerComment(activeLayerId, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          placeholder="Add a comment for this layer..."
          className="w-full min-h-28 max-h-72 p-2 text-[11px] leading-relaxed font-mono border border-black dark:border-white bg-white dark:bg-black/20 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white resize-y overflow-auto whitespace-pre-wrap placeholder:opacity-30"
        />
      </div>

      <div className="flex-grow overflow-y-auto p-2 space-y-2 bg-gray-50/50 dark:bg-black/10 thin-scrollbar">
        {activeLayer.words.length === 0 ? (
          <div className="text-gray-400 dark:text-white/30 text-[11px] text-center mt-8 italic px-4">
            Click any cell in the grid and start typing to begin the sequence...
          </div>
        ) : (
          activeLayer.words.map((word, index) => (
            <div
              key={word.id}
              onClick={() => setSelectedWord(word.id)}
              className={`p-3 border-2 border-black dark:border-white cursor-pointer transition-all ${
                selectedWordId === word.id 
                  ? 'bg-black dark:bg-white text-white dark:text-black translate-x-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' 
                  : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-black dark:text-white'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-mono text-[10px] ${selectedWordId === word.id ? 'opacity-100' : 'opacity-40'}`}>
                  STEP {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex gap-2 items-center">
                  {dictionary.has(word.text.toUpperCase()) && (
                    <CheckCircle2 size={12} className="text-blue-500" />
                  )}
                  {word.ladderLayerId && (
                    <Layers size={14} className={selectedWordId === word.id ? 'text-yellow-400 dark:text-blue-600' : 'text-blue-600 dark:text-blue-400'} />
                  )}
                  {selectedWordId === word.id && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteWord(word.id); }}
                      className="text-red-400 hover:text-red-300 dark:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="font-bold font-mono text-lg tracking-tight truncate uppercase">{word.text}</div>
              <div className="flex justify-between items-center mt-1">
                <div className={`text-[9px] uppercase tracking-tighter ${selectedWordId === word.id ? 'opacity-70' : 'opacity-40'}`}>
                  {word.direction} @ {word.start.x}, {word.start.y}
                </div>
                {index > 0 && !activeLayer.words.slice(0, index).some(w => activeLayer.words[index].id === w.id) && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: getOverlapCount(word, activeLayer.words[index - 1]) }).map((_, i) => (
                      <Star key={i} size={8} fill="currentColor" className={selectedWordId === word.id ? 'text-yellow-400' : 'text-black dark:text-white'} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-2 border-t-2 border-black dark:border-white text-[9px] text-center font-bold tracking-[0.2em] uppercase opacity-30 text-black dark:text-white">
        Mnemonic Ladder v1.0
      </div>
    </div>
  );
};
