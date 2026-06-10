import { achievementsList } from './data/achievements';
import { getProfile, updateProfile } from './auth';
import {
    Driver,
    Ride,
    RidePlan,
    RideStatus,
    RideType,
    ScheduledEvent,
    Student,
    Transaction,
    UserRole,
    WaitlistItem,
} from './types';
import { calculateDriverBonus } from './ai/EcoNudgeEngine';

const KEYS = {
    rides: 'automate_rides',
    rideRequests: 'automate_ride_requests',
    waitlist: 'automate_waitlist',
    transactions: 'automate_transactions',
    scheduledEvents: 'automate_scheduled_events',
    ridePlans: 'automate_ride_plans',
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToStore(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notify(): void {
    listeners.forEach((listener) => listener());
}

function readMap<T>(key: string): Record<string, T> {
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
        return {};
    }
}

function writeMap<T>(key: string, data: Record<string, T>): void {
    localStorage.setItem(key, JSON.stringify(data));
    notify();
}

export function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getAllRides(): Ride[] {
    return Object.values(readMap<Ride>(KEYS.rides));
}

export function getRide(id: string): Ride | null {
    return readMap<Ride>(KEYS.rides)[id] ?? null;
}

function saveRide(ride: Ride): void {
    const rides = readMap<Ride>(KEYS.rides);
    rides[ride.id] = ride;
    writeMap(KEYS.rides, rides);
}

function updateRide(id: string, updates: Partial<Ride>): Ride | null {
    const rides = readMap<Ride>(KEYS.rides);
    if (!rides[id]) return null;
    rides[id] = { ...rides[id], ...updates };
    writeMap(KEYS.rides, rides);
    return rides[id];
}

function getRideRequestsMap(): Record<string, Ride> {
    return readMap<Ride>(KEYS.rideRequests);
}

function saveRideRequest(ride: Ride): void {
    const requests = getRideRequestsMap();
    requests[ride.id] = ride;
    writeMap(KEYS.rideRequests, requests);
}

function removeRideRequest(id: string): void {
    const requests = getRideRequestsMap();
    delete requests[id];
    writeMap(KEYS.rideRequests, requests);
}

export function getFilteredRideRequests(): Ride[] {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    return Object.values(getRideRequestsMap()).filter((ride) => {
        if (ride.status !== RideStatus.PENDING) return false;
        if (ride.bookingType === 'ASAP') return true;
        if (ride.bookingType === 'Scheduled' && ride.scheduledTime) {
            const scheduledDateTime = new Date(ride.scheduledTime);
            return scheduledDateTime <= thirtyMinutesFromNow && scheduledDateTime >= now;
        }
        return false;
    });
}

export function getWaitlist(): WaitlistItem[] {
    const data = readMap<{ rideDetails: WaitlistItem['rideDetails']; timestamp: number }>(KEYS.waitlist);
    return Object.keys(data)
        .map((studentId) => ({ studentId, ...data[studentId] }))
        .sort((a, b) => a.timestamp - b.timestamp);
}

function saveTransaction(transaction: Transaction): void {
    const transactions = readMap<Transaction>(KEYS.transactions);
    transactions[transaction.id] = transaction;
    writeMap(KEYS.transactions, transactions);
}

export function getTransactionsForStudent(student: Student): Transaction[] {
    const ids = student.transactionHistory || {};
    const all = readMap<Transaction>(KEYS.transactions);
    return Object.keys(ids)
        .map((id) => all[id])
        .filter(Boolean)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getScheduledEventsForStudent(student: Student): ScheduledEvent[] {
    const ids = student.weeklySchedule || {};
    const all = readMap<ScheduledEvent>(KEYS.scheduledEvents);
    return Object.keys(ids).map((id) => all[id]).filter(Boolean);
}

export function getRidePlansForStudent(student: Student): RidePlan[] {
    const ids = student.ridePlans || {};
    const all = readMap<RidePlan>(KEYS.ridePlans);
    return Object.keys(ids).map((id) => all[id]).filter(Boolean);
}

export function getRecentRidesForStudent(studentId: string): Ride[] {
    return getAllRides()
        .filter(
            (ride) =>
                ride.studentId === studentId &&
                (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getCompletedRides(): Ride[] {
    return getAllRides().filter((ride) => ride.status === RideStatus.COMPLETED);
}

export function bookRide(
    details: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>,
    studentId: string
): Ride {
    const ride: Ride = {
        ...details,
        id: generateId('ride'),
        studentId,
        date: new Date().toISOString(),
        status: RideStatus.PENDING,
    };

    saveRide(ride);
    saveRideRequest(ride);
    updateProfile(studentId, UserRole.STUDENT, { activeRideId: ride.id });
    return ride;
}

export function joinWaitlist(
    details: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>,
    studentId: string
): void {
    const waitlist = readMap<{ rideDetails: WaitlistItem['rideDetails']; timestamp: number }>(KEYS.waitlist);
    waitlist[studentId] = { rideDetails: details, timestamp: Date.now() };
    writeMap(KEYS.waitlist, waitlist);
    updateProfile(studentId, UserRole.STUDENT, { isOnWaitlist: true });
}

export function leaveWaitlist(studentId: string): void {
    const waitlist = readMap<{ rideDetails: WaitlistItem['rideDetails']; timestamp: number }>(KEYS.waitlist);
    delete waitlist[studentId];
    writeMap(KEYS.waitlist, waitlist);
    updateProfile(studentId, UserRole.STUDENT, { isOnWaitlist: false });
}

export function acceptWaitlistedRide(waitlistItem: WaitlistItem, driverId: string): Ride {
    const { studentId, rideDetails } = waitlistItem;
    leaveWaitlist(studentId);

    const ride: Ride = {
        ...rideDetails,
        id: generateId('ride'),
        studentId,
        date: new Date().toISOString(),
        status: RideStatus.ACTIVE,
        driverId,
    };

    saveRide(ride);
    updateProfile(studentId, UserRole.STUDENT, { activeRideId: ride.id, isOnWaitlist: false });
    updateProfile(driverId, UserRole.DRIVER, { currentRideId: ride.id });
    return ride;
}

export function addFundsToWallet(studentId: string, amount: number): Transaction {
    const student = getProfile(studentId, UserRole.STUDENT) as Student | null;
    if (!student) throw new Error('Student not found');

    const transaction: Transaction = {
        id: generateId('txn'),
        type: 'credit',
        amount,
        date: new Date().toISOString(),
        description: 'Funds added to wallet',
    };

    saveTransaction(transaction);
    updateProfile(studentId, UserRole.STUDENT, {
        walletBalance: student.walletBalance + amount,
        transactionHistory: {
            ...(student.transactionHistory || {}),
            [transaction.id]: true,
        },
    });

    return transaction;
}

export function saveWeeklySchedule(studentId: string, events: ScheduledEvent[]): ScheduledEvent[] {
    const allEvents = readMap<ScheduledEvent>(KEYS.scheduledEvents);
    const links: Record<string, boolean> = {};

    const savedEvents = events.map((event) => {
        const eventId = event.id?.startsWith('event-') ? event.id : generateId('event');
        const saved = { ...event, id: eventId };
        allEvents[eventId] = saved;
        links[eventId] = true;
        return saved;
    });

    writeMap(KEYS.scheduledEvents, allEvents);
    updateProfile(studentId, UserRole.STUDENT, { weeklySchedule: links });
    return savedEvents;
}

export function saveRidePlan(studentId: string, plan: Omit<RidePlan, 'id'>): RidePlan {
    const planId = generateId('plan');
    const newPlan: RidePlan = { ...plan, id: planId };
    const allPlans = readMap<RidePlan>(KEYS.ridePlans);
    allPlans[planId] = newPlan;
    writeMap(KEYS.ridePlans, allPlans);

    const student = getProfile(studentId, UserRole.STUDENT) as Student;
    updateProfile(studentId, UserRole.STUDENT, {
        ridePlans: { ...(student.ridePlans || {}), [planId]: true },
    });

    return newPlan;
}

export function deleteRidePlan(studentId: string, planId: string): void {
    const allPlans = readMap<RidePlan>(KEYS.ridePlans);
    delete allPlans[planId];
    writeMap(KEYS.ridePlans, allPlans);

    const student = getProfile(studentId, UserRole.STUDENT) as Student;
    const ridePlans = { ...(student.ridePlans || {}) };
    delete ridePlans[planId];
    updateProfile(studentId, UserRole.STUDENT, { ridePlans });
}

export function cancelRide(rideId: string, studentId: string, reason: string, driverId?: string | null): void {
    updateRide(rideId, { status: RideStatus.CANCELLED, cancellationReason: reason });
    removeRideRequest(rideId);
    updateProfile(studentId, UserRole.STUDENT, { activeRideId: null });
    if (driverId) {
        updateProfile(driverId, UserRole.DRIVER, { currentRideId: null });
    }
}

export function acceptRideRequest(rideId: string, driverId: string): Ride | null {
    const ride = getRide(rideId);
    if (!ride) return null;

    removeRideRequest(rideId);
    const updated = updateRide(rideId, { status: RideStatus.ACTIVE, driverId });
    updateProfile(driverId, UserRole.DRIVER, { currentRideId: rideId });
    return updated;
}

export function declineRideRequest(rideId: string): void {
    removeRideRequest(rideId);
}

function awardAchievements(studentId: string, completedRide: Ride, onUnlock: (title: string, name: string) => void): void {
    const student = getProfile(studentId, UserRole.STUDENT) as Student | null;
    if (!student) return;

    const achievements = { ...(student.achievements || {}) };

    if (!achievements['first-ride']) {
        achievements['first-ride'] = true;
        onUnlock('Achievement Unlocked!', achievementsList.find((a) => a.id === 'first-ride')!.name);
    }

    if (!achievements['ten-rides'] && student.totalRides >= 10) {
        achievements['ten-rides'] = true;
        onUnlock('Achievement Unlocked!', achievementsList.find((a) => a.id === 'ten-rides')!.name);
    }

    if (!achievements['five-shared'] && completedRide.type === RideType.SHARED && (student.sharedRides || 0) >= 5) {
        achievements['five-shared'] = true;
        onUnlock('Achievement Unlocked!', achievementsList.find((a) => a.id === 'five-shared')!.name);
    }

    const rideHour = new Date(completedRide.date).getHours();
    if (!achievements['night-ride'] && (rideHour >= 22 || rideHour < 5)) {
        achievements['night-ride'] = true;
        onUnlock('Achievement Unlocked!', achievementsList.find((a) => a.id === 'night-ride')!.name);
    }

    updateProfile(studentId, UserRole.STUDENT, { achievements });
}

export function completeRide(
    rideId: string,
    driverId: string,
    onUnlock: (title: string, name: string) => void
): void {
    const ride = getRide(rideId);
    const driver = getProfile(driverId, UserRole.DRIVER) as Driver | null;
    const student = ride ? (getProfile(ride.studentId, UserRole.STUDENT) as Student | null) : null;

    if (!ride || !driver || !student) return;

    const completionTime = new Date();
    const { bonus: regularBonus, co2Savings } = calculateDriverBonus(ride, driver, completionTime);

    let totalBonus = regularBonus;
    let onboardingBonusAwarded = driver.onboardingBonusAwarded || false;

    if (!driver.onboardingBonusAwarded && driver.totalRides + 1 >= 10) {
        totalBonus += 250;
        onboardingBonusAwarded = true;
        onUnlock('Bonus Unlocked!', 'You earned a ₹250 sign-up bonus!');
    }

    updateRide(rideId, {
        status: RideStatus.COMPLETED,
        completionDate: completionTime.toISOString(),
        co2Savings,
        bonus: totalBonus,
    });

    const debitTransaction: Transaction = {
        id: generateId('txn'),
        type: 'debit',
        amount: ride.fare,
        date: completionTime.toISOString(),
        description: `Ride to ${ride.destination}`,
    };
    saveTransaction(debitTransaction);

    updateProfile(ride.studentId, UserRole.STUDENT, {
        activeRideId: null,
        walletBalance: student.walletBalance - ride.fare,
        totalRides: student.totalRides + 1,
        sharedRides: ride.type === RideType.SHARED ? (student.sharedRides || 0) + 1 : student.sharedRides,
        totalCo2Savings: (student.totalCo2Savings || 0) + co2Savings,
        recentRides: { ...(student.recentRides || {}), [rideId]: true },
        transactionHistory: { ...(student.transactionHistory || {}), [debitTransaction.id]: true },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = dayNames[completionTime.getDay()];
    const weeklyEarnings = [...(driver.weeklyEarnings || [])];
    const dayIndex = weeklyEarnings.findIndex((entry) => entry.day === today);
    const earned = ride.fare + totalBonus;

    if (dayIndex >= 0) {
        weeklyEarnings[dayIndex] = { ...weeklyEarnings[dayIndex], earnings: weeklyEarnings[dayIndex].earnings + earned };
    } else {
        weeklyEarnings.push({ day: today, earnings: earned });
    }

    updateProfile(driverId, UserRole.DRIVER, {
        currentRideId: null,
        earnings: driver.earnings + earned,
        totalRides: driver.totalRides + 1,
        totalCo2Savings: (driver.totalCo2Savings || 0) + co2Savings,
        onboardingBonusAwarded,
        weeklyEarnings,
    });

    awardAchievements(ride.studentId, ride, onUnlock);
}

export function submitDriverRating(
    rideId: string,
    driverId: string,
    rating: number,
    feedback: string
): void {
    const driver = getProfile(driverId, UserRole.DRIVER) as Driver | null;
    if (!driver) throw new Error('Driver not found');

    const ratingCount = driver.ratingCount || 0;
    const newRatingCount = ratingCount + 1;
    const newAverageRating = ((driver.rating * ratingCount) + rating) / newRatingCount;

    updateProfile(driverId, UserRole.DRIVER, {
        rating: parseFloat(newAverageRating.toFixed(2)),
        ratingCount: newRatingCount,
    });

    const rideUpdates: Partial<Ride> = { rating };
    if (feedback) rideUpdates.feedback = feedback;
    updateRide(rideId, rideUpdates);
}

export function getActiveRideForUser(student: Student | null, driver: Driver | null): Ride | null {
    const rideId = student?.activeRideId || driver?.currentRideId;
    if (!rideId) return null;

    const ride = getRide(rideId);
    if (!ride) return null;

    if ([RideStatus.ACTIVE, RideStatus.PENDING, RideStatus.CONFIRMED].includes(ride.status)) {
        return ride;
    }
    return null;
}

export function getDriverProfile(driverId: string): Driver | null {
    return getProfile(driverId, UserRole.DRIVER) as Driver | null;
}
