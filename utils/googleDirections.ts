import { Coordinates } from '../types';
import { decodePolyline } from './decodePolyline';
import { RouteResult, RouteStep } from './osrmRouting';

declare namespace google {
    namespace maps {
        interface LatLngLiteral { lat: number; lng: number; }
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
            distance?: { value: number; text: string };
            duration?: { value: number; text: string };
            steps?: DirectionsStep[];
        }
        interface DirectionsStep {
            instructions?: string;
            distance?: { value: number; text: string };
        }
        enum TravelMode { DRIVING = 'DRIVING' }
    }
}

function stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
}

function formatStepDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

function ensureRouteEndpoints(
    coordinates: [number, number][],
    origin: Coordinates,
    dest: Coordinates,
): [number, number][] {
    const result = [...coordinates];
    if (result.length === 0) {
        return [[origin.lat, origin.lng], [dest.lat, dest.lng]];
    }

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

export function fetchGoogleDirections(
    origin: Coordinates,
    dest: Coordinates,
    pickupLabel?: string,
    destLabel?: string,
): Promise<RouteResult | null> {
    if (!window.google?.maps) return Promise.resolve(null);

    return new Promise((resolve) => {
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
                    resolve(null);
                    return;
                }

                const route = result.routes[0];
                let coordinates: [number, number][] = [];
                if (route.overview_path?.length) {
                    coordinates = route.overview_path.map((point) => [point.lat(), point.lng()]);
                } else if (route.overview_polyline) {
                    coordinates = decodePolyline(route.overview_polyline);
                }
                coordinates = ensureRouteEndpoints(coordinates, origin, dest);

                const steps: RouteStep[] = [];
                if (pickupLabel) {
                    steps.push({ instruction: `Start at ${pickupLabel}`, distance: '' });
                }

                for (const leg of route.legs || []) {
                    for (const step of leg.steps || []) {
                        const text = step.instructions ? stripHtml(step.instructions) : 'Continue on road';
                        if (!text) continue;
                        steps.push({
                            instruction: text,
                            distance: formatStepDistance(step.distance?.value || 0),
                        });
                    }
                }

                if (destLabel) {
                    steps.push({ instruction: `Arrive at ${destLabel}`, distance: '' });
                }

                const totalMeters = route.legs?.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) || 0;
                const totalSeconds = route.legs?.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) || 0;

                resolve({
                    distanceKm: totalMeters / 1000,
                    durationMin: Math.max(1, Math.round(totalSeconds / 60)),
                    coordinates,
                    steps,
                });
            },
        );
    });
}

