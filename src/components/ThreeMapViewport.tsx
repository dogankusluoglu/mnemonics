import React, { useMemo, useState, useCallback, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Billboard, 
  QuadraticBezierLine, 
  Edges, 
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Float,
  Grid
} from '@react-three/drei';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { buildMapData } from '../model/threeMap';
import type { MapNode, MapEdge } from '../model/threeMap';
import * as THREE from 'three';

// --- Visual Constants ---
const COLORS = {
  selected: "#ffffff",
  incoming: "#00ff88", // Neon Green
  outgoing: "#00ccff", // Neon Blue
  bgDark: "#111111",    // Neutral Dark Gray
  bgLight: "#f8fafc",
  gridColor: "#333333",
};

const LEVEL_COLORS = [
  "#fcd34d", // Level 0: Gold
  "#f472b6", // Level 1: Pink
  "#22d3ee", // Level 2: Cyan
  "#a3e635", // Level 3: Lime
  "#fb923c", // Level 4: Orange
  "#c084fc", // Level 5: Purple
  "#f87171", // Level 6: Red
];

// --- Components ---

interface WordNodeProps {
  node: MapNode;
  highlightType: 'none' | 'selected' | 'incoming' | 'outgoing';
  isDimmed: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string | null) => void;
}

const WordNode = React.memo(({ 
  node, 
  highlightType, 
  isDimmed, 
  onHover, 
  onClick
}: WordNodeProps) => {
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
    onHover(node.id);
    document.body.style.cursor = 'pointer';
  }, [node.id, onHover]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    onHover(null);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleNodeClick = useCallback((e: any) => {
    e.stopPropagation();
    const targetId = node.id.includes('virtual') ? null : node.id;
    console.log('Node Clicked:', node.text, targetId);
    onClick(targetId);
  }, [node.id, node.text, onClick]);

  const opacity = isDimmed ? 0.1 : 1.0;
  const scale = hovered ? 1.3 : 1.0;
  const textZ = hovered ? 0.8 : 0.5;
  
  const levelColor = LEVEL_COLORS[node.depth % LEVEL_COLORS.length];
  
  let nodeColor = levelColor;
  let emissiveIntensity = 0.5;

  if (highlightType === 'selected') {
    nodeColor = COLORS.selected;
    emissiveIntensity = 4.0;
  } else if (highlightType === 'incoming') {
    nodeColor = COLORS.incoming;
    emissiveIntensity = 2.0;
  } else if (highlightType === 'outgoing') {
    nodeColor = COLORS.outgoing;
    emissiveIntensity = 2.0;
  }

  return (
    <group 
      position={node.position} 
      scale={[scale, scale, scale]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Sci-Fi Capsule Node */}
      <mesh onClick={handleNodeClick}>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial 
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={emissiveIntensity * opacity}
          transparent
          opacity={opacity}
          metalness={0.9}
          roughness={0.1}
        />
        <Edges 
          color={highlightType !== 'none' ? "#ffffff" : nodeColor} 
          threshold={15} 
          transparent
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* Selected Glow Aura */}
      {highlightType === 'selected' && (
        <mesh scale={[1.2, 1.2, 1.2]}>
          <capsuleGeometry args={[0.35, 1.1, 8, 16]} />
          <meshBasicMaterial color={COLORS.highlight || "#ffffff"} transparent opacity={0.2} />
        </mesh>
      )}

      {/* Floating Holographic Text with Background for Readability */}
      <group position={[0, 0, textZ]}>
        <Text
          fontSize={hovered ? 0.32 : 0.22}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity}
          fontWeight="black"
          font="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.1.1/files/jetbrains-mono-latin-800-normal.woff"
          outlineColor="#000000"
          outlineWidth={0.02}
          outlineOpacity={opacity * 0.8}
          onError={(e) => {
            console.warn("Font loading error for JetBrains Mono, falling back to default:", e);
          }}
        >
          {node.text.toUpperCase()}
        </Text>
        
        {/* Semi-transparent dark background for text */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[node.text.length * (hovered ? 0.22 : 0.15) + 0.2, hovered ? 0.45 : 0.35]} />
          <meshBasicMaterial 
            color="#000000" 
            transparent 
            opacity={opacity * 0.85} 
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Futuristic Step Indicator */}
      {!node.isVirtual && (
        <Billboard position={[0.7, 0.7, 0]}>
          <Text
            fontSize={0.14}
            color={nodeColor}
            fillOpacity={opacity * 0.8}
            fontWeight="bold"
            font="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.1.1/files/jetbrains-mono-latin-700-normal.woff"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {`#${(node.wordIndex + 1).toString().padStart(2, '0')}`}
          </Text>
        </Billboard>
      )}
    </group>
  );
});

interface ConnectionProps {
  edge: MapEdge;
  highlightType: 'none' | 'incoming' | 'outgoing';
  isDimmed: boolean;
  isNodeHovered: boolean;
}

const Connection = React.memo(({ 
  edge, 
  highlightType, 
  isDimmed,
  isNodeHovered
}: ConnectionProps) => {
  const pulseRef = useRef<THREE.Mesh>(null);
  
  let opacity = isDimmed ? 0.05 : (highlightType !== 'none' ? 1.0 : 0.25);
  if (isNodeHovered && !isDimmed) opacity = 0.9;
  
  let color = "#555555";
  if (highlightType === 'incoming') color = COLORS.incoming;
  else if (highlightType === 'outgoing') color = COLORS.outgoing;

  const start = useMemo(() => new THREE.Vector3(...edge.startPos), [edge.startPos]);
  const end = useMemo(() => new THREE.Vector3(...edge.endPos), [edge.endPos]);
  const mid = useMemo(() => {
    const m = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    m.y += 0.5;
    m.z += 0.2;
    return m;
  }, [start, end]);

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, mid, end]);

  useFrame((state) => {
    if (pulseRef.current && highlightType !== 'none') {
      const t = (state.clock.elapsedTime * 1.2) % 1; // Faster pulses
      const pos = curve.getPoint(t);
      pulseRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={mid}
        color={color}
        lineWidth={highlightType !== 'none' ? 6 : (edge.type === 'ladder' ? 1.5 : 2.5)}
        transparent
        opacity={opacity}
        dashed={edge.type === 'ladder'}
        dashScale={5}
        gapSize={0.2}
      />
      
      {highlightType !== 'none' && !isDimmed && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}

      {/* Flow Marker */}
      <mesh position={end}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={3} 
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const mapData = useMemo(() => buildMapData(doc), [doc]);

  const layerGroups = useMemo(() => {
    const groups: Record<string, { nodes: MapNode[], edges: MapEdge[] }> = {};
    mapData.nodes.forEach(n => {
      if (!groups[n.layerId]) groups[n.layerId] = { nodes: [], edges: [] };
      groups[n.layerId].nodes.push(n);
    });
    mapData.edges.forEach(e => {
      if (groups[e.layerId]) groups[e.layerId].edges.push(e);
    });
    return Object.entries(groups);
  }, [mapData]);

  // Robust highlighting logic
  const highlightedItems = useMemo(() => {
    const incomingNodes = new Set<string>();
    const incomingEdges = new Set<string>();
    const outgoingNodes = new Set<string>();
    const outgoingEdges = new Set<string>();

    if (!selectedWordId) return { incomingNodes, incomingEdges, outgoingNodes, outgoingEdges };

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

    const traceIncoming = (nodeId: string) => {
      const incoming = incomingEdgesByNode.get(nodeId) || [];
      incoming.forEach(edge => {
        if (!incomingEdges.has(edge.id)) {
          incomingEdges.add(edge.id);
          incomingNodes.add(edge.startNodeId);
          traceIncoming(edge.startNodeId);
        }
      });
    };

    const traceOutgoing = (nodeId: string) => {
      const outgoing = outgoingEdgesByNode.get(nodeId) || [];
      outgoing.forEach(edge => {
        if (!outgoingEdges.has(edge.id)) {
          outgoingEdges.add(edge.id);
          outgoingNodes.add(edge.endNodeId);
          traceOutgoing(edge.endNodeId);
        }
      });
    };

    traceIncoming(selectedWordId);
    traceOutgoing(selectedWordId);

    return { incomingNodes, incomingEdges, outgoingNodes, outgoingEdges };
  }, [selectedWordId, mapData]);

  const isAnythingSelected = selectedWordId !== null;

  const handleCanvasMissed = useCallback(() => {
    setSelectedWord(null);
  }, [setSelectedWord]);

  const bgColor = theme === 'light' ? COLORS.bgLight : COLORS.bgDark;

  return (
    <div className="w-full h-full" style={{ backgroundColor: bgColor }}>
      <Canvas 
        shadows 
        gl={{ antialias: true }}
        onPointerMissed={handleCanvasMissed}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={40} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.1} 
          rotateSpeed={0.8} 
          zoomSpeed={1.2}
          minDistance={2}
          maxDistance={500}
          makeDefault
        />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <ambientLight intensity={0.15} />
          <pointLight position={[20, 20, 20]} intensity={3} color="#ffffff" />
          
          <group>
            {layerGroups.map(([layerId, data]) => (
              <Float 
                key={layerId} 
                speed={0.5} 
                rotationIntensity={0.05} 
                floatIntensity={0.15}
              >
                {/* Render Connections first so they are behind nodes */}
                {data.edges.map(edge => {
                  let hType: 'none' | 'incoming' | 'outgoing' = 'none';
                  if (highlightedItems.incomingEdges.has(edge.id)) hType = 'incoming';
                  else if (highlightedItems.outgoingEdges.has(edge.id)) hType = 'outgoing';
                  
                  const isDimmed = isAnythingSelected && hType === 'none';
                  const isNodeHovered = hoveredNodeId === edge.startNodeId || hoveredNodeId === edge.endNodeId;
                  
                  return (
                    <Connection 
                      key={edge.id} 
                      edge={edge} 
                      highlightType={hType}
                      isDimmed={isDimmed}
                      isNodeHovered={isNodeHovered}
                    />
                  );
                })}

                {data.nodes.map(node => {
                  let hType: 'none' | 'selected' | 'incoming' | 'outgoing' = 'none';
                  if (node.id === selectedWordId) hType = 'selected';
                  else if (highlightedItems.incomingNodes.has(node.id)) hType = 'incoming';
                  else if (highlightedItems.outgoingNodes.has(node.id)) hType = 'outgoing';

                  const isDimmed = isAnythingSelected && hType === 'none' && node.id !== selectedWordId;
                  
                  return (
                    <WordNode 
                      key={node.id} 
                      node={node} 
                      highlightType={hType}
                      isDimmed={isDimmed}
                      onHover={setHoveredNodeId}
                      onClick={setSelectedWord}
                    />
                  );
                })}
              </Float>
            ))}
          </group>

          <Grid 
            position={[0, -15, 0]} 
            infiniteGrid 
            sectionSize={10} 
            sectionColor={COLORS.gridColor} 
            cellColor={COLORS.gridColor} 
            cellThickness={0.5} 
            sectionThickness={1.5} 
            fadeDistance={150}
          />

          <ContactShadows 
            position={[0, -15, 0]} 
            opacity={0.8} 
            scale={100} 
            blur={1.5} 
            far={40} 
          />
        </Suspense>

        <fog attach="fog" args={[bgColor, 50, 200]} />
      </Canvas>
    </div>
  );
};
