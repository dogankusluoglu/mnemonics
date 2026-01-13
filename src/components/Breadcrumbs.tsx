/** @author Dogan Kusluoglu */
import React from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const { navStack, doc, popLayer } = useMnemonicStore();

  const getLayerName = (id: string) => {
    if (id === 'root') return 'Home';
    return doc.layersById[id]?.name || id;
  };

  return (
    <div className="relative flex items-center gap-2 p-2 px-4 bg-gray-100 dark:bg-white/5 border-b-2 border-black dark:border-white font-mono text-sm z-40 text-black dark:text-white">
      {navStack.map((layerId, index) => (
        <React.Fragment key={layerId}>
          {index > 0 && <ChevronRight size={14} className="text-gray-400 dark:text-white/40" />}
          <button
            onClick={() => {
              // Pop until we reach this index
              const popsNeeded = navStack.length - 1 - index;
              for (let i = 0; i < popsNeeded; i++) {
                popLayer();
              }
            }}
            className={`hover:underline uppercase tracking-widest ${
              index === navStack.length - 1 ? 'font-bold' : 'text-gray-500 dark:text-white/60'
            }`}
          >
            {index === 0 ? <Home size={14} className="inline mr-1" /> : null}
            {getLayerName(layerId)}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
