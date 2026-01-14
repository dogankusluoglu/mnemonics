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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setWelcomeModalVisible(false)}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0a] border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b-4 border-black dark:border-white bg-yellow-400 dark:bg-yellow-600">
          <div className="flex items-center gap-3">
            <Brain size={24} strokeWidth={2.5} className="text-black dark:text-white" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">Welcome</h2>
          </div>
          <button 
            onClick={() => setWelcomeModalVisible(false)}
            className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-black dark:border-white bg-white dark:bg-[#1a1a1a] text-black dark:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 font-mono text-black dark:text-white">
          <div className="space-y-6">
            {/* The Why */}
            <section>
              <h3 className="text-base font-black uppercase tracking-tight bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 w-fit mb-2">
                Why use this?
              </h3>
              <p className="text-xs leading-relaxed font-bold italic border-l-4 border-black dark:border-white pl-3">
                "Stop memorizing lists. Start building shapes."
              </p>
              <p className="mt-2 text-xs leading-relaxed opacity-80">
                The brain is naturally wired for spatial navigation. By interlocking words into a visual grid (an engram), you transform abstract data into a physical "location".
              </p>
            </section>

            {/* Quick Start Guide */}
            <section className="space-y-3">
              <h3 className="text-base font-black uppercase tracking-tight bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 w-fit">
                How to play
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-start gap-3 p-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                  <div className="flex-shrink-0 w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black rounded-full text-xs">1</div>
                  <div>
                    <div className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-0.5">
                      <MousePointer2 size={12} /> Select a Cell
                    </div>
                    <p className="text-[10px] opacity-70 leading-tight">Click anywhere on the infinite grid to start your first word.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                  <div className="flex-shrink-0 w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black rounded-full text-xs">2</div>
                  <div>
                    <div className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-0.5">
                      <Keyboard size={12} /> Type & Interlock
                    </div>
                    <p className="text-[10px] opacity-70 leading-tight">Type a word and press Enter. Interlock words to create a "chain".</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-white/5">
                  <div className="flex-shrink-0 w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black rounded-full text-xs">3</div>
                  <div>
                    <div className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-0.5">
                      <Layers size={12} /> Ladder Down
                    </div>
                    <p className="text-[10px] opacity-70 leading-tight">Click the Ladder icon to enable a sub-layer, then double-click it.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t-4 border-black dark:border-white bg-gray-100 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={10} fill="currentColor" className="text-yellow-500" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-black dark:text-white">v1.0</span>
          </div>
          <button 
            onClick={() => setWelcomeModalVisible(false)}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest hover:bg-yellow-400 dark:hover:bg-yellow-600 hover:text-black dark:hover:text-white transition-all border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 text-xs"
          >
            I'm Ready
          </button>
        </div>
      </div>
    </div>
  );
};

