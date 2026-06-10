export const CAMPUS_EMERGENCY_CONTACT = {
    name: 'MBU Ride Emergency',
    phone: '9392999309',
} as const;

export const formatIndianPhone = (phone: string) =>
    phone.startsWith('+') ? phone : `+91 ${phone}`;

export const telHref = (phone: string) =>
    `tel:${phone.replace(/\s+/g, '')}`;
