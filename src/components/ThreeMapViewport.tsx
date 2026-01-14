import React, { useMemo, useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Line, Edges, PerspectiveCamera } from '@react-three/drei';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { buildMapData } from '../model/threeMap';
import type { MapNode, MapEdge } from '../model/threeMap';
import * as THREE from 'three';

// --- Components ---

interface WordNodeProps {
  node: MapNode;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: (id: string | null) => void;
  theme: 'light' | 'dark';
}

const WordNode = React.memo(({ 
  node, 
  isHighlighted, 
  isDimmed, 
  onClick,
  theme 
}: WordNodeProps) => {
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, [node.id]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  const color = theme === 'light' ? '#000000' : '#ffffff';
  const bgColor = theme === 'light' ? '#ffffff' : '#1a1a1a';
  const highlightColor = '#3b82f6'; // blue-500
  
  const opacity = isDimmed ? 0.2 : 1.0;
  const scale = hovered ? 1.05 : 1.0;

  return (
    <group 
      position={node.position} 
      scale={[scale, scale, scale]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node.id === 'selected' ? null : node.id);
      }}
    >
      {/* Background Capsule/Box */}
      <mesh>
        <capsuleGeometry args={[0.3, 1, 4, 12]} />
        <meshBasicMaterial 
          color={isHighlighted ? highlightColor : bgColor} 
          transparent 
          opacity={opacity} 
        />
        <Edges 
          color={isHighlighted ? highlightColor : color} 
          threshold={15} 
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Word Text */}
      <Text
        position={[0, 0, 0.4]}
        fontSize={0.25}
        color={isHighlighted ? '#ffffff' : color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        {node.text.toUpperCase()}
      </Text>

      {/* Sequence Number */}
      {!node.isVirtual && (
        <Billboard position={[0.6, 0.6, 0]}>
          <Text
            fontSize={0.15}
            color={color}
            fillOpacity={opacity * 0.5}
          >
            {(node.wordIndex + 1).toString()}
          </Text>
        </Billboard>
      )}
    </group>
  );
});

interface ConnectionProps {
  edge: MapEdge;
  isHighlighted: boolean;
  isDimmed: boolean;
}

const Connection = React.memo(({ 
  edge, 
  isHighlighted, 
  isDimmed
}: ConnectionProps) => {
  const opacity = isDimmed ? 0.05 : (isHighlighted ? 0.8 : 0.4);
  
  // Green to Red gradient as requested
  // If highlighted, use a Cyan to Blue gradient for clarity
  const colorA = isHighlighted ? '#22d3ee' : '#22c55e';
  const colorB = isHighlighted ? '#3b82f6' : '#ef4444';

  const start = useMemo(() => new THREE.Vector3(...edge.startPos), [edge.startPos]);
  const end = useMemo(() => new THREE.Vector3(...edge.endPos), [edge.endPos]);
  
  const points = useMemo(() => [start, end], [start, end]);

  const colors = useMemo(() => [
    new THREE.Color(colorA),
    new THREE.Color(colorB)
  ], [colorA, colorB]);

  const dir = useMemo(() => new THREE.Vector3().subVectors(end, start).normalize(), [start, end]);
  
  // Position arrow head slightly before the end to avoid clipping with the node
  const arrowPos = useMemo(() => {
    return new THREE.Vector3().copy(end).sub(new THREE.Vector3().copy(dir).multiplyScalar(0.8));
  }, [end, dir]);

  const arrowQuaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir]);

  return (
    <group>
      <Line
        points={points}
        vertexColors={colors.map(c => [c.r, c.g, c.b])}
        lineWidth={isHighlighted ? 4 : (edge.type === 'ladder' ? 1.5 : 2.5)}
        transparent
        opacity={opacity}
        dashed={edge.type === 'ladder'}
        dashScale={5}
        gapSize={0.2}
      />
      
      {/* Arrow Head */}
      <mesh position={arrowPos} quaternion={arrowQuaternion}>
        <coneGeometry args={[0.12, 0.35, 8]} />
        <meshBasicMaterial 
          color={colorB} 
          transparent 
          opacity={opacity} 
        />
      </mesh>
    </group>
  );
});

// --- Main Viewport ---

export const ThreeMapViewport: React.FC = () => {
  const { doc, theme, selectedWordId, setSelectedWord } = useMnemonicStore();

  const mapData = useMemo(() => buildMapData(doc), [doc]);

  // Compute highlighted path (Ancestors and Descendants)
  const highlightedItems = useMemo(() => {
    const highlightedNodes = new Set<string>();
    const highlightedEdges = new Set<string>();

    if (!selectedWordId) return { nodes: highlightedNodes, edges: highlightedEdges };

    const selectedNode = mapData.nodes.find(n => n.id === selectedWordId);
    if (!selectedNode) return { nodes: highlightedNodes, edges: highlightedEdges };

    // Simple strategy: highlight all nodes and edges in the same layer as the selected word
    // plus the ladder jump that led to this layer.
    
    const layerId = selectedNode.layerId;
    
    // 1. Highlight entire layer chain
    mapData.nodes.forEach(n => {
      if (n.layerId === layerId) highlightedNodes.add(n.id);
    });
    mapData.edges.forEach(e => {
      if (e.layerId === layerId && e.type === 'chain') highlightedEdges.add(e.id);
    });

    // 2. Highlight ladder jumps to/from this layer
    mapData.edges.forEach(e => {
      if (e.type === 'ladder') {
        // Ladder jump from parent to this layer
        if (mapData.nodes.find(n => n.id === e.endNodeId)?.layerId === layerId) {
          highlightedEdges.add(e.id);
          highlightedNodes.add(e.startNodeId);
        }
        // Ladder jump from this layer to child
        if (mapData.nodes.find(n => n.id === e.startNodeId)?.layerId === layerId) {
          highlightedEdges.add(e.id);
          highlightedNodes.add(e.endNodeId);
        }
      }
    });

    return { nodes: highlightedNodes, edges: highlightedEdges };
  }, [selectedWordId, mapData]);

  const isAnythingSelected = selectedWordId !== null;

  const handleCanvasClick = useCallback(() => {
    setSelectedWord(null);
  }, [setSelectedWord]);

  return (
    <div className="w-full h-full bg-[#fdfaf6] dark:bg-[#0a0a0a]">
      <Canvas 
        shadows 
        gl={{ antialias: true }}
        onClick={handleCanvasClick}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          rotateSpeed={0.5} 
          minDistance={2}
          maxDistance={100}
        />

        <ambientLight intensity={theme === 'light' ? 2 : 0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <group>
            {/* Render Edges */}
            {mapData.edges.map(edge => {
              const isHighlighted = highlightedItems.edges.has(edge.id);
              const isDimmed = isAnythingSelected && !isHighlighted;
              return (
                <Connection 
                  key={edge.id} 
                  edge={edge} 
                  isHighlighted={isHighlighted} 
                  isDimmed={isDimmed}
                />
              );
            })}

            {/* Render Nodes */}
            {mapData.nodes.map(node => {
              const isHighlighted = highlightedItems.nodes.has(node.id) || node.id === selectedWordId;
              const isDimmed = isAnythingSelected && !isHighlighted;
              return (
                <WordNode 
                  key={node.id} 
                  node={node} 
                  isHighlighted={isHighlighted} 
                  isDimmed={isDimmed}
                  onClick={setSelectedWord}
                  theme={theme}
                />
              );
            })}
          </group>
        </Suspense>

        <fog attach="fog" args={[theme === 'light' ? '#fdfaf6' : '#0a0a0a', 30, 80]} />
      </Canvas>
    </div>
  );
};
