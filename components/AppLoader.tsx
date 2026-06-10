import React from 'react';

const AppLoader: React.FC<{ message?: string }> = ({ message = 'Loading MBU Ride...' }) => {
    return (
        <div className="app-loader">
            <div className="app-loader-card">
                <i className="fas fa-bus app-loader-icon" aria-hidden="true"></i>
                <h1 className="app-loader-title">MBU Ride</h1>
                <div className="app-loader-spinner" role="status" aria-label="Loading">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="app-loader-message">{message}</p>
            </div>
        </div>
    );
};

export default AppLoader;
