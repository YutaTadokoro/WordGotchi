// Skeleton Screen Component
// Task 19.2: Add skeleton screens for initial load

import React from 'react';
import './SkeletonScreen.css';

export const SkeletonScreen: React.FC = () => {
  return (
    <div className="skeleton-screen">
      {/* Canvas skeleton */}
      <div className="skeleton-canvas">
        <div className="skeleton-gotchi"></div>
        <div className="skeleton-glow"></div>
      </div>
      
      {/* Input area skeleton */}
      <div className="skeleton-input-area">
        <div className="skeleton-textarea"></div>
        <div className="skeleton-controls">
          <div className="skeleton-counter"></div>
          <div className="skeleton-button"></div>
        </div>
        <div className="skeleton-status">
          <div className="skeleton-status-item"></div>
          <div className="skeleton-status-item"></div>
        </div>
      </div>
    </div>
  );
};
