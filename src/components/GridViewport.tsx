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
    setLayerCommentPos,
    closePanels,
    theme
  } = useMnemonicStore();

  const activeLayer = doc.layersById[activeLayerId];

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the hidden input whenever an active cell is selected to trigger mobile keyboard
  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeCell]);

  // Tap-vs-drag threshold for mobile selection
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const lastTapRef = useRef<{ x: number, y: number, time: number } | null>(null);

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

    const handlePointerMove = (e: PointerEvent) => {
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

    const handlePointerUp = () => {
      const pos = memoDragPosRef.current ?? activeLayer.commentPos ?? defaultCommentAnchor;
      // Persist with a little rounding to keep JSON stable/readable.
      const rounded = { x: Math.round(pos.x * 100) / 100, y: Math.round(pos.y * 100) / 100 };
      setLayerCommentPos(activeLayerId, rounded);

      memoDragRef.current = null;
      memoDragPosRef.current = null;
      setIsDraggingMemo(false);
      setMemoDragPos(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
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
  const handleCellClick = (x: number, y: number, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    
    // Explicitly blur any active input/textarea to return focus to the grid
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Close mobile drawers when interacting with the grid
    closePanels();

    const cellKey = getCoordKey(x, y);
    const cell = activeLayer.cellsByKey[cellKey];
    
    if (cell && cell.wordIds.length > 0) {
      setSelectedWord(cell.wordIds[0]);
    } else {
      setSelectedWord(null);
    }
    
    setActiveCell({ x, y });
  };

  const handleGridClick = (e: React.MouseEvent) => {
    // If we're on a touch device and this was a drag, don't trigger click logic
    if (touchStartRef.current) {
      const dx = Math.abs(e.clientX - touchStartRef.current.x);
      const dy = Math.abs(e.clientY - touchStartRef.current.y);
      if (dx > 5 || dy > 5) return;
    }

    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const { scale, positionX, positionY } = camera;
    
    // Position relative to the viewport top-left in screen pixels
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Convert to content coordinates (ignoring camera pan/zoom)
    const contentX = (screenX - positionX) / scale;
    const contentY = (screenY - positionY) / scale;
    
    // Convert to grid coordinates
    const gridX = Math.floor(contentX / CELL_SIZE);
    const gridY = Math.floor(contentY / CELL_SIZE);
    
    // Handle double-tap/drill detection for mobile
    const now = Date.now();
    if (lastTapRef.current) {
      const tapDx = Math.abs(e.clientX - lastTapRef.current.x);
      const tapDy = Math.abs(e.clientY - lastTapRef.current.y);
      const tapDt = now - lastTapRef.current.time;
      
      if (tapDx < 20 && tapDy < 20 && tapDt < 300) {
        handleDoubleClick(gridX, gridY, e);
        lastTapRef.current = null;
        return;
      }
    }
    lastTapRef.current = { x: e.clientX, y: e.clientY, time: now };

    handleCellClick(gridX, gridY, e);
  };

  const handleDoubleClick = (x: number, y: number, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, typeChar, backspace, commitWord, cancelDraft, toggleDirection, undo, redo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 0) {
      const char = val[val.length - 1].toUpperCase();
      if (char.match(/[A-Z0-9 ]/)) {
        typeChar(char);
      }
      // Reset input value so we can keep detecting changes
      e.target.value = '';
    }
  };

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
    const renderedKeys = new Set<string>();
    const elements: React.ReactNode[] = [];

    const addCell = (x: number, y: number) => {
      const key = getCoordKey(x, y);
      if (renderedKeys.has(key)) return;
      
      const cell = activeLayer.cellsByKey[key];
      const isDraft = draftFootprint.some(c => c.x === x && c.y === y);
      const draftCharIndex = draftFootprint.findIndex(c => c.x === x && c.y === y);
      const isActive = activeCell?.x === x && activeCell?.y === y;
      
      // If none of these, it's an empty background cell - don't render it!
      if (!cell && !isDraft && !isActive) return;

      let char = cell?.char || '';
      if (isDraft) char = currentDraft[draftCharIndex];

      const isInvalid = cell?.wordIds.some(id => invalidWordIds.has(id));
      const isSelected = cell?.wordIds.includes(selectedWordId || '');
      
      const ladderWord = cell?.wordIds
        ?.map(id => activeLayer.words.find(w => w.id === id))
        .find(w => w?.ladderLayerId);
        
      const hasLadder = !!ladderWord;
      const subLayer = ladderWord?.ladderLayerId ? doc.layersById[ladderWord.ladderLayerId] : null;

      elements.push(
        <div
          key={key}
          onClick={(e) => handleCellClick(x, y, e)}
          onDoubleClick={(e) => handleDoubleClick(x, y, e)}
          className={cn(
            "absolute flex items-center justify-center border text-lg font-mono cursor-pointer select-none overflow-hidden transition-colors duration-75",
            // Base Colors
            "bg-white dark:bg-[#1a1a1a] text-black dark:text-white border-gray-200 dark:border-white/10",
            // Active Selection (The cell with the cursor)
            isActive && "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white z-20 scale-105",
            // Draft Words (Letters you are currently typing)
            isDraft && !isActive && "bg-gray-100 dark:bg-white/10 text-black dark:text-white border-black/20 dark:border-white/20 z-10",
            // Invalid Words
            isInvalid && "bg-red-500 text-white border-red-700 dark:border-red-400 z-10",
            // Selected Word from List
            isSelected && !isActive && !isInvalid && "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600",
            // Word with a Ladder (Sub-layer)
            hasLadder && !isActive && !isInvalid && !isSelected && "border-2 border-black dark:border-white"
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
            <div className="absolute inset-0 opacity-20 pointer-events-none grid grid-cols-4 grid-rows-4 gap-px bg-gray-200 dark:bg-white/10">
              {Object.values(subLayer.cellsByKey).slice(0, 16).map((subCell, i) => (
                <div key={i} className="bg-black dark:bg-white w-full h-full" style={{ opacity: subCell.char ? 1 : 0 }} />
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
      renderedKeys.add(key);
    };

    // 1. Always render active cell
    if (activeCell) addCell(activeCell.x, activeCell.y);

    // 2. Render all cells in the draft
    draftFootprint.forEach(c => addCell(c.x, c.y));

    // 3. Render all occupied cells within the visible range
    Object.keys(activeLayer.cellsByKey).forEach(key => {
      const [x, y] = key.split(',').map(Number);
      if (x >= visibleRange.left && x <= visibleRange.right && y >= visibleRange.top && y <= visibleRange.bottom) {
        addCell(x, y);
      }
    });

    return elements;
  };

  const isFirstRender = useRef(true);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white dark:bg-[#0a0a0a] cursor-crosshair touch-none"
      onPointerDown={(e) => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      }}
      onPointerUp={() => {
        // We'll keep touchStartRef for a moment for click handler to use
        setTimeout(() => { touchStartRef.current = null; }, 10);
      }}
    >
      {/* Hidden input to trigger mobile keyboard and capture text entry */}
      <input
        ref={inputRef}
        type="text"
        className="fixed opacity-0 pointer-events-none -top-10 left-0"
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            backspace();
          } else if (e.key === 'Enter') {
            commitWord();
          } else if (e.key === 'Escape') {
            cancelDraft();
          }
        }}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck="false"
      />
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
        // Enable touch panning (1-finger) and wheel zoom
        panning={{
          disabled: false,
          velocityDisabled: true,
          excluded: ["input", "textarea", "button", "select"],
          // Require middle button or Alt key on desktop for panning
          // But allow touch panning freely
        }}
        pinch={{ disabled: false }}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }} // Handle it ourselves for mobile compatibility
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          {/* Grid Background & Click Surface */}
          <div 
            className="absolute cursor-crosshair"
            style={{
              width: '100000px',
              height: '100000px',
              left: '-50000px',
              top: '-50000px',
              backgroundColor: theme === 'dark' ? '#0a0a0a' : 'white',
              backgroundImage: `
                linear-gradient(to right, ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e5e7eb'} 1px, transparent 1px),
                linear-gradient(to bottom, ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e5e7eb'} 1px, transparent 1px)
              `,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              backgroundPosition: '0 0',
            }}
            onClick={handleGridClick}
          />

          <div className="relative pointer-events-none">
            <div className="pointer-events-auto">
              {renderCells()}
            </div>
            
            {activeLayer.comment && commentsVisible && (
              <div 
                className={cn(
                  "absolute z-30 transition-opacity duration-300 pointer-events-auto",
                  currentDraft ? "opacity-10" : "opacity-100"
                )}
                style={{
                  left: effectiveCommentPos.x * CELL_SIZE,
                  top: effectiveCommentPos.y * CELL_SIZE,
                }}
              >
                {/* Connector Line */}
                <div className="absolute left-4 -bottom-4 w-px h-8 border-l-2 border-dashed border-black dark:border-white opacity-20" />
                
                {/* The "Post-it" or "Tape" */}
                <div
                  className={cn(
                    "relative bg-yellow-50 dark:bg-yellow-900/20 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] rotate-[-1deg]",
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
                      "bg-yellow-100 dark:bg-yellow-900/40 border-b border-black/30 dark:border-white/30 cursor-move select-none touch-none"
                    )}
                    onPointerDown={(e) => {
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
                      <div className="w-2 h-2 bg-black dark:bg-white rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-black dark:text-white">
                        Memo // Layer {activeLayerId.slice(-4)}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono opacity-60 text-black dark:text-white">
                      x {Math.round(effectiveCommentPos.x * 100) / 100}, y {Math.round(effectiveCommentPos.y * 100) / 100}
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-[11px] font-mono leading-relaxed text-black dark:text-white whitespace-pre-wrap break-words">
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
                className="absolute border-2 border-black dark:border-white pointer-events-none opacity-30 transition-all duration-100"
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
