import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { StudentFeedback } from '../db/types.ts';

export async function getFeedback(req: Request, res: Response) {
  try {
    const { category, status, faculty_id } = req.query;

    let sql = `
      SELECT 
        fb.*,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.reg_number,
        (f.first_name || ' ' || f.last_name) as faculty_name,
        sub.name as subject_name
      FROM student_feedback fb
      JOIN students s ON fb.student_id = s.student_id
      LEFT JOIN faculty f ON fb.faculty_id = f.faculty_id
      LEFT JOIN subjects sub ON fb.subject_id = sub.subject_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      sql += ` AND fb.category = ?`;
      params.push(category);
    }
    if (status) {
      sql += ` AND fb.status = ?`;
      params.push(status);
    }
    if (faculty_id) {
      sql += ` AND fb.faculty_id = ?`;
      params.push(Number(faculty_id));
    }

    sql += ` ORDER BY fb.submitted_at DESC`;

    const feedbackList = await dbQuery<StudentFeedback>(sql, params);

    // Summary statistics
    const stats: any = await dbQuery(`
      SELECT 
        COUNT(*) as total_feedback,
        ROUND(AVG(rating), 2) as avg_rating,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_review
      FROM student_feedback
    `);

    res.json({
      success: true,
      data: feedbackList,
      stats: {
        total: Number(stats[0]?.total_feedback || 0),
        averageRating: Number(stats[0]?.avg_rating || 0),
        pending: Number(stats[0]?.pending_review || 0)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function submitFeedback(req: Request, res: Response) {
  try {
    const { student_id, faculty_id, subject_id, rating, category, comments } = req.body;

    if (!student_id || !rating || !category || !comments) {
      return res.status(400).json({ success: false, error: 'Student, Rating (1-5), Category, and Comments are required' });
    }

    const r = Number(rating);
    if (r < 1 || r > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5 stars' });
    }

    const result = await dbExecute(`
      INSERT INTO student_feedback (student_id, faculty_id, subject_id, rating, category, comments, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `, [
      Number(student_id),
      faculty_id ? Number(faculty_id) : null,
      subject_id ? Number(subject_id) : null,
      r,
      category,
      comments
    ]);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback_id: result.insertId }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function reviewFeedback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await dbExecute(`UPDATE student_feedback SET status = 'Reviewed' WHERE feedback_id = ?`, [id]);
    res.json({ success: true, message: 'Feedback marked as reviewed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
