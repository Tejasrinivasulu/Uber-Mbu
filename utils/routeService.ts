import { Coordinates } from '../types';
import { decodePolyline } from './decodePolyline';
import { waitForGoogleMaps } from './waitForGoogleMaps';

declare namespace google {
    namespace maps {
        class LatLng {
            lat(): number;
            lng(): number;
        }
        class DirectionsService {
            route(req: Record<string, unknown>, cb: (result: DirectionsResult | null, status: string) => void): void;
        }
        interface DirectionsResult { routes: DirectionsRoute[]; }
        interface DirectionsRoute {
            overview_path?: LatLng[];
            overview_polyline?: string;
            legs: DirectionsLeg[];
        }
        interface DirectionsLeg {
            distance?: { value: number };
            duration?: { value: number };
            steps?: DirectionsStep[];
        }
        interface DirectionsStep {
            instructions?: string;
            distance?: { value: number };
        }
        enum TravelMode { DRIVING = 'DRIVING' }
    }
}

export interface RouteStep {
    instruction: string;
    distance: string;
}

export interface RouteResult {
    distanceKm: number;
    durationMin: number;
    coordinates: [number, number][];
    steps: RouteStep[];
    source: 'google' | 'osrm' | 'local';
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

function stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
}

function haversineKm(a: Coordinates, b: Coordinates): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2
        + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function interpolateRoute(origin: Coordinates, dest: Coordinates, segments = 24): [number, number][] {
    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        points.push([
            origin.lat + (dest.lat - origin.lat) * t,
            origin.lng + (dest.lng - origin.lng) * t,
        ]);
    }
    return points;
}

function ensureRouteEndpoints(
    coordinates: [number, number][],
    origin: Coordinates,
    dest: Coordinates,
): [number, number][] {
    if (coordinates.length === 0) {
        return interpolateRoute(origin, dest);
    }

    const result = [...coordinates];
    const [firstLat, firstLng] = result[0];
    const [lastLat, lastLng] = result[result.length - 1];

    if (Math.abs(firstLat - origin.lat) > 0.0002 || Math.abs(firstLng - origin.lng) > 0.0002) {
        result.unshift([origin.lat, origin.lng]);
    }
    if (Math.abs(lastLat - dest.lat) > 0.0002 || Math.abs(lastLng - dest.lng) > 0.0002) {
        result.push([dest.lat, dest.lng]);
    }

    return result;
}

function getCardinalDirection(dLng: number, dLat: number): string {
    const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    if (angle >= -22.5 && angle < 22.5) return 'north';
    if (angle >= 22.5 && angle < 67.5) return 'north-east';
    if (angle >= 67.5 && angle < 112.5) return 'east';
    if (angle >= 112.5 && angle < 157.5) return 'south-east';
    if (angle >= 157.5 || angle < -157.5) return 'south';
    if (angle >= -157.5 && angle < -112.5) return 'south-west';
    if (angle >= -112.5 && angle < -67.5) return 'west';
    return 'north-west';
}

/** Instant synchronous route — shown immediately on pickup/drop change. */
export function getInstantRoute(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): RouteResult {
    const distanceKm = haversineKm(origin, dest);
    const direction = getCardinalDirection(dest.lng - origin.lng, dest.lat - origin.lat);
    const steps: RouteStep[] = [];

    if (pickupLabel) steps.push({ instruction: `Start at ${pickupLabel}`, distance: '' });
    steps.push({
        instruction: `Head ${direction} on road towards ${destLabel || 'destination'}`,
        distance: formatDistance(distanceKm * 1000),
    });
    steps.push({
        instruction: `Continue straight for ${formatDistance(distanceKm * 1000)}`,
        distance: '',
    });
    if (destLabel) steps.push({ instruction: `Arrive at ${destLabel}`, distance: '' });

    return {
        distanceKm,
        durationMin: Math.max(2, Math.round(distanceKm * 3)),
        coordinates: interpolateRoute(origin, dest, 32),
        steps,
        source: 'local',
    };
}

async function fetchGoogleRoute(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): Promise<RouteResult | null> {
    if (!window.google?.maps) return null;

    return new Promise((resolve) => {
        let settled = false;
        const finish = (value: RouteResult | null) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            resolve(value);
        };

        const timer = window.setTimeout(() => finish(null), 4000);
        const service = new google.maps.DirectionsService();

        service.route(
            {
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: dest.lat, lng: dest.lng },
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: false,
            },
            (result, status) => {
                if (status !== 'OK' || !result?.routes?.[0]) {
                    finish(null);
                    return;
                }

                const route = result.routes[0];
                let coordinates: [number, number][] = [];

                if (route.overview_path?.length) {
                    coordinates = route.overview_path.map((p) => [p.lat(), p.lng()]);
                } else if (route.overview_polyline) {
                    coordinates = decodePolyline(route.overview_polyline);
                }

                coordinates = ensureRouteEndpoints(coordinates, origin, dest);

                const steps: RouteStep[] = [];
                if (pickupLabel) steps.push({ instruction: `Start at ${pickupLabel}`, distance: '' });

                for (const leg of route.legs || []) {
                    for (const step of leg.steps || []) {
                        const text = step.instructions ? stripHtml(step.instructions) : '';
                        if (!text) continue;
                        steps.push({
                            instruction: text,
                            distance: formatDistance(step.distance?.value || 0),
                        });
                    }
                }

                if (destLabel) steps.push({ instruction: `Arrive at ${destLabel}`, distance: '' });

                const totalMeters = route.legs?.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) || 0;
                const totalSeconds = route.legs?.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) || 0;

                finish({
                    distanceKm: totalMeters / 1000,
                    durationMin: Math.max(1, Math.round(totalSeconds / 60)),
                    coordinates,
                    steps: steps.length > 0 ? steps : getInstantRoute(origin, dest, pickupLabel, destLabel).steps,
                    source: 'google',
                });
            },
        );
    });
}

async function fetchOsrmRoute(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): Promise<RouteResult | null> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;

        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.[0]) return null;

        const route = data.routes[0];
        let coordinates: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng],
        );
        coordinates = ensureRouteEndpoints(coordinates, origin, dest);

        const steps: RouteStep[] = [];
        if (pickupLabel) steps.push({ instruction: `Start at ${pickupLabel}`, distance: '' });

        for (const leg of route.legs || []) {
            for (const step of leg.steps || []) {
                const raw = step.maneuver?.instruction || step.name || 'Continue on road';
                steps.push({
                    instruction: raw.charAt(0).toUpperCase() + raw.slice(1),
                    distance: formatDistance(step.distance || 0),
                });
            }
        }

        if (destLabel) steps.push({ instruction: `Arrive at ${destLabel}`, distance: '' });

        return {
            distanceKm: route.distance / 1000,
            durationMin: Math.max(1, Math.round(route.duration / 60)),
            coordinates,
            steps: steps.length > 0 ? steps : getInstantRoute(origin, dest, pickupLabel, destLabel).steps,
            source: 'osrm',
        };
    } catch {
        return null;
    } finally {
        window.clearTimeout(timeout);
    }
}

/** Fetch live road route in background (OSRM + Google in parallel). Returns null if unavailable. */
export async function fetchEnhancedRoute(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): Promise<RouteResult | null> {
    const googleTask = (async () => {
        const googleReady = window.google?.maps ? true : await waitForGoogleMaps(2000);
        if (!googleReady) return null;
        return fetchGoogleRoute(origin, dest, pickupLabel, destLabel);
    })();

    const [osrmRoute, googleRoute] = await Promise.all([
        fetchOsrmRoute(origin, dest, pickupLabel, destLabel),
        googleTask,
    ]);

    if (googleRoute && googleRoute.coordinates.length >= 2 && googleRoute.steps.length > 2) {
        return googleRoute;
    }
    if (osrmRoute && osrmRoute.coordinates.length >= 2) return osrmRoute;
    if (googleRoute && googleRoute.coordinates.length >= 2) return googleRoute;

    return null;
}

export async function fetchRoute(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): Promise<RouteResult> {
    const enhanced = await fetchEnhancedRoute(origin, dest, pickupLabel, destLabel);
    return enhanced ?? getInstantRoute(origin, dest, pickupLabel, destLabel);
}

export { formatDistance, formatDuration };
