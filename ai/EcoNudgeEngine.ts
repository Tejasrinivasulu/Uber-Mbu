
import { Ride, RideType, Driver } from '../types';

// Define the state for our RL model
interface RLState {
    timeOfDay: 'day' | 'night';
    isSoloRide: boolean;
}

// Define the action the RL model can take
type RLAction = 'nudge' | 'do_nothing';

export interface Nudge {
    message: string;
    modifiedRideDetails: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>;
}

/**
 * Simulates a trained Proximal Policy Optimization (PPO) model.
 * In a real-world scenario, this would be a call to a TensorFlow.js model or a backend service.
 * Here, we use a simple rule-based system to mimic its decision-making process.
 * 
 * @param state The current state of the booking request.
 * @returns The best action determined by the "model".
 */
const decideAction = (state: RLState): RLAction => {
    // PPO Policy: Nudge late-night solo riders towards shared EV rides.
    // This is a high-reward scenario: it's late, so the user may be more price-sensitive,
    // and converting a solo ride to shared has a high environmental impact.
    if (state.timeOfDay === 'night' && state.isSoloRide) {
        return 'nudge';
    }
    // Default action: do nothing
    return 'do_nothing';
};

/**
 * The main entry point for the student-facing nudge engine.
 *
 * @param rideDetails The details of the ride the student is about to book.
 * @returns A nudge object if an eco-friendly alternative is suggested, otherwise null.
 */
export const getStudentNudge = (rideDetails: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'>): Nudge | null => {
    const bookingTime = rideDetails.scheduledTime ? new Date(rideDetails.scheduledTime) : new Date();
    const hour = bookingTime.getHours();
    
    const state: RLState = {
        timeOfDay: (hour >= 21 || hour < 6) ? 'night' : 'day',
        isSoloRide: rideDetails.type === RideType.SOLO,
    };

    const action = decideAction(state);

    if (action === 'nudge') {
        const discount = 0.25; // 25% discount for switching
        const newFare = rideDetails.fare * (1 - discount);
        const co2Savings = 1.2; // kg of CO2 saved by switching

        const modifiedRide: Omit<Ride, 'id' | 'studentId' | 'date' | 'status'> = {
            ...rideDetails,
            type: RideType.SHARED,
            fare: newFare,
            co2Savings: co2Savings,
        };

        return {
            message: `Save ${discount * 100}% and reduce your carbon footprint! An eco-friendly shared ride is available.`,
            modifiedRideDetails: modifiedRide,
        };
    }

    return null;
};

/**
 * Calculates bonuses for drivers based on eco-friendly behavior and other incentives.
 *
 * @param ride The completed ride object.
 * @param driver The driver who completed the ride.
 * @param completionDate The time the ride was marked as complete. Defaults to now.
 * @returns An object containing the calculated bonus and CO2 savings.
 */
export const calculateDriverBonus = (ride: Ride, driver: Driver, completionDate: Date = new Date()): { bonus: number; co2Savings: number } => {
    let bonus = 0;
    let co2Savings = 0;

    // Base CO2 savings for any ride
    co2Savings += 0.2;

    // Night-shift incentive (9 PM to 6 AM)
    const rideHour = completionDate.getHours();
    if (rideHour >= 21 || rideHour < 6) {
        bonus += 20.00; // Flat ₹20 bonus for night rides
    }

    // Bonus for shared rides (encourages efficiency)
    if (ride.type === RideType.SHARED) {
        bonus += 15.00;
        co2Savings += 1.0; // Higher savings for shared rides
    }
    
    // Bonus for using an Electric Vehicle (EV)
    if (driver.isEV) {
        bonus += 10.00;
        co2Savings += 1.5; // Significant savings for EVs
    }

    return { bonus, co2Savings };
};