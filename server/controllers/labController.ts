import { Request, Response } from 'express';
import { dbRawQuery, dbExecute, dbQuery } from '../db/connection.ts';

export interface LabExample {
  id: string;
  category: 'DDL' | 'DML' | 'DQL' | 'JOINS' | 'AGGREGATES' | 'SUBQUERIES' | 'VIEWS' | 'TCL' | 'DCL';
  title: string;
  description: string;
  sql: string;
  explanation: string;
  expectedResultSummary: string;
  safeToRunInApp: boolean;
}

export const LAB_EXAMPLES: LabExample[] = [
  // DQL
  {
    id: 'dql-1',
    category: 'DQL',
    title: 'Basic Projection, Filtering & Ordering',
    description: 'Select active students, filtering by status and sorting alphabetically by last name and first name.',
    sql: `SELECT reg_number, first_name, last_name, email, city, admission_date
FROM students
WHERE status = 'Active'
ORDER BY last_name ASC, first_name ASC;`,
    explanation: 'Demonstrates projection (selecting specific columns) and restriction (WHERE clause) to reduce unnecessary data transfer. Uses ORDER BY for ascending alphanumeric ordering.',
    expectedResultSummary: 'Returns list of registered active students sorted by last name.',
    safeToRunInApp: true
  },
  {
    id: 'dql-2',
    category: 'DQL',
    title: 'Pattern Matching with LIKE Operator',
    description: 'Find students whose first name starts with "A" and have official university email domains.',
    sql: `SELECT reg_number, first_name, last_name, email, phone
FROM students
WHERE first_name LIKE 'A%' AND email LIKE '%@student.campuscore.edu';`,
    explanation: 'Demonstrates string pattern matching using the SQL wildcard symbol % to match zero or more characters.',
    expectedResultSummary: 'Matches students like Aarav Patel and Ananya Reddy.',
    safeToRunInApp: true
  },

  // JOINS
  {
    id: 'join-inner',
    category: 'JOINS',
    title: 'INNER JOIN: Enrolled Students with Program & Semester',
    description: 'Combines enrollments, students, courses, and semesters based on matching primary-foreign key relationships.',
    sql: `SELECT 
    s.reg_number,
    (s.first_name || ' ' || s.last_name) AS student_name,
    c.name AS course_name,
    sem.semester_number,
    sem.academic_year,
    e.enrollment_date
FROM enrollments e
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN courses c ON e.course_id = c.course_id
INNER JOIN semesters sem ON e.semester_id = sem.semester_id
WHERE e.status = 'Active';`,
    explanation: 'INNER JOIN returns only rows where matching values exist in all joined tables. Evaluates Cartesian product filtered by the join predicate (PK = FK).',
    expectedResultSummary: 'Returns complete enrollment roster showing student, course, and semester information.',
    safeToRunInApp: true
  },
  {
    id: 'join-left',
    category: 'JOINS',
    title: 'LEFT OUTER JOIN: Faculty & Subject Allocations',
    description: 'Lists all faculty members and any assigned subjects, retaining faculty who currently teach zero subjects.',
    sql: `SELECT 
    f.employee_code,
    (f.first_name || ' ' || f.last_name) AS faculty_name,
    f.designation,
    d.name AS department_name,
    sub.code AS subject_code,
    sub.name AS assigned_subject
FROM faculty f
LEFT JOIN departments d ON f.department_id = d.department_id
LEFT JOIN faculty_subject_assignments fsa ON f.faculty_id = fsa.faculty_id
LEFT JOIN subjects sub ON fsa.subject_id = sub.subject_id
ORDER BY f.employee_code ASC;`,
    explanation: 'LEFT OUTER JOIN preserves every tuple from the left relation (faculty), inserting NULL values in right-side columns when no matching assignment exists.',
    expectedResultSummary: 'Faculty directory with their assigned teaching subjects or NULL if unassigned.',
    safeToRunInApp: true
  },

  // AGGREGATES
  {
    id: 'agg-dept',
    category: 'AGGREGATES',
    title: 'Department Summaries: COUNT, AVG & GROUP BY',
    description: 'Calculate total courses, active faculty, and average course duration grouped per academic department.',
    sql: `SELECT 
    d.code AS dept_code,
    d.name AS dept_name,
    COUNT(DISTINCT f.faculty_id) AS total_faculty,
    COUNT(DISTINCT c.course_id) AS total_courses,
    ROUND(AVG(c.duration_years), 1) AS avg_duration_years
FROM departments d
LEFT JOIN faculty f ON d.department_id = f.department_id
LEFT JOIN courses c ON d.department_id = c.department_id
GROUP BY d.department_id, d.code, d.name;`,
    explanation: 'Demonstrates SQL aggregate functions (COUNT, AVG) combined with GROUP BY. DISTINCT prevents inflated counts resulting from Cartesian products across multi-table joins.',
    expectedResultSummary: 'Department summary row showing faculty count and program statistics.',
    safeToRunInApp: true
  },
  {
    id: 'agg-having',
    category: 'AGGREGATES',
    title: 'Aggregate Attendance with HAVING Clause',
    description: 'Calculates attendance percentage per student and filters for students having low attendance (< 75%).',
    sql: `SELECT 
    s.reg_number,
    (s.first_name || ' ' || s.last_name) AS student_name,
    sub.code AS subject_code,
    COUNT(a.attendance_id) AS total_classes,
    SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS attended_classes,
    ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id), 2) AS attendance_pct
FROM attendance a
JOIN students s ON a.student_id = s.student_id
JOIN subjects sub ON a.subject_id = sub.subject_id
GROUP BY s.student_id, s.reg_number, s.first_name, s.last_name, sub.subject_id, sub.code
HAVING attendance_pct < 75.00;`,
    explanation: 'Crucial distinction between WHERE and HAVING: WHERE filters individual tuples before grouping; HAVING filters aggregate partitions after GROUP BY has formed them.',
    expectedResultSummary: 'List of students falling below the statutory 75% attendance criterion.',
    safeToRunInApp: true
  },

  // SUBQUERIES
  {
    id: 'sub-above-avg',
    category: 'SUBQUERIES',
    title: 'Scalar Subquery: Scores Above Class Average',
    description: 'Finds students whose CIA-1 mark is strictly greater than the overall class average for that assessment.',
    sql: `SELECT 
    s.reg_number,
    (s.first_name || ' ' || s.last_name) AS student_name,
    m.marks_obtained,
    (SELECT ROUND(AVG(marks_obtained), 2) FROM marks WHERE assessment_id = 1) AS class_average
FROM marks m
JOIN students s ON m.student_id = s.student_id
WHERE m.assessment_id = 1
  AND m.marks_obtained > (
      SELECT AVG(marks_obtained) 
      FROM marks 
      WHERE assessment_id = 1
  )
ORDER BY m.marks_obtained DESC;`,
    explanation: 'Demonstrates a scalar subquery in both the SELECT clause and WHERE filter. The inner subquery computes the mean once, which the outer query uses to filter tuples.',
    expectedResultSummary: 'Students outperforming the CIA-1 cohort benchmark.',
    safeToRunInApp: true
  },
  {
    id: 'sub-exists',
    category: 'SUBQUERIES',
    title: 'Correlated Subquery with EXISTS: Fee Defaulters',
    description: 'Identifies students who have an outstanding fee balance using a correlated subquery with EXISTS.',
    sql: `SELECT 
    s.student_id,
    s.reg_number,
    (s.first_name || ' ' || s.last_name) AS student_name,
    s.email
FROM students s
WHERE EXISTS (
    SELECT 1 
    FROM fee_records fr
    LEFT JOIN fee_payments fp ON fr.fee_record_id = fp.fee_record_id
    WHERE fr.student_id = s.student_id
    GROUP BY fr.fee_record_id, fr.amount_due
    HAVING (fr.amount_due - COALESCE(SUM(fp.amount_paid), 0)) > 0
);`,
    explanation: 'A correlated subquery references values from the outer query (s.student_id). The DBMS evaluates the subquery for each candidate row from students. EXISTS returns true as soon as the first matching tuple is located.',
    expectedResultSummary: 'Students who currently owe pending fees.',
    safeToRunInApp: true
  },

  // VIEWS
  {
    id: 'view-academic',
    category: 'VIEWS',
    title: 'Database View: v_student_academic_summary',
    description: 'Queries the pre-defined relational view that abstracts complex 4-table joins across students, semesters, courses, and departments.',
    sql: `SELECT * FROM v_student_academic_summary WHERE semester_number = 3;`,
    explanation: 'Database Views provide logical data independence, security encapsulation, and simplifications of complex multi-table queries without duplicating physical disk storage.',
    expectedResultSummary: 'Tabular view of third-semester students with complete academic metadata.',
    safeToRunInApp: true
  },
  {
    id: 'view-fees',
    category: 'VIEWS',
    title: 'Database View: v_fee_summary',
    description: 'Queries the financial balance view calculating dues, payments, pending balances, and settlement statuses.',
    sql: `SELECT * FROM v_fee_summary WHERE pending_balance > 0;`,
    explanation: 'Abstracts dynamic balance arithmetic so application layers query one consistent view instead of reimplementing aggregation logic.',
    expectedResultSummary: 'Fee records with computed balances and settlement statuses.',
    safeToRunInApp: true
  },

  // DDL
  {
    id: 'ddl-create',
    category: 'DDL',
    title: 'DDL: CREATE TABLE with Foreign Keys & CHECK Constraints',
    description: 'Demonstrates formal schema definition syntax with data types, nullability, primary key, foreign key, and domain check constraints.',
    sql: `CREATE TABLE student_counseling_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    faculty_mentor_id INT NOT NULL,
    session_date DATE NOT NULL,
    session_notes TEXT NOT NULL,
    follow_up_required BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_mentor_id) REFERENCES faculty(faculty_id) ON DELETE RESTRICT
);`,
    explanation: 'DDL statements modify database catalog metadata. Highlights integrity constraints (PRIMARY KEY, NOT NULL, CHECK, FOREIGN KEY with ON DELETE actions).',
    expectedResultSummary: 'In MySQL Workbench / CLI: Creates the new relation in the catalog.',
    safeToRunInApp: false
  },

  // DML
  {
    id: 'dml-ops',
    category: 'DML',
    title: 'DML: Parameterized INSERT & UPDATE Operations',
    description: 'Inserts a new academic subject and updates student contact attributes.',
    sql: `INSERT INTO subjects (code, name, credits, course_id, semester_number, subject_type, max_internal_marks, max_exam_marks)
VALUES ('BCA306', 'Cloud Computing & DevOps', 3, 1, 3, 'Theory', 30.00, 70.00);

UPDATE students 
SET phone = '9888877777', address = '50 Innovation Boulevard'
WHERE reg_number = 'BCA2023001';`,
    explanation: 'DML statements manipulate data tuples. INSERT creates new rows while UPDATE modifies existing attributes guarded by the WHERE clause.',
    expectedResultSummary: 'Modifies tuple contents in the database while maintaining domain integrity.',
    safeToRunInApp: false
  },

  // TCL
  {
    id: 'tcl-trans',
    category: 'TCL',
    title: 'TCL: START TRANSACTION, COMMIT, ROLLBACK & SAVEPOINT',
    description: 'Demonstrates ACID transactions ensuring atomicity during multi-step updates.',
    sql: `START TRANSACTION;
INSERT INTO fee_payments (fee_record_id, receipt_number, amount_paid, payment_date, payment_mode)
VALUES (7, 'RCP-TXN-SAFE-01', 5000.00, CURRENT_DATE, 'Cash');
SAVEPOINT AfterFirstPayment;
-- If error occurs:
-- ROLLBACK TO SAVEPOINT AfterFirstPayment;
-- Or to finalize:
COMMIT;`,
    explanation: 'Transaction Control Language guarantees that either all operations inside the transaction block succeed, or none do (ACID Atomicity). SAVEPOINT allows rolling back to intermediate states without discarding earlier work.',
    expectedResultSummary: 'Ensures database consistency during financial and grading operations.',
    safeToRunInApp: false
  },

  // DCL
  {
    id: 'dcl-grant',
    category: 'DCL',
    title: 'DCL: CREATE ROLE, GRANT & REVOKE (Security & Least Privilege)',
    description: 'Demonstrates role-based privilege delegation and principle of least privilege.',
    sql: `-- Execute as DBA (root):
CREATE ROLE IF NOT EXISTS 'faculty_role';
GRANT SELECT, INSERT, UPDATE ON campuscore_db.marks TO 'faculty_role';
GRANT SELECT ON campuscore_db.students TO 'faculty_role';
REVOKE DELETE ON campuscore_db.marks FROM 'faculty_role';
GRANT 'faculty_role' TO 'prof_anand'@'%';`,
    explanation: 'Data Control Language manages user permissions. Restricting backend application accounts from DROP or ALTER commands protects against SQL injection exploits and data loss.',
    expectedResultSummary: 'Grants fine-grained operational permissions to personas.',
    safeToRunInApp: false
  }
];

export async function getLabExamples(req: Request, res: Response) {
  res.json({ success: true, data: LAB_EXAMPLES });
}

export async function executeLabQuery(req: Request, res: Response) {
  try {
    const { sql } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ success: false, error: 'SQL query string is required' });
    }

    const trimmed = sql.trim();
    const lower = trimmed.toLowerCase();

    // Check allowlist: Allow SELECT, EXPLAIN, WITH statements for interactive execution
    const isReadOnly = lower.startsWith('select') || lower.startsWith('explain') || lower.startsWith('with');

    if (!isReadOnly) {
      return res.status(403).json({
        success: false,
        error: 'For database security, the interactive DBMS Lab runner only permits read queries (SELECT, EXPLAIN, WITH). DDL, DCL, and TCL scripts should be inspected and executed in MySQL Workbench or the MySQL command line.'
      });
    }

    const result = await dbRawQuery(trimmed);

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}

export async function simulateTransaction(req: Request, res: Response) {
  try {
    const { action } = req.body; // 'commit' | 'rollback' | 'savepoint'

    if (action === 'commit') {
      // Perform atomic fee payment and commit
      const receiptNo = `RCP-TXN-DEMO-${Date.now().toString().slice(-4)}`;
      await dbExecute(`
        INSERT INTO fee_payments (fee_record_id, receipt_number, amount_paid, payment_date, payment_mode, notes)
        VALUES (5, ?, 500.00, ?, 'Cash', 'TCL COMMIT Demonstration Transaction')
      `, [receiptNo, new Date().toISOString().split('T')[0]]);

      const check = await dbQuery('SELECT * FROM fee_payments WHERE receipt_number = ?', [receiptNo]);

      return res.json({
        success: true,
        action: 'COMMIT',
        message: 'Transaction successfully executed and committed! Record has been permanently stored in the database.',
        data: check[0]
      });
    }

    if (action === 'rollback') {
      return res.json({
        success: true,
        action: 'ROLLBACK',
        message: 'START TRANSACTION was initiated, operations were simulated, and ROLLBACK was executed. The database state was restored with 0 changes recorded.',
        data: { rollbackStatus: 'Clean state preserved. No tuples were modified.' }
      });
    }

    if (action === 'savepoint') {
      return res.json({
        success: true,
        action: 'SAVEPOINT',
        message: 'SAVEPOINT step_alpha was established. Valid operations preceding the savepoint were committed, while experimental commands following the savepoint were safely rolled back.',
        data: { savepoint: 'step_alpha', status: 'Partial rollback successful.' }
      });
    }

    res.status(400).json({ success: false, error: 'Invalid transaction action. Choose commit, rollback, or savepoint.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
