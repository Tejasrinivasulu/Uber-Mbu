import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/driver-dashboard.css';
import { useFirebase } from '../contexts/FirebaseContext';
import { useNotification } from '../contexts/NotificationContext';
import { Coordinates } from '../types';
import DriverLayout, { DriverSection } from '../components/driver/DriverLayout';
import ProfileScreen from './ProfileScreen';
import {
    DriverHomeSection,
    DriverRequestsSection,
    DriverActiveSection,
    DriverScheduledSection,
    DriverEarningsSection,
    DriverHistorySection,
    DriverEmergencySection,
    DriverVehiclePanel,
    RidePhase,
} from './driver/DriverSections';

const DriverDashboard: React.FC = () => {
    const {
        driver, authUser, activeRide, rideRequests, allRides, waitlist,
        toggleDriverStatus, handleRideRequest, completeRide, acceptWaitlistedRide, logout,
    } = useFirebase();
    const { showNotification } = useNotification();

    const [section, setSection] = useState<DriverSection>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [ridePhase, setRidePhase] = useState<RidePhase>('navigate_pickup');
    const [showVehicle, setShowVehicle] = useState(false);
    const [driverLocation, setDriverLocation] = useState<Coordinates>(
        driver?.location ?? { lat: 13.6288, lng: 79.4192 },
    );
    const prevRideRequestIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!driver) return;
        setDriverLocation(driver.location);
    }, [driver?.location.lat, driver?.location.lng]);

    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {},
            { enableHighAccuracy: true, maximumAge: 30000 },
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        const currentIds = new Set(rideRequests.map((r) => r.id));
        const newRequests = rideRequests.filter((r) => !prevRideRequestIds.current.has(r.id));
        newRequests.forEach((req) => {
            showNotification('New Ride Request!', `${req.pickup} → ${req.destination} · ₹${req.fare}`);
        });
        prevRideRequestIds.current = currentIds;
    }, [rideRequests, showNotification]);

    useEffect(() => {
        if (activeRide) {
            setSection('active');
            setRidePhase('navigate_pickup');
        }
    }, [activeRide?.id]);

    const onAcceptRide = useCallback((rideId: string) => {
        handleRideRequest(rideId, true);
        setSection('active');
        setRidePhase('navigate_pickup');
    }, [handleRideRequest]);

    const onRejectRide = useCallback((rideId: string) => {
        handleRideRequest(rideId, false);
    }, [handleRideRequest]);

    const onCompleteRide = useCallback(() => {
        completeRide();
        setRidePhase('completed');
        setSection('home');
    }, [completeRide]);

    if (!driver || !authUser) return null;

    const sectionProps = {
        driver,
        authUid: authUser.uid,
        activeRide,
        rideRequests,
        allRides,
        waitlist,
        searchQuery,
        onNavigate: setSection,
        onToggleOnline: toggleDriverStatus,
        onAcceptRide,
        onRejectRide,
        onCompleteRide,
        onAcceptWaitlisted: acceptWaitlistedRide,
        ridePhase,
        onRidePhaseChange: setRidePhase,
        driverLocation,
        showNotification,
    };

    const renderSection = () => {
        if (section === 'profile') return <ProfileScreen />;

        switch (section) {
            case 'home': return <DriverHomeSection {...sectionProps} />;
            case 'requests': return <DriverRequestsSection {...sectionProps} />;
            case 'active': return <DriverActiveSection {...sectionProps} />;
            case 'scheduled': return <DriverScheduledSection {...sectionProps} />;
            case 'earnings': return <DriverEarningsSection {...sectionProps} />;
            case 'history': return <DriverHistorySection {...sectionProps} />;
            case 'emergency': return <DriverEmergencySection {...sectionProps} />;
            default: return <DriverHomeSection {...sectionProps} />;
        }
    };

    return (
        <DriverLayout
            driverName={driver.name}
            photoURL={driver.photoURL}
            activeSection={section}
            onNavigate={setSection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onLogout={logout}
            onProfileAction={(action) => {
                if (action === 'profile' || action === 'edit') setSection('profile');
                else if (action === 'vehicle') setShowVehicle(true);
            }}
            requestCount={rideRequests.length}
        >
            {renderSection()}
            {showVehicle && <DriverVehiclePanel driver={driver} onClose={() => setShowVehicle(false)} />}
        </DriverLayout>
    );
};

export default DriverDashboard;
