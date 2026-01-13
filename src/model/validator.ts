/** @author Dogan Kusluoglu */

export const getCoordKey = (x: number, y: number): string => `${x},${y}`;

export function getWordFootprint(word: any): any[] {
  const coords: any[] = [];
  for (let i = 0; i < word.text.length; i++) {
    if (word.direction === 'across') {
      coords.push({ x: word.start.x + i, y: word.start.y });
    } else {
      coords.push({ x: word.start.x, y: word.start.y + i });
    }
  }
  return coords;
}

export function intersects(wordA: any, wordB: any): boolean {
  return getOverlapCount(wordA, wordB) > 0;
}

export function getOverlapCount(wordA: any, wordB: any): number {
  const footprintA = getWordFootprint(wordA);
  const footprintB = getWordFootprint(wordB);
  
  const setA = new Set(footprintA.map(c => getCoordKey(c.x, c.y)));
  let overlaps = 0;
  footprintB.forEach(c => {
    if (setA.has(getCoordKey(c.x, c.y))) {
      overlaps++;
    }
  });
  return overlaps;
}

export function calculateStability(doc: any, activeLayerId: string, dictionary: Set<string>): { score: number; status: string } {
  const layer = doc.layersById[activeLayerId];
  if (!layer || layer.words.length === 0) return { score: 0, status: 'EMPTY' };

  let score = 0;
  const invalidIds = validatePlacementChain(layer.words);
  
  layer.words.forEach((word: any, index: number) => {
    if (invalidIds.has(word.id)) {
      score -= 500;
    } else {
      score += 100;
      score += word.text.length * 10;

      // Dictionary Bonus
      if (dictionary.has(word.text.toUpperCase())) {
        score += 500; // Bonus for real words
      }

      if (index > 0) {
        const overlaps = getOverlapCount(word, layer.words[index - 1]);
        if (overlaps > 1) {
          score += (overlaps - 1) * 150;
        }
      }

      if (word.ladderLayerId) {
        score += 1000;
      }
    }
  });

  // Global depth bonus
  const totalLayers = Object.keys(doc.layersById).length;
  score += (totalLayers - 1) * 2000;

  let status = 'UNSTABLE';
  if (score > 10000) status = 'ASCENDED';
  else if (score > 5000) status = 'CRYSTALLIZED';
  else if (score > 2000) status = 'STABLE';
  else if (score > 500) status = 'COHERENT';
  else if (score >= 0) status = 'FRAGMENTED';

  return { score: Math.max(0, score), status };
}

export function validatePlacementChain(words: any[]): Set<string> {
  const invalidIds = new Set<string>();
  if (words.length <= 1) return invalidIds;

  let chainBroken = false;
  
  for (let i = 1; i < words.length; i++) {
    const prevWord = words[i - 1];
    const currWord = words[i];
    
    if (chainBroken || !intersects(prevWord, currWord)) {
      invalidIds.add(currWord.id);
      chainBroken = true;
    }
  }
  
  return invalidIds;
}

export function updateLayerCells(layer: any): any {
  const cellsByKey: Record<string, any> = {};

  layer.words.forEach((word: any) => {
    const footprint = getWordFootprint(word);
    footprint.forEach((coord, index) => {
      const key = getCoordKey(coord.x, coord.y);
      const char = word.text[index];
      
      if (!cellsByKey[key]) {
        cellsByKey[key] = { coord, char, wordIds: [word.id] };
      } else {
        cellsByKey[key].char = char; 
        if (!cellsByKey[key].wordIds.includes(word.id)) {
          cellsByKey[key].wordIds.push(word.id);
        }
      }
    });
  });

  return { ...layer, cellsByKey };
}
