import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { Enrollment } from '../db/types.ts';

export async function getEnrollments(req: Request, res: Response) {
  try {
    const { course_id, semester_id, academic_year } = req.query;

    let sql = `
      SELECT 
        e.*,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.reg_number,
        c.name as course_name,
        sem.semester_number
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN courses c ON e.course_id = c.course_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (course_id) {
      sql += ` AND e.course_id = ?`;
      params.push(Number(course_id));
    }
    if (semester_id) {
      sql += ` AND e.semester_id = ?`;
      params.push(Number(semester_id));
    }
    if (academic_year) {
      sql += ` AND e.academic_year = ?`;
      params.push(academic_year);
    }

    sql += ` ORDER BY e.enrollment_date DESC`;

    const enrollments = await dbQuery<Enrollment>(sql, params);
    res.json({ success: true, data: enrollments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createEnrollment(req: Request, res: Response) {
  try {
    const { student_id, course_id, semester_id, academic_year, enrollment_date, status } = req.body;

    if (!student_id || !course_id || !semester_id || !academic_year) {
      return res.status(400).json({ success: false, error: 'Student, Course, Semester, and Academic Year are required' });
    }

    // Check duplicate enrollment (UNIQUE: student_id, semester_id, academic_year)
    const existing = await dbQuery(`
      SELECT enrollment_id FROM enrollments 
      WHERE student_id = ? AND semester_id = ? AND academic_year = ?
    `, [student_id, semester_id, academic_year]);

    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Student is already enrolled in this semester and academic year.' });
    }

    const result = await dbExecute(`
      INSERT INTO enrollments (student_id, course_id, semester_id, academic_year, enrollment_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      Number(student_id),
      Number(course_id),
      Number(semester_id),
      academic_year,
      enrollment_date || new Date().toISOString().split('T')[0],
      status || 'Active'
    ]);

    // Update student's current_semester_id
    await dbExecute(`
      UPDATE students SET current_semester_id = ? WHERE student_id = ?
    `, [semester_id, student_id]);

    res.status(201).json({ success: true, data: { enrollment_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
