/** @author Dogan Kusluoglu */
import React from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { 
  X, 
  Layers, 
  BookOpen, 
  MousePointer2, 
  Keyboard,
  Star,
  Brain
} from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const { welcomeModalVisible, setWelcomeModalVisible } = useMnemonicStore();

  if (!welcomeModalVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setWelcomeModalVisible(false)}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black dark:border-white bg-yellow-400 dark:bg-yellow-600">
          <div className="flex items-center gap-3">
            <Brain size={28} strokeWidth={2.5} className="text-black dark:text-white" />
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Welcome to Mnemonic Ladder</h2>
          </div>
          <button 
            onClick={() => setWelcomeModalVisible(false)}
            className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-black dark:border-white bg-white dark:bg-[#1a1a1a] text-black dark:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 font-mono text-black dark:text-white">
          <div className="space-y-8">
            {/* The Why */}
            <section>
              <h3 className="text-lg font-black uppercase tracking-tight bg-black dark:bg-white text-white dark:text-black px-2 py-1 w-fit mb-3">
                Why use this?
              </h3>
              <p className="text-sm leading-relaxed font-bold italic border-l-4 border-black dark:border-white pl-4">
                "Stop memorizing lists. Start building shapes."
              </p>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                The brain is naturally wired for spatial navigation. By interlocking words into a visual grid (an engram), you transform abstract data into a physical "location" that is significantly harder to forget.
              </p>
            </section>

            {/* Quick Start Guide */}
            <section className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight bg-black dark:bg-white text-white dark:text-black px-2 py-1 w-fit">
                How to play
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-4 p-4 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                  <div className="flex-shrink-0 w-8 h-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black rounded-full text-sm">1</div>
                  <div>
                    <div className="font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-1">
                      <MousePointer2 size={14} /> Select a Cell
                    </div>
                    <p className="text-xs opacity-70">Click anywhere on the infinite grid to start your first word.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                  <div className="flex-shrink-0 w-8 h-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black rounded-full text-sm">2</div>
                  <div>
                    <div className="font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-1">
                      <Keyboard size={14} /> Type & Interlock
                    </div>
                    <p className="text-xs opacity-70">Type a word and press Enter. Interlock new words with existing ones to create a "chain". Use the <strong>direction buttons</strong> in the toolbar to change flow.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                  <div className="flex-shrink-0 w-8 h-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black rounded-full text-sm">3</div>
                  <div>
                    <div className="font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-1">
                      <Layers size={14} /> Ladder Down
                    </div>
                    <p className="text-xs opacity-70">Click the Ladder icon on a word to enable a sub-layer, then double-click it to dive into more detail.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Presets Recommendation */}
            <section className="p-4 border-2 border-black dark:border-white bg-blue-50 dark:bg-blue-900/20 border-dashed">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
                <h3 className="font-black uppercase text-sm tracking-wider">Pro Tip: Try a Preset</h3>
              </div>
              <p className="text-xs leading-relaxed">
                Feeling stuck? Click the <strong className="uppercase">Presets</strong> button in the top toolbar to load pre-built memory ladders like the <span className="underline font-bold">Nervous System</span> or <span className="underline font-bold">Vehicle Operation</span>.
              </p>
            </section>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t-4 border-black dark:border-white bg-gray-100 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={12} fill="currentColor" className="text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-white">Mnemonic Ladder v1.0</span>
          </div>
          <button 
            onClick={() => setWelcomeModalVisible(false)}
            className="px-10 py-3 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest hover:bg-yellow-400 dark:hover:bg-yellow-600 hover:text-black dark:hover:text-white transition-all border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            I'm Ready
          </button>
        </div>
      </div>
    </div>
  );
};

