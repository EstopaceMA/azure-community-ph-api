import { TableClient } from '@azure/data-tables';

const connectionString = process.env.AzureWebJobsStorage || 'UseDevelopmentStorage=true';

const clients = new Map<string, TableClient>();

export async function getTableClient(tableName: string): Promise<TableClient> {
    const cached = clients.get(tableName);
    if (cached) {
        return cached;
    }

    const client = TableClient.fromConnectionString(connectionString, tableName, {
        allowInsecureConnection: true,
    });

    try {
        await client.createTable();
    } catch (err: any) {
        if (err?.statusCode !== 409) {
            throw err;
        }
    }

    clients.set(tableName, client);
    return client;
}
