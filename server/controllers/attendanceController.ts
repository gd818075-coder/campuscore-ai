import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { AttendanceRecord } from '../db/types.ts';

export async function getAttendanceRecords(req: Request, res: Response) {
  try {
    const { subject_id, date, student_id } = req.query;

    let sql = `
      SELECT 
        a.*,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.reg_number,
        sub.name as subject_name,
        sub.code as subject_code,
        (f.first_name || ' ' || f.last_name) as faculty_name
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      JOIN subjects sub ON a.subject_id = sub.subject_id
      LEFT JOIN faculty f ON a.recorded_by_faculty_id = f.faculty_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subject_id) {
      sql += ` AND a.subject_id = ?`;
      params.push(Number(subject_id));
    }
    if (date) {
      sql += ` AND a.attendance_date = ?`;
      params.push(date);
    }
    if (student_id) {
      sql += ` AND a.student_id = ?`;
      params.push(Number(student_id));
    }

    sql += ` ORDER BY a.attendance_date DESC, s.reg_number ASC`;

    const records = await dbQuery<AttendanceRecord>(sql, params);
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAttendanceSummary(req: Request, res: Response) {
  try {
    const { subject_id, threshold = 75 } = req.query;

    let sql = `
      SELECT 
        s.student_id,
        s.reg_number,
        (s.first_name || ' ' || s.last_name) as student_name,
        sub.subject_id,
        sub.code as subject_code,
        sub.name as subject_name,
        COUNT(a.attendance_id) as total_sessions,
        SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) as attended_sessions,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_sessions,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_sessions,
        SUM(CASE WHEN a.status = 'Excused' THEN 1 ELSE 0 END) as excused_sessions
      FROM students s
      JOIN subjects sub ON 1=1
      LEFT JOIN attendance a ON s.student_id = a.student_id AND sub.subject_id = a.subject_id
      WHERE s.status = 'Active'
    `;
    const params: any[] = [];

    if (subject_id) {
      sql += ` AND sub.subject_id = ?`;
      params.push(Number(subject_id));
    }

    sql += `
      GROUP BY s.student_id, s.reg_number, s.first_name, s.last_name, sub.subject_id, sub.code, sub.name
      HAVING total_sessions > 0
      ORDER BY sub.code ASC, s.reg_number ASC
    `;

    const rawSummary: any[] = await dbQuery(sql, params);

    const summary = rawSummary.map(row => {
      const total = Number(row.total_sessions);
      const attended = Number(row.attended_sessions);
      const pct = total > 0 ? Math.round((attended / total) * 1000) / 10 : null;
      return {
        ...row,
        total_sessions: total,
        attended_sessions: attended,
        attendance_percentage: pct, // null if 0 recorded sessions to avoid misleading 0%
        hasWarning: pct !== null && pct < Number(threshold)
      };
    });

    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function recordSingleAttendance(req: Request, res: Response) {
  try {
    const { student_id, subject_id, attendance_date, status, remarks, recorded_by_faculty_id } = req.body;

    if (!student_id || !subject_id || !attendance_date || !status) {
      return res.status(400).json({ success: false, error: 'Student, Subject, Date, and Status are required' });
    }

    // Check duplicate attendance for same student, subject, and date
    const existing = await dbQuery(`
      SELECT attendance_id FROM attendance 
      WHERE student_id = ? AND subject_id = ? AND attendance_date = ?
    `, [student_id, subject_id, attendance_date]);

    if (existing.length > 0) {
      // Update existing record
      await dbExecute(`
        UPDATE attendance SET status = ?, remarks = ?, recorded_by_faculty_id = ?
        WHERE attendance_id = ?
      `, [status, remarks || null, recorded_by_faculty_id || null, existing[0].attendance_id]);

      return res.json({
        success: true,
        message: 'Attendance record updated successfully',
        data: { attendance_id: existing[0].attendance_id, updated: true }
      });
    }

    const result = await dbExecute(`
      INSERT INTO attendance (student_id, subject_id, attendance_date, status, remarks, recorded_by_faculty_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      Number(student_id),
      Number(subject_id),
      attendance_date,
      status,
      remarks || null,
      recorded_by_faculty_id || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: { attendance_id: result.insertId }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function recordBatchAttendance(req: Request, res: Response) {
  try {
    const { subject_id, attendance_date, records, recorded_by_faculty_id } = req.body;

    if (!subject_id || !attendance_date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Subject, Date, and an array of Student records are required' });
    }

    let inserted = 0;
    let updated = 0;

    for (const item of records) {
      const { student_id, status = 'Present', remarks = '' } = item;
      const existing = await dbQuery(`
        SELECT attendance_id FROM attendance 
        WHERE student_id = ? AND subject_id = ? AND attendance_date = ?
      `, [student_id, subject_id, attendance_date]);

      if (existing.length > 0) {
        await dbExecute(`
          UPDATE attendance SET status = ?, remarks = ?, recorded_by_faculty_id = ?
          WHERE attendance_id = ?
        `, [status, remarks || null, recorded_by_faculty_id || null, existing[0].attendance_id]);
        updated++;
      } else {
        await dbExecute(`
          INSERT INTO attendance (student_id, subject_id, attendance_date, status, remarks, recorded_by_faculty_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [student_id, subject_id, attendance_date, status, remarks || null, recorded_by_faculty_id || null]);
        inserted++;
      }
    }

    res.json({
      success: true,
      message: `Batch attendance processed: ${inserted} created, ${updated} updated.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
