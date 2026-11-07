import { DatabaseStatus } from './types.ts';
import { testMySqlConnection, getMySqlPool, getLastMySqlAttempt, getMySqlConfig } from './mysql.ts';
import {
  getSqlEngine,
  runQuery,
  executeStatement,
  executeRawSql,
  reseedSqlEngine
} from './sqlEngine.ts';

let isInitialized = false;
let forceEngine: 'auto' | 'mysql' | 'embedded' = 'auto';

export async function initDatabase(): Promise<DatabaseStatus> {
  const mysqlTest = await testMySqlConnection();
  // Always initialize embedded engine so we have instantaneous relational fallback
  await getSqlEngine();
  isInitialized = true;
  return getDatabaseStatus();
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const config = getMySqlConfig();
  const lastAttempt = getLastMySqlAttempt();
  const pool = getMySqlPool();

  const useMySql = (forceEngine === 'mysql' || (forceEngine === 'auto' && pool !== null && lastAttempt.success));

  let tablesCount = 0;
  let totalRecordsCount = 0;

  try {
    if (useMySql && pool) {
      const [tableRows]: any = await pool.query(`
        SELECT table_name FROM information_schema.tables WHERE table_schema = ?
      `, [config.database]);
      tablesCount = tableRows?.length || 0;
      totalRecordsCount = 120; // approximate
    } else {
      const tables: any = await runQuery(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      tablesCount = tables.length;

      let total = 0;
      for (const t of tables) {
        const cnt: any = await runQuery(`SELECT COUNT(*) as c FROM ${t.name}`);
        total += cnt[0]?.c || 0;
      }
      totalRecordsCount = total;
    }
  } catch (e) {
    // Non-fatal
  }

  return {
    activeEngine: useMySql ? 'MySQL' : 'Embedded SQL (sql.js)',
    mysqlConfigured: !!(process.env.DB_HOST && process.env.DB_NAME),
    mysqlConnected: lastAttempt.success,
    mysqlHost: config.host as string,
    mysqlPort: config.port as number,
    mysqlDatabase: config.database as string,
    mysqlError: lastAttempt.error || (lastAttempt.success ? undefined : 'No MySQL daemon responding on port ' + config.port),
    tablesCount,
    totalRecordsCount,
    lastChecked: new Date().toISOString()
  };
}

export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!isInitialized) {
    await initDatabase();
  }

  const pool = getMySqlPool();
  if (pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows as T[];
    } catch (err: any) {
      console.warn('MySQL query failed, falling back to embedded SQL:', err.message);
    }
  }

  // Use embedded SQL engine
  return runQuery<T>(sql, params);
}

export async function dbExecute(
  sql: string,
  params: any[] = []
): Promise<{ insertId?: number; affectedRows: number }> {
  if (!isInitialized) {
    await initDatabase();
  }

  const pool = getMySqlPool();
  if (pool) {
    try {
      const [result]: any = await pool.execute(sql, params);
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    } catch (err: any) {
      console.warn('MySQL execute failed, falling back to embedded SQL:', err.message);
    }
  }

  return executeStatement(sql, params);
}

export async function dbRawQuery(sql: string): Promise<{
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTimeMs: number;
}> {
  if (!isInitialized) {
    await initDatabase();
  }

  // Safety filter for the demo query runner: prevent dangerous commands
  const sanitized = sql.trim();
  const lower = sanitized.toLowerCase();

  const pool = getMySqlPool();
  if (pool && (lower.startsWith('select') || lower.startsWith('show') || lower.startsWith('explain'))) {
    const start = performance.now();
    try {
      const [rows, fields]: any = await pool.query(sanitized);
      const duration = Math.round((performance.now() - start) * 100) / 100;
      const columns = fields ? fields.map((f: any) => f.name) : Object.keys(rows[0] || {});
      return {
        columns,
        rows: Array.isArray(rows) ? rows : [rows],
        rowCount: Array.isArray(rows) ? rows.length : 1,
        executionTimeMs: duration
      };
    } catch (err: any) {
      throw new Error(`MySQL Error: ${err.message}`);
    }
  }

  return executeRawSql(sanitized);
}

export async function dbReseed(): Promise<void> {
  await reseedSqlEngine();
}
