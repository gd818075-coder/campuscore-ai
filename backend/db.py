"""
CampusCore AI - Dual Database Adapter
Connects to MySQL if available; otherwise falls back automatically and seamlessly
to an embedded SQLite relational database (campuscore_ai.db) with identical schema.
"""

import os
import sqlite3
import hashlib
from datetime import datetime

# Database Configuration from Environment or Defaults
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "campuscore_db")

SQLITE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "campuscore_ai.db")

ACTIVE_ENGINE = "SQLite" # will be tested upon startup
_mysql_available = False

try:
    import pymysql
    import pymysql.cursors
    _pymysql_installed = True
except ImportError:
    _pymysql_installed = False


def check_mysql_connection():
    """Test whether MySQL daemon is reachable and database is accessible."""
    global _mysql_available, ACTIVE_ENGINE
    if not _pymysql_installed:
        _mysql_available = False
        ACTIVE_ENGINE = "SQLite (Embedded)"
        return False

    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset="utf8mb4",
            connect_timeout=2
        )
        conn.close()
        _mysql_available = True
        ACTIVE_ENGINE = f"MySQL 8.0+ ({DB_HOST}:{DB_PORT}/{DB_NAME})"
        return True
    except Exception as e:
        _mysql_available = False
        ACTIVE_ENGINE = "SQLite (Embedded Fallback)"
        return False


def get_db_connection():
    """Returns a native database connection (MySQL or SQLite)."""
    global _mysql_available
    if _mysql_available and _pymysql_installed:
        try:
            return pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )
        except Exception:
            _mysql_available = False

    # Fallback to SQLite
    conn = sqlite3.connect(SQLITE_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def query(sql, params=()):
    """Executes a SELECT query and returns a list of dictionaries."""
    conn = get_db_connection()
    try:
        if isinstance(conn, sqlite3.Connection):
            # Adapt MySQL syntax quirks if any
            sql_adapted = sql.replace("%s", "?")
            cur = conn.cursor()
            cur.execute(sql_adapted, params)
            rows = cur.fetchall()
            return [dict(ix) for ix in rows]
        else:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchall()
    finally:
        conn.close()


def query_one(sql, params=()):
    """Executes a SELECT query and returns a single dictionary or None."""
    results = query(sql, params)
    return results[0] if results else None


def execute(sql, params=()):
    """Executes an INSERT, UPDATE, or DELETE statement. Returns lastrowid or affected count."""
    conn = get_db_connection()
    try:
        if isinstance(conn, sqlite3.Connection):
            sql_adapted = sql.replace("%s", "?")
            cur = conn.cursor()
            cur.execute(sql_adapted, params)
            conn.commit()
            return cur.lastrowid
        else:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                conn.commit()
                return cur.lastrowid
    finally:
        conn.close()


def hash_password(password: str) -> str:
    """Standard SHA-256 password hash for authentication."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def init_database():
    """Initializes tables and seeds data in either MySQL or SQLite."""
    check_mysql_connection()
    print(f"[*] CampusCore Database Engine Active: {ACTIVE_ENGINE}")

    if _mysql_available:
        try:
            init_mysql()
            print("[+] MySQL campuscore_db verified and initialized.")
            return
        except Exception as err:
            print(f"[!] MySQL initialization notice: {err} -> Falling back to SQLite.")

    # Initialize SQLite database
    init_sqlite()


def init_sqlite():
    """Create SQLite tables and seed data if not already existing."""
    conn = sqlite3.connect(SQLITE_FILE)
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS departments (
        department_id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        building TEXT NOT NULL,
        head_of_dept TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
        course_id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        duration_years INTEGER DEFAULT 3,
        total_semesters INTEGER DEFAULT 6,
        degree_level TEXT DEFAULT 'Undergraduate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
    );

    CREATE TABLE IF NOT EXISTS semesters (
        semester_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        semester_number INTEGER NOT NULL,
        academic_year TEXT NOT NULL,
        term TEXT NOT NULL,
        is_current INTEGER DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
    );

    CREATE TABLE IF NOT EXISTS faculty (
        faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_code TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        designation TEXT NOT NULL,
        qualification TEXT NOT NULL,
        specialization TEXT,
        joining_date TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
    );

    CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reg_number TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        dob TEXT NOT NULL,
        gender TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        current_semester_id INTEGER,
        cgpa REAL DEFAULT 0.00,
        admission_date TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id),
        FOREIGN KEY (current_semester_id) REFERENCES semesters(semester_id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
        subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        credits INTEGER DEFAULT 4,
        course_id INTEGER NOT NULL,
        semester_number INTEGER NOT NULL,
        subject_type TEXT DEFAULT 'Theory',
        faculty_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id),
        FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
        attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        attendance_date TEXT NOT NULL,
        status TEXT DEFAULT 'Present',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
    );

    CREATE TABLE IF NOT EXISTS marks (
        mark_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        exam_type TEXT NOT NULL,
        marks_obtained REAL DEFAULT 0.00,
        max_marks REAL DEFAULT 100.00,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
    );

    CREATE TABLE IF NOT EXISTS events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'Technical',
        venue TEXT NOT NULL,
        event_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        max_seats INTEGER DEFAULT 100,
        registered_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Upcoming',
        created_by TEXT DEFAULT 'Campus Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
        registration_id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Confirmed',
        FOREIGN KEY (event_id) REFERENCES events(event_id),
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS campus_resources (
        resource_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        building TEXT NOT NULL,
        room_number TEXT NOT NULL,
        capacity INTEGER DEFAULT 60,
        status TEXT DEFAULT 'Available',
        features TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resource_bookings (
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        purpose TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES campus_resources(resource_id)
    );

    CREATE TABLE IF NOT EXISTS student_feedback (
        feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        target_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comments TEXT NOT NULL,
        sentiment TEXT DEFAULT 'Neutral',
        sentiment_score REAL DEFAULT 0.50,
        ai_summary TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS career_profiles (
        profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE NOT NULL,
        technical_skills TEXT NOT NULL,
        interests TEXT NOT NULL,
        preferred_domain TEXT NOT NULL,
        ai_recommended_path TEXT,
        ai_match_score INTEGER DEFAULT 85,
        ai_learning_roadmap TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS ai_content_library (
        content_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        title TEXT NOT NULL,
        prompt_context TEXT NOT NULL,
        output_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
        notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        target_role TEXT DEFAULT 'All',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'Student',
        linked_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS responsible_ai_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        tool_name TEXT NOT NULL,
        prompt_summary TEXT NOT NULL,
        pii_detected INTEGER DEFAULT 0,
        safety_rating TEXT DEFAULT 'Safe',
        ai_engine TEXT DEFAULT 'Local-Heuristic-AI',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admissions_inquiries (
        inquiry_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        program_interested TEXT NOT NULL,
        academic_score REAL DEFAULT 0.0,
        message TEXT,
        status TEXT DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'Unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fee_records (
        fee_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        fee_type TEXT NOT NULL DEFAULT 'Tuition Fee',
        amount_due REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
        payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        fee_record_id INTEGER NOT NULL,
        receipt_number TEXT UNIQUE NOT NULL,
        amount_paid REAL NOT NULL,
        payment_date TEXT NOT NULL,
        payment_mode TEXT NOT NULL DEFAULT 'UPI Reference',
        transaction_ref TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fee_record_id) REFERENCES fee_records(fee_record_id)
    );

    CREATE TABLE IF NOT EXISTS timetables (
        timetable_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        semester_number INTEGER NOT NULL,
        day_of_week TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        subject_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        room_number TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id),
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
        FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
    );
    """)

    conn.commit()

    # Check if seed data exists
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        seed_sqlite(conn)

    # Ensure admissions_inquiries has seed data
    cur.execute("SELECT COUNT(*) FROM admissions_inquiries")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO admissions_inquiries (inquiry_id, full_name, email, phone, program_interested, academic_score, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (1, 'Siddharth Rao', 'siddharth.rao@gmail.com', '+91 9845112233', 'BCA with AI Specialization', 88.5, 'Interested in scholarship criteria and GPU lab access for AI research.', 'Under Review'),
            (2, 'Kavya Sundaram', 'kavya.s@outlook.com', '+91 9845223344', 'B.Sc. in Computer Science', 92.0, 'Inquiring about hostel accommodation and placement records.', 'Admitted'),
            (3, 'Abhishek Gowda', 'abhishek.g@yahoo.com', '+91 9845334455', 'Master of Computer Applications (MCA)', 84.0, 'Lateral entry eligibility questions for MCA program.', 'New')
        ])
        conn.commit()

    # Ensure contact_messages has seed data
    cur.execute("SELECT COUNT(*) FROM contact_messages")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO contact_messages (message_id, name, email, subject, message, status) VALUES (?, ?, ?, ?, ?, ?)
        """, [
            (1, 'Prof. N. K. Murthy', 'nkmurthy@ieee.org', 'Guest Lecture on Responsible AI', 'Would like to propose a guest lecture session for BCA semester 1 students in Dec 2024.', 'Read'),
            (2, 'TechCorp Placement Lead', 'hr@techcorp.in', 'Campus Placement Drive 2024-25', 'Requesting date confirmation for on-campus technical recruitment interviews.', 'New')
        ])
        conn.commit()

    # Ensure fee_records has seed data
    cur.execute("SELECT COUNT(*) FROM fee_records")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO fee_records (fee_record_id, student_id, fee_type, amount_due, due_date, status) VALUES (?, ?, ?, ?, ?, ?)
        """, [
            (1, 1, 'Tuition & Academic Fee', 45000.0, '2024-11-30', 'Paid'),
            (2, 2, 'Tuition & Academic Fee', 45000.0, '2024-11-30', 'Paid'),
            (3, 3, 'Tuition & Academic Fee', 45000.0, '2024-11-30', 'Partially Paid'),
            (4, 4, 'Tuition & Academic Fee', 45000.0, '2024-11-30', 'Pending'),
            (5, 5, 'Hostel & Mess Fee', 35000.0, '2024-12-10', 'Paid')
        ])
        cur.executemany("""
        INSERT INTO fee_payments (payment_id, fee_record_id, receipt_number, amount_paid, payment_date, payment_mode, transaction_ref) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            (1, 1, 'REC-2024-001', 45000.0, '2024-08-10', 'UPI Reference', 'UPI/2024/9871234'),
            (2, 2, 'REC-2024-002', 45000.0, '2024-08-12', 'Net Banking', 'NEFT/AXIS/442211'),
            (3, 3, 'REC-2024-003', 20000.0, '2024-08-15', 'UPI Reference', 'UPI/2024/774411'),
            (4, 5, 'REC-2024-004', 35000.0, '2024-08-20', 'Demand Draft', 'DD/SBI/665522')
        ])
        conn.commit()

    # Ensure timetables has seed data
    cur.execute("SELECT COUNT(*) FROM timetables")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO timetables (timetable_id, course_id, semester_number, day_of_week, time_slot, subject_id, faculty_id, room_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (1, 1, 1, 'Monday', '09:00 AM - 10:00 AM', 1, 3, 'AB-301'),
            (2, 1, 1, 'Monday', '10:15 AM - 11:15 AM', 2, 4, 'AB-301'),
            (3, 1, 1, 'Monday', '11:30 AM - 12:30 PM', 3, 1, 'AB-301'),
            (4, 1, 1, 'Monday', '02:00 PM - 04:00 PM', 5, 3, 'RT-204 (AI Lab)'),
            (5, 1, 1, 'Tuesday', '09:00 AM - 10:00 AM', 4, 4, 'AB-301'),
            (6, 1, 1, 'Tuesday', '10:15 AM - 11:15 AM', 6, 5, 'AB-301'),
            (7, 1, 1, 'Wednesday', '09:00 AM - 10:00 AM', 1, 3, 'AB-301'),
            (8, 1, 1, 'Wednesday', '10:15 AM - 11:15 AM', 2, 4, 'AB-301'),
            (9, 1, 1, 'Thursday', '02:00 PM - 04:00 PM', 5, 3, 'RT-204 (AI Lab)'),
            (10, 1, 1, 'Friday', '09:00 AM - 10:00 AM', 3, 1, 'AB-301'),
            (11, 1, 1, 'Friday', '10:15 AM - 11:15 AM', 6, 5, 'AB-301')
        ])
        conn.commit()

    # Ensure user aliases exist (Admin ID, Faculty ID, Student Reg Number)
    user_rows = [
        ('admin', hash_password('admin123'), 'Dean / Chief Administrator', 'admin@campuscore.edu', 'Administrator', None),
        ('admin@campuscore.edu', hash_password('admin123'), 'Dean / Chief Administrator', 'admin2@campuscore.edu', 'Administrator', None),
        ('dr_vikram', hash_password('faculty123'), 'Dr. Vikram Malhotra', 'vikram.malhotra@campuscore.edu', 'Faculty', 3),
        ('FAC103', hash_password('faculty123'), 'Dr. Vikram Malhotra', 'fac103@campuscore.edu', 'Faculty', 3),
        ('FAC101', hash_password('faculty123'), 'Dr. Ramesh Sharma', 'fac101@campuscore.edu', 'Faculty', 1),
        ('FAC104', hash_password('faculty123'), 'Prof. Priya Nair', 'fac104@campuscore.edu', 'Faculty', 4),
        ('aarav', hash_password('student123'), 'Aarav Sharma', 'aarav.sharma@student.campuscore.edu', 'Student', 1),
        ('BCA24001', hash_password('student123'), 'Aarav Sharma', 'bca24001@student.campuscore.edu', 'Student', 1),
        ('diya', hash_password('student123'), 'Diya Patel', 'diya.patel@student.campuscore.edu', 'Student', 2),
        ('BCA24002', hash_password('student123'), 'Diya Patel', 'bca24002@student.campuscore.edu', 'Student', 2),
        ('rohan', hash_password('student123'), 'Rohan Verma', 'rohan.verma@student.campuscore.edu', 'Student', 3),
        ('BCA24003', hash_password('student123'), 'Rohan Verma', 'bca24003@student.campuscore.edu', 'Student', 3)
    ]
    for u in user_rows:
        cur.execute("SELECT user_id FROM users WHERE username = ?", (u[0],))
        if not cur.fetchone():
            cur.execute("""
            INSERT INTO users (username, password_hash, full_name, email, role, linked_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
            """, u)
    conn.commit()

    conn.close()
    print("[+] SQLite schema & seed records loaded successfully.")


def seed_sqlite(conn):
    """Insert comprehensive sample data into SQLite."""
    cur = conn.cursor()

    # Departments
    cur.executemany("""
    INSERT INTO departments (department_id, code, name, building, head_of_dept) VALUES (?, ?, ?, ?, ?)
    """, [
        (1, 'DCA', 'Department of Computer Applications', 'Aryabhata Academic Block', 'Dr. Ramesh Sharma'),
        (2, 'DIT', 'Department of Information Technology', 'Turing Science Center', 'Dr. Sunita Rao'),
        (3, 'DAI', 'Department of Artificial Intelligence & Data Science', 'Ramanujan Tech Tower', 'Dr. Vikram Malhotra'),
        (4, 'DMS', 'Department of Management Studies', 'Chanakya Hall', 'Prof. Arvind Kumar')
    ])

    # Courses
    cur.executemany("""
    INSERT INTO courses (course_id, code, name, department_id, duration_years, total_semesters, degree_level) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'BCA', 'Bachelor of Computer Applications', 1, 3, 6, 'Undergraduate'),
        (2, 'BSC-CS', 'B.Sc. in Computer Science', 2, 3, 6, 'Undergraduate'),
        (3, 'BCA-AI', 'BCA with Specialization in Artificial Intelligence', 3, 3, 6, 'Undergraduate'),
        (4, 'MCA', 'Master of Computer Applications', 1, 2, 4, 'Postgraduate')
    ])

    # Semesters
    cur.executemany("""
    INSERT INTO semesters (semester_id, course_id, semester_number, academic_year, term, is_current) VALUES (?, ?, ?, ?, ?, ?)
    """, [
        (1, 1, 1, '2024-2025', 'Odd', 1),
        (2, 1, 2, '2024-2025', 'Even', 0),
        (3, 1, 3, '2024-2025', 'Odd', 0),
        (4, 3, 1, '2024-2025', 'Odd', 1)
    ])

    # Faculty
    cur.executemany("""
    INSERT INTO faculty (faculty_id, employee_code, first_name, last_name, email, phone, department_id, designation, qualification, specialization, joining_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'FAC101', 'Ramesh', 'Sharma', 'ramesh.sharma@campuscore.edu', '+91 9845012341', 1, 'HOD', 'Ph.D. in Computer Science', 'Artificial Intelligence & Data Mining', '2015-06-15', 'Active'),
        (2, 'FAC102', 'Sunita', 'Rao', 'sunita.rao@campuscore.edu', '+91 9845012342', 2, 'Professor', 'Ph.D. in Information Systems', 'Cloud Computing & Distributed Systems', '2017-08-20', 'Active'),
        (3, 'FAC103', 'Vikram', 'Malhotra', 'vikram.malhotra@campuscore.edu', '+91 9845012343', 3, 'Associate Professor', 'M.Tech, Ph.D. (AI)', 'Deep Learning & Natural Language Processing', '2019-01-10', 'Active'),
        (4, 'FAC104', 'Priya', 'Nair', 'priya.nair@campuscore.edu', '+91 9845012344', 1, 'Assistant Professor', 'M.Sc., M.Phil (Computer Science)', 'Web Architecture & Python Programming', '2020-07-01', 'Active'),
        (5, 'FAC105', 'Arvind', 'Kumar', 'arvind.kumar@campuscore.edu', '+91 9845012345', 4, 'Associate Professor', 'Ph.D. in Business Systems', 'IT Project Management & Ethics', '2018-03-12', 'Active'),
        (6, 'FAC106', 'Ananya', 'Roy', 'ananya.roy@campuscore.edu', '+91 9845012346', 3, 'Assistant Professor', 'M.Tech in Data Science', 'Computer Vision & Ethical AI', '2021-09-15', 'Active')
    ])

    # Students
    cur.executemany("""
    INSERT INTO students (student_id, reg_number, first_name, last_name, email, phone, dob, gender, course_id, current_semester_id, cgpa, admission_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'BCA24001', 'Aarav', 'Sharma', 'aarav.sharma@student.campuscore.edu', '+91 9876500001', '2005-04-12', 'Male', 1, 1, 8.85, '2024-07-15', 'Active'),
        (2, 'BCA24002', 'Diya', 'Patel', 'diya.patel@student.campuscore.edu', '+91 9876500002', '2005-08-23', 'Female', 1, 1, 9.20, '2024-07-15', 'Active'),
        (3, 'BCA24003', 'Rohan', 'Verma', 'rohan.verma@student.campuscore.edu', '+91 9876500003', '2004-11-05', 'Male', 1, 1, 6.75, '2024-07-16', 'Active'),
        (4, 'BCA24004', 'Sneha', 'Reddy', 'sneha.reddy@student.campuscore.edu', '+91 9876500004', '2005-02-17', 'Female', 1, 1, 8.40, '2024-07-16', 'Active'),
        (5, 'BCA24005', 'Karthik', 'Iyer', 'karthik.iyer@student.campuscore.edu', '+91 9876500005', '2005-06-30', 'Male', 1, 1, 7.90, '2024-07-17', 'Active'),
        (6, 'BCA24006', 'Meera', 'Nambiar', 'meera.nambiar@student.campuscore.edu', '+91 9876500006', '2005-09-14', 'Female', 1, 1, 8.95, '2024-07-17', 'Active'),
        (7, 'BCA24007', 'Aditya', 'Joshi', 'aditya.joshi@student.campuscore.edu', '+91 9876500007', '2004-12-01', 'Male', 1, 1, 6.40, '2024-07-18', 'Active'),
        (8, 'BCA24008', 'Pooja', 'Hegde', 'pooja.hegde@student.campuscore.edu', '+91 9876500008', '2005-03-25', 'Female', 1, 1, 9.45, '2024-07-18', 'Active'),
        (9, 'BCA24009', 'Naveen', 'Choudhary', 'naveen.c@student.campuscore.edu', '+91 9876500009', '2005-01-19', 'Male', 1, 1, 7.10, '2024-07-19', 'Active'),
        (10, 'BCA24010', 'Tanvi', 'Deshmukh', 'tanvi.d@student.campuscore.edu', '+91 9876500010', '2005-07-08', 'Female', 1, 1, 8.65, '2024-07-19', 'Active'),
        (11, 'BCA24011', 'Varun', 'Sengupta', 'varun.s@student.campuscore.edu', '+91 9876500011', '2004-10-10', 'Male', 1, 1, 6.15, '2024-07-20', 'Active'),
        (12, 'BCA24012', 'Ananya', 'Menon', 'ananya.m@student.campuscore.edu', '+91 9876500012', '2005-05-15', 'Female', 1, 1, 8.70, '2024-07-20', 'Active')
    ])

    # Subjects
    cur.executemany("""
    INSERT INTO subjects (subject_id, code, name, credits, course_id, semester_number, subject_type, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'BCA101', 'Introduction to Artificial Intelligence', 4, 1, 1, 'Theory', 3),
        (2, 'BCA102', 'Problem Solving with Python', 4, 1, 1, 'Theory', 4),
        (3, 'BCA103', 'Database Management Systems', 4, 1, 1, 'Theory', 1),
        (4, 'BCA104', 'Web Technologies & Responsive UI', 3, 1, 1, 'Theory', 4),
        (5, 'BCA105', 'Python Programming & AI Lab', 2, 1, 1, 'Lab', 3),
        (6, 'BCA106', 'Mathematical Foundations for Computing', 4, 1, 1, 'Theory', 5)
    ])

    # Attendance
    attendance_data = [
        (1, 1, '2024-10-01', 'Present', 'Attentive'),
        (1, 1, '2024-10-03', 'Present', 'Participated in Q&A'),
        (1, 1, '2024-10-05', 'Present', 'On time'),
        (1, 1, '2024-10-08', 'Present', 'Lab completed'),
        (1, 2, '2024-10-02', 'Present', 'Coding exercise'),
        (1, 2, '2024-10-04', 'Present', 'On time'),
        (2, 1, '2024-10-01', 'Present', 'Active interaction'),
        (2, 1, '2024-10-03', 'Present', 'On time'),
        (2, 1, '2024-10-05', 'Present', 'On time'),
        (2, 2, '2024-10-02', 'Present', 'Fast submission'),
        (3, 1, '2024-10-01', 'Absent', 'Medical leave'),
        (3, 1, '2024-10-03', 'Absent', 'Unexcused'),
        (3, 1, '2024-10-05', 'Late', 'Late by 15 mins'),
        (3, 1, '2024-10-08', 'Absent', 'Shortage risk'),
        (3, 2, '2024-10-02', 'Absent', 'Unexcused'),
        (4, 1, '2024-10-01', 'Present', 'On time'),
        (4, 1, '2024-10-03', 'Present', 'On time'),
        (4, 1, '2024-10-05', 'Present', 'On time'),
        (7, 1, '2024-10-01', 'Absent', 'Unexcused'),
        (7, 1, '2024-10-03', 'Absent', 'Unexcused'),
        (7, 1, '2024-10-05', 'Absent', 'Unexcused shortage flag'),
        (11, 1, '2024-10-01', 'Absent', 'Sports trial'),
        (11, 1, '2024-10-03', 'Late', 'Late arrival'),
        (11, 1, '2024-10-05', 'Absent', 'Under 65% warning')
    ]
    cur.executemany("""
    INSERT INTO attendance (student_id, subject_id, attendance_date, status, remarks) VALUES (?, ?, ?, ?, ?)
    """, attendance_data)

    # Marks
    marks_data = [
        (1, 1, 'Internal 1', 28.50, 30.00, 'Excellent conceptual clarity'),
        (1, 1, 'Internal 2', 27.00, 30.00, 'Strong problem solving'),
        (1, 2, 'Internal 1', 29.00, 30.00, 'Clean Python coding'),
        (1, 3, 'Internal 1', 26.50, 30.00, 'Good SQL joins understanding'),
        (2, 1, 'Internal 1', 30.00, 30.00, 'Top score in class'),
        (2, 1, 'Internal 2', 29.50, 30.00, 'Distinction level'),
        (2, 2, 'Internal 1', 30.00, 30.00, 'Flawless algorithms'),
        (3, 1, 'Internal 1', 14.00, 30.00, 'Needs revision in search algorithms'),
        (3, 1, 'Internal 2', 15.50, 30.00, 'Requires coaching'),
        (3, 2, 'Internal 1', 13.00, 30.00, 'Struggling with loops & recursion'),
        (4, 1, 'Internal 1', 25.00, 30.00, 'Good performance'),
        (4, 2, 'Internal 1', 26.00, 30.00, 'Consistent effort'),
        (7, 1, 'Internal 1', 12.50, 30.00, 'Academic warning - remedial classes advised'),
        (7, 2, 'Internal 1', 14.00, 30.00, 'Low scores in recursion'),
        (8, 1, 'Internal 1', 29.50, 30.00, 'Outstanding analytical answers'),
        (8, 2, 'Internal 1', 30.00, 30.00, 'Best OOP design implementation'),
        (11, 1, 'Internal 1', 11.00, 30.00, 'Critical risk tier')
    ]
    cur.executemany("""
    INSERT INTO marks (student_id, subject_id, exam_type, marks_obtained, max_marks, remarks) VALUES (?, ?, ?, ?, ?, ?)
    """, marks_data)

    # Events
    cur.executemany("""
    INSERT INTO events (event_id, title, description, category, venue, event_date, start_time, end_time, max_seats, registered_count, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'AI & Robotics Hackathon 2024', '36-hour competitive coding and hardware prototyping challenge focusing on computer vision and autonomous agents.', 'Technical', 'Turing Innovation Hub, 4th Floor', '2024-11-20', '09:00:00', '18:00:00', 150, 84, 'Upcoming', 'Dr. Vikram Malhotra'),
        (2, 'Cloud AI & MLOps Hands-on Workshop', 'Industry-led masterclass on deploying PyTorch models, Docker containers, and REST APIs on cloud infrastructure.', 'Workshop', 'Ada Lovelace Computing Lab', '2024-11-25', '10:30:00', '16:00:00', 60, 48, 'Upcoming', 'Dr. Sunita Rao'),
        (3, 'National Seminar on Ethical & Responsible AI', 'Panel discussion with industry ethicists on algorithmic bias, data privacy, and EU AI Act compliance.', 'Seminar', 'Main Auditorium (Capacity 500)', '2024-12-05', '14:00:00', '17:30:00', 400, 210, 'Upcoming', 'Prof. Arvind Kumar'),
        (4, 'CYBERFEST 2024: Annual Tech Fest', 'Inter-university technology fest featuring Web3, cybersecurity CTF, gaming, and UI/UX design sprint.', 'Technical', 'Campus Amphitheatre & Sports Arena', '2024-12-15', '09:00:00', '20:00:00', 600, 340, 'Upcoming', 'Campus Admin'),
        (5, 'Inter-Department Cricket & Badminton Tournament', 'Annual sporting tournament fostering team spirit and fitness among faculty and students.', 'Sports', 'University Sports Pavilion', '2024-11-28', '08:00:00', '16:00:00', 200, 95, 'Upcoming', 'Sports Committee')
    ])

    # Event Registrations
    cur.executemany("""
    INSERT INTO event_registrations (registration_id, event_id, student_id, status) VALUES (?, ?, ?, ?)
    """, [
        (1, 1, 1, 'Confirmed'),
        (2, 1, 2, 'Confirmed'),
        (3, 1, 4, 'Confirmed'),
        (4, 2, 1, 'Confirmed'),
        (5, 2, 5, 'Confirmed'),
        (6, 3, 2, 'Confirmed'),
        (7, 3, 8, 'Confirmed')
    ])

    # Campus Resources
    cur.executemany("""
    INSERT INTO campus_resources (resource_id, name, resource_type, building, room_number, capacity, status, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'Smart Lecture Hall 301', 'Classroom', 'Aryabhata Academic Block', 'AB-301', 75, 'Available', 'Interactive 86-inch Smart Display, Acoustic Mic System, Air Conditioned'),
        (2, 'Ada Lovelace AI & Data Science Lab', 'Computer Lab', 'Ramanujan Tech Tower', 'RT-204', 60, 'Available', '60 High-end i7 32GB RAM Desktops, NVIDIA RTX 4080 GPUs, Gigabit LAN'),
        (3, 'Alan Turing Systems Lab', 'Computer Lab', 'Turing Science Center', 'TC-108', 50, 'Booked', 'Linux Workstations, Cisco Networking Racks, Dual Monitors'),
        (4, 'Main Campus Auditorium', 'Auditorium', 'Central Administrative Complex', 'AUD-01', 500, 'Available', 'Dual 4K Laser Projection, Dolby 7.1 Stage Audio, Tiered Seating'),
        (5, 'High-Performance GPU Server Alpha', 'GPU Server', 'Data Center Basement', 'DC-S01', 16, 'Available', '4x NVIDIA A100 80GB, 256GB ECC RAM, Slurm Workload Manager'),
        (6, 'Portable 4K Laser Projector Unit #3', 'Projector', 'Media Equipment Vault', 'EV-03', 1, 'Available', 'Wireless HDMI, 5000 Lumens, Battery & Tripod pack')
    ])

    # Resource Bookings
    cur.executemany("""
    INSERT INTO resource_bookings (booking_id, resource_id, user_id, user_name, purpose, booking_date, time_slot, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 3, 3, 'Dr. Vikram Malhotra', 'Deep Learning Model Training Session for BCA Semester 1 AI students', '2024-11-15', '09:00 AM - 12:00 PM', 'Approved'),
        (2, 1, 4, 'Prof. Priya Nair', 'Web Development Hack-Sprint practice', '2024-11-16', '02:00 PM - 04:00 PM', 'Approved'),
        (3, 4, 1, 'Campus Admin', 'Pre-Hackathon Briefing and Team Formations', '2024-11-19', '11:00 AM - 01:00 PM', 'Pending')
    ])

    # Student Feedback
    cur.executemany("""
    INSERT INTO student_feedback (feedback_id, student_id, category, target_name, rating, comments, sentiment, sentiment_score, ai_summary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 1, 'Faculty & Teaching', 'Dr. Vikram Malhotra (AI)', 5, 'The explanations of A* search and Heuristic evaluation are extremely clear and engaging. Real-world examples make concepts easy to grasp.', 'Positive', 0.94, 'High student appreciation for interactive AI teaching style and clear practical heuristics explanation.', 'Reviewed'),
        (2, 2, 'Lab Facilities', 'Ada Lovelace AI Lab', 5, 'GPUs work seamlessly for deep learning models. Visual Studio Code and Jupyter environments are well configured.', 'Positive', 0.91, 'Praise for high-performance lab workstations and pre-installed AI tooling.', 'Reviewed'),
        (3, 3, 'Curriculum & Courses', 'DBMS Course Pace', 2, 'The SQL joins and transaction concepts are moving too fast in lectures. Need more step-by-step practical query workshops.', 'Negative', 0.28, 'Pacing concern regarding SQL normalization and ACID transactions; student requests remedial practice.', 'Reviewed'),
        (4, 7, 'Campus Infrastructure', 'Library WiFi & Seating', 3, 'Wi-Fi connection frequently drops on the second floor reading room. Seating is comfortable though.', 'Neutral', 0.48, 'Infrastructure alert: Wireless access point instability reported in second-floor library study hall.', 'Pending'),
        (5, 4, 'Faculty & Teaching', 'Prof. Priya Nair (Python)', 5, 'Excellent guidance during hands-on lab sessions. Patiently debugs code with every student.', 'Positive', 0.96, 'Commendable faculty mentoring during live coding and debugging exercises.', 'Reviewed')
    ])

    # Career Profiles
    cur.executemany("""
    INSERT INTO career_profiles (profile_id, student_id, technical_skills, interests, preferred_domain, ai_recommended_path, ai_match_score, ai_learning_roadmap) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 1, 'Python, SQL, Algorithms, Git, Data Structures', 'Machine Learning, NLP, Intelligent Agents', 'Artificial Intelligence', 'AI & Machine Learning Engineer', 92, 'Step 1: Master Linear Algebra and NumPy/Pandas. Step 2: Implement Supervised & Unsupervised ML with Scikit-Learn. Step 3: Deep Learning with PyTorch & Hugging Face Transformers. Step 4: Build End-to-End MLOps pipeline with FastAPI & Docker.'),
        (2, 2, 'React.js, JavaScript, Tailwind, Python, REST APIs', 'Web Engineering, User Experience, Cloud Architecture', 'Full Stack Development', 'Full-Stack Software Engineer', 95, 'Step 1: Advanced TypeScript and Next.js / React Router. Step 2: Scalable backend development with Python Flask/Node.js. Step 3: Database design, Redis caching, and JWT auth. Step 4: CI/CD automation and AWS/GCP cloud container deployment.')
    ])

    # AI Content Library
    cur.executemany("""
    INSERT INTO ai_content_library (content_id, user_id, content_type, title, prompt_context, output_text) VALUES (?, ?, ?, ?, ?, ?)
    """, [
        (1, 1, 'study_notes', 'Introduction to Artificial Intelligence: Search Strategies & Heuristics', 'BCA Semester 1 Module 2: State Space Search, BFS, DFS, and Heuristic Search Algorithms.', '### Module Overview: Search Strategies in AI\n\n**1. State Space Representation**\nIn AI, problem-solving is modeled as navigating a graph of states from an *Initial State* to a *Goal State* using available *Actions* (Transitions).\n\n**2. Uninformed (Blind) Search**\n- **Breadth-First Search (BFS):** Explores tree layer-by-layer using a FIFO queue. It is complete and optimal when step costs are equal, but consumes high exponential memory: O(b^d).\n- **Depth-First Search (DFS):** Explores deepest node first using a LIFO stack. Highly memory efficient: O(bm), but not guaranteed to find the shortest path.\n\n**3. Informed (Heuristic) Search**\n- **Heuristic Function h(n):** An estimation of cost from current node n to goal state.\n- **A* Search Algorithm:** Evaluates f(n) = g(n) + h(n), where g(n) is exact cost from start to n, and h(n) is admissible heuristic (never overestimates). A* is both complete and optimal!\n\n**Key Takeaway for Exam:** Always ensure h(n) is admissible and consistent for tree/graph search optimality.'),
        (2, 1, 'quiz', 'AI Foundations 5-Question Concept Quiz', 'Topics: Turing Test, Agents, BFS vs DFS, Admissibility, Supervised Learning', '1. What property ensures an A* search heuristic is admissible?\n   a) It always overestimates the cost\n   b) It never overestimates the true cost to the goal [Correct]\n   c) It equals the distance traveled so far\n   d) It must be negative\n   *Explanation: An admissible heuristic h(n) <= h*(n) guarantees A* finds optimal solutions.*\n\n2. Which search algorithm utilizes a First-In-First-Out (FIFO) queue?\n   a) Depth-First Search\n   b) Breadth-First Search [Correct]\n   c) Greedy Best-First Search\n   d) Uniform-Cost Search\n\n3. In an Intelligent Agent architecture, what does the PEAS description stand for?\n   a) Program, Entity, Action, System\n   b) Performance measure, Environment, Actuators, Sensors [Correct]\n   c) Planning, Execution, Analysis, Storage\n   d) Perception, Evaluation, Automation, State')
    ])

    # Notifications
    cur.executemany("""
    INSERT INTO notifications (notification_id, user_id, target_role, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, None, 'All', 'Campus AI & Hackathon Registration Live', 'Registrations are open for the 36-Hour Hackathon 2024. Win exciting prizes and industry mentorship!', 'info', 0),
        (2, None, 'Student', 'Attendance Shortage Alert (<75%)', 'Students with attendance below 75% in BCA101 and BCA103 must meet their academic counselors before the 15th.', 'warning', 0),
        (3, None, 'Faculty', 'Mid-Term Mark Submission Deadline', 'Please finalize and upload CIA-1 and CIA-2 internal assessment marks by Friday 5:00 PM.', 'alert', 0),
        (4, None, 'All', 'AI Ethics & Responsible Computing Guidelines Released', 'Review the Smart Campus Responsible AI Charter regarding student privacy and generative tool transparency.', 'success', 0)
    ])

    # Users
    cur.executemany("""
    INSERT INTO users (user_id, username, password_hash, full_name, email, role, linked_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'admin', hash_password('admin123'), 'Dean / Chief Administrator', 'admin@campuscore.edu', 'Administrator', None, 1),
        (2, 'dr_vikram', hash_password('faculty123'), 'Dr. Vikram Malhotra', 'vikram.malhotra@campuscore.edu', 'Faculty', 3, 1),
        (3, 'aarav', hash_password('student123'), 'Aarav Sharma', 'aarav.sharma@student.campuscore.edu', 'Student', 1, 1),
        (4, 'diya', hash_password('student123'), 'Diya Patel', 'diya.patel@student.campuscore.edu', 'Student', 2, 1)
    ])

    # Responsible AI Logs
    cur.executemany("""
    INSERT INTO responsible_ai_logs (log_id, user_id, tool_name, prompt_summary, pii_detected, safety_rating, ai_engine) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 1, 'Academic Notes Generator', 'Requested study notes on A* Search and Heuristic Admissibility', 0, 'Safe', 'Local-Heuristic-AI'),
        (2, 3, 'Career Guidance AI', 'Profile career matching for AI/ML Engineer role', 0, 'Safe', 'Local-Heuristic-AI'),
        (3, 2, 'Content Generator', 'Drafted notification for hackathon event with formal academic tone', 0, 'Safe', 'Local-Heuristic-AI')
    ])

    # Admissions Inquiries
    cur.executemany("""
    INSERT INTO admissions_inquiries (inquiry_id, full_name, email, phone, program_interested, academic_score, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (1, 'Siddharth Rao', 'siddharth.rao@gmail.com', '+91 9845112233', 'BCA with AI Specialization', 88.5, 'Interested in scholarship criteria and GPU lab access for AI research.', 'Under Review'),
        (2, 'Kavya Sundaram', 'kavya.s@outlook.com', '+91 9845223344', 'B.Sc. in Computer Science', 92.0, 'Inquiring about hostel accommodation and placement records.', 'Admitted'),
        (3, 'Abhishek Gowda', 'abhishek.g@yahoo.com', '+91 9845334455', 'Master of Computer Applications (MCA)', 84.0, 'Lateral entry eligibility questions for MCA program.', 'New')
    ])

    # Contact Messages
    cur.executemany("""
    INSERT INTO contact_messages (message_id, name, email, subject, message, status) VALUES (?, ?, ?, ?, ?, ?)
    """, [
        (1, 'Prof. N. K. Murthy', 'nkmurthy@ieee.org', 'Guest Lecture on Responsible AI', 'Would like to propose a guest lecture session for BCA semester 1 students in Dec 2024.', 'Read'),
        (2, 'TechCorp Placement Lead', 'hr@techcorp.in', 'Campus Placement Drive 2024-25', 'Requesting date confirmation for on-campus technical recruitment interviews.', 'New')
    ])

    conn.commit()


def init_mysql():
    """Execute MySQL DDL and seed scripts if MySQL is online."""
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        charset="utf8mb4"
    )
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.select_db(DB_NAME)

    # Read and execute schema and seed scripts
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "campuscore_ai_schema.sql")
    seed_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "campuscore_ai_seed.sql")

    def run_sql_file(path):
        if not os.path.exists(path):
            return
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        statements = content.split(";")
        with conn.cursor() as cur:
            for stmt in statements:
                stmt_clean = stmt.strip()
                if stmt_clean and not stmt_clean.lower().startswith("drop database") and not stmt_clean.lower().startswith("create database") and not stmt_clean.lower().startswith("use "):
                    try:
                        cur.execute(stmt_clean)
                    except Exception:
                        pass
        conn.commit()

    run_sql_file(schema_path)
    run_sql_file(seed_path)
    conn.close()

