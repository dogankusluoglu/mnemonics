/** @author Dogan Kusluoglu */
import React, { useMemo } from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';

const CELL_SIZE = 40;

export const PathOverlay: React.FC<{ width: number; height: number }> = () => {
  const { doc, activeLayerId, pathViewEnabled } = useMnemonicStore();
  const activeLayer = doc.layersById[activeLayerId];

  const points = useMemo(() => {
    if (!pathViewEnabled || activeLayer.words.length < 2) return "";

    return activeLayer.words.map(word => {
      const startX = word.start.x;
      const startY = word.start.y;
      const endX = word.direction === 'across' ? startX + word.text.length - 1 : startX;
      const endY = word.direction === 'across' ? startY : startY + word.text.length - 1;

      // Center of the word in grid coordinates
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;

      // Grid position in pixels (relative to grid origin 0,0)
      const gridX = (centerX + 0.5) * CELL_SIZE;
      const gridY = (centerY + 0.5) * CELL_SIZE;

      return `${gridX},${gridY}`;
    }).join(" ");
  }, [activeLayer.words, pathViewEnabled]);

  if (!pathViewEnabled || activeLayer.words.length < 2) return null;

  // We use a large bounding box for the SVG since it's inside the transform container
  // and we want it to cover all potential word coordinates.
  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-30 overflow-visible" 
      style={{ width: 1, height: 1 }} // Size doesn't matter much with overflow-visible
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="pathGradient" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#000" />
          <stop offset="50%" stopColor="#666" />
          <stop offset="100%" stopColor="#000" />
          <animate attributeName="x1" from="-100%" to="100%" dur="3s" repeatCount="indefinite" />
          <animate attributeName="x2" from="0%" to="200%" dur="3s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      
      {/* Background Glow Path */}
      <polyline
        points={points}
        fill="none"
        stroke="black"
        strokeWidth={6}
        strokeOpacity="0.1"
        filter="url(#glow)"
      />

      <polyline
        points={points}
        fill="none"
        stroke="url(#pathGradient)"
        strokeWidth={2}
        strokeDasharray="4 4"
        className="animate-pulse"
      />
      
      {activeLayer.words.map((word) => {
        const startX = word.start.x;
        const startY = word.start.y;
        const endX = word.direction === 'across' ? startX + word.text.length - 1 : startX;
        const endY = word.direction === 'across' ? startY : startY + word.text.length - 1;
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const gridX = (centerX + 0.5) * CELL_SIZE;
        const gridY = (centerY + 0.5) * CELL_SIZE;

        return (
          <g key={word.id}>
            <circle
              cx={gridX}
              cy={gridY}
              r={6}
              fill="white"
              stroke="black"
              strokeWidth={1}
            />
            <circle
              cx={gridX}
              cy={gridY}
              r={3}
              fill="black"
              className="animate-ping"
              style={{ animationDuration: '3s' }}
            />
          </g>
        );
      })}
    </svg>
  );
};
