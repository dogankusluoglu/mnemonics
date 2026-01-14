import type { MnemonicDoc, WordPlacement, Coord } from '../store/useMnemonicStore';

export interface MapNode {
  id: string;
  text: string;
  position: [number, number, number];
  layerId: string;
  depth: number;
  wordIndex: number;
  ladderLayerId?: string;
  isVirtual?: boolean;
}

export interface MapEdge {
  id: string;
  startNodeId: string;
  endNodeId: string;
  type: 'chain' | 'ladder';
  startPos: [number, number, number];
  endPos: [number, number, number];
  layerId: string;
  depth: number;
}

export const LAYER_SPACING_Z = 5;
export const GRID_UNIT = 1; // 1 unit in 3D per grid cell

export function getWordCenter(word: WordPlacement): Coord {
  const startX = word.start.x;
  const startY = word.start.y;
  const endX = word.direction === 'across' ? startX + word.text.length - 1 : startX;
  const endY = word.direction === 'across' ? startY : startY + word.text.length - 1;

  return {
    x: (startX + endX) / 2,
    y: (startY + endY) / 2
  };
}

export function buildMapData(doc: MnemonicDoc) {
  const nodes: MapNode[] = [];
  const edges: MapEdge[] = [];
  
  // Cache to store layer offsets: layerId -> { x, y }
  const layerOffsets: Record<string, { x: number, y: number }> = {
    [doc.rootLayerId]: { x: 0, y: 0 }
  };

  function traverse(layerId: string, depth: number) {
    const layer = doc.layersById[layerId];
    if (!layer) return;

    const offset = layerOffsets[layerId] || { x: 0, y: 0 };
    const z = -depth * LAYER_SPACING_Z;

    // 1. Create nodes for this layer
    layer.words.forEach((word, wordIndex) => {
      const center = getWordCenter(word);
      const pos: [number, number, number] = [
        (center.x + offset.x) * GRID_UNIT,
        -(center.y + offset.y) * GRID_UNIT, // Invert Y for 3D coordinate system (Y up)
        z
      ];

      nodes.push({
        id: word.id,
        text: word.text,
        position: pos,
        layerId,
        depth,
        wordIndex,
        ladderLayerId: word.ladderLayerId
      });

      // 2. Chain edges: word[i] -> word[i+1]
      if (wordIndex > 0) {
        const prevWord = layer.words[wordIndex - 1];
        const prevCenter = getWordCenter(prevWord);
        const prevPos: [number, number, number] = [
          (prevCenter.x + offset.x) * GRID_UNIT,
          -(prevCenter.y + offset.y) * GRID_UNIT,
          z
        ];

        edges.push({
          id: `chain-${prevWord.id}-${word.id}`,
          startNodeId: prevWord.id,
          endNodeId: word.id,
          type: 'chain',
          startPos: prevPos,
          endPos: pos,
          layerId,
          depth
        });
      }

      // 3. Ladder edges: parent ladder word -> child layer
      if (word.ladderLayerId) {
        const childLayerId = word.ladderLayerId;
        const childLayer = doc.layersById[childLayerId];
        
        if (childLayer) {
          const hasWords = childLayer.words.length > 0;
          const firstChildCenter = hasWords 
            ? getWordCenter(childLayer.words[0]) 
            : { x: 0, y: 0 };
          
          const childOffset = {
            x: center.x + offset.x - firstChildCenter.x,
            y: center.y + offset.y - firstChildCenter.y
          };
          
          layerOffsets[childLayerId] = childOffset;
          
          const childZ = -(depth + 1) * LAYER_SPACING_Z;
          const childPos: [number, number, number] = [
            (firstChildCenter.x + childOffset.x) * GRID_UNIT,
            -(firstChildCenter.y + childOffset.y) * GRID_UNIT,
            childZ
          ];

          if (hasWords) {
            const firstChildWord = childLayer.words[0];
            edges.push({
              id: `ladder-${word.id}-${firstChildWord.id}`,
              startNodeId: word.id,
              endNodeId: firstChildWord.id,
              type: 'ladder',
              startPos: pos,
              endPos: childPos,
              layerId,
              depth
            });
            traverse(childLayerId, depth + 1);
          } else {
            // Virtual node for empty layer
            const virtualId = `virtual-${childLayerId}`;
            nodes.push({
              id: virtualId,
              text: '(EMPTY)',
              position: childPos,
              layerId: childLayerId,
              depth: depth + 1,
              wordIndex: 0,
              isVirtual: true
            });
            edges.push({
              id: `ladder-${word.id}-${virtualId}`,
              startNodeId: word.id,
              endNodeId: virtualId,
              type: 'ladder',
              startPos: pos,
              endPos: childPos,
              layerId,
              depth
            });
          }
        }
      }
    });
  }

  traverse(doc.rootLayerId, 0);

  return { nodes, edges };
}
