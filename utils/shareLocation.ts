export interface LiveLocation {
    lat: number;
    lng: number;
    accuracy?: number;
    updatedAt: Date;
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function buildShareMessage(studentName: string, location: LiveLocation): string {
    const url = getGoogleMapsUrl(location.lat, location.lng);
    const time = location.updatedAt.toLocaleTimeString();
    const accuracy = location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : '';
    return `🚨 MBUGO - ${studentName} is sharing live location${accuracy} at ${time}: ${url}`;
}

export async function shareLiveLocation(options: {
    studentName: string;
    location: LiveLocation;
    emergencyPhone?: string;
}): Promise<'whatsapp' | 'shared' | 'copied'> {
    const message = buildShareMessage(options.studentName, options.location);
    const url = getGoogleMapsUrl(options.location.lat, options.location.lng);

    if (options.emergencyPhone) {
        const wa = `https://wa.me/${options.emergencyPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(wa, '_blank');
        return 'whatsapp';
    }

    if (navigator.share) {
        try {
            await navigator.share({ title: 'My Live Location - MBUGO', text: message, url });
            return 'shared';
        } catch (err) {
            if ((err as Error).name === 'AbortError') throw err;
        }
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        return 'copied';
    }

    window.prompt('Copy this live location message:', message);
    return 'copied';
}
