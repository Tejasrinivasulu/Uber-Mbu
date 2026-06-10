let leafletPromise: Promise<void> | null = null;

export function loadLeaflet(): Promise<void> {
    if (typeof window !== 'undefined' && window.L) {
        return Promise.resolve();
    }

    if (leafletPromise) return leafletPromise;

    leafletPromise = new Promise((resolve, reject) => {
        const ensureCss = () => new Promise<void>((res) => {
            const existing = document.getElementById('leaflet-css') as HTMLLinkElement | null;
            if (existing?.sheet) {
                res();
                return;
            }
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.onload = () => res();
            link.onerror = () => res();
            document.head.appendChild(link);
        });

        if (document.getElementById('leaflet-js')) {
            const wait = window.setInterval(() => {
                if (window.L) {
                    window.clearInterval(wait);
                    resolve();
                }
            }, 50);
            window.setTimeout(() => window.clearInterval(wait), 10000);
            return;
        }

        ensureCss().then(() => {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load map library'));
            document.head.appendChild(script);
        });
    });

    return leafletPromise;
}
