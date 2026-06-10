
import React, { useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = useFirebase();

  // This effect handles the body padding to prevent the fixed banner
  // from overlapping the sticky header.
  useEffect(() => {
    const bannerHeight = '38px';
    if (!isOnline) {
      document.body.style.paddingTop = bannerHeight;
    } else {
      document.body.style.paddingTop = '0';
    }

    // Cleanup function to remove padding when the component unmounts
    return () => {
      document.body.style.paddingTop = '0';
    };
  }, [isOnline]);

  if (isOnline) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      backgroundColor: 'var(--danger)',
      color: 'white',
      textAlign: 'center',
      padding: '0.5rem',
      zIndex: 1100,
      fontWeight: '600',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '38px',
    }}>
      <i className="fas fa-wifi me-2"></i> You are currently offline. New bookings will be queued.
    </div>
  );
};

export default OfflineIndicator;