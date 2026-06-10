import React, { useEffect, useRef, useState } from 'react';
import { Coordinates } from '../types';
import { loadLeaflet } from '../utils/loadLeaflet';
import {
    fetchEnhancedRoute,
    formatDuration,
    getInstantRoute,
    RouteResult,
    RouteStep,
} from '../utils/routeService';

export interface RouteMapProps {
    originCoords: Coordinates;
    destinationCoords: Coordinates;
    pickupLabel?: string;
    destLabel?: string;
    onRouteUpdate?: (eta: string | null, distance: string | null, steps?: RouteStep[], loading?: boolean) => void;
    className?: string;
}

export function buildLiveLocationEmbedUrl(lat: number, lng: number, zoom = 16): string {
    return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

const MAP_HEIGHT = 440;
const ROUTE_COLOR = '#0F766E';
const ROUTE_OUTLINE = '#93C5FD';

const getCenter = (origin: Coordinates, dest: Coordinates): [number, number] => [
    (origin.lat + dest.lat) / 2,
    (origin.lng + dest.lng) / 2,
];

const refreshMapView = (map: L.Map, coordinates: [number, number][]) => {
    map.invalidateSize(true);
    if (coordinates.length >= 2) {
        map.fitBounds(L.latLngBounds(coordinates), { padding: [48, 48], maxZoom: 16, animate: false });
    }
    window.setTimeout(() => map.invalidateSize(true), 150);
};

const RouteMap: React.FC<RouteMapProps> = ({
    originCoords,
    destinationCoords,
    pickupLabel,
    destLabel,
    onRouteUpdate,
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<Array<L.Polyline | L.CircleMarker>>([]);
    const onUpdateRef = useRef(onRouteUpdate);
    const routeGenRef = useRef(0);
    const [mapReady, setMapReady] = useState(false);

    onUpdateRef.current = onRouteUpdate;

    const publish = (route: RouteResult, loading = false) => {
        onUpdateRef.current?.(
            route.durationMin > 0 ? formatDuration(route.durationMin * 60) : null,
            route.distanceKm > 0 ? `${route.distanceKm.toFixed(1)} km` : null,
            route.steps,
            loading,
        );
    };

    const drawRoute = (route: RouteResult, origin: Coordinates, dest: Coordinates) => {
        if (!mapRef.current || route.coordinates.length < 2) return;

        layersRef.current.forEach((l) => l.remove());
        layersRef.current = [];

        const outline = L.polyline(route.coordinates, {
            color: ROUTE_OUTLINE,
            weight: 12,
            opacity: 0.65,
            lineCap: 'round',
            lineJoin: 'round',
        }).addTo(mapRef.current);

        const line = L.polyline(route.coordinates, {
            color: ROUTE_COLOR,
            weight: 7,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
        }).addTo(mapRef.current);

        const pickup = L.circleMarker([origin.lat, origin.lng], {
            radius: 9,
            color: '#1E40AF',
            fillColor: '#0F766E',
            fillOpacity: 1,
            weight: 2,
        }).addTo(mapRef.current);

        const drop = L.circleMarker([dest.lat, dest.lng], {
            radius: 9,
            color: '#047857',
            fillColor: '#10B981',
            fillOpacity: 1,
            weight: 2,
        }).addTo(mapRef.current);

        layersRef.current = [outline, line, pickup, drop];
        refreshMapView(mapRef.current, route.coordinates);
    };

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            try {
                await loadLeaflet();
                if (cancelled || !containerRef.current) return;

                if (!mapRef.current) {
                    mapRef.current = L.map(containerRef.current, {
                        center: getCenter(originCoords, destinationCoords),
                        zoom: 14,
                        zoomControl: true,
                        attributionControl: true,
                    });

                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    }).addTo(mapRef.current);
                }

                mapRef.current.invalidateSize(true);
                window.setTimeout(() => mapRef.current?.invalidateSize(true), 100);
                if (!cancelled) setMapReady(true);
            } catch {
                if (!cancelled) setMapReady(false);
            }
        };

        boot();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!mapReady || !mapRef.current) return;

        const generation = ++routeGenRef.current;
        const origin = originCoords;
        const dest = destinationCoords;

        const instant = getInstantRoute(origin, dest, pickupLabel, destLabel);
        drawRoute(instant, origin, dest);
        publish(instant, true);

        const upgrade = async () => {
            const enhanced = await fetchEnhancedRoute(origin, dest, pickupLabel, destLabel);
            if (generation !== routeGenRef.current) return;

            const route = enhanced ?? instant;
            drawRoute(route, origin, dest);
            publish(route, false);
        };

        upgrade();
    }, [
        mapReady,
        originCoords.lat,
        originCoords.lng,
        destinationCoords.lat,
        destinationCoords.lng,
        pickupLabel,
        destLabel,
    ]);

    useEffect(() => () => {
        layersRef.current.forEach((l) => l.remove());
        layersRef.current = [];
        mapRef.current?.remove();
        mapRef.current = null;
    }, []);

    return (
        <div className={`mbu-route-map-container ${className}`} style={{ height: MAP_HEIGHT }}>
            <div
                ref={containerRef}
                className="mbu-route-map-canvas"
                style={{ height: MAP_HEIGHT, width: '100%' }}
                role="application"
                aria-label="Route map"
            />
            {!mapReady && (
                <div className="mbu-route-map-overlay">
                    <i className="fas fa-map me-2"></i> Loading map...
                </div>
            )}
        </div>
    );
};

export default RouteMap;
