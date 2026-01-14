import React, { useMemo, useEffect, useRef } from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { buildMapData } from '../model/threeMap';
import type { MapNode, MapEdge } from '../model/threeMap';
import { X } from 'lucide-react';

export const RouteDiagram: React.FC = () => {
  const { doc, selectedWordId, setSelectedWord } = useMnemonicStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const routeData = useMemo(() => {
    if (!selectedWordId) return null;

    const mapData = buildMapData(doc);
    const nodeById = new Map<string, MapNode>();
    mapData.nodes.forEach(n => nodeById.set(n.id, n));

    const outgoingEdgesByNode = new Map<string, MapEdge[]>();
    const incomingEdgesByNode = new Map<string, MapEdge[]>();
    
    mapData.edges.forEach(e => {
      if (!outgoingEdgesByNode.has(e.startNodeId)) outgoingEdgesByNode.set(e.startNodeId, []);
      if (!incomingEdgesByNode.has(e.endNodeId)) incomingEdgesByNode.set(e.endNodeId, []);
      outgoingEdgesByNode.get(e.startNodeId)!.push(e);
      incomingEdgesByNode.get(e.endNodeId)!.push(e);
    });

    const visited = new Set<string>();

    // 1. Trace Ancestry (Upstream)
    let currId: string | undefined = selectedWordId;
    const ancestry: MapNode[] = [];
    while (currId && !visited.has(currId)) {
      const node = nodeById.get(currId);
      if (!node) break;
      visited.add(currId);
      ancestry.unshift(node);
      
      const incoming: MapEdge[] = incomingEdgesByNode.get(currId) || [];
      // In this tree structure, nodes have one primary parent (either chain or ladder)
      currId = incoming[0]?.startNodeId;
    }

    // 2. Trace Descendants (Downstream)
    const descendants: MapNode[] = [];
    const getDescendants = (id: string) => {
      const outgoing = outgoingEdgesByNode.get(id) || [];
      if (outgoing.length === 0) return;
      
      // Prioritize ladders for the "route" view as they represent the hierarchy
      const primaryEdge = outgoing.find(e => e.type === 'ladder') || outgoing[0];
      const nextId = primaryEdge.endNodeId;
      
      if (!visited.has(nextId)) {
        visited.add(nextId);
        const node = nodeById.get(nextId);
        if (node) {
          descendants.push(node);
          getDescendants(nextId);
        }
      }
    };

    getDescendants(selectedWordId);

    return [...ancestry, ...descendants];
  }, [doc, selectedWordId]);

  // Auto-scroll to selected word when it changes
  useEffect(() => {
    if (!selectedWordId) return;
    
    const timer = setTimeout(() => {
      const selectedEl = scrollContainerRef.current?.querySelector(`[data-id="${selectedWordId}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedWordId]);

  if (!selectedWordId || !routeData || routeData.length <= 1) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl transition-all duration-300 ease-in-out">
      <div className="bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-2 border-black dark:border-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex justify-between items-center mb-5 border-b-2 border-black dark:border-white pb-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-red-500 animate-pulse rounded-full" />
            <h3 className="text-base font-black uppercase tracking-[0.15em]">Route Protocol</h3>
          </div>
          <button 
            onClick={() => setSelectedWord(null)}
            className="hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all p-1"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div 
          ref={scrollContainerRef}
          className="relative overflow-x-auto pb-5 scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white"
        >
          <div className="flex items-center gap-12 min-w-max px-8">
            {routeData.map((node, index) => (
              <div key={node.id} className="relative flex items-center">
                {/* Numbered Step Label */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[9px] font-black opacity-40 mr-1 text-black dark:text-white">STEP_{index + 1}</span>
                </div>

                {/* Arrow connector with straight lines */}
                {index > 0 && (
                  <div className="absolute -left-10 w-8 flex items-center">
                    <div className="h-[2px] w-full bg-black dark:bg-white" />
                    <div className="absolute right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-black dark:border-white rotate-45 -translate-y-[4.5px]" />
                  </div>
                )}

                <button
                  onClick={() => setSelectedWord(node.id)}
                  data-id={node.id}
                  className={`
                    group relative flex flex-col items-center min-w-[115px] p-3 border-2 transition-all duration-200
                    ${node.id === selectedWordId 
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white scale-110 shadow-[5px_5px_0px_0px_rgba(239,68,68,1)]' 
                      : 'bg-white dark:bg-black border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:-translate-y-1'
                    }
                  `}
                >
                  <span className="text-sm font-black tracking-tight whitespace-nowrap">
                    {node.text.toUpperCase()}
                  </span>
                  
                  <div className="flex gap-3 opacity-60 text-[8px] font-bold uppercase mt-1.5">
                    <span>DEPTH:{node.depth}</span>
                    <span>LAYER:{doc.layersById[node.layerId]?.name?.slice(0, 6) || node.layerId.slice(0, 4)}</span>
                  </div>

                  {/* Visual indicator of ladder (vertical jump) */}
                  {node.ladderLayerId && (
                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
