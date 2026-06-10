declare namespace google {
    namespace maps {
        class DirectionsService {}
    }
}

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import '../styles/student-dashboard.css';
import AppLoader from '../components/AppLoader';
import { useFirebase } from '../contexts/FirebaseContext';
import { Ride, RideType, RideStatus, Driver, FareBreakdownDetails, Coordinates } from '../types';
import { getStudentNudge, Nudge } from '../ai/EcoNudgeEngine';
import { useNotification } from '../contexts/NotificationContext';
import { calculateFare, getMaxFareDiscount } from '../ai/FareCalculator';
import FareBreakdownModal from '../components/FareBreakdownModal';
import { getDriverProfile } from '../localStore';
import { findStopByName } from '../data/campusStops';
import StudentLayout, { StudentSection } from '../components/student/StudentLayout';
import {
    HomeSection, RideBookingSection, NearAutosSection,
    ScheduledRidesSection, RideHistorySection, EmergencySection, BookingState,
} from './student/StudentSections';
import ProfileScreen from './ProfileScreen';
import PaymentScreen from './PaymentScreen';

const SchedulerScreen = lazy(() => import('./SchedulerScreen'));

const DEFAULT_DEST = { lat: 13.6330, lng: 79.4137 };

const StudentDashboard: React.FC = () => {
    const {
        authUser, student, activeRide, driverForRide, recentRides,
        cancelRide, bookRide, loading, submitRating,
        joinWaitlist, leaveWaitlist, waitlist, ridePlans, logout,
    } = useFirebase();
    const { showNotification } = useNotification();

    const [section, setSection] = useState<StudentSection>('home');
    const [searchQuery, setSearchQuery] = useState('');

    const [rideType, setRideType] = useState<RideType>(RideType.SOLO);
    const [bookingMode, setBookingMode] = useState<'instant' | 'schedule' | 'shared' | 'full'>('instant');
    const [pickup, setPickup] = useState('MBU Main Gate');
    const [destination, setDestination] = useState('Railway Station');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [fareDiscount, setFareDiscount] = useState(0);
    const [ecoNudge, setEcoNudge] = useState<Nudge | null>(null);
    const [noDriversAvailable, setNoDriversAvailable] = useState(false);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [rideToRate, setRideToRate] = useState<{ ride: Ride; driver: Driver | null } | null>(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const prevRecentRidesLength = useRef(recentRides.length);
    const [fareDetails, setFareDetails] = useState<FareBreakdownDetails | null>(null);
    const [soloFare, setSoloFare] = useState<FareBreakdownDetails | null>(null);
    const [sharedFare, setSharedFare] = useState<FareBreakdownDetails | null>(null);
    const [showFareModal, setShowFareModal] = useState(false);
    const [showSosModal, setShowSosModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');

    const bookingType: 'ASAP' | 'Scheduled' = bookingMode === 'schedule' ? 'Scheduled' : 'ASAP';

    useEffect(() => {
        setNoDriversAvailable(rideType === RideType.SHARED && Math.random() > 0.5);
    }, [rideType]);

    useEffect(() => {
        const scheduledIso = bookingType === 'Scheduled' && scheduledDate && scheduledTime
            ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
            : new Date().toISOString();

        const solo = calculateFare({ pickup, destination, type: RideType.SOLO, scheduledTime: scheduledIso });
        const shared = calculateFare({ pickup, destination, type: RideType.SHARED, scheduledTime: scheduledIso });
        setSoloFare(solo);
        setSharedFare(shared);

        let selected = rideType === RideType.SHARED ? shared : solo;
        if (bookingMode === 'full') {
            selected = { ...solo, totalFare: Math.round((solo.totalFare * 1.15) / 5) * 5 };
        }
        setFareDetails(selected);
        const maxDiscount = getMaxFareDiscount(solo.distanceKm);
        setFareDiscount((prev) => Math.min(prev, maxDiscount));
    }, [pickup, destination, rideType, bookingType, bookingMode, scheduledDate, scheduledTime]);

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setUserLocation({ lat: 13.6296, lng: 79.4165 }),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        if (recentRides.length > prevRecentRidesLength.current) {
            const lastRide = recentRides[0];
            if (lastRide?.status === RideStatus.COMPLETED && lastRide.rating === undefined && lastRide.driverId) {
                const driver = getDriverProfile(lastRide.driverId);
                if (driver) setRideToRate({ ride: lastRide, driver });
            }
        }
        prevRecentRidesLength.current = recentRides.length;
    }, [recentRides]);

    const getCoords = useCallback((name: string, fallback: Coordinates) => {
        const stop = findStopByName(name);
        return stop ? { lat: stop.lat, lng: stop.lng } : fallback;
    }, []);

    const getFinalFare = useCallback(() => {
        if (!fareDetails) return 0;
        return Math.max(25, fareDetails.totalFare - fareDiscount);
    }, [fareDetails, fareDiscount]);

    const handleBookingAction = () => {
        if (!fareDetails) { showNotification('Error', 'Fare could not be calculated.'); return; }
        const rideDetails: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'> = {
            pickup, destination, type: rideType, fare: getFinalFare(),
            pickupCoords: getCoords(pickup, { lat: 13.6296, lng: 79.4165 }),
            destinationCoords: getCoords(destination, DEFAULT_DEST),
            bookingType,
            ...(rideType === RideType.SHARED && { groupSize: passengers }),
        };
        if (bookingType === 'Scheduled') {
            if (!scheduledDate || !scheduledTime) {
                showNotification('Date Required', 'Please select date and time for scheduled ride.');
                return;
            }
            rideDetails.scheduledTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        }
        if (noDriversAvailable) { joinWaitlist(rideDetails); return; }
        const nudge = getStudentNudge(rideDetails);
        if (nudge) setEcoNudge(nudge);
        else {
            bookRide(rideDetails);
            setSection('booking');
        }
    };

    const handleNudgeResponse = (accepted: boolean) => {
        if (accepted && ecoNudge) bookRide(ecoNudge.modifiedRideDetails);
        else if (fareDetails) {
            bookRide({
                pickup, destination, type: rideType, fare: getFinalFare(),
                pickupCoords: getCoords(pickup, { lat: 13.6296, lng: 79.4165 }),
                destinationCoords: getCoords(destination, DEFAULT_DEST), bookingType,
            });
        }
        setEcoNudge(null);
        setSection('booking');
    };

    const handleLocate = () => {
        setPickup('MBU Main Gate');
        showNotification('Location', 'Using campus default pickup — MBU Main Gate.');
    };

    const handleSosConfirm = () => {
        setShowSosModal(false);
        showNotification('SOS Activated', 'Notifying security and emergency contact...');
        if (student?.emergencyContact?.phone) {
            const num = student.emergencyContact.phone;
            if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) window.location.href = `tel:${num}`;
            else window.open(`https://wa.me/${num.replace(/\D/g, '')}`, '_blank');
        }
    };

    const handleConfirmCancellation = () => {
        if (!cancellationReason) { showNotification('Reason Required', 'Please select a reason.'); return; }
        cancelRide(cancellationReason);
        setShowCancelModal(false);
        setCancellationReason('');
        setSection('home');
    };

    if (!student) return <AppLoader message="Loading your profile..." />;

    const hasEmergencyContact = !!(student.emergencyContact?.name && student.emergencyContact.phone);

    const bookingState: BookingState = {
        rideType, setRideType, bookingMode, setBookingMode,
        pickup, setPickup, destination, setDestination,
        scheduledDate, setScheduledDate, scheduledTime, setScheduledTime,
        passengers, setPassengers,
        fareDiscount, setFareDiscount,
        fareDetails, soloFare, sharedFare, loading, noDriversAvailable,
        onBook: handleBookingAction, onShowFare: () => setShowFareModal(true),
    };

    const sectionProps = {
        student, onNavigate: setSection, recentRides, ridePlans,
        activeRide, driverForRide,
        onSos: () => setShowSosModal(true),
        onCancel: () => setShowCancelModal(true),
    };

    const renderSection = () => {
        if (section === 'profile') return <ProfileScreen />;
        if (section === 'wallet') return <PaymentScreen />;
        if (section === 'scheduler') return (
            <Suspense fallback={<AppLoader message="Loading scheduler..." />}>
                <SchedulerScreen />
            </Suspense>
        );
        switch (section) {
            case 'home': return <HomeSection {...sectionProps} />;
            case 'booking': return <RideBookingSection {...sectionProps} booking={bookingState} />;
            case 'nearby': return <NearAutosSection onBook={() => setSection('booking')} />;
            case 'scheduled': return <ScheduledRidesSection {...sectionProps} onScheduleNew={() => { setBookingMode('schedule'); setSection('booking'); }} onOpenPlanner={() => setSection('scheduler')} />;
            case 'history': return <RideHistorySection rides={recentRides} />;
            case 'emergency': return <EmergencySection student={student} onSos={() => setShowSosModal(true)} onNavigateProfile={() => setSection('profile')} />;
            default: return <HomeSection {...sectionProps} />;
        }
    };

    return (
        <>
            <StudentLayout
                studentName={student.name}
                photoURL={student.photoURL}
                activeSection={section}
                onNavigate={setSection}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSelect={(stop) => { setDestination(stop); setSection('booking'); }}
                onLogout={logout}
                onProfileAction={(action) => {
                    if (action === 'profile') setSection('profile');
                    else if (action === 'wallet') setSection('wallet');
                    else if (action === 'settings') showNotification('Settings', 'Settings coming soon.');
                }}
            >
                {student.isOnWaitlist && (
                    <div className="mbu-card mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderColor: 'var(--mbu-primary-light)' }}>
                        <div>
                            <strong><i className="fas fa-clock me-2"></i>On Waitlist</strong>
                            <span className="text-muted ms-2">Position #{waitlist.findIndex((w) => w.studentId === authUser?.uid) + 1}</span>
                        </div>
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={leaveWaitlist}>Leave Waitlist</button>
                    </div>
                )}
                {renderSection()}
            </StudentLayout>

            {rideToRate && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header"><h5 className="modal-title">Rate ride with {rideToRate.driver?.name}</h5>
                                <button type="button" className="btn-close" onClick={() => setRideToRate(null)}></button></div>
                            <div className="modal-body text-center">
                                <p>How was your trip to {rideToRate.ride.destination}?</p>
                                <div className="fs-1 my-3">{[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} type="button" className="rating-star-btn border-0 bg-transparent" onClick={() => setRating(star)}>
                                        <i className={`fas fa-star ${rating >= star ? 'text-warning' : 'text-secondary'}`}></i>
                                    </button>
                                ))}</div>
                                <textarea className="form-control" rows={3} placeholder="Add a comment..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setRideToRate(null)}>Skip</button>
                                <button type="button" className="btn btn-primary" onClick={() => {
                                    if (rideToRate.ride.driverId) submitRating(rideToRate.ride.id, rideToRate.ride.driverId, rating, feedback);
                                    setRideToRate(null); setRating(0); setFeedback('');
                                }}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {ecoNudge && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header"><h5 className="modal-title"><i className="fas fa-leaf me-2 text-success"></i>Go Green & Save!</h5></div>
                            <div className="modal-body"><p>{ecoNudge.message}</p></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => handleNudgeResponse(false)}>No Thanks</button>
                                <button type="button" className="btn btn-primary" onClick={() => handleNudgeResponse(true)}>Accept</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showFareModal && fareDetails && <FareBreakdownModal show={showFareModal} onClose={() => setShowFareModal(false)} details={fareDetails} />}

            {showSosModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-danger">
                            <div className="modal-header"><h5 className="modal-title text-danger"><i className="fas fa-triangle-exclamation me-2"></i>{hasEmergencyContact ? 'Confirm SOS' : 'No Emergency Contact'}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowSosModal(false)}></button></div>
                            {hasEmergencyContact && student.emergencyContact ? (
                                <>
                                    <div className="modal-body"><p>Alert security and call <strong>{student.emergencyContact.name}</strong>?</p></div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowSosModal(false)}>Cancel</button>
                                        <button type="button" className="btn btn-danger" onClick={handleSosConfirm}>Yes, I Need Help</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="modal-body"><p>Add an emergency contact in your profile to use SOS.</p></div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowSosModal(false)}>Cancel</button>
                                        <button type="button" className="btn btn-primary" onClick={() => { setShowSosModal(false); setSection('profile'); }}>Go to Profile</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header"><h5 className="modal-title">Cancel Ride</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button></div>
                            <div className="modal-body">
                                <select className="form-control" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)}>
                                    <option value="" disabled>Select reason</option>
                                    <option value="Changed my mind">Changed my mind</option>
                                    <option value="No longer needed">No longer needed</option>
                                    <option value="Waited too long">Waited too long</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Nevermind</button>
                                <button type="button" className="btn btn-danger" onClick={handleConfirmCancellation} disabled={!cancellationReason}>Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentDashboard;
