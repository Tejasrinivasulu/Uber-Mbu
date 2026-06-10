
import { Ride, RideType, FareBreakdownDetails } from '../types';

// Mock historical data for popular routes (distance in km, time in minutes)
const historicalRouteData: { [key: string]: { distance: number; time: number } } = {
    "MBU Main Gate_Tirupati Railway Station": { distance: 8, time: 30 },
    "Hostel Block C_Tirupati Railway Station": { distance: 9, time: 23 },
    "MBU Main Gate_Central Mall": { distance: 12, time: 30 },
    "Library_City Bus Stand": { distance: 10, time: 25 },
    "Admin Block_PVR Cinemas": { distance: 13, time: 33 },
    "default": { distance: 9, time: 22 } // Fallback for other routes
};

const RATE_PER_KM = 10; // ₹10 per km
const RATE_PER_MINUTE = 1; // ₹1 per minute
const MAX_SURGE_MULTIPLIER = 1.5; // Capped at 1.5x

export const getRouteInfo = (pickup: string, destination: string): { distance: number; time: number } => {
    const routeKey = `${pickup}_${destination}`;
    const reverseRouteKey = `${destination}_${pickup}`;
    return historicalRouteData[routeKey] || historicalRouteData[reverseRouteKey] || historicalRouteData.default;
};

export const getRouteDistanceKm = (pickup: string, destination: string): number => {
    return getRouteInfo(pickup, destination).distance;
};

/** Longer routes allow students to negotiate up to ₹40 off; shorter routes up to ₹20. */
export const getMaxFareDiscount = (distanceKm: number): number => {
    if (distanceKm <= 7) return 20;
    if (distanceKm <= 11) return 30;
    return 40;
};

/**
 * Calculates the surge multiplier based on the time of day, with a hard cap.
 * @param date The date/time of the ride.
 * @returns A surge multiplier (e.g., 1.0 for no surge, 1.5 for 50% surge).
 */
const getSurgeMultiplier = (date: Date): number => {
    const hour = date.getHours();
    let surge = 1.0;
    // Peak hours: 8-10 AM, 5-7 PM
    if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 19)) {
        surge = 1.3; // 30% surge
    }
    // Late night hours: 10 PM - 5 AM
    if (hour >= 22 || hour < 5) {
        surge = 1.8; // Potential 80% surge
    }
    // Apply the cap
    return Math.min(surge, MAX_SURGE_MULTIPLIER);
};

/**
 * Calculates the estimated fare for a given ride.
 * @param rideDetails Partial details of the ride being booked.
 * @returns A detailed breakdown of the calculated fare.
 */
export const calculateFare = (
    rideDetails: Pick<Ride, 'pickup' | 'destination' | 'type' | 'scheduledTime'>
): FareBreakdownDetails => {
    const { pickup, destination, type, scheduledTime } = rideDetails;

    // 1. Determine Base Fare
    const baseFare = type === RideType.SOLO ? 40 : 25;

    // 2. Get Route Data from historical records
    const routeKey = `${pickup}_${destination}`;
    const reverseRouteKey = `${destination}_${pickup}`;
    const routeInfo = historicalRouteData[routeKey] || historicalRouteData[reverseRouteKey] || historicalRouteData.default;
    const distanceCharge = routeInfo.distance * RATE_PER_KM;
    const timeCharge = routeInfo.time * RATE_PER_MINUTE;

    // 3. Calculate Surge Pricing
    const rideTime = scheduledTime ? new Date(scheduledTime) : new Date();
    const surgeMultiplier = getSurgeMultiplier(rideTime);
    const subtotal = baseFare + distanceCharge + timeCharge;
    const surgeCharge = surgeMultiplier > 1.0 ? (subtotal * (surgeMultiplier - 1.0)) : 0;

    // 4. Calculate Total Fare
    const totalFare = subtotal + surgeCharge;

    return {
        baseFare,
        distanceCharge,
        timeCharge,
        distanceKm: routeInfo.distance,
        surgeMultiplier,
        surgeCharge,
        totalFare: Math.round(totalFare / 5) * 5, // Round to nearest ₹5
    };
};