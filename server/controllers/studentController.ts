import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { Student } from '../db/types.ts';

export async function getStudents(req: Request, res: Response) {
  try {
    const { search, semester, status } = req.query;

    let sql = `
      SELECT 
        s.*,
        c.name as course_name,
        sem.semester_number,
        sem.academic_year
      FROM students s
      LEFT JOIN semesters sem ON s.current_semester_id = sem.semester_id
      LEFT JOIN courses c ON sem.course_id = c.course_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.reg_number LIKE ? OR s.email LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (semester) {
      sql += ` AND sem.semester_number = ?`;
      params.push(Number(semester));
    }

    if (status) {
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY s.student_id ASC`;

    const students = await dbQuery<Student>(sql, params);
    res.json({ success: true, data: students });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStudentById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const students = await dbQuery<Student>(`
      SELECT 
        s.*,
        c.name as course_name,
        sem.semester_number,
        sem.academic_year
      FROM students s
      LEFT JOIN semesters sem ON s.current_semester_id = sem.semester_id
      LEFT JOIN courses c ON sem.course_id = c.course_id
      WHERE s.student_id = ?
    `, [id]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const student = students[0];

    // Fetch enrollments
    const enrollments = await dbQuery(`
      SELECT e.*, c.name as course_name, sem.semester_number
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
      WHERE e.student_id = ?
    `, [id]);

    // Fetch attendance stats
    const attendance = await dbQuery(`
      SELECT 
        sub.name as subject_name,
        COUNT(a.attendance_id) as total_classes,
        SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) as attended,
        ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id), 1) as percentage
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.subject_id
      WHERE a.student_id = ?
      GROUP BY sub.name
    `, [id]);

    // Fetch marks
    const marks = await dbQuery(`
      SELECT 
        asm.name as assessment_name,
        asm.assessment_type,
        asm.max_marks,
        sub.name as subject_name,
        m.marks_obtained,
        m.is_absent,
        m.remarks
      FROM marks m
      JOIN assessments asm ON m.assessment_id = asm.assessment_id
      JOIN subjects sub ON asm.subject_id = sub.subject_id
      WHERE m.student_id = ?
    `, [id]);

    // Fetch fee records & payments
    const fees = await dbQuery(`
      SELECT 
        fr.fee_record_id,
        fr.fee_type,
        fr.amount_due,
        fr.due_date,
        COALESCE(SUM(fp.amount_paid), 0) as paid_amount,
        (fr.amount_due - COALESCE(SUM(fp.amount_paid), 0)) as balance
      FROM fee_records fr
      LEFT JOIN fee_payments fp ON fr.fee_record_id = fp.fee_record_id
      WHERE fr.student_id = ?
      GROUP BY fr.fee_record_id, fr.fee_type, fr.amount_due, fr.due_date
    `, [id]);

    res.json({
      success: true,
      data: {
        student,
        enrollments,
        attendance,
        marks,
        fees
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createStudent(req: Request, res: Response) {
  try {
    const {
      reg_number,
      first_name,
      last_name,
      email,
      phone,
      dob,
      gender,
      blood_group,
      address,
      city,
      state,
      admission_date,
      current_semester_id,
      status
    } = req.body;

    // Validation
    if (!reg_number || !first_name || !last_name || !email || !phone || !dob || !admission_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: Registration Number, Names, Email, Phone, DOB, and Admission Date are mandatory.'
      });
    }

    // Check unique reg_number
    const existingReg = await dbQuery('SELECT student_id FROM students WHERE reg_number = ?', [reg_number]);
    if (existingReg.length > 0) {
      return res.status(409).json({ success: false, error: `Student registration number '${reg_number}' already exists.` });
    }

    // Check unique email
    const existingEmail = await dbQuery('SELECT student_id FROM students WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ success: false, error: `Student email '${email}' already registered.` });
    }

    const result = await dbExecute(`
      INSERT INTO students (
        reg_number, first_name, last_name, email, phone, dob, gender,
        blood_group, address, city, state, admission_date, current_semester_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reg_number,
      first_name,
      last_name,
      email,
      phone,
      dob,
      gender || 'Other',
      blood_group || 'O+',
      address || '',
      city || '',
      state || '',
      admission_date,
      current_semester_id || null,
      status || 'Active'
    ]);

    res.status(201).json({
      success: true,
      data: { student_id: result.insertId, message: 'Student registered successfully' }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      dob,
      gender,
      blood_group,
      address,
      city,
      state,
      current_semester_id,
      status
    } = req.body;

    // Check student existence
    const existing = await dbQuery('SELECT student_id FROM students WHERE student_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    await dbExecute(`
      UPDATE students SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        dob = ?,
        gender = ?,
        blood_group = ?,
        address = ?,
        city = ?,
        state = ?,
        current_semester_id = ?,
        status = ?
      WHERE student_id = ?
    `, [
      first_name,
      last_name,
      email,
      phone,
      dob,
      gender,
      blood_group,
      address,
      city,
      state,
      current_semester_id || null,
      status,
      id
    ]);

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await dbQuery('SELECT student_id, reg_number FROM students WHERE student_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Cascade delete related records
    await dbExecute('DELETE FROM attendance WHERE student_id = ?', [id]);
    await dbExecute('DELETE FROM marks WHERE student_id = ?', [id]);
    await dbExecute('DELETE FROM enrollments WHERE student_id = ?', [id]);
    await dbExecute('DELETE FROM student_feedback WHERE student_id = ?', [id]);
    // Fee payments for fee records
    const feeRecords: any = await dbQuery('SELECT fee_record_id FROM fee_records WHERE student_id = ?', [id]);
    for (const fr of feeRecords) {
      await dbExecute('DELETE FROM fee_payments WHERE fee_record_id = ?', [fr.fee_record_id]);
    }
    await dbExecute('DELETE FROM fee_records WHERE student_id = ?', [id]);
    await dbExecute('DELETE FROM students WHERE student_id = ?', [id]);

    res.json({ success: true, message: `Student ${existing[0].reg_number} deleted successfully along with associated records.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
