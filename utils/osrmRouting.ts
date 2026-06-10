import { Coordinates } from '../types';

export interface RouteStep {
    instruction: string;
    distance: string;
}

export interface RouteResult {
    distanceKm: number;
    durationMin: number;
    coordinates: [number, number][];
    steps: RouteStep[];
}

function formatDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
    const min = Math.max(1, Math.round(seconds / 60));
    if (min < 60) return `~${min} min`;
    return `~${Math.floor(min / 60)} hr ${min % 60} min`;
}

function capitalizeInstruction(text: string): string {
    if (!text) return 'Continue';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function fetchDrivingRoute(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): Promise<RouteResult | null> {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=true`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.[0]) return null;

        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng],
        );

        const steps: RouteStep[] = [];
        if (pickupLabel) {
            steps.push({ instruction: `Start at ${pickupLabel}`, distance: '' });
        }

        for (const leg of route.legs || []) {
            for (const step of leg.steps || []) {
                const raw = step.maneuver?.instruction || step.name || 'Continue on road';
                steps.push({
                    instruction: capitalizeInstruction(raw),
                    distance: formatDistance(step.distance || 0),
                });
            }
        }

        if (destLabel) {
            steps.push({ instruction: `Arrive at ${destLabel}`, distance: '' });
        }

        return {
            distanceKm: route.distance / 1000,
            durationMin: Math.max(1, Math.round(route.duration / 60)),
            coordinates,
            steps,
        };
    } catch {
        return null;
    }
}

export function buildStraightLineFallback(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): RouteResult {
    const coordinates: [number, number][] = [
        [origin.lat, origin.lng],
        [dest.lat, dest.lng],
    ];
    const steps: RouteStep[] = [];
    if (pickupLabel) steps.push({ instruction: `Start at ${pickupLabel}`, distance: '' });
    steps.push({ instruction: `Head towards ${destLabel || 'destination'}`, distance: '' });
    if (destLabel) steps.push({ instruction: `Arrive at ${destLabel}`, distance: '' });

    return {
        distanceKm: 0,
        durationMin: 0,
        coordinates,
        steps,
    };
}

export function formatRouteDistance(distanceKm: number): string {
    return distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '';
}

export { formatDuration };
