import { randomUUID } from 'crypto';
import { getTableClient } from './tableClient';
import { Event, Registration, Session, Speaker, Venue } from './models';

const EVENTS_TABLE = 'Events';
const SESSIONS_TABLE = 'Sessions';
const SPEAKERS_TABLE = 'Speakers';
const VENUES_TABLE = 'Venues';
const REGISTRATIONS_TABLE = 'Registrations';

const SEED_EVENTS: Event[] = [
    {
        id: 'evt-001',
        name: 'Microsoft Build Localhost Manila',
        category: 'AI',
        date: '2026-08-15',
        venueId: 'ven-001',
        availableSlots: 35,
    },
    {
        id: 'evt-002',
        name: 'Azure Community Cebu Meetup',
        category: 'Cloud',
        date: '2026-09-05',
        venueId: 'ven-002',
        availableSlots: 20,
    },
];

const SEED_VENUES: Venue[] = [
    {
        id: 'ven-001',
        name: 'Microsoft Philippines',
        city: 'Makati',
        address: '6750 Ayala Ave',
        capacity: 150,
        parkingAvailable: true,
    },
    {
        id: 'ven-002',
        name: 'Cebu IT Park Hub',
        city: 'Cebu',
        address: 'Cebu Business Park',
        capacity: 80,
        parkingAvailable: false,
    },
];

const SEED_SPEAKERS: Speaker[] = [
    {
        id: 'spk-001',
        name: 'Mark Anthony Estopace',
        title: 'Senior Software Engineer',
        company: 'Cambridge University Press & Assessment',
        expertise: ['Azure', 'AI', 'GitHub'],
        mvp: true,
    },
];

const SEED_SESSIONS: Session[] = [
    {
        id: 'ses-001',
        eventId: 'evt-001',
        title: 'Turn REST APIs into MCP Servers',
        speakerId: 'spk-001',
        track: 'AI',
        startTime: '09:00',
        endTime: '09:45',
        room: 'Main Hall',
        remainingSeats: 18,
    },
];

let seeded: Promise<void> | undefined;

function ensureSeeded(): Promise<void> {
    if (!seeded) {
        seeded = seedIfEmpty();
    }
    return seeded;
}

async function seedIfEmpty(): Promise<void> {
    await Promise.all([
        seedTable(EVENTS_TABLE, SEED_EVENTS, (e) => ({ partitionKey: 'event', rowKey: e.id, ...e })),
        seedTable(VENUES_TABLE, SEED_VENUES, (v) => ({ partitionKey: 'venue', rowKey: v.id, ...v })),
        seedTable(SPEAKERS_TABLE, SEED_SPEAKERS, (s) => ({
            partitionKey: 'speaker',
            rowKey: s.id,
            ...s,
            expertise: JSON.stringify(s.expertise),
        })),
        seedTable(SESSIONS_TABLE, SEED_SESSIONS, (s) => ({ partitionKey: s.eventId, rowKey: s.id, ...s })),
    ]);
}

async function seedTable<T extends { id: string }>(
    tableName: string,
    seedRows: T[],
    toEntity: (row: T) => Record<string, unknown>
): Promise<void> {
    const client = await getTableClient(tableName);
    const existing = client.listEntities();
    const iterator = existing[Symbol.asyncIterator]();
    const first = await iterator.next();
    if (!first.done) {
        return;
    }

    for (const row of seedRows) {
        await client.createEntity(toEntity(row) as any);
    }
}

async function listAll(tableName: string): Promise<Record<string, any>[]> {
    const client = await getTableClient(tableName);
    const rows: Record<string, any>[] = [];
    for await (const entity of client.listEntities()) {
        rows.push(entity);
    }
    return rows;
}

export async function getEvents(): Promise<Event[]> {
    await ensureSeeded();
    const rows = await listAll(EVENTS_TABLE);
    return rows.map((r) => ({
        id: r.rowKey,
        name: r.name,
        category: r.category,
        date: r.date,
        venueId: r.venueId,
        availableSlots: r.availableSlots,
    }));
}

export async function getVenues(): Promise<Venue[]> {
    await ensureSeeded();
    const rows = await listAll(VENUES_TABLE);
    return rows.map((r) => ({
        id: r.rowKey,
        name: r.name,
        city: r.city,
        address: r.address,
        capacity: r.capacity,
        parkingAvailable: r.parkingAvailable,
    }));
}

export async function getSpeakers(): Promise<Speaker[]> {
    await ensureSeeded();
    const rows = await listAll(SPEAKERS_TABLE);
    return rows.map((r) => ({
        id: r.rowKey,
        name: r.name,
        title: r.title,
        company: r.company,
        expertise: JSON.parse(r.expertise),
        mvp: r.mvp,
    }));
}

export async function getSessions(): Promise<Session[]> {
    await ensureSeeded();
    const rows = await listAll(SESSIONS_TABLE);
    return rows.map((r) => ({
        id: r.rowKey,
        eventId: r.eventId,
        title: r.title,
        speakerId: r.speakerId,
        track: r.track,
        startTime: r.startTime,
        endTime: r.endTime,
        room: r.room,
        remainingSeats: r.remainingSeats,
    }));
}

export async function getEventById(eventId: string): Promise<Event | undefined> {
    await ensureSeeded();
    const client = await getTableClient(EVENTS_TABLE);
    try {
        const r = await client.getEntity<Record<string, any>>('event', eventId);
        return {
            id: r.rowKey,
            name: r.name,
            category: r.category,
            date: r.date,
            venueId: r.venueId,
            availableSlots: r.availableSlots,
        };
    } catch (err: any) {
        if (err?.statusCode === 404) {
            return undefined;
        }
        throw err;
    }
}

export async function getSessionById(eventId: string, sessionId: string): Promise<Session | undefined> {
    await ensureSeeded();
    const client = await getTableClient(SESSIONS_TABLE);
    try {
        const r = await client.getEntity<Record<string, any>>(eventId, sessionId);
        return {
            id: r.rowKey,
            eventId: r.eventId,
            title: r.title,
            speakerId: r.speakerId,
            track: r.track,
            startTime: r.startTime,
            endTime: r.endTime,
            room: r.room,
            remainingSeats: r.remainingSeats,
        };
    } catch (err: any) {
        if (err?.statusCode === 404) {
            return undefined;
        }
        throw err;
    }
}

/** Atomically claims one seat using ETag optimistic concurrency; returns the seat number, or undefined if sold out. */
export async function claimSeat(eventId: string, sessionId: string): Promise<number | undefined> {
    const client = await getTableClient(SESSIONS_TABLE);

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const entity = await client.getEntity<Record<string, any>>(eventId, sessionId);
        const remainingSeats: number = entity.remainingSeats;

        if (remainingSeats <= 0) {
            return undefined;
        }

        try {
            await client.updateEntity(
                { partitionKey: eventId, rowKey: sessionId, remainingSeats: remainingSeats - 1 },
                'Merge',
                { etag: entity.etag }
            );
            return remainingSeats;
        } catch (err: any) {
            if (err?.statusCode === 412) {
                continue; // etag mismatch, retry
            }
            throw err;
        }
    }

    throw new Error('Could not claim a seat due to concurrent updates, please retry');
}

export async function addRegistration(registration: Registration): Promise<void> {
    const client = await getTableClient(REGISTRATIONS_TABLE);
    await client.createEntity({
        partitionKey: registration.eventId,
        rowKey: registration.registrationId,
        ...registration,
    } as any);
}

export function newRegistrationId(): string {
    return `REG-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}
