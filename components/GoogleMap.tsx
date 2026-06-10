import React, { useEffect, useRef, useCallback } from 'react';

declare namespace google {
    namespace maps {
        interface LatLngLiteral { lat: number; lng: number; }
        class Map {
            constructor(el: HTMLElement, opts?: Record<string, unknown>);
            fitBounds(b: LatLngBounds): void;
        }
        class LatLngBounds {
            extend(p: LatLngLiteral): void;
        }
        class Marker {
            constructor(opts?: Record<string, unknown>);
            setMap(map: Map | null): void;
            setPosition(p: LatLngLiteral): void;
        }
        class DirectionsService {
            route(req: Record<string, unknown>, cb: (result: DirectionsResult | null, status: string) => void): void;
        }
        class DirectionsRenderer {
            constructor(opts?: Record<string, unknown>);
            setMap(map: Map | null): void;
            setDirections(result: DirectionsResult | null): void;
        }
        interface DirectionsResult { routes: DirectionsRoute[]; }
        interface DirectionsRoute { legs: DirectionsLeg[]; }
        interface DirectionsLeg {
            duration?: { text: string; value: number };
            distance?: { text: string; value: number };
        }
        enum TravelMode { DRIVING = 'DRIVING' }
        namespace event {
            function trigger(instance: Map, eventName: string): void;
        }
    }
}

interface GoogleMapProps {
    originCoords: google.maps.LatLngLiteral;
    destinationCoords: google.maps.LatLngLiteral;
    onRouteUpdate?: (eta: string | null, distance?: string | null) => void;
}

const isMapsReady = () => typeof window !== 'undefined' && !!window.google?.maps;

const GoogleMap: React.FC<GoogleMapProps> = ({ originCoords, destinationCoords, onRouteUpdate }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);
    const pickupMarker = useRef<google.maps.Marker | null>(null);
    const destMarker = useRef<google.maps.Marker | null>(null);
    const directionsService = useRef<google.maps.DirectionsService | null>(null);
    const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

    const clearRoute = useCallback(() => {
        if (directionsRenderer.current) {
            try {
                directionsRenderer.current.setDirections(null);
            } catch {
                directionsRenderer.current.setMap(null);
                if (mapInstance.current) directionsRenderer.current.setMap(mapInstance.current);
            }
        }
        onRouteUpdate?.(null, null);
    }, [onRouteUpdate]);

    useEffect(() => {
        if (!mapRef.current || !isMapsReady() || mapInstance.current) return;

        mapInstance.current = new google.maps.Map(mapRef.current, {
            center: originCoords,
            zoom: 14,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
        });

        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#0F766E',
                strokeOpacity: 0.85,
                strokeWeight: 5,
            },
        });
        directionsRenderer.current.setMap(mapInstance.current);

        pickupMarker.current = new google.maps.Marker({
            map: mapInstance.current,
            position: originCoords,
            title: 'Pickup',
            label: { text: 'P', color: 'white', fontWeight: '700' },
        });
        destMarker.current = new google.maps.Marker({
            map: mapInstance.current,
            position: destinationCoords,
            title: 'Destination',
            label: { text: 'D', color: 'white', fontWeight: '700' },
        });

        const resizeMap = () => {
            if (!mapInstance.current || !mapRef.current) return;
            google.maps.event.trigger(mapInstance.current, 'resize');
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(originCoords);
            bounds.extend(destinationCoords);
            mapInstance.current.fitBounds(bounds);
        };

        requestAnimationFrame(resizeMap);
        const observer = new ResizeObserver(() => resizeMap());
        observer.observe(mapRef.current);

        return () => observer.disconnect();
    }, [originCoords, destinationCoords]);

    useEffect(() => {
        if (!mapInstance.current || !isMapsReady()) return;

        pickupMarker.current?.setPosition(originCoords);
        destMarker.current?.setPosition(destinationCoords);
    }, [originCoords, destinationCoords]);

    useEffect(() => {
        if (!mapInstance.current || !directionsService.current || !directionsRenderer.current) return;

        directionsService.current.route(
            {
                origin: originCoords,
                destination: destinationCoords,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result?.routes?.length) {
                    directionsRenderer.current?.setDirections(result);
                    const leg = result.routes[0]?.legs?.[0];
                    onRouteUpdate?.(leg?.duration?.text ?? null, leg?.distance?.text ?? null);

                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(originCoords);
                    bounds.extend(destinationCoords);
                    mapInstance.current?.fitBounds(bounds);
                } else {
                    clearRoute();
                }
            },
        );
    }, [originCoords, destinationCoords, onRouteUpdate, clearRoute]);

    return (
        <div
            ref={mapRef}
            className="w-100 mbu-google-map"
            style={{ height: '100%', minHeight: '440px', width: '100%' }}
            role="application"
            aria-label="Route directions map"
        />
    );
};

export default GoogleMap;
