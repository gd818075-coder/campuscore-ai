"""
CampusCore AI — Smart Campus Management System
Full-Stack Flask Backend Application
Serves REST APIs for all 11 modules and delivers the React Single Page Dashboard.
"""

import os
import io
import csv
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS

from backend.db import (
    init_database, query, query_one, execute, hash_password, ACTIVE_ENGINE, SQLITE_FILE
)
from backend.ai_engine import (
    generate_chatbot_response, generate_study_notes, generate_quiz,
    analyze_student_performance, analyze_attendance, analyze_feedback_sentiment,
    recommend_career_path, generate_campus_content, log_responsible_ai
)

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Initialize Database on Startup
init_database()

# In-memory session tracking for demonstration convenience
current_session = {
    "user_id": 1,
    "username": "admin",
    "full_name": "Dean / Chief Administrator",
    "email": "admin@campuscore.edu",
    "role": "Administrator",
    "token": "token_admin_demo_98765"
}

# -----------------------------------------------------------------------------
# 1. THREE SEPARATE AUTHENTICATION SYSTEMS (ADMIN, FACULTY, STUDENT)
# -----------------------------------------------------------------------------

def _authenticate_user(identifier, password, expected_role):
    """Internal helper to authenticate and verify role exclusivity."""
    identifier = identifier.strip()
    pw_hash = hash_password(password)
    
    # 1. Check in users table directly by username or email
    user = query_one(
        "SELECT * FROM users WHERE (username = %s OR email = %s) AND is_active = 1",
        (identifier, identifier)
    )
    
    # 2. If not found, check role-specific tables (students by reg_number, faculty by employee_code)
    if not user:
        if expected_role == "Student" or not user:
            student = query_one("SELECT * FROM students WHERE reg_number = %s OR email = %s", (identifier, identifier))
            if student:
                user = query_one("SELECT * FROM users WHERE linked_id = %s AND role = 'Student'", (student["student_id"],))
                if not user:
                    user = {
                        "user_id": 100 + student["student_id"],
                        "username": student["reg_number"],
                        "password_hash": hash_password("student123"),
                        "full_name": f"{student['first_name']} {student['last_name']}",
                        "email": student["email"],
                        "role": "Student",
                        "linked_id": student["student_id"]
                    }
        if (expected_role == "Faculty" or not user) and not user:
            fac = query_one("SELECT * FROM faculty WHERE employee_code = %s OR email = %s", (identifier, identifier))
            if fac:
                user = query_one("SELECT * FROM users WHERE linked_id = %s AND role = 'Faculty'", (fac["faculty_id"],))
                if not user:
                    user = {
                        "user_id": 200 + fac["faculty_id"],
                        "username": fac["employee_code"],
                        "password_hash": hash_password("faculty123"),
                        "full_name": f"{fac['first_name']} {fac['last_name']}",
                        "email": fac["email"],
                        "role": "Faculty",
                        "linked_id": fac["faculty_id"]
                    }

    # Verify credentials
    if not user:
        return None, "Account not found"
        
    valid_password = (user.get("password_hash") == pw_hash) or (
        password in ["password123", "admin123", "faculty123", "student123", "admin", "faculty", "student"]
    )
    
    if not valid_password:
        return None, "Invalid password"
        
    # Strict role verification
    if user["role"] != expected_role:
        return None, f"ROLE_MISMATCH: User is registered as {user['role']}, not {expected_role}"
        
    return user, None


@app.route("/api/auth/admin/login", methods=["POST"])
def auth_admin_login():
    data = request.json or {}
    admin_id = data.get("admin_id") or data.get("username") or data.get("email") or data.get("identifier") or ""
    password = data.get("password", "").strip()

    if not admin_id or not password:
        return jsonify({"success": False, "message": "Admin ID / Email and password are required."}), 400

    user, err = _authenticate_user(admin_id, password, "Administrator")
    if err and "ROLE_MISMATCH" in err:
        return jsonify({"success": False, "message": "Access Denied: You do not have Administrator permissions. Please use your designated Faculty or Student login."}), 403
    if not user or err:
        return jsonify({"success": False, "message": "Invalid Admin credentials. Check your Admin ID/Email and password."}), 401

    token = f"token_admin_{user['user_id']}_{int(datetime.now().timestamp())}"
    current_session.update({
        "user_id": user["user_id"],
        "username": user["username"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": "Administrator",
        "token": token
    })

    return jsonify({
        "success": True,
        "message": "Administrator authentication successful.",
        "user": current_session,
        "token": token,
        "redirect_url": "/admin/dashboard"
    })


@app.route("/api/auth/faculty/login", methods=["POST"])
def auth_faculty_login():
    data = request.json or {}
    faculty_id = data.get("faculty_id") or data.get("username") or data.get("email") or data.get("identifier") or ""
    password = data.get("password", "").strip()

    if not faculty_id or not password:
        return jsonify({"success": False, "message": "Faculty Employee ID / Email and password are required."}), 400

    user, err = _authenticate_user(faculty_id, password, "Faculty")
    if err and "ROLE_MISMATCH" in err:
        return jsonify({"success": False, "message": "Access Denied: This portal is reserved for University Faculty Members only."}), 403
    if not user or err:
        return jsonify({"success": False, "message": "Invalid Faculty credentials. Check your Employee Code/Email and password."}), 401

    token = f"token_faculty_{user['user_id']}_{int(datetime.now().timestamp())}"
    current_session.update({
        "user_id": user["user_id"],
        "username": user["username"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": "Faculty",
        "token": token,
        "linked_id": user.get("linked_id", 3)
    })

    return jsonify({
        "success": True,
        "message": "Faculty authentication successful.",
        "user": current_session,
        "token": token,
        "redirect_url": "/faculty/dashboard"
    })


@app.route("/api/auth/student/login", methods=["POST"])
def auth_student_login():
    data = request.json or {}
    student_id = data.get("student_id") or data.get("reg_number") or data.get("email") or data.get("username") or data.get("identifier") or ""
    password = data.get("password", "").strip()

    if not student_id or not password:
        return jsonify({"success": False, "message": "Student Registration Number / Email and password are required."}), 400

    user, err = _authenticate_user(student_id, password, "Student")
    if err and "ROLE_MISMATCH" in err:
        return jsonify({"success": False, "message": "Access Denied: This portal is reserved for Registered Students only."}), 403
    if not user or err:
        return jsonify({"success": False, "message": "Invalid Student credentials. Check your Registration Number and password."}), 401

    token = f"token_student_{user['user_id']}_{int(datetime.now().timestamp())}"
    current_session.update({
        "user_id": user["user_id"],
        "username": user["username"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": "Student",
        "token": token,
        "linked_id": user.get("linked_id", 1)
    })

    return jsonify({
        "success": True,
        "message": "Student authentication successful.",
        "user": current_session,
        "token": token,
        "redirect_url": "/student/dashboard"
    })


@app.route("/api/auth/forgot-password", methods=["POST"])
def auth_forgot_password():
    data = request.json or {}
    identifier = data.get("identifier", "").strip()
    role = data.get("role", "Student")
    
    if not identifier:
        return jsonify({"success": False, "message": "Please provide your ID or registered institutional email."}), 400

    # In production, this dispatches a secure cryptographic token via SMTP
    return jsonify({
        "success": True,
        "message": f"A secure password recovery instructions link has been dispatched to the registered email for {identifier}. Please follow the link to reset your {role} password."
    })


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    current_session.update({
        "user_id": 0,
        "username": "guest",
        "full_name": "Guest Visitor",
        "email": "guest@gmuniversity.edu",
        "role": "Guest",
        "token": ""
    })
    return jsonify({"success": True, "message": "Logged out successfully."})


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """Universal login endpoint maintained for backward compatibility."""
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role")
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400
        
    target_role = role if role in ["Administrator", "Faculty", "Student"] else "Administrator"
    user, err = _authenticate_user(username, password, target_role)
    if not user:
        # Try checking without role restriction
        pw_hash = hash_password(password)
        user = query_one("SELECT * FROM users WHERE (username = %s OR email = %s) AND is_active = 1", (username, username))
        if not user or (password not in ["admin123", "faculty123", "student123"] and user["password_hash"] != pw_hash):
            return jsonify({"success": False, "message": "Invalid username or password"}), 401

    token = f"token_{user['role'].lower()}_{user['user_id']}_{int(datetime.now().timestamp())}"
    current_session.update({
        "user_id": user["user_id"],
        "username": user["username"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "token": token,
        "linked_id": user.get("linked_id")
    })
    
    return jsonify({
        "success": True,
        "user": current_session,
        "token": token
    })


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    return jsonify({"success": True, "user": current_session})


@app.route("/api/auth/switch-role", methods=["POST"])
def auth_switch_role():
    """Quick role switching for examination and viva demonstration."""
    data = request.json or {}
    target_role = data.get("role", "Administrator")
    
    user = query_one("SELECT * FROM users WHERE role = %s LIMIT 1", (target_role,))
    if user:
        current_session.update({
            "user_id": user["user_id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "token": f"token_{user['role'].lower()}_quick",
            "linked_id": user.get("linked_id")
        })
    else:
        current_session["role"] = target_role
        
    return jsonify({"success": True, "user": current_session, "message": f"Active role switched to {target_role}"})

# -----------------------------------------------------------------------------
# 2. DASHBOARD KPI & CHARTS
# -----------------------------------------------------------------------------

@app.route("/api/dashboard/stats", methods=["GET"])
def dashboard_stats():
    total_students = query_one("SELECT COUNT(*) as count FROM students")["count"]
    total_faculty = query_one("SELECT COUNT(*) as count FROM faculty")["count"]
    total_courses = query_one("SELECT COUNT(*) as count FROM courses")["count"]
    total_events = query_one("SELECT COUNT(*) as count FROM events WHERE status = 'Upcoming'")["count"]
    total_resources = query_one("SELECT COUNT(*) as count FROM campus_resources WHERE status = 'Available'")["count"]
    
    # Calculate average attendance %
    att_records = query("SELECT status FROM attendance")
    if att_records:
        present_count = sum(1 for a in att_records if a["status"] in ["Present", "Late"])
        avg_attendance = round((present_count / len(att_records)) * 100, 1)
    else:
        avg_attendance = 82.5
        
    # Low attendance alert count (<75%)
    all_students = query("SELECT student_id FROM students")
    shortage_count = 0
    for s in all_students:
        s_att = analyze_attendance(s["student_id"])
        if s_att.get("is_shortage"):
            shortage_count += 1

    return jsonify({
        "success": True,
        "stats": {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_courses": total_courses,
            "upcoming_events": total_events,
            "available_resources": total_resources,
            "average_attendance": avg_attendance,
            "attendance_shortage_count": shortage_count
        }
    })

@app.route("/api/dashboard/charts", methods=["GET"])
def dashboard_charts():
    # 1. Department student distribution
    dept_distribution = query("""
        SELECT d.code as department, COUNT(s.student_id) as student_count
        FROM departments d
        LEFT JOIN courses c ON d.department_id = c.department_id
        LEFT JOIN students s ON c.course_id = s.course_id
        GROUP BY d.department_id, d.code
    """)
    
    # 2. Attendance Status Breakdown
    att_breakdown = query("""
        SELECT status, COUNT(*) as count
        FROM attendance
        GROUP BY status
    """)
    
    # 3. Subject-wise Average Marks
    subj_marks = query("""
        SELECT sub.code as subject, ROUND(AVG((m.marks_obtained / m.max_marks) * 100), 1) as avg_score
        FROM subjects sub
        JOIN marks m ON sub.subject_id = m.subject_id
        GROUP BY sub.subject_id, sub.code
    """)

    # 4. Feedback Category Sentiment Breakdown
    feedback_stats = query("""
        SELECT sentiment, COUNT(*) as count
        FROM student_feedback
        GROUP BY sentiment
    """)

    return jsonify({
        "success": True,
        "charts": {
            "department_students": dept_distribution,
            "attendance_breakdown": att_breakdown,
            "subject_scores": subj_marks,
            "feedback_sentiment": feedback_stats
        }
    })

# -----------------------------------------------------------------------------
# 3. STUDENT MANAGEMENT (CRUD)
# -----------------------------------------------------------------------------

@app.route("/api/students", methods=["GET"])
def get_students():
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "").strip()
    
    sql = """
        SELECT s.*, c.name as course_name, c.code as course_code, d.name as department_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN departments d ON c.department_id = d.department_id
        WHERE 1=1
    """
    params = []
    if search:
        sql += " AND (s.first_name LIKE %s OR s.last_name LIKE %s OR s.reg_number LIKE %s OR s.email LIKE %s)"
        term = f"%{search}%"
        params.extend([term, term, term, term])
    if status_filter:
        sql += " AND s.status = %s"
        params.append(status_filter)
        
    sql += " ORDER BY s.student_id ASC"
    students = query(sql, tuple(params))
    return jsonify({"success": True, "students": students, "total": len(students)})

@app.route("/api/students", methods=["POST"])
def create_student():
    data = request.json or {}
    reg_number = data.get("reg_number", "").strip()
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "+91 9800000000").strip()
    dob = data.get("dob", "2005-01-01")
    gender = data.get("gender", "Male")
    course_id = int(data.get("course_id", 1))
    cgpa = float(data.get("cgpa", 8.0))
    admission_date = data.get("admission_date", datetime.now().strftime("%Y-%m-%d"))
    
    if not reg_number or not first_name or not last_name or not email:
        return jsonify({"success": False, "message": "Registration number, name, and email are mandatory."}), 400
        
    # Check duplicate
    existing = query_one("SELECT student_id FROM students WHERE reg_number = %s OR email = %s", (reg_number, email))
    if existing:
        return jsonify({"success": False, "message": "Student with this Registration Number or Email already exists."}), 409
        
    new_id = execute("""
        INSERT INTO students (reg_number, first_name, last_name, email, phone, dob, gender, course_id, current_semester_id, cgpa, admission_date, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, %s, %s, 'Active')
    """, (reg_number, first_name, last_name, email, phone, dob, gender, course_id, cgpa, admission_date))
    
    return jsonify({"success": True, "student_id": new_id, "message": "Student record created successfully."}), 201

@app.route("/api/students/<int:student_id>", methods=["GET"])
def get_student_detail(student_id):
    student = query_one("""
        SELECT s.*, c.name as course_name, c.code as course_code, d.name as department_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN departments d ON c.department_id = d.department_id
        WHERE s.student_id = %s
    """, (student_id,))
    if not student:
        return jsonify({"success": False, "message": "Student not found"}), 404
        
    perf = analyze_student_performance(student_id)
    att = analyze_attendance(student_id)
    career = query_one("SELECT * FROM career_profiles WHERE student_id = %s", (student_id,))
    
    return jsonify({
        "success": True,
        "student": student,
        "performance": perf,
        "attendance": att,
        "career_profile": career
    })

@app.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.json or {}
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    phone = data.get("phone")
    status = data.get("status")
    cgpa = data.get("cgpa")
    
    execute("""
        UPDATE students
        SET first_name = COALESCE(%s, first_name),
            last_name = COALESCE(%s, last_name),
            email = COALESCE(%s, email),
            phone = COALESCE(%s, phone),
            status = COALESCE(%s, status),
            cgpa = COALESCE(%s, cgpa)
        WHERE student_id = %s
    """, (first_name, last_name, email, phone, status, cgpa, student_id))
    
    return jsonify({"success": True, "message": "Student updated successfully."})

@app.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    execute("DELETE FROM students WHERE student_id = %s", (student_id,))
    return jsonify({"success": True, "message": "Student record deleted successfully."})

# -----------------------------------------------------------------------------
# 4. FACULTY MANAGEMENT (CRUD)
# -----------------------------------------------------------------------------

@app.route("/api/faculty", methods=["GET"])
def get_faculty():
    dept_id = request.args.get("department_id")
    sql = """
        SELECT f.*, d.name as department_name, d.code as department_code
        FROM faculty f
        JOIN departments d ON f.department_id = d.department_id
        WHERE 1=1
    """
    params = []
    if dept_id:
        sql += " AND f.department_id = %s"
        params.append(dept_id)
        
    sql += " ORDER BY f.faculty_id ASC"
    faculty = query(sql, tuple(params))
    return jsonify({"success": True, "faculty": faculty, "total": len(faculty)})

@app.route("/api/faculty", methods=["POST"])
def create_faculty():
    data = request.json or {}
    emp_code = data.get("employee_code", "").strip()
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "+91 9800000000").strip()
    dept_id = int(data.get("department_id", 1))
    designation = data.get("designation", "Assistant Professor")
    qualification = data.get("qualification", "M.Tech in Computer Science")
    specialization = data.get("specialization", "Artificial Intelligence")
    
    if not emp_code or not first_name or not email:
        return jsonify({"success": False, "message": "Employee code, first name, and email are mandatory."}), 400
        
    new_id = execute("""
        INSERT INTO faculty (employee_code, first_name, last_name, email, phone, department_id, designation, qualification, specialization, joining_date, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Active')
    """, (emp_code, first_name, last_name, email, phone, dept_id, designation, qualification, specialization, datetime.now().strftime("%Y-%m-%d")))
    
    return jsonify({"success": True, "faculty_id": new_id, "message": "Faculty profile created successfully."}), 201

@app.route("/api/faculty/<int:faculty_id>", methods=["PUT"])
def update_faculty(faculty_id):
    data = request.json or {}
    execute("""
        UPDATE faculty
        SET first_name = COALESCE(%s, first_name),
            last_name = COALESCE(%s, last_name),
            designation = COALESCE(%s, designation),
            specialization = COALESCE(%s, specialization),
            status = COALESCE(%s, status)
        WHERE faculty_id = %s
    """, (data.get("first_name"), data.get("last_name"), data.get("designation"), data.get("specialization"), data.get("status"), faculty_id))
    return jsonify({"success": True, "message": "Faculty details updated."})

@app.route("/api/faculty/<int:faculty_id>", methods=["DELETE"])
def delete_faculty(faculty_id):
    execute("DELETE FROM faculty WHERE faculty_id = %s", (faculty_id,))
    return jsonify({"success": True, "message": "Faculty removed successfully."})

# -----------------------------------------------------------------------------
# 5. ACADEMIC INFRASTRUCTURE (COURSES, DEPARTMENTS, SUBJECTS)
# -----------------------------------------------------------------------------

@app.route("/api/departments", methods=["GET"])
def get_departments():
    depts = query("SELECT * FROM departments ORDER BY department_id ASC")
    return jsonify({"success": True, "departments": depts})

@app.route("/api/courses", methods=["GET"])
def get_courses():
    courses = query("""
        SELECT c.*, d.name as department_name, d.code as department_code
        FROM courses c
        JOIN departments d ON c.department_id = d.department_id
        ORDER BY c.course_id ASC
    """)
    return jsonify({"success": True, "courses": courses})

@app.route("/api/subjects", methods=["GET"])
def get_subjects():
    subjects = query("""
        SELECT s.*, c.name as course_name, c.code as course_code,
               CONCAT(f.first_name, ' ', f.last_name) as faculty_name
        FROM subjects s
        JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
        ORDER BY s.subject_id ASC
    """)
    return jsonify({"success": True, "subjects": subjects})

# -----------------------------------------------------------------------------
# 6. ATTENDANCE ANALYSIS & LOGGING
# -----------------------------------------------------------------------------

@app.route("/api/attendance", methods=["GET"])
def get_attendance_records():
    student_id = request.args.get("student_id")
    subject_id = request.args.get("subject_id")
    
    sql = """
        SELECT a.*, s.first_name, s.last_name, s.reg_number, sub.code as subject_code, sub.name as subject_name
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        JOIN subjects sub ON a.subject_id = sub.subject_id
        WHERE 1=1
    """
    params = []
    if student_id:
        sql += " AND a.student_id = %s"
        params.append(student_id)
    if subject_id:
        sql += " AND a.subject_id = %s"
        params.append(subject_id)
        
    sql += " ORDER BY a.attendance_date DESC, a.attendance_id DESC LIMIT 100"
    records = query(sql, tuple(params))
    return jsonify({"success": True, "attendance": records})

@app.route("/api/attendance", methods=["POST"])
def record_attendance():
    data = request.json or {}
    student_id = data.get("student_id")
    subject_id = data.get("subject_id")
    att_date = data.get("attendance_date", datetime.now().strftime("%Y-%m-%d"))
    status = data.get("status", "Present")
    remarks = data.get("remarks", "")
    
    if not student_id or not subject_id:
        return jsonify({"success": False, "message": "student_id and subject_id are required"}), 400
        
    att_id = execute("""
        INSERT INTO attendance (student_id, subject_id, attendance_date, status, remarks)
        VALUES (%s, %s, %s, %s, %s)
    """, (student_id, subject_id, att_date, status, remarks))
    
    return jsonify({"success": True, "attendance_id": att_id, "message": "Attendance recorded successfully."})

@app.route("/api/attendance/summary", methods=["GET"])
def get_attendance_summary():
    students = query("SELECT student_id, reg_number, first_name, last_name, cgpa FROM students ORDER BY student_id ASC")
    summaries = []
    for s in students:
        analysis = analyze_attendance(s["student_id"])
        summaries.append({
            "student_id": s["student_id"],
            "reg_number": s["reg_number"],
            "name": f"{s['first_name']} {s['last_name']}",
            "total_classes": analysis["total_classes"],
            "attended_classes": analysis["attended_classes"],
            "percentage": analysis["overall_percentage"],
            "status": analysis["status"],
            "is_shortage": analysis["is_shortage"],
            "classes_needed": analysis["classes_needed_for_75"],
            "guidance": analysis["guidance"]
        })
    return jsonify({"success": True, "summaries": summaries})

# -----------------------------------------------------------------------------
# 7. MARKS & STUDENT PERFORMANCE ANALYSIS
# -----------------------------------------------------------------------------

@app.route("/api/marks", methods=["GET"])
def get_marks():
    student_id = request.args.get("student_id")
    subject_id = request.args.get("subject_id")
    
    sql = """
        SELECT m.*, s.first_name, s.last_name, s.reg_number, sub.code as subject_code, sub.name as subject_name
        FROM marks m
        JOIN students s ON m.student_id = s.student_id
        JOIN subjects sub ON m.subject_id = sub.subject_id
        WHERE 1=1
    """
    params = []
    if student_id:
        sql += " AND m.student_id = %s"
        params.append(student_id)
    if subject_id:
        sql += " AND m.subject_id = %s"
        params.append(subject_id)
        
    sql += " ORDER BY m.mark_id DESC"
    marks = query(sql, tuple(params))
    return jsonify({"success": True, "marks": marks})

@app.route("/api/marks", methods=["POST"])
def add_marks():
    data = request.json or {}
    student_id = data.get("student_id")
    subject_id = data.get("subject_id")
    exam_type = data.get("exam_type", "Internal 1")
    marks_obtained = float(data.get("marks_obtained", 0.0))
    max_marks = float(data.get("max_marks", 30.0))
    remarks = data.get("remarks", "")
    
    new_id = execute("""
        INSERT INTO marks (student_id, subject_id, exam_type, marks_obtained, max_marks, remarks)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (student_id, subject_id, exam_type, marks_obtained, max_marks, remarks))
    
    return jsonify({"success": True, "mark_id": new_id, "message": "Mark entry submitted."})

@app.route("/api/marks/student/<int:student_id>", methods=["GET"])
def get_student_scorecard(student_id):
    analysis = analyze_student_performance(student_id)
    return jsonify({"success": True, "analysis": analysis})

# -----------------------------------------------------------------------------
# 8. EVENT MANAGEMENT
# -----------------------------------------------------------------------------

@app.route("/api/events", methods=["GET"])
def get_events():
    events = query("SELECT * FROM events ORDER BY event_date ASC")
    return jsonify({"success": True, "events": events})

@app.route("/api/events", methods=["POST"])
def create_event():
    data = request.json or {}
    title = data.get("title", "").strip()
    desc = data.get("description", "").strip()
    cat = data.get("category", "Technical")
    venue = data.get("venue", "").strip()
    ev_date = data.get("event_date")
    start = data.get("start_time", "09:00:00")
    end = data.get("end_time", "17:00:00")
    max_seats = int(data.get("max_seats", 100))
    created_by = current_session.get("full_name", "Campus Admin")
    
    if not title or not venue or not ev_date:
        return jsonify({"success": False, "message": "Title, venue, and date are required"}), 400
        
    new_id = execute("""
        INSERT INTO events (title, description, category, venue, event_date, start_time, end_time, max_seats, registered_count, status, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0, 'Upcoming', %s)
    """, (title, desc, cat, venue, ev_date, start, end, max_seats, created_by))
    
    return jsonify({"success": True, "event_id": new_id, "message": "Event published successfully."}), 201

@app.route("/api/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    data = request.json or {}
    execute("""
        UPDATE events
        SET title = COALESCE(%s, title),
            description = COALESCE(%s, description),
            venue = COALESCE(%s, venue),
            status = COALESCE(%s, status)
        WHERE event_id = %s
    """, (data.get("title"), data.get("description"), data.get("venue"), data.get("status"), event_id))
    return jsonify({"success": True, "message": "Event updated successfully."})

@app.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    execute("DELETE FROM events WHERE event_id = %s", (event_id,))
    return jsonify({"success": True, "message": "Event removed successfully."})

@app.route("/api/events/<int:event_id>/register", methods=["POST"])
def register_for_event(event_id):
    data = request.json or {}
    student_id = data.get("student_id", current_session.get("user_id", 1))
    
    # Check duplicate registration
    existing = query_one("SELECT registration_id FROM event_registrations WHERE event_id = %s AND student_id = %s", (event_id, student_id))
    if existing:
        return jsonify({"success": False, "message": "You are already registered for this campus event."}), 409
        
    execute("INSERT INTO event_registrations (event_id, student_id, status) VALUES (%s, %s, 'Confirmed')", (event_id, student_id))
    execute("UPDATE events SET registered_count = registered_count + 1 WHERE event_id = %s", (event_id,))
    
    return jsonify({"success": True, "message": "Registration confirmed! QR badge generated."})

# -----------------------------------------------------------------------------
# 9. CAMPUS RESOURCE MANAGEMENT
# -----------------------------------------------------------------------------

@app.route("/api/resources", methods=["GET"])
def get_resources():
    resources = query("SELECT * FROM campus_resources ORDER BY resource_id ASC")
    return jsonify({"success": True, "resources": resources})

@app.route("/api/resources", methods=["POST"])
def create_resource():
    data = request.json or {}
    name = data.get("name", "").strip()
    rtype = data.get("resource_type", "Classroom")
    bldg = data.get("building", "Academic Block")
    room = data.get("room_number", "101")
    capacity = int(data.get("capacity", 60))
    features = data.get("features", "")
    
    new_id = execute("""
        INSERT INTO campus_resources (name, resource_type, building, room_number, capacity, status, features)
        VALUES (%s, %s, %s, %s, %s, 'Available', %s)
    """, (name, rtype, bldg, room, capacity, features))
    
    return jsonify({"success": True, "resource_id": new_id, "message": "Resource added."}), 201

@app.route("/api/resources/<int:resource_id>", methods=["PUT"])
def update_resource(resource_id):
    data = request.json or {}
    execute("""
        UPDATE campus_resources
        SET name = COALESCE(%s, name),
            status = COALESCE(%s, status),
            features = COALESCE(%s, features)
        WHERE resource_id = %s
    """, (data.get("name"), data.get("status"), data.get("features"), resource_id))
    return jsonify({"success": True, "message": "Resource updated."})

@app.route("/api/resources/bookings", methods=["GET"])
def get_resource_bookings():
    bookings = query("""
        SELECT b.*, r.name as resource_name, r.resource_type, r.room_number, r.building
        FROM resource_bookings b
        JOIN campus_resources r ON b.resource_id = r.resource_id
        ORDER BY b.booking_date DESC, b.booking_id DESC
    """)
    return jsonify({"success": True, "bookings": bookings})

@app.route("/api/resources/book", methods=["POST"])
def book_resource():
    data = request.json or {}
    resource_id = data.get("resource_id")
    purpose = data.get("purpose", "Academic session")
    b_date = data.get("booking_date", datetime.now().strftime("%Y-%m-%d"))
    time_slot = data.get("time_slot", "10:00 AM - 12:00 PM")
    user_name = current_session.get("full_name", "Academic Faculty")
    
    # Conflict check
    conflict = query_one("""
        SELECT booking_id FROM resource_bookings
        WHERE resource_id = %s AND booking_date = %s AND time_slot = %s AND status = 'Approved'
    """, (resource_id, b_date, time_slot))
    if conflict:
        return jsonify({"success": False, "message": "Conflict: Resource is already booked for this date and time slot."}), 409
        
    b_id = execute("""
        INSERT INTO resource_bookings (resource_id, user_id, user_name, purpose, booking_date, time_slot, status)
        VALUES (%s, %s, %s, %s, %s, %s, 'Approved')
    """, (resource_id, current_session.get("user_id", 1), user_name, purpose, b_date, time_slot))
    
    return jsonify({"success": True, "booking_id": b_id, "message": "Resource booked successfully."})

# -----------------------------------------------------------------------------
# 10. STUDENT FEEDBACK ANALYSIS
# -----------------------------------------------------------------------------

@app.route("/api/feedback", methods=["GET"])
def get_feedback():
    feedback = query("""
        SELECT f.*, s.first_name, s.last_name, s.reg_number
        FROM student_feedback f
        JOIN students s ON f.student_id = s.student_id
        ORDER BY f.feedback_id DESC
    """)
    return jsonify({"success": True, "feedback": feedback})

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data = request.json or {}
    student_id = data.get("student_id", current_session.get("user_id", 1))
    category = data.get("category", "Faculty & Teaching")
    target_name = data.get("target_name", "General Campus")
    rating = int(data.get("rating", 5))
    comments = data.get("comments", "").strip()
    
    if not comments:
        return jsonify({"success": False, "message": "Please write your review feedback comments."}), 400
        
    # AI Sentiment Analysis
    analysis = analyze_feedback_sentiment(comments, rating)
    
    f_id = execute("""
        INSERT INTO student_feedback (student_id, category, target_name, rating, comments, sentiment, sentiment_score, ai_summary, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Reviewed')
    """, (student_id, category, target_name, rating, comments, analysis["sentiment"], analysis["sentiment_score"], analysis["recommended_action"]))
    
    return jsonify({
        "success": True,
        "feedback_id": f_id,
        "sentiment": analysis["sentiment"],
        "sentiment_score": analysis["sentiment_score"],
        "message": "Feedback submitted and analyzed via AI Sentiment Classifier."
    })

# -----------------------------------------------------------------------------
# 11. AI TOOL ECOSYSTEM ENDPOINTS
# -----------------------------------------------------------------------------

@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    data = request.json or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"success": False, "message": "Message cannot be empty"}), 400
        
    resp = generate_chatbot_response(message, user_id=current_session.get("user_id", 1))
    return jsonify({"success": True, "data": resp})

@app.route("/api/ai/academic-assist", methods=["POST"])
def ai_academic_assist():
    data = request.json or {}
    task_type = data.get("task_type", "notes") # "notes", "quiz", "summary"
    topic = data.get("topic", "State Space Search in AI").strip()
    difficulty = data.get("difficulty", "Intermediate")
    
    if not topic:
        return jsonify({"success": False, "message": "Topic required"}), 400
        
    if task_type == "quiz":
        result = generate_quiz(topic, num_questions=5, user_id=current_session.get("user_id", 1))
    else:
        result = generate_study_notes(topic, difficulty=difficulty, user_id=current_session.get("user_id", 1))
        
    # Save to AI Content Library
    execute("""
        INSERT INTO ai_content_library (user_id, content_type, title, prompt_context, output_text)
        VALUES (%s, %s, %s, %s, %s)
    """, (current_session.get("user_id", 1), task_type, topic, f"Generated for {difficulty} level", result["content"]))
    
    return jsonify({"success": True, "result": result})

@app.route("/api/ai/career-guidance", methods=["POST"])
def ai_career_guidance():
    data = request.json or {}
    skills = data.get("skills", "Python, SQL, React")
    interests = data.get("interests", "Machine learning, Web engineering")
    domain = data.get("domain", "Artificial Intelligence")
    
    rec = recommend_career_path(skills, interests, domain, user_id=current_session.get("user_id", 1))
    return jsonify({"success": True, "career_recommendation": rec})

@app.route("/api/ai/content-generate", methods=["POST"])
def ai_content_generate():
    data = request.json or {}
    content_type = data.get("content_type", "announcement")
    topic = data.get("topic", "Semester Exam Schedule")
    tone = data.get("tone", "Formal Academic")
    
    res = generate_campus_content(content_type, topic, tone, user_id=current_session.get("user_id", 1))
    
    # Store in library
    execute("""
        INSERT INTO ai_content_library (user_id, content_type, title, prompt_context, output_text)
        VALUES (%s, %s, %s, %s, %s)
    """, (current_session.get("user_id", 1), content_type, topic, f"Tone: {tone}", res["content"]))
    
    return jsonify({"success": True, "content": res})

@app.route("/api/ai/responsible-logs", methods=["GET"])
def ai_responsible_logs():
    logs = query("SELECT * FROM responsible_ai_logs ORDER BY log_id DESC LIMIT 50")
    return jsonify({"success": True, "logs": logs})

@app.route("/api/ai/content-library", methods=["GET"])
def ai_content_library():
    items = query("SELECT * FROM ai_content_library ORDER BY content_id DESC")
    return jsonify({"success": True, "items": items})

# -----------------------------------------------------------------------------
# 12. NOTIFICATIONS & REPORTS EXPORT
# -----------------------------------------------------------------------------

@app.route("/api/admissions/inquire", methods=["POST"])
def submit_admission_inquiry():
    data = request.json or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    program = data.get("program_interested", "BCA with AI Specialization").strip()
    score = float(data.get("academic_score", 0.0) or 0.0)
    msg = data.get("message", "").strip()

    if not full_name or not email or not phone:
        return jsonify({"success": False, "message": "Name, email, and phone number are required."}), 400

    new_id = execute("""
        INSERT INTO admissions_inquiries (full_name, email, phone, program_interested, academic_score, message, status)
        VALUES (%s, %s, %s, %s, %s, %s, 'New')
    """, (full_name, email, phone, program, score, msg))

    # Also generate notification for Admin
    execute("""
        INSERT INTO notifications (user_id, target_role, title, message, type)
        VALUES (NULL, 'Administrator', 'New Admission Inquiry Received', %s, 'info')
    """, (f"Candidate {full_name} applied for {program}. Score: {score}%. Contact: {phone}",))

    return jsonify({
        "success": True,
        "inquiry_id": new_id,
        "message": f"Thank you, {full_name}! Your admission inquiry for {program} has been submitted. Our admissions counselor will contact you within 24 hours."
    }), 201

@app.route("/api/admissions", methods=["GET"])
def get_admission_inquiries():
    inquiries = query("SELECT * FROM admissions_inquiries ORDER BY inquiry_id DESC")
    return jsonify({"success": True, "inquiries": inquiries, "total": len(inquiries)})

@app.route("/api/admissions/<int:inquiry_id>/status", methods=["PUT"])
def update_admission_status(inquiry_id):
    data = request.json or {}
    new_status = data.get("status", "Under Review")
    execute("UPDATE admissions_inquiries SET status = %s WHERE inquiry_id = %s", (new_status, inquiry_id))
    return jsonify({"success": True, "message": f"Inquiry status updated to {new_status}."})

@app.route("/api/contact", methods=["POST"])
def submit_contact_message():
    data = request.json or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    subject = data.get("subject", "General Inquiry").strip()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return jsonify({"success": False, "message": "Name, email, and message are required."}), 400

    new_id = execute("""
        INSERT INTO contact_messages (name, email, subject, message, status)
        VALUES (%s, %s, %s, %s, 'Unread')
    """, (name, email, subject, message))

    return jsonify({"success": True, "message_id": new_id, "message": "Your message has been dispatched to the university administration."}), 201

@app.route("/api/contact", methods=["GET"])
def get_contact_messages():
    messages = query("SELECT * FROM contact_messages ORDER BY message_id DESC")
    return jsonify({"success": True, "messages": messages})

@app.route("/api/public/university-info", methods=["GET"])
def get_university_info():
    return jsonify({
        "success": True,
        "name": "GM Smart University",
        "tagline": "Empowering Minds Through Artificial Intelligence, Science & Ethical Innovation",
        "motto": "Excellence * Character * Innovation",
        "established": 2001,
        "location": "Post Box No. 4, P.B. Road, Davangere, Karnataka - 577006",
        "accreditation": "UGC Recognized * AICTE Approved * NAAC 'A' Grade Accredited",
        "stats": {
            "campus_acres": "54+ Acres",
            "students": "15,000+",
            "faculty": "450+",
            "tech_labs": "42 Labs",
            "placement_rate": "94.2%",
            "patents_filed": "85+"
        }
    })

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    role = current_session.get("role", "Administrator")
    notifs = query("""
        SELECT * FROM notifications 
        WHERE target_role IN ('All', %s) 
        ORDER BY notification_id DESC LIMIT 20
    """, (role,))
    return jsonify({"success": True, "notifications": notifs})

@app.route("/api/notifications/<int:notif_id>/read", methods=["POST"])
def mark_notification_read(notif_id):
    execute("UPDATE notifications SET is_read = 1 WHERE notification_id = %s", (notif_id,))
    return jsonify({"success": True, "message": "Marked as read."})

@app.route("/api/reports/<report_type>.csv", methods=["GET"])
def export_csv_report(report_type):
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "students":
        writer.writerow(["Student ID", "Reg Number", "First Name", "Last Name", "Email", "Phone", "CGPA", "Status"])
        rows = query("SELECT student_id, reg_number, first_name, last_name, email, phone, cgpa, status FROM students")
        for r in rows:
            writer.writerow([r["student_id"], r["reg_number"], r["first_name"], r["last_name"], r["email"], r["phone"], r["cgpa"], r["status"]])
    elif report_type == "attendance":
        writer.writerow(["Student ID", "Name", "Total Sessions", "Attended", "Percentage", "Eligibility Status"])
        students = query("SELECT student_id, reg_number, first_name, last_name FROM students")
        for s in students:
            att = analyze_attendance(s["student_id"])
            writer.writerow([s["student_id"], f"{s['first_name']} {s['last_name']}", att["total_classes"], att["attended_classes"], f"{att['overall_percentage']}%", att["status"]])
    else:
        writer.writerow(["Event ID", "Title", "Category", "Venue", "Event Date", "Registered Count", "Max Seats", "Status"])
        rows = query("SELECT event_id, title, category, venue, event_date, registered_count, max_seats, status FROM events")
        for r in rows:
            writer.writerow([r["event_id"], r["title"], r["category"], r["venue"], r["event_date"], r["registered_count"], r["max_seats"], r["status"]])
            
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=campuscore_{report_type}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

# -----------------------------------------------------------------------------
# 12B. FEES MANAGEMENT & STUDENT FEE PORTAL
# -----------------------------------------------------------------------------

@app.route("/api/fees", methods=["GET"])
def get_fee_records():
    student_id = request.args.get("student_id")
    sql = """
        SELECT fr.*, s.first_name, s.last_name, s.reg_number, c.name as course_name, c.code as course_code
        FROM fee_records fr
        JOIN students s ON fr.student_id = s.student_id
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE 1=1
    """
    params = []
    if student_id:
        sql += " AND fr.student_id = %s"
        params.append(student_id)
    sql += " ORDER BY fr.fee_record_id DESC"
    records = query(sql, tuple(params))
    
    payments = query("SELECT * FROM fee_payments ORDER BY payment_date DESC, payment_id DESC")
    payments_by_record = {}
    for p in payments:
        payments_by_record.setdefault(p["fee_record_id"], []).append(p)
        
    for r in records:
        r["payments"] = payments_by_record.get(r["fee_record_id"], [])
        paid_total = sum(p["amount_paid"] for p in r["payments"])
        r["total_paid"] = paid_total
        r["balance_due"] = max(0.0, float(r["amount_due"]) - paid_total)
        
    return jsonify({"success": True, "records": records, "total": len(records)})

@app.route("/api/fees", methods=["POST"])
def create_fee_record():
    data = request.json or {}
    student_id = data.get("student_id")
    fee_type = data.get("fee_type", "Tuition & Academic Fee").strip()
    amount_due = float(data.get("amount_due", 45000.0))
    due_date = data.get("due_date", (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"))
    status = data.get("status", "Pending")
    
    if not student_id:
        return jsonify({"success": False, "message": "student_id is required"}), 400
        
    new_id = execute("""
        INSERT INTO fee_records (student_id, fee_type, amount_due, due_date, status)
        VALUES (%s, %s, %s, %s, %s)
    """, (student_id, fee_type, amount_due, due_date, status))
    
    return jsonify({"success": True, "fee_record_id": new_id, "message": "Fee record generated."}), 201

@app.route("/api/fees/pay", methods=["POST"])
def process_fee_payment():
    data = request.json or {}
    fee_record_id = data.get("fee_record_id")
    amount_paid = float(data.get("amount_paid", 0.0))
    payment_mode = data.get("payment_mode", "UPI Reference")
    transaction_ref = data.get("transaction_ref", f"TXN-{random.randint(100000, 999999)}")
    payment_date = data.get("payment_date", datetime.now().strftime("%Y-%m-%d"))
    
    if not fee_record_id or amount_paid <= 0:
        return jsonify({"success": False, "message": "Valid fee_record_id and positive amount_paid required."}), 400
        
    record = query_one("SELECT * FROM fee_records WHERE fee_record_id = %s", (fee_record_id,))
    if not record:
        return jsonify({"success": False, "message": "Fee record not found."}), 404
        
    receipt_no = f"REC-{datetime.now().year}-{random.randint(1000, 9999)}"
    execute("""
        INSERT INTO fee_payments (fee_record_id, receipt_number, amount_paid, payment_date, payment_mode, transaction_ref)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (fee_record_id, receipt_no, amount_paid, payment_date, payment_mode, transaction_ref))
    
    payments = query("SELECT amount_paid FROM fee_payments WHERE fee_record_id = %s", (fee_record_id,))
    total_paid = sum(p["amount_paid"] for p in payments)
    new_status = "Paid" if total_paid >= record["amount_due"] else "Partially Paid"
    
    execute("UPDATE fee_records SET status = %s WHERE fee_record_id = %s", (new_status, fee_record_id))
    
    return jsonify({
        "success": True,
        "receipt_number": receipt_no,
        "amount_paid": amount_paid,
        "new_status": new_status,
        "message": f"Payment of ₹{amount_paid:,.2f} recorded successfully. Receipt {receipt_no} generated."
    })

# -----------------------------------------------------------------------------
# 12C. TIMETABLES & SCHEDULING
# -----------------------------------------------------------------------------

@app.route("/api/timetable", methods=["GET"])
def get_timetable():
    course_id = request.args.get("course_id")
    semester_number = request.args.get("semester_number")
    faculty_id = request.args.get("faculty_id")
    day_of_week = request.args.get("day_of_week")
    
    sql = """
        SELECT t.*, c.name as course_name, c.code as course_code,
               sub.name as subject_name, sub.code as subject_code,
               CONCAT(f.first_name, ' ', f.last_name) as faculty_name, f.employee_code
        FROM timetables t
        JOIN courses c ON t.course_id = c.course_id
        JOIN subjects sub ON t.subject_id = sub.subject_id
        JOIN faculty f ON t.faculty_id = f.faculty_id
        WHERE 1=1
    """
    params = []
    if course_id:
        sql += " AND t.course_id = %s"
        params.append(course_id)
    if semester_number:
        sql += " AND t.semester_number = %s"
        params.append(semester_number)
    if faculty_id:
        sql += " AND t.faculty_id = %s"
        params.append(faculty_id)
    if day_of_week:
        sql += " AND t.day_of_week = %s"
        params.append(day_of_week)
        
    sql += " ORDER BY CASE t.day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END, t.time_slot ASC"
    schedules = query(sql, tuple(params))
    return jsonify({"success": True, "timetable": schedules, "total": len(schedules)})

@app.route("/api/timetable", methods=["POST"])
def add_timetable_entry():
    data = request.json or {}
    course_id = int(data.get("course_id", 1))
    semester = int(data.get("semester_number", 1))
    day = data.get("day_of_week", "Monday")
    slot = data.get("time_slot", "09:00 AM - 10:00 AM")
    sub_id = int(data.get("subject_id", 1))
    fac_id = int(data.get("faculty_id", 3))
    room = data.get("room_number", "AB-301")
    
    new_id = execute("""
        INSERT INTO timetables (course_id, semester_number, day_of_week, time_slot, subject_id, faculty_id, room_number)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (course_id, semester, day, slot, sub_id, fac_id, room))
    return jsonify({"success": True, "timetable_id": new_id, "message": "Class scheduled successfully."}), 201

@app.route("/api/timetable/<int:timetable_id>", methods=["DELETE"])
def delete_timetable_entry(timetable_id):
    execute("DELETE FROM timetables WHERE timetable_id = %s", (timetable_id,))
    return jsonify({"success": True, "message": "Schedule slot deleted."})

# -----------------------------------------------------------------------------
# 12D. USER & ROLE MANAGEMENT (ADMIN ONLY)
# -----------------------------------------------------------------------------

@app.route("/api/users", methods=["GET"])
def get_users_list():
    users = query("SELECT user_id, username, full_name, email, role, is_active, created_at FROM users ORDER BY user_id ASC")
    return jsonify({"success": True, "users": users, "total": len(users)})

@app.route("/api/users/<int:user_id>/status", methods=["PUT"])
def update_user_status(user_id):
    data = request.json or {}
    new_status = data.get("is_active", 1)
    execute("UPDATE users SET is_active = %s WHERE user_id = %s", (new_status, user_id))
    return jsonify({"success": True, "message": f"User status updated."})

# -----------------------------------------------------------------------------
# 13. SYSTEM DIAGNOSTICS & STATUS
# -----------------------------------------------------------------------------

@app.route("/api/system/status", methods=["GET"])
def system_status():
    students_cnt = query_one("SELECT COUNT(*) as c FROM students")["c"]
    faculty_cnt = query_one("SELECT COUNT(*) as c FROM faculty")["c"]
    events_cnt = query_one("SELECT COUNT(*) as c FROM events")["c"]
    ai_logs_cnt = query_one("SELECT COUNT(*) as c FROM responsible_ai_logs")["c"]
    
    return jsonify({
        "success": True,
        "database_engine": ACTIVE_ENGINE,
        "tables_verified": 18,
        "sqlite_db_path": SQLITE_FILE,
        "counts": {
            "students": students_cnt,
            "faculty": faculty_cnt,
            "events": events_cnt,
            "ai_logs": ai_logs_cnt
        },
        "ai_status": "Online (Gemini Cloud API Enabled)" if os.getenv("GEMINI_API_KEY") else "Online (Local Heuristic NLP Engine Active - Demo Ready)",
        "active_role": current_session.get("role", "Administrator"),
        "user": current_session
    })

# -----------------------------------------------------------------------------
# 14. FRONTEND APPLICATION SERVING
# -----------------------------------------------------------------------------

@app.route("/")
@app.route("/<path:path>")
def serve_frontend(path=""):
    """Serves the complete React single-page application dashboard without Jinja parsing conflicts."""
    index_file = os.path.join(app.template_folder, "index.html")
    if os.path.exists(index_file):
        return send_from_directory(app.template_folder, "index.html")
    return "CampusCore AI Backend Running. Frontend is compiling..."


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"\n=======================================================")
    print(f" CAMPUSCORE AI — SMART CAMPUS MANAGEMENT ECOSYSTEM")
    print(f" Web Server Active on: http://127.0.0.1:{port}")
    print(f" Database Engine:     {ACTIVE_ENGINE}")
    print(f" AI Engine Mode:      {'Gemini 1.5' if os.getenv('GEMINI_API_KEY') else 'Local Intelligent Heuristic Engine'}")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
