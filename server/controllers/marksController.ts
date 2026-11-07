import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { Assessment, MarkRecord } from '../db/types.ts';

// -----------------------------------------------------------------------------
// ASSESSMENTS
// -----------------------------------------------------------------------------
export async function getAssessments(req: Request, res: Response) {
  try {
    const { subject_id, semester_id } = req.query;

    let sql = `
      SELECT 
        asm.*,
        sub.name as subject_name,
        sub.code as subject_code,
        sem.semester_number,
        sem.academic_year
      FROM assessments asm
      JOIN subjects sub ON asm.subject_id = sub.subject_id
      JOIN semesters sem ON asm.semester_id = sem.semester_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subject_id) {
      sql += ` AND asm.subject_id = ?`;
      params.push(Number(subject_id));
    }
    if (semester_id) {
      sql += ` AND asm.semester_id = ?`;
      params.push(Number(semester_id));
    }

    sql += ` ORDER BY asm.conduct_date DESC`;

    const assessments = await dbQuery<Assessment>(sql, params);
    res.json({ success: true, data: assessments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAssessment(req: Request, res: Response) {
  try {
    const { subject_id, semester_id, name, assessment_type, max_marks, weightage_percent, conduct_date } = req.body;

    if (!subject_id || !semester_id || !name || !assessment_type || !max_marks || !conduct_date) {
      return res.status(400).json({ success: false, error: 'All assessment fields are required' });
    }

    if (Number(max_marks) <= 0) {
      return res.status(400).json({ success: false, error: 'Max marks must be greater than zero' });
    }

    const result = await dbExecute(`
      INSERT INTO assessments (subject_id, semester_id, name, assessment_type, max_marks, weightage_percent, conduct_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      Number(subject_id),
      Number(semester_id),
      name,
      assessment_type,
      Number(max_marks),
      Number(weightage_percent) || 100,
      conduct_date
    ]);

    res.status(201).json({ success: true, data: { assessment_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// -----------------------------------------------------------------------------
// MARKS
// -----------------------------------------------------------------------------
export async function getMarks(req: Request, res: Response) {
  try {
    const { assessment_id, student_id, subject_id } = req.query;

    let sql = `
      SELECT 
        m.*,
        asm.name as assessment_name,
        asm.assessment_type,
        asm.max_marks,
        sub.name as subject_name,
        sub.code as subject_code,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.reg_number
      FROM marks m
      JOIN assessments asm ON m.assessment_id = asm.assessment_id
      JOIN subjects sub ON asm.subject_id = sub.subject_id
      JOIN students s ON m.student_id = s.student_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assessment_id) {
      sql += ` AND m.assessment_id = ?`;
      params.push(Number(assessment_id));
    }
    if (student_id) {
      sql += ` AND m.student_id = ?`;
      params.push(Number(student_id));
    }
    if (subject_id) {
      sql += ` AND asm.subject_id = ?`;
      params.push(Number(subject_id));
    }

    sql += ` ORDER BY asm.name, s.reg_number ASC`;

    const marks = await dbQuery<MarkRecord>(sql, params);
    res.json({ success: true, data: marks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function recordMark(req: Request, res: Response) {
  try {
    const { assessment_id, student_id, marks_obtained, is_absent, remarks } = req.body;

    if (!assessment_id || !student_id) {
      return res.status(400).json({ success: false, error: 'Assessment and Student are required' });
    }

    // Check assessment max marks
    const assessmentRes = await dbQuery<Assessment>(`
      SELECT max_marks, name FROM assessments WHERE assessment_id = ?
    `, [assessment_id]);

    if (assessmentRes.length === 0) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    const maxMarks = Number(assessmentRes[0].max_marks);
    const score = Number(marks_obtained);

    if (!is_absent && (score < 0 || score > maxMarks)) {
      return res.status(400).json({
        success: false,
        error: `Marks obtained (${score}) must be between 0 and maximum marks (${maxMarks}) for this assessment.`
      });
    }

    // Check duplicate mark entry (UNIQUE: assessment_id, student_id)
    const existing = await dbQuery(`
      SELECT mark_id FROM marks WHERE assessment_id = ? AND student_id = ?
    `, [assessment_id, student_id]);

    if (existing.length > 0) {
      await dbExecute(`
        UPDATE marks 
        SET marks_obtained = ?, is_absent = ?, remarks = ?
        WHERE mark_id = ?
      `, [is_absent ? 0 : score, is_absent ? 1 : 0, remarks || null, existing[0].mark_id]);

      return res.json({ success: true, message: 'Marks updated successfully', data: { mark_id: existing[0].mark_id } });
    }

    const result = await dbExecute(`
      INSERT INTO marks (assessment_id, student_id, marks_obtained, is_absent, remarks)
      VALUES (?, ?, ?, ?, ?)
    `, [
      Number(assessment_id),
      Number(student_id),
      is_absent ? 0 : score,
      is_absent ? 1 : 0,
      remarks || null
    ]);

    res.status(201).json({ success: true, message: 'Marks recorded successfully', data: { mark_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPerformanceSummary(req: Request, res: Response) {
  try {
    const summary = await dbQuery(`
      SELECT 
        s.student_id,
        s.reg_number,
        (s.first_name || ' ' || s.last_name) as student_name,
        sub.code as subject_code,
        sub.name as subject_name,
        MAX(CASE WHEN asm.assessment_type = 'Internal' THEN m.marks_obtained ELSE NULL END) as internal_score,
        MAX(CASE WHEN asm.assessment_type = 'Internal' THEN asm.max_marks ELSE NULL END) as internal_max,
        MAX(CASE WHEN asm.assessment_type = 'Semester_Exam' THEN m.marks_obtained ELSE NULL END) as exam_score,
        MAX(CASE WHEN asm.assessment_type = 'Semester_Exam' THEN asm.max_marks ELSE NULL END) as exam_max,
        (COALESCE(MAX(CASE WHEN asm.assessment_type = 'Internal' THEN m.marks_obtained ELSE NULL END), 0) +
         COALESCE(MAX(CASE WHEN asm.assessment_type = 'Semester_Exam' THEN m.marks_obtained ELSE NULL END), 0)) as total_obtained,
        (COALESCE(MAX(CASE WHEN asm.assessment_type = 'Internal' THEN asm.max_marks ELSE NULL END), 0) +
         COALESCE(MAX(CASE WHEN asm.assessment_type = 'Semester_Exam' THEN asm.max_marks ELSE NULL END), 0)) as total_max
      FROM students s
      JOIN marks m ON s.student_id = m.student_id
      JOIN assessments asm ON m.assessment_id = asm.assessment_id
      JOIN subjects sub ON asm.subject_id = sub.subject_id
      GROUP BY s.student_id, s.reg_number, s.first_name, s.last_name, sub.code, sub.name
      ORDER BY total_obtained DESC
    `);

    // Rank high and low performers
    const formatted = summary.map(row => {
      const totObt = Number(row.total_obtained || 0);
      const totMax = Number(row.total_max || 100);
      const pct = totMax > 0 ? Math.round((totObt / totMax) * 1000) / 10 : 0;
      let grade = 'F';
      if (pct >= 85) grade = 'O (Outstanding)';
      else if (pct >= 75) grade = 'A+ (Distinction)';
      else if (pct >= 60) grade = 'A (First Class)';
      else if (pct >= 50) grade = 'B (Second Class)';
      else if (pct >= 40) grade = 'C (Pass)';

      return {
        ...row,
        percentage: pct,
        grade,
        performance_tier: pct >= 75 ? 'High Performer' : pct < 45 ? 'Needs Remedial' : 'Average'
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
