import { useEffect, useState } from 'react';

declare global {
    interface Window {
        googleMapsApiLoaded?: boolean;
        google?: typeof google;
    }
}

export function useGoogleMapsLoader(): boolean {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const isReady = () => !!(window.google?.maps || window.googleMapsApiLoaded);

        if (isReady()) {
            setLoaded(true);
            return;
        }

        const check = () => {
            if (window.google?.maps) {
                setLoaded(true);
                return true;
            }
            return false;
        };

        if (check()) return;

        const interval = window.setInterval(() => {
            if (check()) window.clearInterval(interval);
        }, 300);

        const timeout = window.setTimeout(() => window.clearInterval(interval), 15000);

        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
        };
    }, []);

    return loaded;
}
