export interface Venue {
    id: string;
    name: string;
    city: string;
    address: string;
    capacity: number;
    parkingAvailable: boolean;
}

export interface Event {
    id: string;
    name: string;
    category: 'AI' | 'Cloud' | 'DevOps' | 'Security';
    date: string;
    venueId: string;
    availableSlots: number;
}

export interface Speaker {
    id: string;
    name: string;
    title: string;
    company: string;
    expertise: string[];
    mvp: boolean;
}

export interface Session {
    id: string;
    eventId: string;
    title: string;
    speakerId: string;
    track: 'AI' | 'Cloud' | 'Data' | 'Security';
    startTime: string;
    endTime: string;
    room: string;
    remainingSeats: number;
}

export interface Registration {
    registrationId: string;
    eventId: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    jobTitle: string;
    seatNumber: number;
    checkInCode: string;
    status: 'Confirmed';
}
