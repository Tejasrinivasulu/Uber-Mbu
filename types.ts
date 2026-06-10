

export enum UserRole {
  STUDENT = 'student',
  DRIVER = 'driver',
}

export interface User {
  uid: string;
  email: string | null;
  role: UserRole;
}

export enum RideType {
  SOLO = 'Solo',
  SHARED = 'Shared',
}

export enum RideStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string; // ISO string
  description: string;
}

export interface Ride {
  id: string;
  pickup: string;
  destination: string;
  type: RideType;
  fare: number;
  date: string; // This will now be the booking date
  status: RideStatus;
  groupSize?: number;
  driverId?: string | null;
  studentId: string;
  pickupCoords: Coordinates;
  destinationCoords: Coordinates;
  bookingType: 'ASAP' | 'Scheduled';
  scheduledTime?: string; // ISO string for scheduled rides
  co2Savings?: number; // in kg
  rating?: number;
  feedback?: string;
  bonus?: number; // For driver incentives
  completionDate?: string; // ISO string for when the ride was completed
  cancellationReason?: string;
}

export interface WaitlistItem {
  studentId: string;
  timestamp: number;
  rideDetails: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>
}

export interface ScheduledEvent {
  id: string;
  name: string;
  days: string[];
  time: string;
  location: string;
}

export interface RidePlan {
  id: string;
  day: string;
  pickupTime: string;
  destination: string;
  forEvent: string;
  reason: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Font Awesome icon class
}

export interface Student {
  name: string;
  role: UserRole.STUDENT;
  walletBalance: number;
  totalRides: number;
  sharedRides: number;
  savings: number;
  rating: number;
  activeRideId: string | null;
  recentRides?: { [rideId: string]: boolean };
  transactionHistory?: { [transactionId: string]: boolean };
  totalCo2Savings?: number; // in kg
  age?: string;
  gender?: string;
  mobileNumber?: string;
  photoURL?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  isOnWaitlist?: boolean;
  weeklySchedule?: { [eventId: string]: boolean };
  ridePlans?: { [planId: string]: boolean };
  achievements?: { [achievementId: string]: boolean };
}

export interface Driver {
  name: string;
  role: UserRole.DRIVER;
  isOnline: boolean;
  totalRides: number;
  earnings: number;
  onlineTime: string;
  rating: number;
  ratingCount?: number;
  currentRideId: string | null;
  location: Coordinates;
  weeklyEarnings: { day: string; earnings: number }[];
  isEV?: boolean;
  totalCo2Savings?: number; // in kg
  hasCompletedOnboarding: boolean;
  onboardingBonusAwarded?: boolean;
  vehicleDetails?: {
    make: string;
    model: string;
    licensePlate: string;
  };
  age?: string;
  gender?: string;
  mobileNumber?: string;
  photoURL?: string;
  isVerified?: boolean;
}

export interface FareBreakdownDetails {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  distanceKm: number;
  surgeMultiplier: number;
  surgeCharge: number;
  totalFare: number;
}