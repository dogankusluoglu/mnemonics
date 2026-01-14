/** @author Dogan Kusluoglu */
import React from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { GitBranch } from 'lucide-react';

export const EngramRoots: React.FC = () => {
  const { doc, activeLayerId, navStack } = useMnemonicStore();

  // Helper to get nested words for visualization
  const getTreeData = (layerId: string, depth = 0): any[] => {
    const layer = doc.layersById[layerId];
    if (!layer) return [];
    
    return layer.words.map(w => ({
      text: w.text,
      id: w.id,
      isLadder: !!w.ladderLayerId,
      subWords: w.ladderLayerId ? getTreeData(w.ladderLayerId, depth + 1) : [],
      isActiveLayer: layerId === activeLayerId,
      isAncestor: navStack.includes(layerId) && layerId !== activeLayerId
    }));
  };

  const fullTree = getTreeData(doc.rootLayerId);

  const renderTreeNode = (node: any, depth = 0) => {
    return (
      <div key={node.id} className="flex flex-col">
        <div className={`flex items-center gap-2 py-1 px-2 border-l-2 transition-colors ${
          node.isActiveLayer ? 'border-black dark:border-white bg-gray-100 dark:bg-white/10 font-bold text-black dark:text-white' : 
          node.isAncestor ? 'border-gray-400 dark:border-white/40 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/60' : 'border-transparent text-gray-400 dark:text-white/30'
        }`} style={{ marginLeft: depth * 12 }}>
          <div className={`w-1.5 h-1.5 rounded-full ${node.isLadder ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/20'}`} />
          <span className="truncate uppercase text-[10px] tracking-tighter">{node.text}</span>
        </div>
        {node.subWords.map((sub: any) => renderTreeNode(sub, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-64 max-w-[calc(100vw-48px)] bg-white dark:bg-[#0a0a0a] flex flex-col z-40 h-full overflow-hidden shrink-0">
      <div className="p-2 px-3 flex items-center gap-2 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
        <GitBranch size={12} className="opacity-50 text-black dark:text-white" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 text-black dark:text-white">Engram Roots</span>
      </div>
      <div className="flex-grow overflow-y-auto p-2 font-mono thin-scrollbar">
        {fullTree.map(node => renderTreeNode(node))}
        {fullTree.length === 0 && (
          <div className="text-[9px] text-gray-400 dark:text-white/30 italic p-2 uppercase text-center mt-4">No roots established</div>
        )}
      </div>
    </div>
  );
};
