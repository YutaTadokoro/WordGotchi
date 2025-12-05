// Popup Component - Display expressions (art and poetry)
// Requirements: 3.5, 4.4, 10.4

import type { ArtExpression, PoetryExpression } from '../types';
import './Popup.css';

interface PopupProps {
  expression: ArtExpression | PoetryExpression | null;
  onClose: () => void;
}

/**
 * Popup component for displaying generated expressions
 * Centered on Canvas Area with fade and scale transitions
 * Requirements: 3.5, 4.4, 10.4
 */
export function Popup({ expression, onClose }: PopupProps) {
  if (!expression) return null;

  const isArt = 'imageUrl' in expression;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        {isArt ? (
          <ArtDisplay expression={expression as ArtExpression} />
        ) : (
          <PoetryDisplay expression={expression as PoetryExpression} />
        )}
      </div>
    </div>
  );
}

/**
 * Display art expression with download functionality
 * Requirements: 3.5, 3.6
 */
function ArtDisplay({ expression }: { expression: ArtExpression }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = expression.imageUrl;
    link.download = `wordgotchi-art-${expression.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="expression-display art-display">
      <h2 className="expression-title">Abstract Expression</h2>
      <div className="art-container">
        <img 
          src={expression.imageUrl} 
          alt={`Abstract art expressing ${expression.dominantEmotion}`}
          className="art-image"
        />
      </div>
      <p className="art-emotion">Dominant Emotion: {expression.dominantEmotion}</p>
      <div className="expression-actions">
        <button className="action-button" onClick={handleDownload}>
          Download
        </button>
      </div>
    </div>
  );
}

/**
 * Display poetry expression with copy functionality
 * Requirements: 4.4
 */
function PoetryDisplay({ expression }: { expression: PoetryExpression }) {
  const handleCopy = async () => {
    const poemText = expression.lines.join('\n');
    try {
      await navigator.clipboard.writeText(poemText);
      alert('Poem copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy poem:', error);
      alert('Failed to copy poem');
    }
  };

  return (
    <div className="expression-display poetry-display">
      <h2 className="expression-title">Poetic Expression</h2>
      <div className="poetry-container">
        {expression.lines.map((line, index) => (
          <p key={index} className="poetry-line">
            {line}
          </p>
        ))}
      </div>
      <div className="expression-actions">
        <button className="action-button" onClick={handleCopy}>
          Copy
        </button>
      </div>
    </div>
  );
}
