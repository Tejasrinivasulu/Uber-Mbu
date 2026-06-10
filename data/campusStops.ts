export interface CampusStop {
    id: string;
    name: string;
    lat: number;
    lng: number;
    category: 'campus' | 'city';
}

export const CAMPUS_STOPS: CampusStop[] = [
    { id: 'rangampet', name: 'Rangampet', lat: 13.6328, lng: 79.4168, category: 'campus' },
    { id: 'school-bus', name: 'School Bus Stop', lat: 13.6315, lng: 79.4158, category: 'campus' },
    { id: 'mbu-bus', name: 'MBU Main Bus Stop', lat: 13.6302, lng: 79.4172, category: 'campus' },
    { id: 'mbu-gate', name: 'MBU Main Gate', lat: 13.6296, lng: 79.4165, category: 'campus' },
    { id: 'medasani', name: 'Medasani Dhaba', lat: 13.6288, lng: 79.4182, category: 'campus' },
    { id: 'couch-potato', name: 'Couch Potato', lat: 13.6310, lng: 79.4152, category: 'campus' },
    { id: 'srinivasa', name: 'Srinivasa Mangapuram', lat: 13.6520, lng: 79.4120, category: 'city' },
    { id: 'cherlopalli', name: 'Cherlopalli', lat: 13.6450, lng: 79.4080, category: 'city' },
    { id: 'ion-digital', name: 'ION Digital Cherlopalli', lat: 13.6465, lng: 79.4095, category: 'city' },
    { id: 'zoo-park', name: 'Zoo Park', lat: 13.6380, lng: 79.4050, category: 'city' },
    { id: 'alipiri', name: 'Alipiri', lat: 13.6550, lng: 79.4200, category: 'city' },
    { id: 'kapila', name: 'Kapila Theertham', lat: 13.6580, lng: 79.4150, category: 'city' },
    { id: 'leela', name: 'Leela Mahal Circle', lat: 13.6340, lng: 79.4220, category: 'city' },
    { id: 'balaji', name: 'Balaji Colony Circle', lat: 13.6320, lng: 79.4240, category: 'city' },
    { id: 'railway', name: 'Railway Station', lat: 13.6284, lng: 79.4193, category: 'city' },
    { id: 'rtc', name: 'RTC Bus Stand', lat: 13.6297, lng: 79.4147, category: 'city' },
    { id: 'dmart', name: 'D-Mart', lat: 13.6370, lng: 79.4260, category: 'city' },
    { id: 'ithepalle', name: 'Ithepalle', lat: 13.6200, lng: 79.4300, category: 'city' },
    { id: 'renigunta', name: 'Renigunta', lat: 13.6100, lng: 79.5100, category: 'city' },
];

export function findStopByName(name: string): CampusStop | undefined {
    return CAMPUS_STOPS.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function searchStops(query: string): CampusStop[] {
    const q = query.trim().toLowerCase();
    if (!q) return CAMPUS_STOPS;
    return CAMPUS_STOPS.filter((s) => s.name.toLowerCase().includes(q));
}
