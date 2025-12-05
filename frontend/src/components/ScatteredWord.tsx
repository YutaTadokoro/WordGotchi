// ScatteredWord Component - Individual word displayed on canvas
// Requirements: 1.1, 1.2, 1.3, 6.5

import { Text } from 'react-konva';
import { useState, useCallback, memo } from 'react';

// ============================================================================
// Types
// ============================================================================

interface ScatteredWordProps {
  word: string;
  x: number;
  y: number;
  onClick: (word: string, x: number, y: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ScatteredWord = memo(function ScatteredWord({ word, x, y, onClick }: ScatteredWordProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onClick(word, x, y);
  }, [onClick, word, x, y]);

  return (
    <Text
      text={word}
      x={x}
      y={y}
      fontSize={18}
      fontFamily="Inter, sans-serif"
      fill={isHovered ? '#b794f6' : '#e8d5ff'} // soul lavender on hover, ghost white default
      opacity={isHovered ? 1 : 0.8}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if word, position, or onClick changed
  return (
    prevProps.word === nextProps.word &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.onClick === nextProps.onClick
  );
});
