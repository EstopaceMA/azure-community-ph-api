import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getSpeakers as fetchSpeakers } from '../data';

export async function getSpeakers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name');
    const expertise = request.query.get('expertise');
    const mvp = request.query.get('mvp');

    let result = await fetchSpeakers();

    if (name) {
        const term = name.toLowerCase();
        result = result.filter((s) => s.name.toLowerCase().includes(term));
    }

    if (expertise) {
        const term = expertise.toLowerCase();
        result = result.filter((s) => s.expertise.some((e) => e.toLowerCase() === term));
    }

    if (mvp) {
        const wantMvp = mvp.toLowerCase() === 'true';
        result = result.filter((s) => s.mvp === wantMvp);
    }

    return { jsonBody: result };
}

app.http('getSpeakers', {
    route: 'speakers',
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getSpeakers,
});
