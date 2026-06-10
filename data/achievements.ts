import { Achievement } from '../types';

export const achievementsList: Achievement[] = [
    {
        id: 'first-ride',
        name: 'First Journey',
        description: 'Complete your first ride.',
        icon: 'fa-rocket'
    },
    {
        id: 'ten-rides',
        name: 'Campus Veteran',
        description: 'Complete 10 rides in total.',
        icon: 'fa-star'
    },
    {
        id: 'five-shared',
        name: 'Eco Warrior',
        description: 'Take 5 shared rides.',
        icon: 'fa-leaf'
    },
    {
        id: 'night-ride',
        name: 'Night Owl',
        description: 'Complete a ride between 10 PM and 5 AM.',
        icon: 'fa-moon'
    }
];
