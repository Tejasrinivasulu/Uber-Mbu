import { Coordinates } from '../types';

export function interpolateToward(from: Coordinates, to: Coordinates, fraction: number): Coordinates {
    const t = Math.min(Math.max(fraction, 0), 1);
    return {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
    };
}

export function haversineKm(a: Coordinates, b: Coordinates): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function rideProgressPercent(driver: Coordinates, pickup: Coordinates, destination: Coordinates): number {
    const total = haversineKm(pickup, destination);
    if (total < 0.01) return 100;
    const covered = haversineKm(pickup, driver);
    return Math.min(100, Math.round((covered / total) * 100));
}
