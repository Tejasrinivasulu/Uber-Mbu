export const CAMPUS_EMERGENCY_CONTACT = {
    name: 'MBUGO Emergency',
    phone: '8984298984',
} as const;

export const formatIndianPhone = (phone: string) =>
    phone.startsWith('+') ? phone : `+91 ${phone}`;

export const telHref = (phone: string) =>
    `tel:${phone.replace(/\s+/g, '')}`;
