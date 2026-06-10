export interface NearbyAuto {
    id: string;
    driverName: string;
    rating: number;
    distanceKm: number;
    etaMin: number;
    plate: string;
    photoInitial: string;
    isEV: boolean;
}

export const NEARBY_AUTOS: NearbyAuto[] = [
    { id: 'auto-1', driverName: 'Ravi Kumar', rating: 4.9, distanceKm: 0.6, etaMin: 3, plate: 'AP03 T 4521', photoInitial: 'R', isEV: true },
    { id: 'auto-2', driverName: 'Suresh Babu', rating: 4.7, distanceKm: 0.9, etaMin: 5, plate: 'AP03 T 8890', photoInitial: 'S', isEV: false },
    { id: 'auto-3', driverName: 'Venkat Reddy', rating: 4.8, distanceKm: 1.2, etaMin: 7, plate: 'AP03 T 3312', photoInitial: 'V', isEV: true },
    { id: 'auto-4', driverName: 'Kiran Naidu', rating: 4.6, distanceKm: 1.5, etaMin: 9, plate: 'AP03 T 7744', photoInitial: 'K', isEV: false },
    { id: 'auto-5', driverName: 'Prasad Rao', rating: 4.9, distanceKm: 1.8, etaMin: 11, plate: 'AP03 T 5566', photoInitial: 'P', isEV: true },
];
