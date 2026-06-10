export function waitForGoogleMaps(timeoutMs = 10000): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.google?.maps) {
            resolve(true);
            return;
        }

        let settled = false;
        const finish = (ready: boolean) => {
            if (settled) return;
            settled = true;
            window.removeEventListener('google-maps-ready', onReady);
            window.clearInterval(interval);
            window.clearTimeout(timeout);
            resolve(ready);
        };

        const onReady = () => finish(!!window.google?.maps);

        window.addEventListener('google-maps-ready', onReady);
        const interval = window.setInterval(() => {
            if (window.google?.maps) finish(true);
        }, 200);
        const timeout = window.setTimeout(() => finish(false), timeoutMs);
    });
}
