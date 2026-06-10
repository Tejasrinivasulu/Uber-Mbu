import { Driver, Student, User, UserRole } from './types';

const SESSION_KEY = 'automate_session';
const ACCOUNTS_KEY = 'automate_accounts';
const STUDENT_PROFILES_KEY = 'automate_student_profiles';
const DRIVER_PROFILES_KEY = 'automate_driver_profiles';

export const DEMO_PASSWORD = 'password';

export const DEMO_ACCOUNTS = {
    student: {
        uid: 'demo-student',
        email: 'student@test.com',
        password: DEMO_PASSWORD,
        role: UserRole.STUDENT,
        name: 'Demo Student',
    },
    driver: {
        uid: 'demo-driver',
        email: 'driver@test.com',
        password: DEMO_PASSWORD,
        role: UserRole.DRIVER,
        name: 'Demo Driver',
    },
} as const;

interface StoredAccount {
    uid: string;
    email: string;
    password: string;
    role: UserRole;
}

function emailToKey(email: string): string {
    return email.toLowerCase().replace(/\./g, ',');
}

function readJson<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeJson(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
}

function getAccounts(): Record<string, StoredAccount> {
    return readJson<Record<string, StoredAccount>>(ACCOUNTS_KEY, {});
}

function saveAccounts(accounts: Record<string, StoredAccount>): void {
    writeJson(ACCOUNTS_KEY, accounts);
}

function getStudentProfiles(): Record<string, Student> {
    return readJson<Record<string, Student>>(STUDENT_PROFILES_KEY, {});
}

function saveStudentProfiles(profiles: Record<string, Student>): void {
    writeJson(STUDENT_PROFILES_KEY, profiles);
}

function getDriverProfiles(): Record<string, Driver> {
    return readJson<Record<string, Driver>>(DRIVER_PROFILES_KEY, {});
}

function saveDriverProfiles(profiles: Record<string, Driver>): void {
    writeJson(DRIVER_PROFILES_KEY, profiles);
}

function buildStudentProfile(name: string, overrides: Partial<Student> = {}): Student {
    return {
        name,
        role: UserRole.STUDENT,
        walletBalance: 500,
        totalRides: 3,
        sharedRides: 1,
        savings: 45,
        rating: 5.0,
        activeRideId: null,
        transactionHistory: {},
        totalCo2Savings: 2.5,
        age: '20',
        gender: '',
        mobileNumber: '',
        photoURL: '',
        emergencyContact: { name: '', phone: '' },
        isOnWaitlist: false,
        weeklySchedule: {},
        ridePlans: {},
        achievements: {},
        ...overrides,
    };
}

function buildDriverProfile(name: string, overrides: Partial<Driver> = {}): Driver {
    return {
        name,
        role: UserRole.DRIVER,
        isOnline: false,
        totalRides: 12,
        earnings: 1850,
        onlineTime: '24h 30m',
        rating: 4.8,
        ratingCount: 10,
        currentRideId: null,
        location: { lat: 13.6288, lng: 79.4192 },
        weeklyEarnings: [
            { day: 'Mon', earnings: 320 },
            { day: 'Tue', earnings: 280 },
            { day: 'Wed', earnings: 410 },
            { day: 'Thu', earnings: 350 },
            { day: 'Fri', earnings: 490 },
        ],
        isEV: true,
        totalCo2Savings: 18,
        hasCompletedOnboarding: true,
        onboardingBonusAwarded: true,
        isVerified: true,
        vehicleDetails: {
            make: 'Tata',
            model: 'Nexon EV',
            licensePlate: 'KA-01-DEMO',
        },
        age: '28',
        gender: '',
        mobileNumber: '',
        photoURL: '',
        ...overrides,
    };
}

export function ensureDemoAccounts(): void {
    const accounts = getAccounts();
    const students = getStudentProfiles();
    const drivers = getDriverProfiles();
    let changed = false;

    for (const demo of Object.values(DEMO_ACCOUNTS)) {
        const emailKey = emailToKey(demo.email);
        if (!accounts[emailKey]) {
            accounts[emailKey] = {
                uid: demo.uid,
                email: demo.email,
                password: demo.password,
                role: demo.role,
            };
            changed = true;
        }
        if (demo.role === UserRole.STUDENT && !students[demo.uid]) {
            students[demo.uid] = buildStudentProfile(demo.name);
            changed = true;
        }
        if (demo.role === UserRole.DRIVER && !drivers[demo.uid]) {
            drivers[demo.uid] = buildDriverProfile(demo.name);
            changed = true;
        }
    }

    if (changed) {
        saveAccounts(accounts);
        saveStudentProfiles(students);
        saveDriverProfiles(drivers);
    }
}

export function getSession(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export function saveSession(user: User): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

export function getProfile(uid: string, role: UserRole): Student | Driver | null {
    if (role === UserRole.STUDENT) {
        return getStudentProfiles()[uid] ?? null;
    }
    return getDriverProfiles()[uid] ?? null;
}

export function saveProfile(uid: string, role: UserRole, profile: Student | Driver): void {
    if (role === UserRole.STUDENT) {
        const profiles = getStudentProfiles();
        profiles[uid] = profile as Student;
        saveStudentProfiles(profiles);
        return;
    }
    const profiles = getDriverProfiles();
    profiles[uid] = profile as Driver;
    saveDriverProfiles(profiles);
}

export function updateProfile(uid: string, role: UserRole, data: Partial<Student> | Partial<Driver>): Student | Driver | null {
    const existing = getProfile(uid, role);
    if (!existing) return null;
    const updated = { ...existing, ...data } as Student | Driver;
    saveProfile(uid, role, updated);
    return updated;
}

export async function signIn(email: string, password: string): Promise<User> {
    ensureDemoAccounts();

    const emailKey = emailToKey(email);
    const account = getAccounts()[emailKey];
    if (!account) {
        throw new Error('No account found with this email.');
    }
    if (account.password !== password) {
        throw new Error('Invalid password.');
    }
    const user: User = { uid: account.uid, email: account.email, role: account.role };
    saveSession(user);
    return user;
}

export async function signUp(name: string, email: string, password: string, role: UserRole): Promise<User> {
    ensureDemoAccounts();

    const normalizedEmail = email.toLowerCase();
    const emailKey = emailToKey(normalizedEmail);
    const accounts = getAccounts();
    if (accounts[emailKey]) {
        throw new Error('An account with this email already exists.');
    }

    const uid = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    accounts[emailKey] = { uid, email: normalizedEmail, password, role };
    saveAccounts(accounts);

    if (role === UserRole.STUDENT) {
        saveProfile(uid, role, buildStudentProfile(name, {
            walletBalance: 0,
            totalRides: 0,
            sharedRides: 0,
            savings: 0,
            totalCo2Savings: 0,
            age: '',
        }));
    } else {
        saveProfile(uid, role, buildDriverProfile(name, {
            totalRides: 0,
            earnings: 0,
            onlineTime: '0h 0m',
            ratingCount: 0,
            weeklyEarnings: [],
            isEV: Math.random() < 0.3,
            totalCo2Savings: 0,
            hasCompletedOnboarding: false,
            onboardingBonusAwarded: false,
            isVerified: false,
            vehicleDetails: undefined,
            age: '',
        }));
    }

    const user: User = { uid, email: normalizedEmail, role };
    saveSession(user);
    return user;
}

export async function signInAsDemo(role: UserRole): Promise<User> {
    ensureDemoAccounts();
    const demo = role === UserRole.STUDENT ? DEMO_ACCOUNTS.student : DEMO_ACCOUNTS.driver;
    return signIn(demo.email, demo.password);
}
