import initSqlJs from 'sql.js';
import type { Database, SqlValue } from 'sql.js';
import { DDL_STATEMENTS, VIEW_STATEMENTS } from './schema.ts';
import { SEED_DATA } from './seedData.ts';

let dbInstance: Database | null = null;

const TABLE_COLUMNS: Record<string, string[]> = {
  departments: ['department_id', 'code', 'name', 'established_year', 'building', 'head_of_dept'],
  courses: ['course_id', 'code', 'name', 'department_id', 'duration_years', 'total_semesters', 'degree_level'],
  semesters: ['semester_id', 'course_id', 'semester_number', 'academic_year', 'term', 'start_date', 'end_date', 'is_current'],
  faculty: ['faculty_id', 'employee_code', 'first_name', 'last_name', 'email', 'phone', 'department_id', 'designation', 'qualification', 'joining_date', 'status'],
  subjects: ['subject_id', 'code', 'name', 'credits', 'course_id', 'semester_number', 'subject_type', 'max_internal_marks', 'max_exam_marks'],
  faculty_subject_assignments: ['assignment_id', 'faculty_id', 'subject_id', 'academic_year', 'semester_id', 'assigned_date'],
  students: ['student_id', 'reg_number', 'first_name', 'last_name', 'email', 'phone', 'dob', 'gender', 'blood_group', 'address', 'city', 'state', 'admission_date', 'current_semester_id', 'status'],
  enrollments: ['enrollment_id', 'student_id', 'course_id', 'semester_id', 'academic_year', 'enrollment_date', 'status'],
  attendance: ['attendance_id', 'student_id', 'subject_id', 'attendance_date', 'status', 'remarks', 'recorded_by_faculty_id'],
  assessments: ['assessment_id', 'subject_id', 'semester_id', 'name', 'assessment_type', 'max_marks', 'weightage_percent', 'conduct_date'],
  marks: ['mark_id', 'assessment_id', 'student_id', 'marks_obtained', 'is_absent', 'remarks'],
  fee_records: ['fee_record_id', 'student_id', 'semester_id', 'fee_type', 'amount_due', 'due_date'],
  fee_payments: ['payment_id', 'fee_record_id', 'receipt_number', 'amount_paid', 'payment_date', 'payment_mode', 'transaction_ref', 'notes'],
  student_feedback: ['feedback_id', 'student_id', 'faculty_id', 'subject_id', 'rating', 'category', 'comments', 'status'],
  users: ['user_id', 'username', 'password_hash', 'full_name', 'email', 'role', 'linked_id', 'is_active']
};

export async function getSqlEngine(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  dbInstance = new SQL.Database();

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Create tables
  for (const ddl of DDL_STATEMENTS) {
    try {
      dbInstance.run(ddl);
    } catch (err: any) {
      console.error('Error executing DDL:', ddl, err?.message);
    }
  }

  // Create views
  for (const view of VIEW_STATEMENTS) {
    try {
      dbInstance.run(view);
    } catch (err: any) {
      console.error('Error creating view:', err?.message);
    }
  }

  // Populate seed data
  populateSeedData(dbInstance);

  return dbInstance;
}

function populateSeedData(db: Database) {
  const tableNames = Object.keys(SEED_DATA) as (keyof typeof SEED_DATA)[];
  for (const table of tableNames) {
    const rows = SEED_DATA[table];
    if (!rows || rows.length === 0) continue;

    // Check if table already has rows
    try {
      const check = db.exec(`SELECT COUNT(*) as cnt FROM ${table}`);
      const count = check[0]?.values[0]?.[0] as number;
      if (count > 0) continue;
    } catch {
      // Table might not exist yet
    }

    const cols = TABLE_COLUMNS[table];
    const colList = cols ? `(${cols.join(', ')})` : '';
    const colCount = cols ? cols.length : rows[0].length;
    const placeholders = Array(colCount).fill('?').join(', ');
    const sql = `INSERT INTO ${table} ${colList} VALUES (${placeholders})`;

    for (const row of rows) {
      try {
        db.run(sql, row as SqlValue[]);
      } catch (err: any) {
        console.warn(`Seed insert error for ${table}:`, err?.message);
      }
    }
  }
}

export async function reseedSqlEngine(): Promise<void> {
  if (!dbInstance) {
    await getSqlEngine();
    return;
  }

  // Drop existing views and tables
  const tables = [
    'users', 'student_feedback', 'fee_payments', 'fee_records',
    'marks', 'assessments', 'attendance', 'enrollments',
    'faculty_subject_assignments', 'subjects', 'faculty',
    'students', 'semesters', 'courses', 'departments'
  ];

  for (const view of ['v_student_academic_summary', 'v_fee_summary', 'v_faculty_workload']) {
    try {
      dbInstance.run(`DROP VIEW IF EXISTS ${view}`);
    } catch {}
  }

  for (const table of tables) {
    try {
      dbInstance.run(`DROP TABLE IF EXISTS ${table}`);
    } catch {}
  }

  // Re-run DDL
  for (const ddl of DDL_STATEMENTS) {
    dbInstance.run(ddl);
  }

  for (const view of VIEW_STATEMENTS) {
    dbInstance.run(view);
  }

  populateSeedData(dbInstance);
}

export async function runQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getSqlEngine();

  try {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params as SqlValue[]);
    }

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  } catch (err: any) {
    console.error(`Query Error [${sql}]:`, err?.message);
    throw err;
  }
}

export async function executeStatement(
  sql: string,
  params: any[] = []
): Promise<{ insertId?: number; affectedRows: number }> {
  const db = await getSqlEngine();
  try {
    db.run(sql, params as SqlValue[]);
    const lastIdRes = db.exec('SELECT last_insert_rowid() AS id');
    const insertId = lastIdRes[0]?.values[0]?.[0] as number | undefined;
    const changesRes = db.exec('SELECT changes() AS affected');
    const affectedRows = (changesRes[0]?.values[0]?.[0] as number) || 1;
    return { insertId, affectedRows };
  } catch (err: any) {
    console.error(`Execution Error [${sql}]:`, err?.message);
    throw err;
  }
}

export async function executeRawSql(sql: string): Promise<{
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTimeMs: number;
}> {
  const db = await getSqlEngine();
  const start = performance.now();

  try {
    const results = db.exec(sql);
    const duration = Math.round((performance.now() - start) * 100) / 100;

    if (!results || results.length === 0) {
      return {
        columns: ['Status'],
        rows: [['Query executed successfully (0 rows returned or DDL/DML statement)']],
        rowCount: 0,
        executionTimeMs: duration
      };
    }

    const first = results[0];
    const columns = first.columns;
    const rows = first.values.map(vals => {
      const obj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        obj[col] = vals[idx];
      });
      return obj;
    });

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs: duration
    };
  } catch (err: any) {
    const duration = Math.round((performance.now() - start) * 100) / 100;
    throw new Error(`SQL Execution Failed: ${err?.message} (${duration}ms)`);
  }
}
