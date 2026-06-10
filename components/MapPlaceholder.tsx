
import React from 'react';

// FIX: Added an interface for component props to accept a className.
interface MapPlaceholderProps {
  className?: string;
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ className = '' }) => {
  return (
    <div 
      className={`map-placeholder ${className}`}
    >
      <div>
        <i className="fas fa-map-marked-alt fa-3x"></i>
        <p className="mt-3 mb-1 fw-bold">
          Loading map...
        </p>
        <p className="small">
          Select pickup and destination to view directions.
        </p>
      </div>
    </div>
  );
};

export default MapPlaceholder;