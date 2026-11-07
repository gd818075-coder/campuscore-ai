import mysql, { Pool, PoolOptions } from 'mysql2/promise';

let pool: Pool | null = null;
let lastConnectionAttempt: { success: boolean; error?: string; timestamp: Date } = {
  success: false,
  timestamp: new Date()
};

export function getMySqlConfig(): PoolOptions {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'campuscore_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campuscore_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    connectTimeout: 2000,
    waitForConnections: true,
    queueLimit: 0,
    multipleStatements: true
  };
}

export async function testMySqlConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const config = getMySqlConfig();
    const testPool = mysql.createPool(config);
    const connection = await testPool.getConnection();
    await connection.ping();
    connection.release();
    await testPool.end();

    lastConnectionAttempt = { success: true, timestamp: new Date() };
    return { connected: true };
  } catch (err: any) {
    const msg = err?.message || 'Failed to connect to MySQL';
    lastConnectionAttempt = { success: false, error: msg, timestamp: new Date() };
    return { connected: false, error: msg };
  }
}

export function getMySqlPool(): Pool | null {
  if (!pool && lastConnectionAttempt.success) {
    try {
      pool = mysql.createPool(getMySqlConfig());
    } catch {
      pool = null;
    }
  }
  return pool;
}

export function getLastMySqlAttempt() {
  return lastConnectionAttempt;
}
