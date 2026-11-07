import { Request, Response } from 'express';
import { dbQuery } from '../db/connection.ts';

export async function getOverviewStats(req: Request, res: Response) {
  try {
    // 1. Total students and active status
    const studentStats: any = await dbQuery(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_students
      FROM students
    `);

    // 2. Total courses and subjects
    const courseStats: any = await dbQuery(`
      SELECT COUNT(*) as total_courses FROM courses
    `);
    const subjectStats: any = await dbQuery(`
      SELECT COUNT(*) as total_subjects FROM subjects
    `);
    const facultyStats: any = await dbQuery(`
      SELECT COUNT(*) as total_faculty FROM faculty WHERE status = 'Active'
    `);

    // 3. Attendance Warnings (< 75% attendance)
    const attendanceStats: any = await dbQuery(`
      SELECT 
        s.student_id,
        s.reg_number,
        (s.first_name || ' ' || s.last_name) as student_name,
        sub.name as subject_name,
        COUNT(a.attendance_id) as total_sessions,
        SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) as attended_sessions,
        ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id), 1) as percentage
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      JOIN subjects sub ON a.subject_id = sub.subject_id
      GROUP BY s.student_id, s.reg_number, s.first_name, s.last_name, sub.name
      HAVING percentage < 75.0
    `);

    // 4. Financial totals (Due, Paid, Pending)
    const feeTotals: any = await dbQuery(`
      SELECT 
        COALESCE(SUM(fr.amount_due), 0) as total_billed,
        COALESCE((SELECT SUM(amount_paid) FROM fee_payments), 0) as total_collected
      FROM fee_records fr
    `);

    const billed = Number(feeTotals[0]?.total_billed || 0);
    const collected = Number(feeTotals[0]?.total_collected || 0);
    const pendingFees = billed - collected;

    // 5. Academic Performance (Average score, distinction count)
    const marksSummary: any = await dbQuery(`
      SELECT 
        COUNT(*) as total_graded_entries,
        ROUND(AVG(marks_obtained), 1) as overall_avg_score
      FROM marks
    `);

    // 6. Recent activity (latest attendance, payments, feedback)
    const recentActivity: any = await dbQuery(`
      SELECT 'Payment' as type, ('Payment of ₹' || amount_paid || ' receipt ' || receipt_number) as description, payment_date as event_date
      FROM fee_payments
      ORDER BY payment_date DESC LIMIT 3
    `);

    res.json({
      success: true,
      data: {
        totalStudents: Number(studentStats[0]?.total_students || 0),
        activeStudents: Number(studentStats[0]?.active_students || 0),
        totalCourses: Number(courseStats[0]?.total_courses || 0),
        totalSubjects: Number(subjectStats[0]?.total_subjects || 0),
        totalFaculty: Number(facultyStats[0]?.total_faculty || 0),
        attendanceWarningsCount: attendanceStats.length,
        attendanceWarningsList: attendanceStats,
        financials: {
          totalBilled: billed,
          totalCollected: collected,
          pendingFees: pendingFees > 0 ? pendingFees : 0
        },
        academic: {
          totalGradedEntries: Number(marksSummary[0]?.total_graded_entries || 0),
          averageScore: Number(marksSummary[0]?.overall_avg_score || 0)
        },
        recentActivity
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
