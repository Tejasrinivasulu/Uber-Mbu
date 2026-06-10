
import React, { useState } from 'react';
import { Ride, Driver, Coordinates } from '../types';
import GoogleMap from './GoogleMap';
import MapPlaceholder from './MapPlaceholder';

interface ActiveRideCardProps {
    activeRide: Ride;
    driverForRide: Driver | null;
    userLocation: Coordinates | null;
    mapsApiLoaded: boolean;
    onCancelClick: () => void;
    onSosClick: () => void;
}

const getDistanceInKm = (p1: Coordinates, p2: Coordinates): number => {
    const R = 6371;
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


const ActiveRideCard: React.FC<ActiveRideCardProps> = ({ 
    activeRide, driverForRide, userLocation, mapsApiLoaded,
    onCancelClick, onSosClick 
}) => {

    const [eta, setEta] = useState<string | null>(null);

    const rideProgressPercentage = (() => {
        if (!driverForRide?.location || !activeRide.pickupCoords || !activeRide.destinationCoords) return 60;
        const totalDist = getDistanceInKm(activeRide.pickupCoords, activeRide.destinationCoords);
        const remainingDist = getDistanceInKm(driverForRide.location, activeRide.destinationCoords);
        if (totalDist <= 0) return 100;
        return Math.min(100, Math.max(0, ((totalDist - remainingDist) / totalDist) * 100));
    })();

    return (
        <div className="app-card">
            <div>
                <div className="section-header">
                    <div className="section-title">Active Ride</div>
                    <span className="badge bg-success">{activeRide.status}</span>
                </div>
                {driverForRide && (
                    <div className="d-flex align-items-center mt-3">
                        <div className="user-avatar me-3" style={{width: '50px', height: '50px'}}>
                            {driverForRide.photoURL ? <img src={driverForRide.photoURL} alt={driverForRide.name} /> : driverForRide.name.charAt(0)}
                        </div>
                        <div>
                            <h6 className="mb-0">{driverForRide.name} {driverForRide.isVerified && <i className="fas fa-check-circle text-success ms-1" style={{fontSize: '0.8em'}}></i>}</h6>
                            <p className="small text-muted mb-0">{driverForRide.vehicleDetails?.make} {driverForRide.vehicleDetails?.model} - <strong>{driverForRide.vehicleDetails?.licensePlate}</strong></p>
                        </div>
                    </div>
                )}
            </div>
            <div className="my-3" style={{ flex: '1 1 auto', minHeight: '250px' }}>
                {mapsApiLoaded ? <GoogleMap driverLocation={driverForRide?.location || null} userLocation={userLocation} destinationCoords={activeRide.destinationCoords} onRouteUpdate={setEta} /> : <MapPlaceholder />}
            </div>
            <div>
                <div className="ride-progress"><div className="progress-bar" style={{ width: `${rideProgressPercentage}%` }}></div></div>
                <div className="d-flex justify-content-between align-items-baseline">
                    <span className="progress-label">En route to {activeRide.destination}</span>
                    {eta && <span className="progress-label small text-muted">ETA: {eta}</span>}
                </div>
                <div className="mt-3">
                    <div className="ride-actions-grid">
                        <button className="btn-action" onClick={() => { if (driverForRide?.mobileNumber) window.location.href = `tel:${driverForRide.mobileNumber}`; }} disabled={!driverForRide?.mobileNumber}><i className="fas fa-phone"></i> Call</button>
                        <button className="btn-action" onClick={onCancelClick}><i className="fas fa-times"></i> Cancel</button>
                    </div>
                    <button className="btn-sos-main" onClick={onSosClick}><i className="fas fa-exclamation-triangle"></i> SOS</button>
                </div>
            </div>
        </div>
    );
};

export default ActiveRideCard;
