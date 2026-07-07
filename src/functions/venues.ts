import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getVenues as fetchVenues } from '../data';

export async function getVenues(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const city = request.query.get('city');
    const capacity = request.query.get('capacity');

    let result = await fetchVenues();

    if (city) {
        result = result.filter((v) => v.city.toLowerCase() === city.toLowerCase());
    }

    if (capacity) {
        const min = parseInt(capacity, 10);
        if (!Number.isNaN(min)) {
            result = result.filter((v) => v.capacity >= min);
        }
    }

    return { jsonBody: result };
}

app.http('getVenues', {
    route: 'venues',
    methods: ['GET'],
    authLevel: 'function',
    handler: getVenues,
});
