
import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="container">
      <div className="row gy-4">
        {/* Top welcome card */}
        <div className="col-12">
          <div className="app-card" style={{ padding: '2rem' }}>
            <div className="skeleton-loader mb-2" style={{ height: '36px', width: '60%' }}></div>
            <div className="skeleton-loader" style={{ height: '20px', width: '40%' }}></div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="col-12">
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="app-card stats-card text-center">
                <div className="skeleton-loader mx-auto" style={{ height: '40px', width: '70%' }}></div>
                <div className="skeleton-loader mx-auto mt-2" style={{ height: '16px', width: '50%' }}></div>
              </div>
            </div>
             <div className="col-6 col-md-3">
              <div className="app-card stats-card text-center">
                <div className="skeleton-loader mx-auto" style={{ height: '40px', width: '70%' }}></div>
                <div className="skeleton-loader mx-auto mt-2" style={{ height: '16px', width: '50%' }}></div>
              </div>
            </div>
             <div className="col-6 col-md-3">
              <div className="app-card stats-card text-center">
                <div className="skeleton-loader mx-auto" style={{ height: '40px', width: '70%' }}></div>
                <div className="skeleton-loader mx-auto mt-2" style={{ height: '16px', width: '50%' }}></div>
              </div>
            </div>
             <div className="col-6 col-md-3">
              <div className="app-card stats-card text-center">
                <div className="skeleton-loader mx-auto" style={{ height: '40px', width: '70%' }}></div>
                <div className="skeleton-loader mx-auto mt-2" style={{ height: '16px', width: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content columns */}
        <div className="col-lg-5">
          <div className="app-card" style={{ minHeight: '500px' }}>
            <div className="skeleton-loader mb-4" style={{ height: '30px', width: '50%' }}></div>
            <div className="skeleton-loader mb-3" style={{ height: '56px', width: '100%' }}></div>
            <div className="skeleton-loader mb-3" style={{ height: '56px', width: '100%' }}></div>
            <div className="skeleton-loader" style={{ height: '56px', width: '100%', marginTop: 'auto' }}></div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="app-card" style={{ minHeight: '500px' }}>
            <div className="skeleton-loader mb-4" style={{ height: '30px', width: '40%' }}></div>
            <div className="skeleton-loader mb-2" style={{ height: '24px', width: '90%' }}></div>
            <div className="skeleton-loader mb-2" style={{ height: '24px', width: '80%' }}></div>
            <div className="skeleton-loader mb-2" style={{ height: '24px', width: '95%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
