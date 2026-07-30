import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

declare global {
  var playPostgresPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não foi configurada");
  }

  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_SIZE || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function getPool() {
  if (!global.playPostgresPool) {
    global.playPostgresPool = createPool();
  }
  return global.playPostgresPool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
