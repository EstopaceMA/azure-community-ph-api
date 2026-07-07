import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getSessions as fetchSessions } from '../data';

export async function getSessions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const eventId = request.query.get('eventId');
    const speakerId = request.query.get('speakerId');
    const track = request.query.get('track');

    let result = await fetchSessions();

    if (eventId) {
        result = result.filter((s) => s.eventId === eventId);
    }

    if (speakerId) {
        result = result.filter((s) => s.speakerId === speakerId);
    }

    if (track) {
        result = result.filter((s) => s.track.toLowerCase() === track.toLowerCase());
    }

    return { jsonBody: result };
}

app.http('getSessions', {
    route: 'sessions',
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getSessions,
});
