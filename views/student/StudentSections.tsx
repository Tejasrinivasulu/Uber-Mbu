import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Ride, RideType, RideStatus, Driver, FareBreakdownDetails, Coordinates, Student, RidePlan } from '../../types';
import { CAMPUS_STOPS, findStopByName } from '../../data/campusStops';
import { getMaxFareDiscount } from '../../ai/FareCalculator';
import { RouteStep } from '../../utils/routeService';
import { loadLeaflet } from '../../utils/loadLeaflet';
import { NEARBY_AUTOS } from '../../data/nearbyAutos';
import RouteMap, { buildLiveLocationEmbedUrl } from '../../components/RouteMap';
import { shareLiveLocation, LiveLocation, getGoogleMapsUrl } from '../../utils/shareLocation';
import { CAMPUS_EMERGENCY_CONTACT, formatIndianPhone, telHref } from '../../data/emergencyContacts';
import type { StudentSection } from '../../components/student/StudentLayout';

export interface BookingState {
    rideType: RideType;
    setRideType: (t: RideType) => void;
    bookingMode: 'instant' | 'schedule' | 'shared' | 'full';
    setBookingMode: (m: 'instant' | 'schedule' | 'shared' | 'full') => void;
    pickup: string;
    setPickup: (v: string) => void;
    destination: string;
    setDestination: (v: string) => void;
    scheduledDate: string;
    setScheduledDate: (v: string) => void;
    scheduledTime: string;
    setScheduledTime: (v: string) => void;
    passengers: number;
    setPassengers: (n: number) => void;
    fareDiscount: number;
    setFareDiscount: (n: number) => void;
    fareDetails: FareBreakdownDetails | null;
    soloFare: FareBreakdownDetails | null;
    sharedFare: FareBreakdownDetails | null;
    loading: boolean;
    noDriversAvailable: boolean;
    onBook: () => void;
    onShowFare: () => void;
}

interface SectionProps {
    student: Student;
    onNavigate: (s: StudentSection) => void;
    recentRides: Ride[];
    ridePlans: RidePlan[];
    activeRide: Ride | null;
    driverForRide: Driver | null;
    onSos: () => void;
    onCancel: () => void;
}

function rideStatusClass(status: RideStatus): string {
    if (status === RideStatus.COMPLETED) return 'completed';
    if (status === RideStatus.CANCELLED) return 'cancelled';
    if (status === RideStatus.ACTIVE || status === RideStatus.CONFIRMED) return 'active';
    return 'pending';
}

export const HomeSection: React.FC<SectionProps> = ({ student, onNavigate, recentRides }) => {
    const upcoming = recentRides.filter((r) => r.bookingType === 'Scheduled' && r.status === RideStatus.PENDING).length;
    const planCount = student.ridePlans ? Object.keys(student.ridePlans).length : 0;

    const stats = [
        { icon: 'fa-route', color: '#0F766E', bg: 'rgba(15,118,110,0.1)', value: student.totalRides, label: 'Total Rides' },
        { icon: 'fa-calendar-check', color: '#059669', bg: 'rgba(5,150,105,0.1)', value: upcoming + planCount, label: 'Scheduled' },
        { icon: 'fa-car', color: '#10B981', bg: 'rgba(16,185,129,0.1)', value: NEARBY_AUTOS.length, label: 'Nearby Autos' },
        { icon: 'fa-piggy-bank', color: '#D97706', bg: 'rgba(217,119,6,0.1)', value: `₹${student.savings.toFixed(0)}`, label: 'Money Saved' },
    ];

    return (
        <div className="d-flex flex-column gap-4">
            <div className="mbu-welcome mbu-card">
                <div className="mbu-welcome-content">
                    <h2 className="mb-1 fw-bold">Welcome back, {student.name.split(' ')[0]}!</h2>
                    <p className="mb-0 opacity-90">Your campus ride companion — book autos across MBU & Tirupati.</p>
                    <div className="mbu-welcome-meta">
                        <span><i className="fas fa-wallet"></i> ₹{student.walletBalance.toFixed(0)} wallet</span>
                        <span><i className="fas fa-star"></i> {student.rating} rating</span>
                        <span><i className="fas fa-leaf"></i> {student.totalCo2Savings?.toFixed(1) ?? 0} kg CO₂ saved</span>
                    </div>
                </div>
            </div>

            <div className="mbu-stat-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className="mbu-card mbu-stat">
                        <div className="mbu-stat-top">
                            <div className="mbu-stat-icon" style={{ background: stat.bg, color: stat.color }}>
                                <i className={`fas ${stat.icon}`}></i>
                            </div>
                        </div>
                        <div className="mbu-stat-value">{stat.value}</div>
                        <div className="mbu-stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="mbu-card">
                <h3 className="mbu-section-title"><i className="fas fa-bolt"></i>Quick Actions</h3>
                <div className="mbu-actions-grid">
                    <button type="button" className="mbu-action-btn primary" onClick={() => onNavigate('booking')}>
                        <span className="mbu-action-icon"><i className="fas fa-taxi"></i></span>
                        Book Ride
                    </button>
                    <button type="button" className="mbu-action-btn" onClick={() => onNavigate('scheduled')}>
                        <span className="mbu-action-icon"><i className="fas fa-calendar-plus"></i></span>
                        Schedule Ride
                    </button>
                    <button type="button" className="mbu-action-btn sos" onClick={() => onNavigate('emergency')}>
                        <span className="mbu-action-icon"><i className="fas fa-bell"></i></span>
                        Emergency SOS
                    </button>
                </div>
            </div>

            <div className="mbu-card">
                <h3 className="mbu-section-title"><i className="fas fa-clock-rotate-left"></i>Recent Activity</h3>
                {recentRides.slice(0, 4).length > 0 ? (
                    recentRides.slice(0, 4).map((ride) => (
                        <div key={ride.id} className="mbu-history-item">
                            <div>
                                <div className="mbu-history-route"><strong>{ride.pickup}</strong> → {ride.destination}</div>
                                <div className="mbu-history-meta">{new Date(ride.date).toLocaleString()}</div>
                            </div>
                            <div className="text-end">
                                <span className={`mbu-status-pill ${rideStatusClass(ride.status)}`}>{ride.status}</span>
                                <div className="fw-bold mt-1" style={{ color: 'var(--mbu-primary)' }}>₹{ride.fare.toFixed(0)}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mbu-empty">
                        <div className="mbu-empty-icon"><i className="fas fa-history"></i></div>
                        <p>No rides yet. Book your first auto!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const RideBookingSection: React.FC<SectionProps & { booking: BookingState }> = ({ booking, activeRide }) => {
    const {
        rideType, setRideType,
        bookingMode, setBookingMode,
        pickup, setPickup, destination, setDestination,
        scheduledDate, setScheduledDate, scheduledTime, setScheduledTime,
        passengers, setPassengers,
        fareDiscount, setFareDiscount,
        fareDetails, soloFare, sharedFare,
        loading, noDriversAvailable,
        onBook, onShowFare,
    } = booking;

    const isBooked = !!activeRide && activeRide.status !== RideStatus.CANCELLED && activeRide.status !== RideStatus.COMPLETED;

    const displayPickup = isBooked ? activeRide!.pickup : pickup;
    const displayDest = isBooked ? activeRide!.destination : destination;

    const pickupStop = findStopByName(displayPickup);
    const destStop = findStopByName(displayDest);
    const pickupCoords = isBooked
        ? activeRide!.pickupCoords
        : (pickupStop ? { lat: pickupStop.lat, lng: pickupStop.lng } : { lat: 13.6296, lng: 79.4165 });
    const destCoords = isBooked
        ? activeRide!.destinationCoords
        : (destStop ? { lat: destStop.lat, lng: destStop.lng } : { lat: 13.6284, lng: 79.4193 });

    const fullAutoFare = soloFare
        ? Math.round((soloFare.totalFare * 1.15) / 5) * 5
        : null;

    const distanceKm = fareDetails?.distanceKm ?? soloFare?.distanceKm ?? 0;
    const maxFareDiscount = getMaxFareDiscount(distanceKm);
    const baseFareAmount = bookingMode === 'full'
        ? fullAutoFare
        : fareDetails?.totalFare;
    const finalFareAmount = baseFareAmount != null
        ? Math.max(25, baseFareAmount - fareDiscount)
        : null;

    const [routeEta, setRouteEta] = useState<string | null>(null);
    const [routeDistance, setRouteDistance] = useState<string | null>(null);
    const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
    const [routeLoading, setRouteLoading] = useState(true);

    const handleRouteUpdate = useCallback((eta: string | null, distance: string | null, steps?: RouteStep[], loading = false) => {
        setRouteEta(eta);
        setRouteDistance(distance);
        setRouteSteps(steps ?? []);
        setRouteLoading(loading);
    }, []);

    useEffect(() => {
        loadLeaflet();
    }, []);

    const handleBookingMode = (mode: typeof bookingMode) => {
        if (isBooked) return;
        setBookingMode(mode);
        if (mode === 'shared') setRideType(RideType.SHARED);
        else if (mode === 'full' || mode === 'instant' || mode === 'schedule') setRideType(RideType.SOLO);
    };

    return (
        <div className="mbu-booking-page">
            {isBooked && (
                <div className="mbu-card mbu-booked-banner">
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <i className="fas fa-circle-check fa-2x text-success"></i>
                        <div className="flex-grow-1">
                            <strong>Ride Confirmed!</strong>
                            <div className="small text-muted">
                                {activeRide!.pickup} → {activeRide!.destination} · {activeRide!.type} · ₹{activeRide!.fare.toFixed(0)}
                            </div>
                            <div className="small text-success mt-1">
                                <i className="fas fa-route me-1"></i>Directions shown on map to the right
                            </div>
                        </div>
                        <span className="badge bg-success">{activeRide!.status}</span>
                    </div>
                </div>
            )}

            <div className="mbu-booking-split">
                <div className="mbu-card mbu-booking-form-card">
                    <h3 className="mbu-section-title"><i className="fas fa-taxi me-2"></i>Book a Ride</h3>

                    <div className="mbu-form-grid">
                        <div className="mbu-form-field">
                            <label htmlFor="pickup-select" className="form-label">Pickup</label>
                            <select id="pickup-select" className="form-control" value={pickup} onChange={(e) => setPickup(e.target.value)} disabled={isBooked}>
                                {CAMPUS_STOPS.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="mbu-form-field">
                            <label htmlFor="dest-select" className="form-label">Drop</label>
                            <select id="dest-select" className="form-control" value={destination} onChange={(e) => setDestination(e.target.value)} disabled={isBooked}>
                                {CAMPUS_STOPS.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="mbu-form-field mbu-form-field-full">
                            <label className="form-label">Booking Type</label>
                            <div className="mbu-booking-modes">
                                {([
                                    ['instant', 'fa-bolt', 'Instant'],
                                    ['schedule', 'fa-calendar', 'Schedule'],
                                    ['shared', 'fa-users', 'Shared'],
                                    ['full', 'fa-car', 'Full Auto'],
                                ] as const).map(([mode, icon, label]) => (
                                    <button key={mode} type="button" className={`mbu-mode-btn ${bookingMode === mode ? 'active' : ''}`}
                                        onClick={() => handleBookingMode(mode)} disabled={isBooked}>
                                        <i className={`fas ${icon}`}></i><span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {bookingMode === 'schedule' && (
                            <>
                                <div className="mbu-form-field">
                                    <label htmlFor="sched-date" className="form-label">Date</label>
                                    <input id="sched-date" type="date" className="form-control" value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)} disabled={isBooked} />
                                </div>
                                <div className="mbu-form-field">
                                    <label htmlFor="sched-time" className="form-label">Time</label>
                                    <input id="sched-time" type="time" className="form-control" value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)} disabled={isBooked} />
                                </div>
                            </>
                        )}

                        <div className="mbu-form-field">
                            <label className="form-label">Seat Type</label>
                            <div className="mbu-simple-toggle">
                                <button type="button" className={rideType === RideType.SOLO ? 'active' : ''}
                                    onClick={() => setRideType(RideType.SOLO)} disabled={isBooked || bookingMode === 'shared'}>
                                    <i className="fas fa-user me-1"></i> Solo
                                </button>
                                <button type="button" className={rideType === RideType.SHARED ? 'active' : ''}
                                    onClick={() => setRideType(RideType.SHARED)} disabled={isBooked}>
                                    <i className="fas fa-users me-1"></i> Shared
                                </button>
                            </div>
                        </div>

                        <div className="mbu-form-field">
                            <label htmlFor="passengers" className="form-label">Passengers</label>
                            <select id="passengers" className="form-control" value={passengers}
                                onChange={(e) => setPassengers(Number(e.target.value))} disabled={isBooked}>
                                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>

                        <div className="mbu-form-field mbu-form-field-full">
                            <div className="mbu-fare-compare">
                                <div className="mbu-fare-compare-header">
                                    <span className="small fw-semibold">
                                        Estimated Fare
                                        {distanceKm > 0 && (
                                            <span className="text-muted fw-normal ms-1">
                                                · {distanceKm} km @ ₹10/km
                                            </span>
                                        )}
                                    </span>
                                    <button type="button" className="btn btn-link btn-sm p-0" onClick={onShowFare} disabled={isBooked}>Breakdown</button>
                                </div>
                                <div className="mbu-fare-options">
                                    <div className={`mbu-fare-option ${rideType === RideType.SOLO && bookingMode !== 'full' ? 'selected' : ''}`}>
                                        <span className="mbu-fare-option-label">Solo</span>
                                        <span className="mbu-fare-option-price">₹{soloFare?.totalFare.toFixed(0) || '—'}</span>
                                    </div>
                                    <div className={`mbu-fare-option ${rideType === RideType.SHARED ? 'selected' : ''}`}>
                                        <span className="mbu-fare-option-label">Shared</span>
                                        <span className="mbu-fare-option-price">₹{sharedFare?.totalFare.toFixed(0) || '—'}</span>
                                    </div>
                                    <div className={`mbu-fare-option ${bookingMode === 'full' ? 'selected' : ''}`}>
                                        <span className="mbu-fare-option-label">Full</span>
                                        <span className="mbu-fare-option-price">₹{fullAutoFare ?? '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mbu-form-field mbu-form-field-full">
                            <label htmlFor="fare-discount" className="form-label">
                                Reduce fare (up to ₹{maxFareDiscount})
                            </label>
                            <div className="mbu-fare-bargain">
                                <input
                                    id="fare-discount"
                                    type="range"
                                    className="form-range"
                                    min={0}
                                    max={maxFareDiscount}
                                    step={5}
                                    value={fareDiscount}
                                    onChange={(e) => setFareDiscount(Number(e.target.value))}
                                    disabled={isBooked}
                                />
                                <div className="mbu-fare-bargain-labels">
                                    <span>₹0</span>
                                    <span className="text-success fw-semibold">−₹{fareDiscount}</span>
                                    <span>₹{maxFareDiscount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mbu-form-field mbu-form-field-full mbu-form-actions">
                            <div className="mbu-fare-row">
                                <div>
                                    <span className="text-muted small">Your offer</span>
                                    {baseFareAmount != null && fareDiscount > 0 && (
                                        <div className="small text-muted text-decoration-line-through">₹{baseFareAmount}</div>
                                    )}
                                    <div className="small text-muted"><i className="fas fa-car-side me-1"></i>{NEARBY_AUTOS.length} autos nearby</div>
                                </div>
                                <span className="mbu-fare-amount">
                                    ₹{finalFareAmount ?? '—'}
                                </span>
                            </div>
                            <button type="button" className="mbu-btn-primary" onClick={onBook} disabled={loading || isBooked}>
                                {isBooked ? 'Ride Confirmed ✓' : loading ? 'Booking...' : noDriversAvailable ? 'Join Waitlist'
                                    : bookingMode === 'schedule' ? 'Schedule Ride' : 'Book Ride'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mbu-booking-map-card mbu-card p-0 overflow-hidden">
                    <div className="mbu-booking-map-header">
                        <h3 className="mbu-section-title mb-0">
                            <i className="fas fa-map me-2"></i>
                            {isBooked ? 'Confirmed Route' : 'Route Map'}
                        </h3>
                        {(routeEta || routeDistance) && (
                            <span className="mbu-route-meta small">
                                {routeDistance && <><i className="fas fa-road me-1"></i>{routeDistance}</>}
                                {routeEta && routeDistance && ' · '}
                                {routeEta && <><i className="fas fa-clock me-1"></i>{routeEta}</>}
                            </span>
                        )}
                    </div>
                    <div className="mbu-booking-map-wrap">
                        <RouteMap
                            originCoords={pickupCoords}
                            destinationCoords={destCoords}
                            pickupLabel={displayPickup}
                            destLabel={displayDest}
                            onRouteUpdate={handleRouteUpdate}
                        />
                    </div>
                    <div className="mbu-directions-panel">
                        <div className="mbu-directions-title">
                            <i className="fas fa-list-ul me-2"></i>Turn-by-turn directions
                        </div>
                        {routeSteps.length > 0 ? (
                            <>
                                {routeLoading && (
                                    <p className="mbu-directions-loading small text-muted px-3 mb-1">
                                        <i className="fas fa-spinner fa-spin me-1"></i> Refining road directions...
                                    </p>
                                )}
                                <ol className="mbu-directions-list">
                                    {routeSteps.map((step, index) => (
                                        <li key={`${step.instruction}-${index}`}>
                                            <span className="mbu-direction-text">{step.instruction}</span>
                                            {step.distance && <span className="mbu-direction-distance">{step.distance}</span>}
                                        </li>
                                    ))}
                                </ol>
                            </>
                        ) : routeLoading ? (
                            <p className="mbu-directions-loading small text-muted px-3 pb-2 mb-0">
                                <i className="fas fa-spinner fa-spin me-1"></i> Fetching road directions...
                            </p>
                        ) : (
                            <p className="mbu-directions-loading small text-muted px-3 pb-2 mb-0">
                                Directions unavailable for this route.
                            </p>
                        )}
                    </div>
                    <div className="mbu-map-route-labels px-3 py-2 small">
                        <span className="mbu-route-from">
                            <i className="fas fa-location-dot text-primary me-1"></i>
                            <strong>From:</strong> {displayPickup}
                        </span>
                        <i className="fas fa-arrow-right mx-2 text-muted"></i>
                        <span className="mbu-route-to">
                            <i className="fas fa-flag-checkered text-success me-1"></i>
                            <strong>To:</strong> {displayDest}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NearAutosSection: React.FC<{ onBook: () => void }> = ({ onBook }) => (
    <div>
        <h3 className="mbu-section-title"><i className="fas fa-car-side me-2"></i>Nearby Available Autos</h3>
        {NEARBY_AUTOS.map((auto) => (
            <div key={auto.id} className="mbu-auto-card mbu-card">
                <div className="mbu-avatar" style={{ width: 52, height: 52 }}>{auto.photoInitial}</div>
                <div className="flex-grow-1">
                    <strong>{auto.driverName}</strong>
                    <div className="small text-muted">⭐ {auto.rating} · {auto.plate} {auto.isEV && '· ⚡ EV'}</div>
                    <div className="small"><i className="fas fa-location-dot me-1"></i>{auto.distanceKm} km · ETA {auto.etaMin} min</div>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={onBook}>Book Now</button>
            </div>
        ))}
    </div>
);

export const ScheduledRidesSection: React.FC<SectionProps & { onScheduleNew: () => void; onOpenPlanner?: () => void }> = ({ ridePlans, recentRides, onScheduleNew, onOpenPlanner }) => {
    const scheduledRides = recentRides.filter((r) => r.bookingType === 'Scheduled');

    return (
        <div className="d-flex flex-column gap-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h3 className="mbu-section-title mb-0"><i className="fas fa-calendar-days me-2"></i>Scheduled Rides</h3>
                <div className="d-flex gap-2">
                    {onOpenPlanner && (
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onOpenPlanner}><i className="fas fa-brain me-1"></i> AI Planner</button>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" onClick={onScheduleNew}><i className="fas fa-plus me-1"></i> Schedule New</button>
                </div>
            </div>

            {ridePlans.length > 0 && (
                <div className="mbu-card">
                    <h4 className="fw-semibold mb-3">Recurring Plans</h4>
                    {ridePlans.map((plan) => (
                        <div key={plan.id} className="mbu-history-item">
                            <div>
                                <strong>{plan.forEvent}</strong>
                                <div className="small text-muted">{plan.day} at {plan.pickupTime} → {plan.destination}</div>
                                <div className="small text-primary">{plan.reason}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {scheduledRides.length > 0 ? (
                scheduledRides.map((ride) => (
                    <div key={ride.id} className="mbu-card">
                        <div className="d-flex justify-content-between">
                            <div>
                                <strong>{ride.pickup} → {ride.destination}</strong>
                                <div className="small text-muted">{ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleString() : new Date(ride.date).toLocaleString()}</div>
                            </div>
                            <span className="badge bg-primary">{ride.status}</span>
                        </div>
                    </div>
                ))
            ) : ridePlans.length === 0 ? (
                <div className="mbu-card mbu-empty">
                    <i className="fas fa-calendar d-block"></i>
                    <p>No scheduled rides. Plan your weekly campus commute!</p>
                    <button type="button" className="btn btn-primary mt-2" onClick={onScheduleNew}>Schedule a Ride</button>
                </div>
            ) : null}
        </div>
    );
};

export const RideHistorySection: React.FC<{ rides: Ride[] }> = ({ rides }) => (
    <div>
        <h3 className="mbu-section-title"><i className="fas fa-clock-rotate-left me-2"></i>Ride History</h3>
        <div className="mbu-card">
            {rides.length > 0 ? rides.map((ride) => (
                <div key={ride.id} className="mbu-history-item">
                    <div>
                        <strong>{ride.pickup}</strong> → {ride.destination}
                        <div className="small text-muted">{new Date(ride.date).toLocaleString()} · {ride.type}</div>
                        {ride.rating && <div className="small">Rated: {'⭐'.repeat(ride.rating)}</div>}
                    </div>
                    <div className="text-end">
                        <div className="fw-bold text-primary">₹{ride.fare.toFixed(2)}</div>
                        <span className={`badge ${ride.status === RideStatus.COMPLETED ? 'bg-success' : 'bg-danger'}`}>{ride.status}</span>
                        <button type="button" className="btn btn-link btn-sm d-block mt-1" onClick={() => window.print()}>Receipt</button>
                    </div>
                </div>
            )) : (
                <div className="mbu-empty"><i className="fas fa-receipt d-block"></i><p>Your ride history will appear here.</p></div>
            )}
        </div>
    </div>
);

export const EmergencySection: React.FC<{
    student: Student;
    onSos: () => void;
    onNavigateProfile: () => void;
}> = ({ student, onSos, onNavigateProfile }) => {
    const hasContact = !!(student.emergencyContact?.name && student.emergencyContact.phone);
    const [sharing, setSharing] = useState(false);
    const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
    const [shareStatus, setShareStatus] = useState<string | null>(null);
    const [shareError, setShareError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const stopSharing = useCallback(() => {
        if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setSharing(false);
    }, []);

    useEffect(() => () => stopSharing(), [stopSharing]);

    const handleShareLocation = async () => {
        setShareError(null);
        setShareStatus(null);

        if (!navigator.geolocation) {
            setShareError('Location services are not available on this device.');
            return;
        }

        const shareCurrentPosition = async (position: GeolocationPosition) => {
            const location: LiveLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                updatedAt: new Date(),
            };
            setLiveLocation(location);

            try {
                const result = await shareLiveLocation({
                    studentName: student.name,
                    location,
                    emergencyPhone: student.emergencyContact?.phone,
                });
                if (result === 'whatsapp') {
                    setShareStatus(hasContact
                        ? `Location sent to ${student.emergencyContact!.name} via WhatsApp.`
                        : 'Location shared via WhatsApp.');
                } else if (result === 'shared') {
                    setShareStatus('Location shared successfully.');
                } else {
                    setShareStatus('Location link copied to clipboard.');
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setShareError('Unable to share location. Please try again.');
                }
            }
        };

        if (!sharing) {
            setSharing(true);
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    setLiveLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        updatedAt: new Date(),
                    });
                },
                (err) => {
                    setShareError('Could not access your location. Check permissions and try again.');
                    stopSharing();
                },
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
            );
        }

        navigator.geolocation.getCurrentPosition(
            shareCurrentPosition,
            () => {
                setShareError('Could not access your location. Check permissions and try again.');
                stopSharing();
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
    };

    return (
        <div className="mbu-emergency-page">
            <div className="mbu-emergency-hero">
                <button type="button" className="mbu-sos-btn" onClick={onSos} aria-label="Emergency SOS">
                    <i className="fas fa-triangle-exclamation mbu-sos-btn-icon" aria-hidden="true"></i>
                    <span className="mbu-sos-btn-text">SOS</span>
                </button>
                <div className="mbu-emergency-hero-copy">
                    <h2 className="mbu-emergency-hero-title">Need help right now?</h2>
                    <p className="mbu-emergency-hero-desc">
                        Tap SOS to alert campus security and notify your emergency contact instantly.
                    </p>
                </div>
            </div>

            <p className="mbu-emergency-section-label">Quick help</p>

            <div className="mbu-emergency-wrap">
                <div className="mbu-emergency-grid">
                    <div className="mbu-card mbu-emergency-card">
                        <div className="mbu-emergency-card-head">
                            <div className="mbu-emergency-card-icon mbu-emergency-card-icon--primary">
                                <i className="fas fa-location-crosshairs" aria-hidden="true"></i>
                            </div>
                            <div className="mbu-emergency-card-head-text">
                                <h3 className="mbu-emergency-card-title">Share Location</h3>
                                <p className="mbu-emergency-card-desc">Share live GPS with contacts or apps.</p>
                            </div>
                        </div>
                        <div className="mbu-emergency-card-body">
                            <ul className="mbu-emergency-support-list">
                                <li><i className="fas fa-check" aria-hidden="true"></i> Emergency contact sharing</li>
                                <li><i className="fas fa-check" aria-hidden="true"></i> WhatsApp &amp; messaging apps</li>
                                <li><i className="fas fa-check" aria-hidden="true"></i> Live GPS updates</li>
                            </ul>
                            {sharing && (
                                <div className="mbu-live-share-badge">
                                    <i className="fas fa-circle" aria-hidden="true"></i>
                                    Live tracking on
                                </div>
                            )}
                            {liveLocation && (
                                <p className="mbu-emergency-location-line">
                                    {liveLocation.lat.toFixed(4)}, {liveLocation.lng.toFixed(4)}
                                    {liveLocation.accuracy ? ` · ±${Math.round(liveLocation.accuracy)}m` : ''}
                                </p>
                            )}
                            {shareStatus && (
                                <p className="mbu-emergency-alert mbu-emergency-alert--success">{shareStatus}</p>
                            )}
                            {shareError && (
                                <p className="mbu-emergency-alert mbu-emergency-alert--error">{shareError}</p>
                            )}
                        </div>
                        <div className="mbu-emergency-card-actions">
                            <button type="button" className="mbu-btn-primary mbu-emergency-btn mbu-emergency-btn--main" onClick={handleShareLocation}>
                                <i className="fas fa-share-nodes" aria-hidden="true"></i>
                                {sharing ? 'Share Again' : 'Share'}
                            </button>
                            {sharing && (
                                <button type="button" className="mbu-btn-outline mbu-emergency-btn" onClick={stopSharing}>
                                    Stop
                                </button>
                            )}
                            {liveLocation && (
                                <a
                                    href={getGoogleMapsUrl(liveLocation.lat, liveLocation.lng)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mbu-btn-outline mbu-emergency-btn"
                                >
                                    <i className="fas fa-map-location-dot" aria-hidden="true"></i>
                                    Maps
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="mbu-card mbu-emergency-card">
                        <div className="mbu-emergency-card-head">
                            <div className="mbu-emergency-card-icon mbu-emergency-card-icon--danger">
                                <i className="fas fa-phone-volume" aria-hidden="true"></i>
                            </div>
                            <div className="mbu-emergency-card-head-text">
                                <h3 className="mbu-emergency-card-title">Emergency Contact</h3>
                                <p className="mbu-emergency-card-desc">24/7 campus hotline for urgent help.</p>
                            </div>
                        </div>
                        <div className="mbu-emergency-card-body">
                            <div className="mbu-emergency-info-block">
                                <span className="mbu-emergency-contact-label">Campus hotline</span>
                                <p className="mbu-emergency-contact-name">{CAMPUS_EMERGENCY_CONTACT.name}</p>
                                <p className="mbu-emergency-phone">{formatIndianPhone(CAMPUS_EMERGENCY_CONTACT.phone)}</p>
                            </div>
                            {hasContact ? (
                                <div className="mbu-emergency-info-block">
                                    <span className="mbu-emergency-contact-label">Personal contact</span>
                                    <p className="mbu-emergency-contact-name">{student.emergencyContact!.name}</p>
                                    <p className="mbu-emergency-phone mbu-emergency-phone--sm">{student.emergencyContact!.phone}</p>
                                </div>
                            ) : (
                                <p className="mbu-emergency-personal-hint">No personal contact saved yet.</p>
                            )}
                        </div>
                        <div className="mbu-emergency-card-actions">
                            <a href={telHref(CAMPUS_EMERGENCY_CONTACT.phone)} className="mbu-btn-danger mbu-emergency-btn">
                                <i className="fas fa-phone" aria-hidden="true"></i>
                                Call Hotline
                            </a>
                            {hasContact ? (
                                <a href={telHref(student.emergencyContact!.phone)} className="mbu-btn-outline mbu-emergency-btn mbu-btn-outline--danger">
                                    <i className="fas fa-user-shield" aria-hidden="true"></i>
                                    Call Contact
                                </a>
                            ) : (
                                <button type="button" className="mbu-btn-outline mbu-emergency-btn" onClick={onNavigateProfile}>
                                    <i className="fas fa-user-plus" aria-hidden="true"></i>
                                    Add Contact
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mbu-card mbu-emergency-card">
                        <div className="mbu-emergency-card-head">
                            <div className="mbu-emergency-card-icon mbu-emergency-card-icon--primary">
                                <i className="fas fa-headset" aria-hidden="true"></i>
                            </div>
                            <div className="mbu-emergency-card-head-text">
                                <h3 className="mbu-emergency-card-title">Contact Admin</h3>
                                <p className="mbu-emergency-card-desc">Report ride issues or safety concerns.</p>
                            </div>
                        </div>
                        <div className="mbu-emergency-card-body">
                            <ul className="mbu-emergency-support-list">
                                <li><i className="fas fa-check" aria-hidden="true"></i> Lost items &amp; billing</li>
                                <li><i className="fas fa-check" aria-hidden="true"></i> Driver or route issues</li>
                                <li><i className="fas fa-check" aria-hidden="true"></i> Safety reports</li>
                            </ul>
                        </div>
                        <div className="mbu-emergency-card-actions">
                            <button type="button" className="mbu-btn-primary mbu-emergency-btn mbu-emergency-btn--main" onClick={onSos}>
                                <i className="fas fa-ticket" aria-hidden="true"></i>
                                Raise Ticket
                            </button>
                        </div>
                    </div>
                </div>

                {liveLocation && (
                    <div className="mbu-emergency-map-panel">
                        <div className="mbu-emergency-map-header">
                            <h3 className="mbu-emergency-map-title">
                                <i className="fas fa-map-pin" aria-hidden="true"></i>
                                Your live location
                            </h3>
                            <span className="mbu-emergency-map-updated">
                                Last updated {liveLocation.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="mbu-emergency-map-wrap">
                            <iframe
                                title="Your live location"
                                className="mbu-emergency-map-iframe"
                                src={buildLiveLocationEmbedUrl(liveLocation.lat, liveLocation.lng)}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}

                <div className="mbu-card mbu-emergency-safety">
                    <div className="mbu-emergency-safety-header">
                        <div className="mbu-emergency-card-icon mbu-emergency-card-icon--primary mbu-emergency-card-icon--sm">
                            <i className="fas fa-shield-halved" aria-hidden="true"></i>
                        </div>
                        <div>
                            <h3 className="mbu-emergency-card-title mb-0">Safety Guidelines</h3>
                            <p className="mbu-emergency-card-desc mb-0">Stay safe on every campus ride.</p>
                        </div>
                    </div>
                    <ul className="mbu-safety-list mbu-safety-list-grid">
                        <li><i className="fas fa-id-card" aria-hidden="true"></i> Verify the auto registration number before boarding</li>
                        <li><i className="fas fa-share-nodes" aria-hidden="true"></i> Share your trip details with a friend or family member</li>
                        <li><i className="fas fa-triangle-exclamation" aria-hidden="true"></i> Use SOS immediately if you feel unsafe — security is alerted</li>
                        <li><i className="fas fa-battery-full" aria-hidden="true"></i> Keep your phone charged, especially for late-night rides</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
