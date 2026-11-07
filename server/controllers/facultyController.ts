import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { FacultyMember } from '../db/types.ts';

export async function getFaculty(req: Request, res: Response) {
  try {
    const { department_id, status } = req.query;

    let sql = `
      SELECT 
        f.*,
        d.name as department_name,
        d.code as department_code
      FROM faculty f
      JOIN departments d ON f.department_id = d.department_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (department_id) {
      sql += ` AND f.department_id = ?`;
      params.push(Number(department_id));
    }
    if (status) {
      sql += ` AND f.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY f.faculty_id ASC`;

    const facultyList = await dbQuery<FacultyMember>(sql, params);

    // Attach assigned subjects for each faculty
    for (const f of facultyList) {
      const assignments = await dbQuery(`
        SELECT sub.code, sub.name, fsa.academic_year
        FROM faculty_subject_assignments fsa
        JOIN subjects sub ON fsa.subject_id = sub.subject_id
        WHERE fsa.faculty_id = ?
      `, [f.faculty_id]);
      f.assigned_subjects = assignments.map((a: any) => `${a.code}: ${a.name} (${a.academic_year})`);
    }

    res.json({ success: true, data: facultyList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createFaculty(req: Request, res: Response) {
  try {
    const {
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      designation,
      qualification,
      joining_date,
      status
    } = req.body;

    if (!employee_code || !first_name || !last_name || !email || !department_id) {
      return res.status(400).json({ success: false, error: 'Employee Code, Names, Email, and Department are required' });
    }

    const existing = await dbQuery('SELECT faculty_id FROM faculty WHERE employee_code = ? OR email = ?', [employee_code, email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Employee Code or Email already registered' });
    }

    const result = await dbExecute(`
      INSERT INTO faculty (
        employee_code, first_name, last_name, email, phone, department_id,
        designation, qualification, joining_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employee_code,
      first_name,
      last_name,
      email,
      phone || '',
      Number(department_id),
      designation || 'Assistant Professor',
      qualification || 'M.Tech / M.Sc',
      joining_date || new Date().toISOString().split('T')[0],
      status || 'Active'
    ]);

    res.status(201).json({ success: true, data: { faculty_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function assignSubjectToFaculty(req: Request, res: Response) {
  try {
    const { faculty_id, subject_id, academic_year, semester_id } = req.body;

    if (!faculty_id || !subject_id || !academic_year || !semester_id) {
      return res.status(400).json({ success: false, error: 'Faculty, Subject, Academic Year, and Semester are required' });
    }

    // Check duplicate assignment
    const existing = await dbQuery(`
      SELECT assignment_id FROM faculty_subject_assignments
      WHERE faculty_id = ? AND subject_id = ? AND academic_year = ?
    `, [faculty_id, subject_id, academic_year]);

    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'This subject is already assigned to the faculty for this academic year' });
    }

    const result = await dbExecute(`
      INSERT INTO faculty_subject_assignments (faculty_id, subject_id, academic_year, semester_id, assigned_date)
      VALUES (?, ?, ?, ?, ?)
    `, [
      Number(faculty_id),
      Number(subject_id),
      academic_year,
      Number(semester_id),
      new Date().toISOString().split('T')[0]
    ]);

    res.status(201).json({ success: true, data: { assignment_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
