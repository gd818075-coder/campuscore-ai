export const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS departments (
    department_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    established_year INTEGER NOT NULL,
    building TEXT NOT NULL,
    head_of_dept TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    duration_years INTEGER NOT NULL DEFAULT 3,
    total_semesters INTEGER NOT NULL DEFAULT 6,
    degree_level TEXT NOT NULL DEFAULT 'Undergraduate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
  )`,

  `CREATE TABLE IF NOT EXISTS semesters (
    semester_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    semester_number INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    term TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_current INTEGER DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE(course_id, semester_number, academic_year)
  )`,

  `CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reg_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    blood_group TEXT DEFAULT 'O+',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    admission_date TEXT NOT NULL,
    current_semester_id INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_semester_id) REFERENCES semesters(semester_id)
  )`,

  `CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    designation TEXT NOT NULL,
    qualification TEXT NOT NULL,
    joining_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
  )`,

  `CREATE TABLE IF NOT EXISTS subjects (
    subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 4,
    course_id INTEGER NOT NULL,
    semester_number INTEGER NOT NULL,
    subject_type TEXT NOT NULL DEFAULT 'Theory',
    max_internal_marks REAL NOT NULL DEFAULT 30.00,
    max_exam_marks REAL NOT NULL DEFAULT 70.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
  )`,

  `CREATE TABLE IF NOT EXISTS faculty_subject_assignments (
    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    semester_id INTEGER NOT NULL,
    assigned_date TEXT NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id),
    UNIQUE(faculty_id, subject_id, academic_year)
  )`,

  `CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    enrollment_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id),
    UNIQUE(student_id, semester_id, academic_year)
  )`,

  `CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Present',
    remarks TEXT,
    recorded_by_faculty_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (recorded_by_faculty_id) REFERENCES faculty(faculty_id),
    UNIQUE(student_id, subject_id, attendance_date)
  )`,

  `CREATE TABLE IF NOT EXISTS assessments (
    assessment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    assessment_type TEXT NOT NULL,
    max_marks REAL NOT NULL,
    weightage_percent REAL NOT NULL DEFAULT 100.0,
    conduct_date TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
  )`,

  `CREATE TABLE IF NOT EXISTS marks (
    mark_id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    marks_obtained REAL NOT NULL DEFAULT 0.0,
    is_absent INTEGER NOT NULL DEFAULT 0,
    remarks TEXT,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    UNIQUE(assessment_id, student_id)
  )`,

  `CREATE TABLE IF NOT EXISTS fee_records (
    fee_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    fee_type TEXT NOT NULL DEFAULT 'Tuition',
    amount_due REAL NOT NULL,
    due_date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
  )`,

  `CREATE TABLE IF NOT EXISTS fee_payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    fee_record_id INTEGER NOT NULL,
    receipt_number TEXT NOT NULL UNIQUE,
    amount_paid REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fee_record_id) REFERENCES fee_records(fee_record_id)
  )`,

  `CREATE TABLE IF NOT EXISTS student_feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    faculty_id INTEGER,
    subject_id INTEGER,
    rating INTEGER NOT NULL,
    category TEXT NOT NULL,
    comments TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Administrator',
    linked_id INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

export const VIEW_STATEMENTS = [
  `CREATE VIEW IF NOT EXISTS v_student_academic_summary AS
  SELECT 
    s.student_id,
    s.reg_number,
    (s.first_name || ' ' || s.last_name) AS student_name,
    s.email,
    s.status,
    c.name AS course_name,
    c.code AS course_code,
    d.name AS department_name,
    sem.semester_number,
    sem.academic_year
  FROM students s
  LEFT JOIN semesters sem ON s.current_semester_id = sem.semester_id
  LEFT JOIN courses c ON sem.course_id = c.course_id
  LEFT JOIN departments d ON c.department_id = d.department_id`,

  `CREATE VIEW IF NOT EXISTS v_fee_summary AS
  SELECT 
    fr.fee_record_id,
    s.student_id,
    s.reg_number,
    (s.first_name || ' ' || s.last_name) AS student_name,
    fr.fee_type,
    fr.amount_due,
    fr.due_date,
    COALESCE(SUM(fp.amount_paid), 0) AS total_paid,
    (fr.amount_due - COALESCE(SUM(fp.amount_paid), 0)) AS pending_balance,
    CASE 
      WHEN COALESCE(SUM(fp.amount_paid), 0) >= fr.amount_due THEN 'Paid'
      WHEN COALESCE(SUM(fp.amount_paid), 0) > 0 THEN 'Partially_Paid'
      ELSE 'Pending'
    END AS calculated_status
  FROM fee_records fr
  JOIN students s ON fr.student_id = s.student_id
  LEFT JOIN fee_payments fp ON fr.fee_record_id = fp.fee_record_id
  GROUP BY fr.fee_record_id, s.student_id, s.reg_number, s.first_name, s.last_name, fr.fee_type, fr.amount_due, fr.due_date`,

  `CREATE VIEW IF NOT EXISTS v_faculty_workload AS
  SELECT 
    f.faculty_id,
    f.employee_code,
    (f.first_name || ' ' || f.last_name) AS faculty_name,
    f.designation,
    d.name AS department_name,
    COUNT(fsa.assignment_id) AS total_subjects_assigned,
    COALESCE(SUM(sub.credits), 0) AS total_teaching_credits
  FROM faculty f
  JOIN departments d ON f.department_id = d.department_id
  LEFT JOIN faculty_subject_assignments fsa ON f.faculty_id = fsa.faculty_id
  LEFT JOIN subjects sub ON fsa.subject_id = sub.subject_id
  GROUP BY f.faculty_id, f.employee_code, f.first_name, f.last_name, f.designation, d.name`
];
