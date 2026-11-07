import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { Department, Course, Semester, Subject } from '../db/types.ts';

// -----------------------------------------------------------------------------
// DEPARTMENTS
// -----------------------------------------------------------------------------
export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await dbQuery<Department>(`
      SELECT 
        d.*,
        COUNT(DISTINCT c.course_id) as total_courses,
        COUNT(DISTINCT f.faculty_id) as total_faculty
      FROM departments d
      LEFT JOIN courses c ON d.department_id = c.department_id
      LEFT JOIN faculty f ON d.department_id = f.department_id
      GROUP BY d.department_id, d.code, d.name, d.established_year, d.building, d.head_of_dept
      ORDER BY d.department_id ASC
    `);
    res.json({ success: true, data: departments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createDepartment(req: Request, res: Response) {
  try {
    const { code, name, established_year, building, head_of_dept } = req.body;
    if (!code || !name || !established_year || !building) {
      return res.status(400).json({ success: false, error: 'Code, Name, Year, and Building are required' });
    }

    const result = await dbExecute(`
      INSERT INTO departments (code, name, established_year, building, head_of_dept)
      VALUES (?, ?, ?, ?, ?)
    `, [code, name, Number(established_year), building, head_of_dept || null]);

    res.status(201).json({ success: true, data: { department_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// -----------------------------------------------------------------------------
// COURSES
// -----------------------------------------------------------------------------
export async function getCourses(req: Request, res: Response) {
  try {
    const courses = await dbQuery<Course>(`
      SELECT 
        c.*,
        d.name as department_name,
        COUNT(DISTINCT sem.semester_id) as total_semesters_count,
        COUNT(DISTINCT sub.subject_id) as total_subjects_count
      FROM courses c
      JOIN departments d ON c.department_id = d.department_id
      LEFT JOIN semesters sem ON c.course_id = sem.course_id
      LEFT JOIN subjects sub ON c.course_id = sub.course_id
      GROUP BY c.course_id, c.code, c.name, c.department_id, c.duration_years, c.total_semesters, c.degree_level, d.name
      ORDER BY c.course_id ASC
    `);
    res.json({ success: true, data: courses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCourse(req: Request, res: Response) {
  try {
    const { code, name, department_id, duration_years, total_semesters, degree_level } = req.body;
    if (!code || !name || !department_id) {
      return res.status(400).json({ success: false, error: 'Code, Name, and Department are required' });
    }

    const result = await dbExecute(`
      INSERT INTO courses (code, name, department_id, duration_years, total_semesters, degree_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      code,
      name,
      Number(department_id),
      Number(duration_years) || 3,
      Number(total_semesters) || 6,
      degree_level || 'Undergraduate'
    ]);

    res.status(201).json({ success: true, data: { course_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// -----------------------------------------------------------------------------
// SEMESTERS
// -----------------------------------------------------------------------------
export async function getSemesters(req: Request, res: Response) {
  try {
    const { course_id } = req.query;
    let sql = `
      SELECT sem.*, c.name as course_name, c.code as course_code
      FROM semesters sem
      JOIN courses c ON sem.course_id = c.course_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (course_id) {
      sql += ` AND sem.course_id = ?`;
      params.push(Number(course_id));
    }
    sql += ` ORDER BY c.code, sem.semester_number ASC`;

    const semesters = await dbQuery<Semester>(sql, params);
    res.json({ success: true, data: semesters });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createSemester(req: Request, res: Response) {
  try {
    const { course_id, semester_number, academic_year, term, start_date, end_date, is_current } = req.body;
    if (!course_id || !semester_number || !academic_year || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const result = await dbExecute(`
      INSERT INTO semesters (course_id, semester_number, academic_year, term, start_date, end_date, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      Number(course_id),
      Number(semester_number),
      academic_year,
      term || 'Odd',
      start_date,
      end_date,
      is_current ? 1 : 0
    ]);

    res.status(201).json({ success: true, data: { semester_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// -----------------------------------------------------------------------------
// SUBJECTS
// -----------------------------------------------------------------------------
export async function getSubjects(req: Request, res: Response) {
  try {
    const { course_id, semester_number } = req.query;
    let sql = `
      SELECT 
        sub.*,
        c.name as course_name,
        c.code as course_code
      FROM subjects sub
      JOIN courses c ON sub.course_id = c.course_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (course_id) {
      sql += ` AND sub.course_id = ?`;
      params.push(Number(course_id));
    }
    if (semester_number) {
      sql += ` AND sub.semester_number = ?`;
      params.push(Number(semester_number));
    }
    sql += ` ORDER BY sub.semester_number, sub.code ASC`;

    const subjects = await dbQuery<Subject>(sql, params);
    res.json({ success: true, data: subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createSubject(req: Request, res: Response) {
  try {
    const { code, name, credits, course_id, semester_number, subject_type, max_internal_marks, max_exam_marks } = req.body;
    if (!code || !name || !credits || !course_id || !semester_number) {
      return res.status(400).json({ success: false, error: 'Code, Name, Credits, Course, and Semester are required' });
    }

    const result = await dbExecute(`
      INSERT INTO subjects (code, name, credits, course_id, semester_number, subject_type, max_internal_marks, max_exam_marks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      name,
      Number(credits),
      Number(course_id),
      Number(semester_number),
      subject_type || 'Theory',
      Number(max_internal_marks) || 30,
      Number(max_exam_marks) || 70
    ]);

    res.status(201).json({ success: true, data: { subject_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
