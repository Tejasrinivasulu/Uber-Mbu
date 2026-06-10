import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { getProfile } from '../../auth';
import { getAllRides } from '../../localStore';
import { getRouteInfo } from '../../ai/FareCalculator';
import { CAMPUS_STOPS } from '../../data/campusStops';
import { CAMPUS_EMERGENCY_CONTACT, formatIndianPhone, telHref } from '../../data/emergencyContacts';
import { shareLiveLocation, getGoogleMapsUrl, LiveLocation } from '../../utils/shareLocation';
import { buildLiveLocationEmbedUrl } from '../../components/RouteMap';
import DriverActiveMap, { DriverNavPhase } from '../../components/driver/DriverActiveMap';
import EarningsChart from '../../components/EarningsChart';
import {
    Driver, Ride, RideStatus, RideType, UserRole, Coordinates,
} from '../../types';
import { RouteStep } from '../../utils/routeService';
import type { DriverSection } from '../../components/driver/DriverLayout';

export type RidePhase = 'navigate_pickup' | 'arrived' | 'picked_up' | 'in_progress' | 'completed';

export interface DriverSectionProps {
    driver: Driver;
    authUid: string;
    activeRide: Ride | null;
    rideRequests: Ride[];
    allRides: Ride[];
    waitlist: { studentId: string; rideDetails: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'> }[];
    searchQuery: string;
    onNavigate: (section: DriverSection) => void;
    onToggleOnline: () => void;
    onAcceptRide: (rideId: string) => void;
    onRejectRide: (rideId: string) => void;
    onCompleteRide: () => void;
    onAcceptWaitlisted: (item: { studentId: string; rideDetails: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'> }) => void;
    ridePhase: RidePhase;
    onRidePhaseChange: (phase: RidePhase) => void;
    driverLocation: Coordinates;
    showNotification: (title: string, message: string) => void;
}

function getStudentInfo(studentId: string) {
    const student = getProfile(studentId, UserRole.STUDENT);
    return {
        name: student?.name ?? 'Student',
        id: studentId.slice(-6).toUpperCase(),
        phone: student?.mobileNumber || '—',
    };
}

function getRideTypeLabel(ride: Ride): { label: string; cls: string } {
    if (ride.bookingType === 'Scheduled') return { label: 'Scheduled Ride', cls: 'scheduled' };
    if (ride.type === RideType.SHARED) return { label: 'Shared Ride', cls: 'shared' };
    if (ride.groupSize && ride.groupSize >= 4) return { label: 'Full Auto', cls: 'full' };
    return { label: 'Instant Ride', cls: 'instant' };
}

function matchesSearch(ride: Ride, query: string): boolean {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const student = getStudentInfo(ride.studentId);
    return (
        ride.id.toLowerCase().includes(q)
        || ride.pickup.toLowerCase().includes(q)
        || ride.destination.toLowerCase().includes(q)
        || student.name.toLowerCase().includes(q)
        || student.id.toLowerCase().includes(q)
    );
}

function filterDriverRides(rides: Ride[], driverId: string): Ride[] {
    return rides.filter((r) => r.driverId === driverId);
}

function getDriverCompletedRides(driverId: string): Ride[] {
    return getAllRides().filter(
        (r) => r.driverId === driverId && r.status === RideStatus.COMPLETED,
    );
}

/** Rides this driver accepted (active or completed — not cancelled/rejected). */
function getDriverAcceptedRides(driverId: string): Ride[] {
    return getAllRides().filter(
        (r) => r.driverId === driverId
            && (r.status === RideStatus.ACTIVE || r.status === RideStatus.COMPLETED),
    );
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function buildWeeklyRideCounts(completedRides: Ride[]): { day: string; rides: number }[] {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const counts = Object.fromEntries(WEEK_DAYS.map((d) => [d, 0])) as Record<string, number>;

    for (const ride of completedRides) {
        if (!ride.completionDate) continue;
        const d = new Date(ride.completionDate);
        if (d.getTime() < weekAgo) continue;
        const day = DAY_NAMES[d.getDay()];
        counts[day] = (counts[day] || 0) + 1;
    }

    return WEEK_DAYS.map((day) => ({ day, rides: counts[day] || 0 }));
}

const PEAK_HOUR_SLOTS = [
    { hour: '6 AM', start: 5, end: 7 },
    { hour: '8 AM', start: 7, end: 9 },
    { hour: '10 AM', start: 9, end: 11 },
    { hour: '12 PM', start: 11, end: 13 },
    { hour: '2 PM', start: 13, end: 15 },
    { hour: '4 PM', start: 15, end: 17 },
    { hour: '6 PM', start: 17, end: 19 },
    { hour: '8 PM', start: 19, end: 21 },
    { hour: '10 PM', start: 21, end: 23 },
];

function buildPeakHoursFromRides(completedRides: Ride[]): { hour: string; rides: number }[] {
    return PEAK_HOUR_SLOTS.map(({ hour, start, end }) => ({
        hour,
        rides: completedRides.filter((ride) => {
            const raw = ride.completionDate || ride.date;
            if (!raw) return false;
            const h = new Date(raw).getHours();
            return h >= start && h < end;
        }).length,
    }));
}

function countCompletedToday(completedRides: Ride[]): number {
    const today = new Date().toDateString();
    return completedRides.filter(
        (r) => r.completionDate && new Date(r.completionDate).toDateString() === today,
    ).length;
}

function countCompletedThisWeek(completedRides: Ride[]): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return completedRides.filter(
        (r) => r.completionDate && new Date(r.completionDate).getTime() >= weekAgo,
    ).length;
}

function todayEarnings(rides: Ride[]): number {
    const today = new Date().toDateString();
    return rides
        .filter((r) => r.status === RideStatus.COMPLETED && r.completionDate && new Date(r.completionDate).toDateString() === today)
        .reduce((sum, r) => sum + r.fare, 0);
}

function weekEarnings(rides: Ride[]): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return rides
        .filter((r) => r.status === RideStatus.COMPLETED && r.completionDate && new Date(r.completionDate).getTime() >= weekAgo)
        .reduce((sum, r) => sum + r.fare, 0);
}

function monthEarnings(rides: Ride[]): number {
    const now = new Date();
    return rides
        .filter((r) => {
            if (r.status !== RideStatus.COMPLETED || !r.completionDate) return false;
            const d = new Date(r.completionDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, r) => sum + r.fare, 0);
}

const RouteVisual: React.FC<{ pickup: string; destination: string; distance: number; time: number }> = ({
    pickup, destination, distance, time,
}) => (
    <div className="mbu-driver-route-visual">
        <div className="mbu-driver-route-line">
            <div className="mbu-driver-route-dot"></div>
            <div className="mbu-driver-route-connector"></div>
            <div className="mbu-driver-route-dot dest"></div>
        </div>
        <div className="mbu-driver-route-points">
            <div className="mbu-driver-route-point">{pickup}</div>
            <div className="mbu-driver-route-point">{destination}</div>
            <div className="mbu-driver-route-meta">
                <i className="fas fa-road"></i>{distance} km · ~{time} min
            </div>
        </div>
    </div>
);

const OnlineToggle: React.FC<{ isOnline: boolean; onToggle: () => void }> = ({ isOnline, onToggle }) => (
    <div className="mbu-driver-online-toggle">
        <span className={`mbu-driver-status-dot ${isOnline ? 'online' : ''}`}></span>
        <span className="mbu-driver-status-label">{isOnline ? 'Online' : 'Offline'}</span>
        <label className="mbu-driver-switch">
            <input type="checkbox" checked={isOnline} onChange={onToggle} aria-label="Toggle online status" />
            <span className="mbu-driver-switch-slider"></span>
        </label>
    </div>
);

const PHASE_STEPS = [
    { key: 'navigate_pickup', label: 'To Pickup' },
    { key: 'arrived', label: 'Arrived' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'in_progress', label: 'En Route' },
] as const;

function phaseIndex(phase: RidePhase): number {
    if (phase === 'navigate_pickup') return 0;
    if (phase === 'arrived') return 1;
    if (phase === 'picked_up') return 2;
    return 3;
}

export const DriverHomeSection: React.FC<DriverSectionProps> = ({
    driver, authUid, rideRequests, allRides, activeRide, onNavigate, onToggleOnline,
}) => {
    const completedRides = getDriverCompletedRides(authUid);
    const acceptedRides = getDriverAcceptedRides(authUid);

    const stats = [
        { icon: 'fa-check-circle', color: '#059669', bg: 'rgba(5,150,105,0.1)', label: 'Rides Completed', value: completedRides.length },
        { icon: 'fa-handshake', color: '#0F766E', bg: 'rgba(15,118,110,0.1)', label: 'Rides Accepted', value: acceptedRides.length },
        { icon: 'fa-route', color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Completed Today', value: countCompletedToday(completedRides) },
        { icon: 'fa-indian-rupee-sign', color: '#D97706', bg: 'rgba(217,119,6,0.1)', label: "Today's Earnings", value: `₹${todayEarnings(completedRides)}` },
        { icon: 'fa-chart-line', color: '#6366F1', bg: 'rgba(99,102,241,0.1)', label: 'Weekly Completed', value: countCompletedThisWeek(completedRides) },
        { icon: 'fa-inbox', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', label: 'Pending Requests', value: rideRequests.length },
    ];

    return (
        <>
            <div className="mbu-driver-hero">
                <div className="mbu-driver-hero-content">
                    <h2>Welcome, {driver.name.split(' ')[0]}!</h2>
                    <div className="mbu-driver-hero-meta">
                        <span><i className="fas fa-car"></i> {driver.vehicleDetails?.licensePlate ?? 'Vehicle'}</span>
                        <span>·</span>
                        <span><i className="fas fa-star"></i> {driver.rating}</span>
                        {driver.isVerified && <span className="drv-verified"><i className="fas fa-check-circle me-1"></i>Verified</span>}
                    </div>
                </div>
                <OnlineToggle isOnline={driver.isOnline} onToggle={onToggleOnline} />
            </div>

            <div className="mbu-driver-stats">
                {stats.map((s) => (
                    <div key={s.label} className="mbu-driver-stat">
                        <div className="mbu-driver-stat-top">
                            <div className="mbu-driver-stat-icon" style={{ background: s.bg, color: s.color }}>
                                <i className={`fas ${s.icon}`}></i>
                            </div>
                        </div>
                        <div className="mbu-driver-stat-value">{s.value}</div>
                        <div className="mbu-driver-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="mbu-driver-card">
                <h3 className="mbu-driver-section-title"><i className="fas fa-bolt"></i>Quick Actions</h3>
                <div className="mbu-driver-actions">
                    <button type="button" className="mbu-driver-action-btn" onClick={onToggleOnline}>
                        <i className={`fas fa-${driver.isOnline ? 'pause' : 'play'}`}></i>
                        {driver.isOnline ? 'Go Offline' : 'Go Online'}
                    </button>
                    <button type="button" className="mbu-driver-action-btn" onClick={() => onNavigate('requests')}>
                        <i className="fas fa-inbox"></i>View Requests
                    </button>
                    <button type="button" className="mbu-driver-action-btn" onClick={() => onNavigate('active')} disabled={!activeRide}>
                        <i className="fas fa-taxi"></i>Active Ride
                    </button>
                    <button type="button" className="mbu-driver-action-btn" onClick={() => onNavigate('earnings')}>
                        <i className="fas fa-wallet"></i>Check Earnings
                    </button>
                </div>
            </div>
        </>
    );
};

export const DriverRequestsSection: React.FC<DriverSectionProps> = ({
    driver, rideRequests, waitlist, searchQuery, onAcceptRide, onRejectRide, onAcceptWaitlisted, showNotification,
}) => {
    const filtered = rideRequests.filter((r) => matchesSearch(r, searchQuery));

    return (
        <>
            {!driver.isOnline ? (
                <div className="mbu-driver-empty">
                    <div className="mbu-driver-empty-icon"><i className="fas fa-power-off"></i></div>
                    <p>Go online to receive ride requests.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="mbu-driver-empty">
                    <div className="mbu-driver-empty-icon"><i className="fas fa-inbox"></i></div>
                    <p>Waiting for new requests...</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {filtered.map((ride) => {
                        const student = getStudentInfo(ride.studentId);
                        const typeInfo = getRideTypeLabel(ride);
                        const route = getRouteInfo(ride.pickup, ride.destination);
                        return (
                            <div key={ride.id} className="mbu-driver-request-card">
                                <div className="mbu-driver-request-header">
                                    <div>
                                        <span className={`mbu-driver-ride-type ${typeInfo.cls}`}>{typeInfo.label}</span>
                                        <div className="mbu-driver-request-student">{student.name}</div>
                                        <div className="mbu-driver-request-id">ID #{student.id}</div>
                                    </div>
                                    <div className="mbu-driver-fare">₹{ride.fare}</div>
                                </div>
                                <RouteVisual pickup={ride.pickup} destination={ride.destination} distance={route.distance} time={route.time} />
                                <div className="mbu-driver-request-actions">
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-accept" onClick={() => onAcceptRide(ride.id)}>
                                        <i className="fas fa-check"></i> Accept
                                    </button>
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-decline" onClick={() => onRejectRide(ride.id)}>
                                        <i className="fas fa-times"></i> Reject
                                    </button>
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-outline" onClick={() => showNotification('Call', `Calling ${student.name}...`)}>
                                        <i className="fas fa-phone"></i> Call
                                    </button>
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-outline" onClick={() => showNotification('Message', `Messaging ${student.name}...`)}>
                                        <i className="fas fa-comment"></i> Message
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {driver.isOnline && waitlist.length > 0 && (
                <div className="mt-4">
                    <h3 className="mbu-driver-section-title"><i className="fas fa-list"></i>Waitlist</h3>
                    <div className="d-flex flex-column gap-3">
                        {waitlist.map((item) => (
                            <div key={item.studentId} className="mbu-driver-request-card">
                                <RouteVisual
                                    pickup={item.rideDetails.pickup}
                                    destination={item.rideDetails.destination}
                                    distance={getRouteInfo(item.rideDetails.pickup, item.rideDetails.destination).distance}
                                    time={getRouteInfo(item.rideDetails.pickup, item.rideDetails.destination).time}
                                />
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <span className="mbu-driver-fare mbu-driver-fare-sm">₹{item.rideDetails.fare.toFixed(0)}</span>
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-accept" onClick={() => onAcceptWaitlisted(item)}>
                                        Accept Waitlisted
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export const DriverActiveSection: React.FC<DriverSectionProps> = ({
    activeRide, ridePhase, onRidePhaseChange, onCompleteRide, driverLocation, showNotification,
}) => {
    const [routeEta, setRouteEta] = useState<string | null>(null);
    const [routeDistance, setRouteDistance] = useState<string | null>(null);
    const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
    const [nextTurn, setNextTurn] = useState<string | null>(null);

    if (!activeRide) {
        return (
            <div className="mbu-driver-empty">
                <div className="mbu-driver-empty-icon"><i className="fas fa-taxi"></i></div>
                <p>No active ride. Accept a request to start navigation.</p>
            </div>
        );
    }

    const student = getStudentInfo(activeRide.studentId);
    const typeInfo = getRideTypeLabel(activeRide);
    const route = getRouteInfo(activeRide.pickup, activeRide.destination);
    const navPhase: DriverNavPhase = ridePhase === 'picked_up' || ridePhase === 'in_progress' ? 'to_destination' : 'to_pickup';
    const currentPhaseIdx = phaseIndex(ridePhase);

    const handleRouteUpdate = (eta: string | null, distance: string | null, steps?: RouteStep[], turn?: string) => {
        setRouteEta(eta);
        setRouteDistance(distance);
        setRouteSteps(steps ?? []);
        setNextTurn(turn ?? null);
    };

    const statusLabel = {
        navigate_pickup: 'En route to pickup',
        arrived: 'Arrived at pickup',
        picked_up: 'Student picked up',
        in_progress: 'Ride in progress',
        completed: 'Completed',
    }[ridePhase];

    return (
        <>
            <div className="mbu-driver-phase-stepper">
                {PHASE_STEPS.map((step, idx) => (
                    <div
                        key={step.key}
                        className={`mbu-driver-phase-step${idx < currentPhaseIdx ? ' done' : ''}${idx === currentPhaseIdx ? ' active' : ''}`}
                    >
                        <div className="mbu-driver-phase-dot">
                            {idx < currentPhaseIdx ? <i className="fas fa-check"></i> : idx + 1}
                        </div>
                        <div className="mbu-driver-phase-label">{step.label}</div>
                    </div>
                ))}
            </div>

            <div className="mbu-driver-active-grid">
                <div className="mbu-driver-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className={`mbu-driver-ride-type ${typeInfo.cls}`}>{typeInfo.label}</span>
                        <span className="mbu-driver-status-pill">{statusLabel}</span>
                    </div>

                    <div className="mbu-driver-ride-detail-row">
                        <span>Ride ID</span>
                        <strong>{activeRide.id.slice(-8).toUpperCase()}</strong>
                    </div>
                    <div className="mbu-driver-ride-detail-row">
                        <span>Student</span>
                        <strong>{student.name} (#{student.id})</strong>
                    </div>
                    <div className="mbu-driver-ride-detail-row">
                        <span>Contact</span>
                        <strong>{student.phone}</strong>
                    </div>
                    <div className="mbu-driver-ride-detail-row">
                        <span>Pickup</span>
                        <strong>{activeRide.pickup}</strong>
                    </div>
                    <div className="mbu-driver-ride-detail-row">
                        <span>Drop</span>
                        <strong>{activeRide.destination}</strong>
                    </div>
                    <div className="mbu-driver-ride-detail-row">
                        <span>Distance</span>
                        <strong>{route.distance} km</strong>
                    </div>
                    <div className="mbu-driver-ride-detail-row">
                        <span>Duration</span>
                        <strong>~{route.time} min</strong>
                    </div>
                    <div className="mbu-driver-ride-detail-row">
                        <span>Fare</span>
                        <strong style={{ color: 'var(--drv-primary)', fontSize: '1.125rem' }}>₹{activeRide.fare}</strong>
                    </div>

                    <div className="mbu-driver-ride-controls">
                        {ridePhase === 'navigate_pickup' && (
                            <>
                                <button type="button" className="mbu-driver-btn mbu-driver-btn-primary" onClick={() => onRidePhaseChange('arrived')}>
                                    <i className="fas fa-location-dot"></i> Arrived at Pickup
                                </button>
                                <a href={getGoogleMapsUrl(activeRide.pickupCoords.lat, activeRide.pickupCoords.lng)} target="_blank" rel="noopener noreferrer" className="mbu-driver-btn mbu-driver-btn-outline">
                                    <i className="fas fa-diamond-turn-right"></i> Open in Maps
                                </a>
                            </>
                        )}
                        {ridePhase === 'arrived' && (
                            <button type="button" className="mbu-driver-btn mbu-driver-btn-primary" onClick={() => onRidePhaseChange('picked_up')}>
                                <i className="fas fa-user-check"></i> Student Picked Up
                            </button>
                        )}
                        {(ridePhase === 'picked_up' || ridePhase === 'in_progress') && (
                            <>
                                <button type="button" className="mbu-driver-btn mbu-driver-btn-primary" onClick={() => onRidePhaseChange('in_progress')}>
                                    <i className="fas fa-play"></i> Start Ride
                                </button>
                                <button type="button" className="mbu-driver-btn mbu-driver-btn-accept" onClick={onCompleteRide}>
                                    <i className="fas fa-flag-checkered"></i> Complete Ride
                                </button>
                            </>
                        )}
                        <button type="button" className="mbu-driver-btn mbu-driver-btn-decline" onClick={() => showNotification('Cancel', 'Contact support to cancel this ride.')}>
                            Cancel Ride
                        </button>
                    </div>
                </div>

                <div>
                    <DriverActiveMap
                        driverCoords={driverLocation}
                        pickupCoords={activeRide.pickupCoords}
                        destinationCoords={activeRide.destinationCoords}
                        pickupLabel={activeRide.pickup}
                        destLabel={activeRide.destination}
                        phase={navPhase}
                        onRouteUpdate={handleRouteUpdate}
                    />

                    <div className="mbu-driver-route-panel">
                        <div className="mbu-driver-route-panel-title">Route Information</div>
                        <div className="mbu-driver-route-stats">
                            {routeDistance && <span><i className="fas fa-road"></i>{routeDistance}</span>}
                            {routeEta && <span><i className="fas fa-clock"></i>{routeEta}</span>}
                            <span><i className="fas fa-route"></i>{navPhase === 'to_pickup' ? 'You → Pickup' : 'Pickup → Destination'}</span>
                        </div>
                        {nextTurn && (
                            <p className="mb-2 small" style={{ margin: '0 0 0.5rem' }}><strong>Next turn:</strong> {nextTurn}</p>
                        )}
                        {routeSteps.length > 0 && (
                            <ol className="mbu-driver-directions-list">
                                {routeSteps.slice(0, 6).map((step, i) => (
                                    <li key={`${step.instruction}-${i}`}><strong>{step.instruction}</strong>{step.distance && ` · ${step.distance}`}</li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export const DriverScheduledSection: React.FC<DriverSectionProps> = ({
    searchQuery, onAcceptRide, onRejectRide,
}) => {
    const scheduled = useMemo(() =>
        getAllRides().filter(
            (r) => r.bookingType === 'Scheduled'
                && r.status === RideStatus.PENDING
                && matchesSearch(r, searchQuery),
        ).sort((a, b) => new Date(a.scheduledTime || a.date).getTime() - new Date(b.scheduledTime || b.date).getTime()),
    [searchQuery]);

    return (
        <>
            {scheduled.length === 0 ? (
                <div className="mbu-driver-empty">
                    <div className="mbu-driver-empty-icon"><i className="fas fa-calendar"></i></div>
                    <p>No upcoming scheduled bookings.</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {scheduled.map((ride) => {
                        const student = getStudentInfo(ride.studentId);
                        const route = getRouteInfo(ride.pickup, ride.destination);
                        return (
                            <div key={ride.id} className="mbu-driver-request-card">
                                <div className="mbu-driver-request-header">
                                    <div>
                                        <div className="mbu-driver-request-student">{student.name}</div>
                                        <div className="mbu-driver-request-id">
                                            <i className="fas fa-clock me-1"></i>
                                            {ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleString() : 'TBD'}
                                        </div>
                                    </div>
                                    <div className="mbu-driver-fare mbu-driver-fare-sm">₹{ride.fare}</div>
                                </div>
                                <RouteVisual pickup={ride.pickup} destination={ride.destination} distance={route.distance} time={route.time} />
                                <div className="mbu-driver-request-actions">
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-accept" onClick={() => onAcceptRide(ride.id)}>Accept</button>
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-outline">View Details</button>
                                    <button type="button" className="mbu-driver-btn mbu-driver-btn-decline" onClick={() => onRejectRide(ride.id)}>Cancel</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export const DriverEarningsSection: React.FC<DriverSectionProps> = ({ driver, authUid, allRides }) => {
    const completed = getDriverCompletedRides(authUid);
    const accepted = getDriverAcceptedRides(authUid);
    const rideCountData = buildWeeklyRideCounts(completed);
    const peakHoursData = buildPeakHoursFromRides(completed);
    const hasPeakData = peakHoursData.some((slot) => slot.rides > 0);

    return (
        <>
            <div className="mbu-driver-ride-count-summary">
                <div className="mbu-driver-ride-count-pill accepted">
                    <span className="label">Rides Accepted</span>
                    <span className="value">{accepted.length}</span>
                </div>
                <div className="mbu-driver-ride-count-pill completed">
                    <span className="label">Rides Completed</span>
                    <span className="value">{completed.length}</span>
                </div>
            </div>

            <div className="mbu-driver-earnings-grid">
                <div className="mbu-driver-earnings-card highlight">
                    <div className="mbu-driver-stat-label">Today's Earnings</div>
                    <div className="mbu-driver-stat-value">₹{todayEarnings(completed)}</div>
                </div>
                <div className="mbu-driver-earnings-card">
                    <div className="mbu-driver-stat-label">Weekly</div>
                    <div className="mbu-driver-stat-value">₹{weekEarnings(completed) || driver.weeklyEarnings.reduce((s, d) => s + d.earnings, 0)}</div>
                </div>
                <div className="mbu-driver-earnings-card">
                    <div className="mbu-driver-stat-label">Monthly</div>
                    <div className="mbu-driver-stat-value">₹{monthEarnings(completed)}</div>
                </div>
                <div className="mbu-driver-earnings-card">
                    <div className="mbu-driver-stat-label">Total</div>
                    <div className="mbu-driver-stat-value">₹{driver.earnings}</div>
                </div>
            </div>

            <div className="row g-3 mb-3">
                <div className="col-lg-6">
                    <div className="mbu-driver-card">
                        <h4 className="mbu-driver-chart-title">Earnings Chart</h4>
                        <div className="mbu-driver-chart-wrap">
                            <EarningsChart data={driver.weeklyEarnings} />
                        </div>
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="mbu-driver-card">
                        <h4 className="mbu-driver-chart-title">Ride Count <span className="mbu-driver-chart-sub">(completed · last 7 days)</span></h4>
                        <div className="mbu-driver-chart-wrap">
                            {completed.length === 0 ? (
                                <p className="text-muted small mb-0 d-flex align-items-center justify-content-center h-100">No completed rides yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={rideCountData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value: number) => [`${value} ride${value === 1 ? '' : 's'}`, 'Completed']} />
                                        <Bar dataKey="rides" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mbu-driver-card mb-3">
                <h4 className="mbu-driver-chart-title">Peak Booking Hours <span className="mbu-driver-chart-sub">(from completed rides)</span></h4>
                <div className="mbu-driver-chart-wrap" style={{ height: 200 }}>
                    {!hasPeakData ? (
                        <p className="text-muted small mb-0 d-flex align-items-center justify-content-center h-100">Complete rides to see peak hours.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={peakHoursData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: number) => [`${value} ride${value === 1 ? '' : 's'}`, 'Completed']} />
                                <Line type="monotone" dataKey="rides" name="Completed" stroke="#0F766E" strokeWidth={2} dot={{ fill: '#0F766E' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="mbu-driver-card">
                <h4 className="mbu-driver-chart-title">Recent Transactions</h4>
                {completed.length === 0 ? (
                    <p className="text-muted small mb-0">No transactions yet.</p>
                ) : (
                    completed.slice(0, 8).map((ride) => (
                        <div key={ride.id} className="mbu-driver-txn-row">
                            <div>
                                <div className="fw-bold">{getStudentInfo(ride.studentId).name}</div>
                                <div className="small text-muted">{ride.id.slice(-8)} · {ride.completionDate ? new Date(ride.completionDate).toLocaleDateString() : '—'}</div>
                            </div>
                            <div className="text-end">
                                <div className="fw-bold" style={{ color: 'var(--drv-primary)' }}>₹{ride.fare}</div>
                                <span className="mbu-driver-badge-paid">Paid</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

type HistoryFilter = 'today' | 'week' | 'month' | 'all';

export const DriverHistorySection: React.FC<DriverSectionProps> = ({ authUid, allRides, searchQuery }) => {
    const [filter, setFilter] = useState<HistoryFilter>('all');
    const driverRides = getDriverCompletedRides(authUid);

    const filtered = driverRides.filter((ride) => {
        if (!matchesSearch(ride, searchQuery)) return false;
        if (!ride.completionDate) return filter === 'all';
        const d = new Date(ride.completionDate);
        const now = new Date();
        if (filter === 'today') return d.toDateString() === now.toDateString();
        if (filter === 'week') return d.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
    });

    return (
        <>
            <div className="mbu-driver-filters">
                {(['today', 'week', 'month', 'all'] as HistoryFilter[]).map((f) => (
                    <button key={f} type="button" className={`mbu-driver-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
                    </button>
                ))}
            </div>
            {filtered.length === 0 ? (
                <div className="mbu-driver-empty">
                    <div className="mbu-driver-empty-icon"><i className="fas fa-history"></i></div>
                    <p>No completed trips found.</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {filtered.map((ride) => {
                        const route = getRouteInfo(ride.pickup, ride.destination);
                        return (
                            <div key={ride.id} className="mbu-driver-request-card">
                                <div className="mbu-driver-request-header">
                                    <div>
                                        <div className="mbu-driver-request-student">{getStudentInfo(ride.studentId).name}</div>
                                        <div className="mbu-driver-request-id">
                                            {ride.completionDate ? new Date(ride.completionDate).toLocaleString() : '—'}
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="mbu-driver-fare mbu-driver-fare-sm">₹{ride.fare}</div>
                                        <div className="small text-muted">{route.distance} km</div>
                                    </div>
                                </div>
                                <RouteVisual pickup={ride.pickup} destination={ride.destination} distance={route.distance} time={route.time} />
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export const DriverEmergencySection: React.FC<DriverSectionProps> = ({ driver, showNotification }) => {
    const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
    const [sharing, setSharing] = useState(false);
    const watchRef = React.useRef<number | null>(null);

    const startSharing = () => {
        if (!navigator.geolocation) {
            showNotification('Error', 'Geolocation not supported.');
            return;
        }
        setSharing(true);
        watchRef.current = navigator.geolocation.watchPosition(
            (pos) => setLiveLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                updatedAt: new Date(),
            }),
            () => showNotification('Error', 'Could not get location.'),
            { enableHighAccuracy: true },
        );
    };

    const stopSharing = () => {
        if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
        setSharing(false);
    };

    const handleShare = async () => {
        if (!liveLocation) startSharing();
        const loc = liveLocation ?? { lat: driver.location.lat, lng: driver.location.lng, updatedAt: new Date() };
        try {
            await shareLiveLocation({ studentName: driver.name, location: loc });
            showNotification('Shared', 'Live location shared.');
        } catch {
            showNotification('Cancelled', 'Share cancelled.');
        }
    };

    return (
        <div className="d-flex flex-column align-items-center gap-4">
            <button type="button" className="mbu-driver-sos-btn" onClick={() => showNotification('SOS', 'Emergency alert sent to admin and campus security.')}>
                SOS
            </button>

            <div className="mbu-driver-emergency-wrap w-100">
                <div className="mbu-driver-emergency-grid">
                    <div className="mbu-driver-card text-center">
                        <i className="fas fa-location-share fa-2x mb-2" style={{ color: 'var(--drv-primary)' }}></i>
                        <h5 className="mb-2">Share Live Location</h5>
                        <p className="small text-muted mb-3">Share your GPS with admin or emergency contacts.</p>
                        <button type="button" className="mbu-driver-btn mbu-driver-btn-primary mbu-driver-btn-sm" onClick={handleShare}>
                            {sharing ? 'Share Again' : 'Share Now'}
                        </button>
                        {sharing && (
                            <button type="button" className="mbu-driver-btn mbu-driver-btn-outline mbu-driver-btn-sm ms-2" onClick={stopSharing}>Stop</button>
                        )}
                        {liveLocation && (
                            <div className="mt-3 mbu-driver-map-wrap" style={{ height: 200 }}>
                                <iframe title="Live location" className="w-100 h-100 border-0" src={buildLiveLocationEmbedUrl(liveLocation.lat, liveLocation.lng)} />
                            </div>
                        )}
                    </div>
                    <div className="mbu-driver-card text-center">
                        <i className="fas fa-phone-volume fa-2x mb-2" style={{ color: 'var(--drv-danger)' }}></i>
                        <h5 className="mb-2">Emergency Contact</h5>
                        <p className="mb-1"><strong>{CAMPUS_EMERGENCY_CONTACT.name}</strong></p>
                        <p className="text-muted mb-3">{formatIndianPhone(CAMPUS_EMERGENCY_CONTACT.phone)}</p>
                        <a href={telHref(CAMPUS_EMERGENCY_CONTACT.phone)} className="mbu-driver-btn mbu-driver-btn-decline mbu-driver-btn-sm">Quick Call</a>
                    </div>
                </div>

                <div className="mbu-driver-emergency-pair">
                    <div className="mbu-driver-card text-center">
                        <i className="fas fa-headset fa-2x mb-2" style={{ color: 'var(--drv-primary)' }}></i>
                        <h5 className="mb-2">Contact Admin</h5>
                        <p className="small text-muted mb-3">Get help from MBUGO support team.</p>
                        <button type="button" className="mbu-driver-btn mbu-driver-btn-outline mbu-driver-btn-sm" onClick={() => showNotification('Support', 'Support ticket raised. Admin will contact you shortly.')}>
                            Raise Ticket
                        </button>
                    </div>
                    <div className="mbu-driver-card">
                        <div className="text-center">
                            <i className="fas fa-book fa-2x mb-2" style={{ color: 'var(--drv-primary)' }}></i>
                            <h5 className="mb-2">Safety Guidelines</h5>
                        </div>
                        <ul className="mbu-driver-safety-list">
                            <li><i className="fas fa-id-card"></i> Verify student ID before pickup</li>
                            <li><i className="fas fa-gauge-high"></i> Follow campus speed limits</li>
                            <li><i className="fas fa-triangle-exclamation"></i> Use SOS for emergencies</li>
                            <li><i className="fas fa-file-lines"></i> Keep vehicle documents ready</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mbu-driver-card w-100 mbu-driver-emergency-wrap">
                <h5 className="mbu-driver-chart-title">Supported Stops</h5>
                <div className="d-flex flex-wrap gap-2">
                    {CAMPUS_STOPS.map((s) => (
                        <span key={s.id} className="mbu-driver-stop-badge">{s.name}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const DriverVehiclePanel: React.FC<{ driver: Driver; onClose: () => void }> = ({ driver, onClose }) => (
    <div className="mbu-driver-modal-backdrop" onClick={onClose} role="presentation">
        <div className="mbu-driver-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="vehicle-modal-title">
            <div className="mbu-driver-modal-header">
                <h3 className="mbu-driver-section-title mb-0" id="vehicle-modal-title"><i className="fas fa-car"></i>Vehicle Details</h3>
                <button type="button" className="mbu-driver-modal-close" onClick={onClose} aria-label="Close">
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <div className="mbu-driver-ride-detail-row"><span>Make</span><strong>{driver.vehicleDetails?.make ?? '—'}</strong></div>
            <div className="mbu-driver-ride-detail-row"><span>Model</span><strong>{driver.vehicleDetails?.model ?? '—'}</strong></div>
            <div className="mbu-driver-ride-detail-row"><span>License Plate</span><strong>{driver.vehicleDetails?.licensePlate ?? '—'}</strong></div>
            <div className="mbu-driver-ride-detail-row"><span>Type</span><strong>{driver.isEV ? 'Electric (EV)' : 'Auto'}</strong></div>
        </div>
    </div>
);
