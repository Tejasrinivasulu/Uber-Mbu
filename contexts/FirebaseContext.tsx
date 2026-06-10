
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    getSession, clearSession, signIn, signUp, signInAsDemo, ensureDemoAccounts,
    getProfile, updateProfile,
} from '../auth';
import {
    subscribeToStore, bookRide as storeBookRide, joinWaitlist as storeJoinWaitlist,
    leaveWaitlist as storeLeaveWaitlist, acceptWaitlistedRide as storeAcceptWaitlistedRide,
    addFundsToWallet as storeAddFunds, saveWeeklySchedule, saveRidePlan, deleteRidePlan,
    cancelRide as storeCancelRide, acceptRideRequest, declineRideRequest,
    completeRide as storeCompleteRide, submitDriverRating,
    getFilteredRideRequests, getWaitlist, getCompletedRides, getRecentRidesForStudent,
    getTransactionsForStudent, getScheduledEventsForStudent, getRidePlansForStudent,
    getActiveRideForUser, getDriverProfile,
} from '../localStore';
import { User, Student, Driver, Ride, UserRole, Transaction, ScheduledEvent, RidePlan, WaitlistItem } from '../types';
import { useNotification } from './NotificationContext';

type ViewType = 'dashboard' | 'profile' | 'wallet' | 'scheduler' | 'heatmap';

interface FirebaseContextState {
    authUser: User | null;
    student: Student | null;
    driver: Driver | null;
    activeRide: Ride | null;
    driverForRide: Driver | null;
    rideRequests: Ride[];
    recentRides: Ride[];
    allRides: Ride[];
    waitlist: WaitlistItem[];
    transactionHistory: Transaction[];
    weeklySchedule: ScheduledEvent[];
    ridePlans: RidePlan[];
    loading: boolean;
    isOnline: boolean;
    view: ViewType;
    setView: (view: ViewType) => void;
    bookRide: (details: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>) => void;
    joinWaitlist: (details: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>) => void;
    leaveWaitlist: () => void;
    acceptWaitlistedRide: (waitlistItem: WaitlistItem) => void;
    addFundsToWallet: (amount: number) => Promise<void>;
    updateWeeklySchedule: (events: ScheduledEvent[]) => Promise<void>;
    acceptRidePlan: (plan: Omit<RidePlan, 'id'>) => Promise<void>;
    removeRidePlan: (planId: string) => Promise<void>;
    cancelRide: (reason: string) => void;
    toggleDriverStatus: () => void;
    handleRideRequest: (rideId: string, accepted: boolean) => void;
    completeRide: () => void;
    submitRating: (rideId: string, driverId: string, rating: number, feedback: string) => void;
    completeDriverOnboarding: (vehicleDetails: { make: string; model: string; licensePlate: string; }) => Promise<void>;
    updateUserProfile: (newData: Partial<Student> | Partial<Driver>, newProfilePicFile?: File | null) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    loginAsDemo: (role: UserRole) => Promise<void>;
    signUp: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => void;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [driverForRide, setDriverForRide] = useState<Driver | null>(null);
    const [rideRequests, setRideRequests] = useState<Ride[]>([]);
    const [recentRides, setRecentRides] = useState<Ride[]>([]);
    const [allRides, setAllRides] = useState<Ride[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
    const [weeklySchedule, setWeeklySchedule] = useState<ScheduledEvent[]>([]);
    const [ridePlans, setRidePlans] = useState<RidePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [view, setView] = useState<ViewType>('dashboard');
    const { showNotification } = useNotification();

    const refreshData = useCallback(() => {
        setRideRequests(getFilteredRideRequests());
        setWaitlist(getWaitlist());
        setAllRides(getCompletedRides());

        if (!authUser) return;

        if (authUser.role === UserRole.STUDENT) {
            const studentProfile = getProfile(authUser.uid, UserRole.STUDENT) as Student | null;
            if (studentProfile) {
                setStudent(studentProfile);
                setRecentRides(getRecentRidesForStudent(authUser.uid));
                setTransactionHistory(getTransactionsForStudent(studentProfile));
                setWeeklySchedule(getScheduledEventsForStudent(studentProfile));
                setRidePlans(getRidePlansForStudent(studentProfile));

                const ride = getActiveRideForUser(studentProfile, null);
                setActiveRide(ride);
                setDriverForRide(ride?.driverId ? getDriverProfile(ride.driverId) : null);
            }
            setDriver(null);
        } else {
            const driverProfile = getProfile(authUser.uid, UserRole.DRIVER) as Driver | null;
            if (driverProfile) {
                setDriver(driverProfile);
                const ride = getActiveRideForUser(null, driverProfile);
                setActiveRide(ride);
                setDriverForRide(ride?.driverId ? getDriverProfile(ride.driverId) : driverProfile);
            }
            setStudent(null);
        }
    }, [authUser]);

    const processBookingQueue = useCallback(() => {
        if (!authUser || authUser.role !== UserRole.STUDENT) return;
        const queuedBookingsRaw = localStorage.getItem('bookingQueue');
        if (!queuedBookingsRaw) return;

        const queuedBookings: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>[] = JSON.parse(queuedBookingsRaw);
        if (queuedBookings.length === 0) return;

        showNotification('Back Online!', `Booking your ${queuedBookings.length} queued ride(s)...`);
        queuedBookings.forEach((rideDetails) => storeBookRide(rideDetails, authUser.uid));
        localStorage.removeItem('bookingQueue');
        refreshData();
        showNotification('Success!', 'Your queued ride has been booked.');
    }, [authUser, showNotification, refreshData]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processBookingQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [processBookingQueue]);

    const loadUserFromSession = useCallback((session: User) => {
        const profile = getProfile(session.uid, session.role);
        if (!profile) {
            clearSession();
            setAuthUser(null);
            setStudent(null);
            setDriver(null);
            return;
        }

        setAuthUser(session);
        if (session.role === UserRole.STUDENT) {
            setStudent(profile as Student);
            setDriver(null);
        } else {
            setDriver(profile as Driver);
            setStudent(null);
        }
    }, []);

    useEffect(() => {
        ensureDemoAccounts();
        const session = getSession();
        if (session) loadUserFromSession(session);
        setLoading(false);
    }, [loadUserFromSession]);

    useEffect(() => {
        if (!authUser) return;
        refreshData();
        const unsubscribe = subscribeToStore(refreshData);
        const handleStorage = () => refreshData();
        window.addEventListener('storage', handleStorage);
        return () => {
            unsubscribe();
            window.removeEventListener('storage', handleStorage);
        };
    }, [authUser, refreshData]);

    const bookRide = useCallback(async (details: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>) => {
        if (!authUser || authUser.role !== UserRole.STUDENT) return;

        if (!isOnline) {
            const queue = JSON.parse(localStorage.getItem('bookingQueue') || '[]');
            queue.push(details);
            localStorage.setItem('bookingQueue', JSON.stringify(queue));
            showNotification('You are offline', 'Ride booking queued. It will be sent upon reconnection.');
            return;
        }

        storeBookRide(details, authUser.uid);
        refreshData();
        showNotification('Ride Booked', 'Looking for a nearby driver...');
    }, [authUser, isOnline, showNotification, refreshData]);

    const joinWaitlist = useCallback(async (details: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>) => {
        if (!authUser || authUser.role !== UserRole.STUDENT) return;
        storeJoinWaitlist(details, authUser.uid);
        refreshData();
        showNotification('Added to Waitlist', 'We will find a driver for you shortly!');
    }, [authUser, showNotification, refreshData]);

    const leaveWaitlist = useCallback(async () => {
        if (!authUser || authUser.role !== UserRole.STUDENT) return;
        storeLeaveWaitlist(authUser.uid);
        refreshData();
        showNotification('Removed from Waitlist', 'You have left the waitlist.');
    }, [authUser, showNotification, refreshData]);

    const acceptWaitlistedRide = async (waitlistItem: WaitlistItem) => {
        if (!authUser || authUser.role !== UserRole.DRIVER || driver?.currentRideId) {
            showNotification('Error', 'Cannot accept ride now.');
            return;
        }
        storeAcceptWaitlistedRide(waitlistItem, authUser.uid);
        refreshData();
        showNotification('Ride Started', 'You have accepted the ride for the waitlisted student.');
    };

    const addFundsToWallet = async (amount: number) => {
        if (!authUser || !student) throw new Error('User not authenticated or not a student.');
        storeAddFunds(authUser.uid, amount);
        refreshData();
        showNotification('Funds Added', `₹${amount.toFixed(2)} added to your wallet.`);
    };

    const updateWeeklySchedule = async (events: ScheduledEvent[]) => {
        if (!authUser || authUser.role !== UserRole.STUDENT) return;
        const saved = saveWeeklySchedule(authUser.uid, events);
        setWeeklySchedule(saved);
        refreshData();
        showNotification('Schedule Saved', 'Your weekly schedule has been updated.');
    };

    const acceptRidePlan = async (plan: Omit<RidePlan, 'id'>) => {
        if (!authUser || authUser.role !== UserRole.STUDENT) return;
        saveRidePlan(authUser.uid, plan);
        refreshData();
        showNotification('Plan Saved', `Recurring ride for ${plan.forEvent} has been saved.`);
    };

    const removeRidePlan = async (planId: string) => {
        if (!authUser || authUser.role !== UserRole.STUDENT) return;
        deleteRidePlan(authUser.uid, planId);
        refreshData();
        showNotification('Plan Removed', 'The recurring ride plan has been deleted.');
    };

    const cancelRide = (reason: string) => {
        if (!student?.activeRideId || !authUser) return;
        storeCancelRide(student.activeRideId, authUser.uid, reason, activeRide?.driverId);
        refreshData();
        showNotification('Ride Cancelled', 'Your ride has been cancelled.');
    };

    const toggleDriverStatus = async () => {
        if (!driver || !authUser || authUser.role !== UserRole.DRIVER) return;
        const updated = updateProfile(authUser.uid, UserRole.DRIVER, { isOnline: !driver.isOnline });
        if (updated) setDriver(updated as Driver);
        refreshData();
        showNotification(
            updated?.isOnline ? 'You are Online' : 'You are Offline',
            updated?.isOnline ? 'You can now receive ride requests.' : 'You will not receive new requests.'
        );
    };

    const handleRideRequest = (rideId: string, accepted: boolean) => {
        if (!authUser || authUser.role !== UserRole.DRIVER || driver?.currentRideId) return;

        if (accepted) {
            acceptRideRequest(rideId, authUser.uid);
            refreshData();
            showNotification('Ride Accepted', 'Head to the pickup location.');
        } else {
            declineRideRequest(rideId);
            refreshData();
        }
    };

    const completeRide = async () => {
        if (!driver?.currentRideId || !activeRide || !authUser) return;
        storeCompleteRide(driver.currentRideId, authUser.uid, showNotification);
        refreshData();
        showNotification('Ride Completed', 'Payment processed and ride marked complete.');
    };

    const submitRating = async (rideId: string, driverId: string, rating: number, feedback: string) => {
        if (!authUser || authUser.role !== UserRole.STUDENT) {
            showNotification('Error', 'Only students can rate rides.');
            return;
        }
        try {
            submitDriverRating(rideId, driverId, rating, feedback);
            refreshData();
            showNotification('Feedback Received', 'Thank you for rating your ride!');
        } catch (error) {
            console.error('Error submitting rating:', error);
            showNotification('Error', 'Failed to submit rating. Please try again.');
        }
    };

    const completeDriverOnboarding = async (vehicleDetails: { make: string; model: string; licensePlate: string; }) => {
        if (!authUser || authUser.role !== UserRole.DRIVER) return;
        const updated = updateProfile(authUser.uid, UserRole.DRIVER, {
            hasCompletedOnboarding: true,
            vehicleDetails,
            isVerified: true,
        });
        if (updated) setDriver(updated as Driver);
        refreshData();
        showNotification('Onboarding Complete', 'You are ready to start driving!');
    };

    const updateUserProfile = async (newData: Partial<Student> | Partial<Driver>, newProfilePicFile?: File | null) => {
        if (!authUser) throw new Error('You must be logged in to update your profile.');

        const dataToUpdate = { ...newData };
        if (newProfilePicFile) {
            dataToUpdate.photoURL = URL.createObjectURL(newProfilePicFile);
        }

        const updated = updateProfile(authUser.uid, authUser.role, dataToUpdate);
        if (updated) {
            if (authUser.role === UserRole.STUDENT) setStudent(updated as Student);
            else setDriver(updated as Driver);
        }
        refreshData();
        showNotification('Success', 'Profile updated successfully!');
    };

    const login = async (email: string, password: string) => {
        const user = await signIn(email, password);
        setView('dashboard');
        loadUserFromSession(user);
    };

    const loginAsDemoUser = async (role: UserRole) => {
        const user = await signInAsDemo(role);
        setView('dashboard');
        loadUserFromSession(user);
    };

    const signUpUser = async (name: string, email: string, password: string, role: UserRole) => {
        const user = await signUp(name, email, password, role);
        setView('dashboard');
        loadUserFromSession(user);
    };

    const logout = () => {
        clearSession();
        setAuthUser(null);
        setStudent(null);
        setDriver(null);
        setActiveRide(null);
        setDriverForRide(null);
        setRideRequests([]);
        setRecentRides([]);
        setTransactionHistory([]);
        setView('dashboard');
    };

    const value = {
        authUser,
        student,
        driver,
        activeRide,
        driverForRide,
        rideRequests,
        recentRides,
        allRides,
        waitlist,
        transactionHistory,
        weeklySchedule,
        ridePlans,
        loading,
        isOnline,
        view,
        setView,
        bookRide,
        joinWaitlist,
        leaveWaitlist,
        acceptWaitlistedRide,
        addFundsToWallet,
        updateWeeklySchedule,
        acceptRidePlan,
        removeRidePlan,
        cancelRide,
        toggleDriverStatus,
        handleRideRequest,
        completeRide,
        submitRating,
        completeDriverOnboarding,
        updateUserProfile,
        login,
        loginAsDemo: loginAsDemoUser,
        signUp: signUpUser,
        logout,
    };

    return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};
