import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

const hasSqlConfig = Boolean(
  (process.env.SQL_HOST && process.env.SQL_HOST.trim().length > 0) ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0)
);

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!hasSqlConfig) {
    return null;
  }
  if (!global._postgresPool) {
    global._postgresPool = process.env.DATABASE_URL
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 10,
          connectionTimeoutMillis: 5000,
        })
      : new Pool({
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 10,
          connectionTimeoutMillis: 5000,
        });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('[Cloud SQL] Idle pool client warning:', err?.message);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

let db: any;
if (pool) {
  try {
    db = drizzle(pool, { schema });
  } catch {
    console.warn('[AI Studio] Database not connected — using mock');
  }
}

if (!db) {
  console.warn('[AI Studio] SQL configuration not detected — active in-memory mock fallback');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };

  const mockQueryChain: any = () => mockQueryChain;
  mockQueryChain.from = () => mockQueryChain;
  mockQueryChain.where = () => mockQueryChain;
  mockQueryChain.orderBy = () => Promise.resolve([]);
  mockQueryChain.values = (d: any) => ({
    returning: async () => (Array.isArray(d) ? d : [d]),
    onConflictDoUpdate: () => ({
      returning: async () => (Array.isArray(d) ? d : [d]),
    }),
  });
  mockQueryChain.set = () => ({
    where: () => ({
      returning: async () => [],
    }),
  });
  mockQueryChain.then = (resolve: any) => Promise.resolve([]).then(resolve);

  db = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'query') return new Proxy({}, { get: () => noOp });
      if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        return () => mockQueryChain;
      }
      return async () => [];
    },
  });
}

export { db };

