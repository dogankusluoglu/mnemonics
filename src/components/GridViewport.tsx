/** @author Dogan Kusluoglu */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMnemonicStore } from '../store/useMnemonicStore';
import { getCoordKey, getWordFootprint, validatePlacementChain } from '../model/validator';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PathOverlay } from './PathOverlay';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CELL_SIZE = 40;

export const GridViewport: React.FC = () => {
  const transformComponentRef = useRef<ReactZoomPanPinchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const memoDragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPos: { x: number; y: number };
  } | null>(null);
  const memoDragPosRef = useRef<{ x: number; y: number } | null>(null);
  const [memoDragPos, setMemoDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingMemo, setIsDraggingMemo] = useState(false);
  
  const { 
    doc, 
    activeLayerId, 
    camera, 
    setCamera, 
    activeCell, 
    setActiveCell,
    activeDirection,
    currentDraft,
    typeChar,
    backspace,
    commitWord,
    cancelDraft,
    toggleDirection,
    selectedWordId,
    setSelectedWord,
    pushLayer,
    undo,
    redo,
    commentsVisible,
    setLayerCommentPos
  } = useMnemonicStore();

  const activeLayer = doc.layersById[activeLayerId];

  const defaultCommentAnchor = useMemo(() => {
    if (activeLayer.words.length === 0) return { x: 0, y: -3 }; // Shifted up 1 more unit
    
    let minX = Infinity;
    let minY = Infinity;
    
    activeLayer.words.forEach(word => {
      const footprint = getWordFootprint(word);
      footprint.forEach(c => {
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
      });
    });
    
    return { x: minX, y: minY - 3 }; // Shifted up 1 more unit
  }, [activeLayer.words]);

  const effectiveCommentPos = memoDragPos ?? activeLayer.commentPos ?? defaultCommentAnchor;

  useEffect(() => {
    if (!isDraggingMemo) return;

    const handleMouseMove = (e: MouseEvent) => {
      const drag = memoDragRef.current;
      if (!drag) return;

      const dxScreen = e.clientX - drag.startClientX;
      const dyScreen = e.clientY - drag.startClientY;

      // Convert screen pixels to content pixels by dividing out current scale,
      // then to grid coordinates by dividing by cell size.
      const dxGrid = (dxScreen / Math.max(0.0001, camera.scale)) / CELL_SIZE;
      const dyGrid = (dyScreen / Math.max(0.0001, camera.scale)) / CELL_SIZE;

      const next = {
        x: drag.startPos.x + dxGrid,
        y: drag.startPos.y + dyGrid,
      };
      memoDragPosRef.current = next;
      setMemoDragPos(next);
    };

    const handleMouseUp = () => {
      const pos = memoDragPosRef.current ?? activeLayer.commentPos ?? defaultCommentAnchor;
      // Persist with a little rounding to keep JSON stable/readable.
      const rounded = { x: Math.round(pos.x * 100) / 100, y: Math.round(pos.y * 100) / 100 };
      setLayerCommentPos(activeLayerId, rounded);

      memoDragRef.current = null;
      memoDragPosRef.current = null;
      setIsDraggingMemo(false);
      setMemoDragPos(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDraggingMemo,
    camera.scale,
    activeLayerId,
    activeLayer.commentPos,
    defaultCommentAnchor,
    setLayerCommentPos
  ]);

  const invalidWordIds = useMemo(() => {
    return validatePlacementChain(activeLayer.words);
  }, [activeLayer.words]);

  // Click on a cell to start/select
  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Explicitly blur any active input/textarea to return focus to the grid
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const cellKey = getCoordKey(x, y);
    const cell = activeLayer.cellsByKey[cellKey];
    
    if (cell && cell.wordIds.length > 0) {
      setSelectedWord(cell.wordIds[0]);
    } else {
      setSelectedWord(null);
    }
    
    setActiveCell({ x, y });
  };

  const handleDoubleClick = (x: number, y: number) => {
    const cellKey = getCoordKey(x, y);
    const cell = activeLayer.cellsByKey[cellKey];
    if (cell && cell.wordIds.length > 0) {
      const wordId = cell.wordIds[0];
      const word = activeLayer.words.find(w => w.id === wordId);
      if (word?.ladderLayerId) {
        pushLayer(word.ladderLayerId);
      }
    }
  };

  // Keyboard events for word entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (!activeCell) return;

      if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Enter') {
        commitWord();
      } else if (e.key === 'Escape') {
        cancelDraft();
      } else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9 ]/)) {
        typeChar(e.key.toUpperCase());
      } else if (e.key.toLowerCase() === 'r') {
        toggleDirection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, typeChar, backspace, commitWord, cancelDraft, toggleDirection, undo, redo]);

  // Viewport size for virtualization
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      setViewport({
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Determine visible range for virtualization
  const visibleRange = useMemo(() => {
    if (viewport.width === 0 || viewport.height === 0) return { left: -10, right: 10, top: -10, bottom: 10 };
    
    const { scale, positionX, positionY } = camera;
    
    const left = Math.floor((-positionX) / (CELL_SIZE * scale));
    const right = Math.ceil((-positionX + viewport.width) / (CELL_SIZE * scale));
    const top = Math.floor((-positionY) / (CELL_SIZE * scale));
    const bottom = Math.ceil((-positionY + viewport.height) / (CELL_SIZE * scale));
    
    // Add some padding to avoid pop-in
    return { 
      left: left - 2, 
      right: right + 2, 
      top: top - 2, 
      bottom: bottom + 2 
    };
  }, [camera, viewport]);

  // Draft footprint
  const draftFootprint = useMemo(() => {
    if (!activeCell || !currentDraft) return [];
    const tempWord = { 
      start: activeCell, 
      direction: activeDirection, 
      text: currentDraft 
    } as any;
    return getWordFootprint(tempWord);
  }, [activeCell, currentDraft, activeDirection]);

  const renderCells = () => {
    const elements = [];
    for (let y = visibleRange.top; y <= visibleRange.bottom; y++) {
      for (let x = visibleRange.left; x <= visibleRange.right; x++) {
        const key = getCoordKey(x, y);
        const cell = activeLayer.cellsByKey[key];
        const isDraft = draftFootprint.some(c => c.x === x && c.y === y);
        const draftCharIndex = draftFootprint.findIndex(c => c.x === x && c.y === y);
        const isActive = activeCell?.x === x && activeCell?.y === y;
        
        let char = cell?.char || '';
        if (isDraft) char = currentDraft[draftCharIndex];

        const isInvalid = cell?.wordIds.some(id => invalidWordIds.has(id));
        const isSelected = cell?.wordIds.includes(selectedWordId || '');
        
        const ladderWord = cell?.wordIds
          .map(id => activeLayer.words.find(w => w.id === id))
          .find(w => w?.ladderLayerId);
          
        const hasLadder = !!ladderWord;
        const subLayer = ladderWord?.ladderLayerId ? doc.layersById[ladderWord.ladderLayerId] : null;

        elements.push(
          <div
            key={key}
            onClick={(e) => handleCellClick(x, y, e)}
            onDoubleClick={() => handleDoubleClick(x, y)}
            className={cn(
              "absolute flex items-center justify-center border border-gray-200 text-lg font-mono cursor-pointer select-none overflow-hidden bg-white",
              isActive && "bg-black text-white border-black z-20 scale-105",
              isDraft && !isActive && "bg-gray-100 border-black z-10",
              isInvalid && "bg-red-500 text-white border-red-700",
              isSelected && !isActive && !isInvalid && "bg-yellow-200 border-yellow-500",
              hasLadder && !isActive && !isInvalid && !isSelected && "border-2 border-black"
            )}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              fontSize: camera.scale < 0.6 ? 0 : undefined,
            }}
          >
            {hasLadder && subLayer && !isActive && camera.scale > 0.7 && (
              <div className="absolute inset-0 opacity-20 pointer-events-none grid grid-cols-4 grid-rows-4 gap-px bg-gray-200">
                {Object.values(subLayer.cellsByKey).slice(0, 16).map((subCell, i) => (
                  <div key={i} className="bg-black w-full h-full" style={{ opacity: subCell.char ? 1 : 0 }} />
                ))}
              </div>
            )}
            
            <span className="relative z-10" style={{ opacity: camera.scale < 0.6 ? 0 : 1 }}>
              {char}
            </span>
            
            {camera.scale > 0.5 && cell?.wordIds.some(id => {
              const w = activeLayer.words.find(word => word.id === id);
              return w && useMnemonicStore.getState().dictionary.has(w.text.toUpperCase());
            }) && !isActive && !isInvalid && (
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full m-0.5" />
            )}
          </div>
        );
      }
    }
    return elements;
  };

  const isFirstRender = useRef(true);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white cursor-crosshair"
      onMouseDown={() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
    >
      <TransformWrapper
        ref={transformComponentRef}
        initialScale={camera.scale}
        initialPositionX={camera.positionX}
        initialPositionY={camera.positionY}
        minScale={0.4}
        maxScale={10}
        limitToBounds={false}
        centerOnInit={isFirstRender.current && camera.positionX === 0 && camera.positionY === 0}
        onInit={() => {
          isFirstRender.current = false;
        }}
        onTransformed={(ref) => {
          setCamera({
            scale: ref.state.scale,
            positionX: ref.state.positionX,
            positionY: ref.state.positionY
          });
        }}
        // Panning only with middle mouse or alt+left click as before
        panning={{
          disabled: false,
          velocityDisabled: true,
        }}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          {/* Grid Background */}
          <div 
            className="absolute pointer-events-none"
            style={{
              width: '10000px', // Large enough to cover visible area
              height: '10000px',
              left: '-5000px',
              top: '-5000px',
              backgroundImage: `
                linear-gradient(to right, #f3f4f6 1px, transparent 1px),
                linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
              `,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              backgroundPosition: '0 0',
            }}
          />

          <div className="relative">
            {renderCells()}
            
            {activeLayer.comment && commentsVisible && (
              <div 
                className={cn(
                  "absolute z-30 transition-opacity duration-300",
                  currentDraft ? "opacity-10" : "opacity-100"
                )}
                style={{
                  left: effectiveCommentPos.x * CELL_SIZE,
                  top: effectiveCommentPos.y * CELL_SIZE,
                }}
              >
                {/* Connector Line */}
                <div className="absolute left-4 -bottom-4 w-px h-8 border-l-2 border-dashed border-black opacity-20" />
                
                {/* The "Post-it" or "Tape" */}
                <div
                  className={cn(
                    "relative bg-yellow-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]",
                    "min-w-[240px] max-w-[560px] max-h-[360px] overflow-auto resize pointer-events-auto"
                  )}
                  onMouseDown={(e) => {
                    // Prevent grid selection/pan when interacting with the memo itself.
                    e.stopPropagation();
                  }}
                >
                  {/* Drag Handle */}
                  <div
                    className={cn(
                      "sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2",
                      "bg-yellow-100 border-b border-black/30 cursor-move select-none"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      const startPos = activeLayer.commentPos ?? defaultCommentAnchor;
                      memoDragRef.current = {
                        startClientX: e.clientX,
                        startClientY: e.clientY,
                        startPos: { x: startPos.x, y: startPos.y },
                      };
                      memoDragPosRef.current = { x: startPos.x, y: startPos.y };
                      setMemoDragPos({ x: startPos.x, y: startPos.y });
                      setIsDraggingMemo(true);
                    }}
                  >
                    <div className="flex items-center gap-2 opacity-60">
                      <div className="w-2 h-2 bg-black rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Memo // Layer {activeLayerId.slice(-4)}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono opacity-60">
                      x {Math.round(effectiveCommentPos.x * 100) / 100}, y {Math.round(effectiveCommentPos.y * 100) / 100}
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-[11px] font-mono leading-relaxed text-black whitespace-pre-wrap break-words">
                      {activeLayer.comment}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <PathOverlay width={viewport.width} height={viewport.height} />
            
            {/* Visual Indicator for Active Direction */}
            {activeCell && (
              <div 
                className="absolute border-2 border-black pointer-events-none opacity-30 transition-all duration-100"
                style={{
                  width: activeDirection === 'across' ? CELL_SIZE * 3 : CELL_SIZE,
                  height: activeDirection === 'across' ? CELL_SIZE : CELL_SIZE * 3,
                  left: activeCell.x * CELL_SIZE,
                  top: activeCell.y * CELL_SIZE,
                  zIndex: 30
                }}
              />
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
