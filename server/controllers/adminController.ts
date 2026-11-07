import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getDatabaseStatus, dbReseed, dbQuery } from '../db/connection.ts';

export async function getHealthStatus(req: Request, res: Response) {
  try {
    const status = await getDatabaseStatus();
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'CampusCore DBMS Backend',
      database: {
        activeEngine: status.activeEngine,
        mysqlConnected: status.mysqlConnected,
        mysqlHost: status.mysqlHost,
        mysqlPort: status.mysqlPort,
        mysqlDatabase: status.mysqlDatabase,
        tablesCount: status.tablesCount,
        totalRecords: status.totalRecordsCount,
        error: status.mysqlError
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
}

export async function getDbStatus(req: Request, res: Response) {
  try {
    const status = await getDatabaseStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function resetDatabase(req: Request, res: Response) {
  try {
    await dbReseed();
    const status = await getDatabaseStatus();
    res.json({
      success: true,
      message: 'Database has been successfully reseeded with official BCA semester 3 demo data.',
      data: status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getSqlScriptContent(req: Request, res: Response) {
  try {
    const { scriptName } = req.params;
    const allowed = ['campuscore_schema.sql', 'campuscore_seed.sql', 'dbms_lab_queries.sql', 'transactions_demo.sql', 'grant_revoke_security.sql', 'er_diagram.mermaid', 'NORMALIZATION.md', 'DATA_DICTIONARY.md'];

    if (!allowed.includes(scriptName)) {
      return res.status(403).json({ success: false, error: 'Unauthorized script access' });
    }

    const filePath = path.join(process.cwd(), 'database', scriptName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Script file not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({
      success: true,
      data: {
        scriptName,
        content
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await dbQuery(`
      SELECT user_id, username, full_name, email, role, is_active, created_at
      FROM users
    `);
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
