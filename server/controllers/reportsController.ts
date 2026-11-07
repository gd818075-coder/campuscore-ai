import { Request, Response } from 'express';
import { dbQuery } from '../db/connection.ts';

export async function getReportData(req: Request, res: Response) {
  try {
    const { reportType } = req.params;

    let rows: any[] = [];
    let title = '';

    switch (reportType) {
      case 'student-directory':
        title = 'Student Master Directory Report';
        rows = await dbQuery(`
          SELECT 
            s.reg_number AS "Register Number",
            (s.first_name || ' ' || s.last_name) AS "Student Name",
            s.email AS "Email Address",
            s.phone AS "Contact Phone",
            s.dob AS "Date of Birth",
            s.gender AS "Gender",
            c.name AS "Course / Program",
            sem.semester_number AS "Current Semester",
            s.city AS "City",
            s.status AS "Enrollment Status",
            s.admission_date AS "Admission Date"
          FROM students s
          LEFT JOIN semesters sem ON s.current_semester_id = sem.semester_id
          LEFT JOIN courses c ON sem.course_id = c.course_id
          ORDER BY s.reg_number ASC
        `);
        break;

      case 'low-attendance':
        title = 'Low Attendance Warning Report (< 75%)';
        rows = await dbQuery(`
          SELECT 
            s.reg_number AS "Register Number",
            (s.first_name || ' ' || s.last_name) AS "Student Name",
            sub.code AS "Subject Code",
            sub.name AS "Subject Name",
            COUNT(a.attendance_id) AS "Total Sessions",
            SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS "Attended",
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS "Absent",
            ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id), 1) AS "Attendance Percentage",
            'Action Required: Send Warning Letter' AS "Recommendation"
          FROM attendance a
          JOIN students s ON a.student_id = s.student_id
          JOIN subjects sub ON a.subject_id = sub.subject_id
          GROUP BY s.student_id, s.reg_number, s.first_name, s.last_name, sub.code, sub.name
          HAVING "Attendance Percentage" < 75.0
          ORDER BY "Attendance Percentage" ASC
        `);
        break;

      case 'subject-attendance':
        title = 'Subject-Wise Attendance Distribution Report';
        rows = await dbQuery(`
          SELECT 
            sub.code AS "Subject Code",
            sub.name AS "Subject Name",
            COUNT(DISTINCT a.attendance_date) AS "Sessions Conducted",
            COUNT(a.attendance_id) AS "Total Student Logs",
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS "Total Present",
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS "Total Absent",
            ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id), 1) AS "Overall Class Attendance Pct"
          FROM subjects sub
          JOIN attendance a ON sub.subject_id = a.subject_id
          GROUP BY sub.subject_id, sub.code, sub.name
          ORDER BY sub.code ASC
        `);
        break;

      case 'marks-summary':
        title = 'Continuous Assessment & Examination Marks Report';
        rows = await dbQuery(`
          SELECT 
            s.reg_number AS "Register Number",
            (s.first_name || ' ' || s.last_name) AS "Student Name",
            sub.code AS "Subject Code",
            sub.name AS "Subject Name",
            asm.name AS "Assessment Name",
            asm.assessment_type AS "Type",
            asm.max_marks AS "Max Marks",
            m.marks_obtained AS "Marks Scored",
            ROUND((m.marks_obtained * 100.0) / asm.max_marks, 1) AS "Score Pct",
            CASE 
              WHEN m.is_absent = 1 THEN 'Absent'
              WHEN (m.marks_obtained * 100.0) / asm.max_marks >= 75 THEN 'Distinction'
              WHEN (m.marks_obtained * 100.0) / asm.max_marks >= 60 THEN 'First Class'
              WHEN (m.marks_obtained * 100.0) / asm.max_marks >= 40 THEN 'Pass'
              ELSE 'Fail'
            END AS "Evaluation"
          FROM marks m
          JOIN assessments asm ON m.assessment_id = asm.assessment_id
          JOIN subjects sub ON asm.subject_id = sub.subject_id
          JOIN students s ON m.student_id = s.student_id
          ORDER BY s.reg_number ASC, sub.code ASC
        `);
        break;

      case 'pending-fees':
        title = 'Pending Dues and Fee Defaulters Report';
        rows = await dbQuery(`
          SELECT 
            s.reg_number AS "Register Number",
            (s.first_name || ' ' || s.last_name) AS "Student Name",
            s.phone AS "Contact Phone",
            fr.fee_type AS "Fee Category",
            fr.amount_due AS "Billed Amount (INR)",
            COALESCE(SUM(fp.amount_paid), 0) AS "Total Paid (INR)",
            (fr.amount_due - COALESCE(SUM(fp.amount_paid), 0)) AS "Pending Balance (INR)",
            fr.due_date AS "Payment Due Date",
            CASE 
              WHEN (fr.amount_due - COALESCE(SUM(fp.amount_paid), 0)) = 0 THEN 'Settled'
              WHEN COALESCE(SUM(fp.amount_paid), 0) > 0 THEN 'Partial Dues'
              ELSE 'Fully Overdue'
            END AS "Collection Status"
          FROM fee_records fr
          JOIN students s ON fr.student_id = s.student_id
          LEFT JOIN fee_payments fp ON fr.fee_record_id = fp.fee_record_id
          GROUP BY fr.fee_record_id, s.reg_number, s.first_name, s.last_name, s.phone, fr.fee_type, fr.amount_due, fr.due_date
          HAVING "Pending Balance (INR)" > 0
          ORDER BY "Pending Balance (INR)" DESC
        `);
        break;

      case 'faculty-allocation':
        title = 'Faculty Workload and Subject Allocation Report';
        rows = await dbQuery(`
          SELECT 
            f.employee_code AS "Employee Code",
            (f.first_name || ' ' || f.last_name) AS "Faculty Member",
            f.designation AS "Designation",
            d.name AS "Department",
            sub.code AS "Subject Code",
            sub.name AS "Subject Name",
            sub.credits AS "Credits",
            fsa.academic_year AS "Academic Year"
          FROM faculty f
          JOIN departments d ON f.department_id = d.department_id
          JOIN faculty_subject_assignments fsa ON f.faculty_id = fsa.faculty_id
          JOIN subjects sub ON fsa.subject_id = sub.subject_id
          ORDER BY f.employee_code ASC
        `);
        break;

      case 'feedback-analytics':
        title = 'Student Academic & Infrastructure Feedback Analytics';
        rows = await dbQuery(`
          SELECT 
            fb.feedback_id AS "ID",
            s.reg_number AS "Submitted By (Reg No)",
            fb.category AS "Category",
            fb.rating AS "Rating (out of 5)",
            COALESCE((f.first_name || ' ' || f.last_name), 'General Campus') AS "Faculty / Scope",
            COALESCE(sub.name, 'N/A') AS "Subject",
            fb.comments AS "Student Remarks",
            fb.status AS "Review Status",
            fb.submitted_at AS "Date Submitted"
          FROM student_feedback fb
          JOIN students s ON fb.student_id = s.student_id
          LEFT JOIN faculty f ON fb.faculty_id = f.faculty_id
          LEFT JOIN subjects sub ON fb.subject_id = sub.subject_id
          ORDER BY fb.submitted_at DESC
        `);
        break;

      default:
        return res.status(404).json({ success: false, error: 'Unknown report type' });
    }

    res.json({
      success: true,
      data: {
        title,
        generatedAt: new Date().toISOString(),
        rowCount: rows.length,
        rows
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
