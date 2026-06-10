import React, { useEffect, useRef, useState } from 'react';
import { Coordinates } from '../../types';
import { loadLeaflet } from '../../utils/loadLeaflet';
import {
    fetchEnhancedRoute,
    formatDuration,
    getInstantRoute,
    RouteResult,
    RouteStep,
} from '../../utils/routeService';

export type DriverNavPhase = 'to_pickup' | 'to_destination';

interface DriverActiveMapProps {
    driverCoords: Coordinates;
    pickupCoords: Coordinates;
    destinationCoords: Coordinates;
    pickupLabel?: string;
    destLabel?: string;
    phase: DriverNavPhase;
    onRouteUpdate?: (eta: string | null, distance: string | null, steps?: RouteStep[], nextTurn?: string) => void;
}

const ROUTE_COLOR = '#0F766E';
const ROUTE_OUTLINE = '#93C5FD';

const refreshMapView = (map: L.Map, coordinates: [number, number][]) => {
    map.invalidateSize(true);
    if (coordinates.length >= 2) {
        map.fitBounds(L.latLngBounds(coordinates), { padding: [52, 52], maxZoom: 16, animate: false });
    }
    window.setTimeout(() => map.invalidateSize(true), 150);
};

const DriverActiveMap: React.FC<DriverActiveMapProps> = ({
    driverCoords,
    pickupCoords,
    destinationCoords,
    pickupLabel,
    destLabel,
    phase,
    onRouteUpdate,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<Array<L.Polyline | L.CircleMarker>>([]);
    const onUpdateRef = useRef(onRouteUpdate);
    const routeGenRef = useRef(0);
    const [mapReady, setMapReady] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    onUpdateRef.current = onRouteUpdate;

    const origin = phase === 'to_pickup' ? driverCoords : pickupCoords;
    const destination = phase === 'to_pickup' ? pickupCoords : destinationCoords;
    const originLabel = phase === 'to_pickup' ? 'Your location' : pickupLabel;
    const destLabelResolved = phase === 'to_pickup' ? pickupLabel : destLabel;

    const publish = (route: RouteResult) => {
        const nextTurn = route.steps.find((s) => s.instruction && !s.instruction.startsWith('Start'))?.instruction ?? null;
        onUpdateRef.current?.(
            route.durationMin > 0 ? formatDuration(route.durationMin * 60) : null,
            route.distanceKm > 0 ? `${route.distanceKm.toFixed(1)} km` : null,
            route.steps,
            nextTurn ?? undefined,
        );
    };

    const drawRoute = (route: RouteResult) => {
        if (!mapRef.current || route.coordinates.length < 2) return;

        layersRef.current.forEach((l) => l.remove());
        layersRef.current = [];

        layersRef.current.push(
            L.polyline(route.coordinates, {
                color: ROUTE_OUTLINE, weight: 12, opacity: 0.6, lineCap: 'round', lineJoin: 'round',
            }).addTo(mapRef.current),
        );
        layersRef.current.push(
            L.polyline(route.coordinates, {
                color: ROUTE_COLOR, weight: 7, opacity: 1, lineCap: 'round', lineJoin: 'round',
            }).addTo(mapRef.current),
        );
        layersRef.current.push(
            L.circleMarker([driverCoords.lat, driverCoords.lng], {
                radius: 9, color: '#115E59', fillColor: '#0D9488', fillOpacity: 1, weight: 2,
            }).addTo(mapRef.current),
        );
        layersRef.current.push(
            L.circleMarker([pickupCoords.lat, pickupCoords.lng], {
                radius: 9, color: '#047857', fillColor: '#10B981', fillOpacity: 1, weight: 2,
            }).addTo(mapRef.current),
        );
        layersRef.current.push(
            L.circleMarker([destinationCoords.lat, destinationCoords.lng], {
                radius: 9, color: '#B45309', fillColor: '#F59E0B', fillOpacity: 1, weight: 2,
            }).addTo(mapRef.current),
        );

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
                        center: [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
                        zoom: 14,
                        zoomControl: true,
                    });
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; OpenStreetMap',
                    }).addTo(mapRef.current);
                }

                mapRef.current.invalidateSize(true);
                if (!cancelled) setMapReady(true);
            } catch {
                if (!cancelled) setMapReady(false);
            }
        };

        boot();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!mapReady || !mapRef.current) return;

        const generation = ++routeGenRef.current;
        const instant = getInstantRoute(origin, destination, originLabel, destLabelResolved);
        drawRoute(instant);
        publish(instant);

        const upgrade = async () => {
            const enhanced = await fetchEnhancedRoute(origin, destination, originLabel, destLabelResolved);
            if (generation !== routeGenRef.current) return;
            const route = enhanced ?? instant;
            drawRoute(route);
            publish(route);
        };

        upgrade();
    }, [
        mapReady, phase,
        origin.lat, origin.lng, destination.lat, destination.lng,
        driverCoords.lat, driverCoords.lng,
        pickupCoords.lat, pickupCoords.lng,
        destinationCoords.lat, destinationCoords.lng,
        pickupLabel, destLabel,
    ]);

    useEffect(() => {
        if (mapRef.current) {
            window.setTimeout(() => mapRef.current?.invalidateSize(true), 200);
        }
    }, [fullscreen]);

    useEffect(() => () => {
        layersRef.current.forEach((l) => l.remove());
        mapRef.current?.remove();
        mapRef.current = null;
    }, []);

    return (
        <div className={`mbu-driver-map-wrap ${fullscreen ? 'fullscreen' : ''}`}>
            <div ref={containerRef} className="mbu-driver-map-canvas" role="application" aria-label="Navigation map" />
            <div className="mbu-driver-map-toolbar">
                <button type="button" className="mbu-driver-map-btn" onClick={() => setFullscreen(!fullscreen)} title="Fullscreen">
                    <i className={`fas fa-${fullscreen ? 'compress' : 'expand'}`}></i>
                </button>
                <button
                    type="button"
                    className="mbu-driver-map-btn"
                    onClick={() => mapRef.current?.invalidateSize(true)}
                    title="Refresh map"
                >
                    <i className="fas fa-location-crosshairs"></i>
                </button>
            </div>
            {!mapReady && (
                <div className="mbu-route-map-overlay">
                    <i className="fas fa-map me-2"></i> Loading navigation...
                </div>
            )}
        </div>
    );
};

export default DriverActiveMap;
