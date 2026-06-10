declare namespace L {
    function map(el: HTMLElement | string, options?: Record<string, unknown>): Map;
    class Map {
        constructor(el: HTMLElement | string, options?: Record<string, unknown>);
        fitBounds(bounds: LatLngBounds, options?: Record<string, unknown>): this;
        setView(center: LatLngExpression, zoom: number, options?: Record<string, unknown>): this;
        invalidateSize(animate?: boolean): this;
        remove(): this;
    }
    class LatLngBounds {
        extend(latlng: LatLngExpression): this;
    }
    class TileLayer {
        constructor(url: string, options?: Record<string, unknown>);
        addTo(map: Map): this;
    }
    class Polyline {
        constructor(latlngs: LatLngExpression[], options?: Record<string, unknown>);
        addTo(map: Map): this;
        remove(): this;
    }
    class CircleMarker {
        constructor(latlng: LatLngExpression, options?: Record<string, unknown>);
        addTo(map: Map): this;
        remove(): this;
    }
    type LatLngExpression = [number, number];
    function tileLayer(url: string, options?: Record<string, unknown>): TileLayer;
    function polyline(latlngs: LatLngExpression[], options?: Record<string, unknown>): Polyline;
    function circleMarker(latlng: LatLngExpression, options?: Record<string, unknown>): CircleMarker;
    function latLngBounds(latlngs: LatLngExpression[]): LatLngBounds;
}

interface Window {
    L: typeof L;
}
