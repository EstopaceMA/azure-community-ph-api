import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getEvents as fetchEvents, getVenues as fetchVenues } from '../data';

export async function getEvents(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const city = request.query.get('city');
    const category = request.query.get('category');
    const date = request.query.get('date');
    const limit = request.query.get('limit');

    let result = await fetchEvents();

    if (category) {
        result = result.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }

    if (date) {
        result = result.filter((e) => e.date === date);
    }

    if (city) {
        const venues = await fetchVenues();
        const venueIds = new Set(
            venues.filter((v) => v.city.toLowerCase() === city.toLowerCase()).map((v) => v.id)
        );
        result = result.filter((e) => venueIds.has(e.venueId));
    }

    if (limit) {
        const n = parseInt(limit, 10);
        if (!Number.isNaN(n)) {
            result = result.slice(0, n);
        }
    }

    return { jsonBody: result };
}

app.http('getEvents', {
    route: 'events',
    methods: ['GET'],
    authLevel: 'function',
    handler: getEvents,
});
