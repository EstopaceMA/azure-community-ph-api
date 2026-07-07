import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { addRegistration, claimSeat, getEventById, getSessionById, newRegistrationId } from '../data';
import { Registration } from '../models';

interface RegisterRequestBody {
    eventId: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    jobTitle: string;
}

const REQUIRED_FIELDS: (keyof RegisterRequestBody)[] = [
    'eventId',
    'sessionId',
    'firstName',
    'lastName',
    'email',
];

export async function register(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    let body: Partial<RegisterRequestBody>;
    try {
        body = (await request.json()) as Partial<RegisterRequestBody>;
    } catch {
        return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
    if (missing.length > 0) {
        return { status: 400, jsonBody: { error: `Missing required field(s): ${missing.join(', ')}` } };
    }

    const event = await getEventById(body.eventId!);
    if (!event) {
        return { status: 404, jsonBody: { error: `Event '${body.eventId}' not found` } };
    }

    const session = await getSessionById(body.eventId!, body.sessionId!);
    if (!session) {
        return { status: 404, jsonBody: { error: `Session '${body.sessionId}' not found for event '${body.eventId}'` } };
    }

    const seatNumber = await claimSeat(body.eventId!, body.sessionId!);
    if (seatNumber === undefined) {
        return { status: 409, jsonBody: { error: 'No remaining seats for this session' } };
    }

    const registrationId = newRegistrationId();
    const checkInCode = `AZMCP${event.date.slice(0, 4)}`;

    const registration: Registration = {
        registrationId,
        eventId: event.id,
        sessionId: session.id,
        firstName: body.firstName!,
        lastName: body.lastName!,
        email: body.email!,
        company: body.company ?? '',
        jobTitle: body.jobTitle ?? '',
        seatNumber,
        checkInCode,
        status: 'Confirmed',
    };

    await addRegistration(registration);

    return {
        status: 201,
        jsonBody: {
            registrationId: registration.registrationId,
            status: registration.status,
            eventName: event.name,
            sessionName: session.title,
            seatNumber: registration.seatNumber,
            checkInCode: registration.checkInCode,
        },
    };
}

app.http('register', {
    route: 'register',
    methods: ['POST'],
    authLevel: 'function',
    handler: register,
});
