# CAMPUSCORE — STUDENT MANAGEMENT DATABASE SYSTEM USING DBMS AND SQL
**BCA Semester 3 Project-Based Learning (PBL) Assignment**  
**Course:** Database Management Systems (DBMS)  
**Standard Enforced:** Relational 3NF, Parameterized SQL, Transaction Controls, Multi-table Joins & Views  

---

## 1. System Overview
**CampusCore** is an enterprise-grade full-stack Student Management Database System designed for university administration. It demonstrates relational modeling, primary and foreign key constraints, 3NF normalization, ACID transaction processing (COMMIT, ROLLBACK, SAVEPOINT), DCL permission management (GRANT, REVOKE), database views, and automated academic calculations.

### Core Modules (All 13 Fully Implemented)
1. **Overview Dashboard:** Live KPI metrics, class performance benchmarks, attendance alerts, and financial summaries.
2. **Student Management:** Full CRUD operations, registration number uniqueness validation, relational student dossiers.
3. **Departments & Courses:** 1:N academic structural hierarchy with referential update cascades and delete restrictions.
4. **Subjects & Semesters:** Curricular courses, credit weights, max internal/exam marks, and term dates.
5. **Enrollments:** Student semester tracking with candidate key uniqueness: `UNIQUE(student_id, semester_id, academic_year)`.
6. **Faculty Management:** Academic profiles, credentials, departments, and subject teaching assignments.
7. **Attendance Tracking:** Session logging with duplicate prevention, percentage calculation: `(attended / total) * 100`, and configurable shortage threshold alerts (<75%).
8. **Marks & Results:** Continuous internal assessment (CIA) and semester exam scores with score validation and honors rankings.
9. **Fees & Payments:** Receivables invoicing, audited payment receipts, and balance calculations: `Amount Due - SUM(Payments)`.
10. **Student Feedback:** Rating submissions (1-5 stars) across course delivery, lab facilities, and administrative review workflows.
11. **Reports & Analytics:** Relational database reports with live search filtering and CSV data export.
12. **DBMS Lab & SQL Laboratory:** Curated syllabus queries for DDL, DML, DQL, Joins, Aggregates, Subqueries, Views, DCL, and live TCL transaction simulator.
13. **Administration & Settings:** Connection health diagnostics, full SQL script viewers, ER diagram, normalization proof, and 1-click database reseed.

---

## 2. Technology Stack & Database Architecture
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express REST API, Parameterized SQL queries.
- **Database Driver:** `mysql2/promise` with connection pooling for MySQL 8.
- **Relational Fallback Engine:** Built-in `sql.js` (SQLite ANSI SQL compiled to pure JS/WASM) for instant offline demo execution in sandboxes without local MySQL daemon.
- **Security:** Parameterized queries, least-privilege role separation, safe SQL query allowlists.

---

## 3. Database Schema & Normalization Summary
The schema consists of 15 relational tables decomposed to **Third Normal Form (3NF)**:
- `departments` (PK: `department_id`, UK: `code`)
- `courses` (PK: `course_id`, UK: `code`, FK: `department_id`)
- `semesters` (PK: `semester_id`, FK: `course_id`, UK: `course_id, semester_number, academic_year`)
- `students` (PK: `student_id`, UK: `reg_number`, UK: `email`, FK: `current_semester_id`)
- `faculty` (PK: `faculty_id`, UK: `employee_code`, UK: `email`, FK: `department_id`)
- `subjects` (PK: `subject_id`, UK: `code`, FK: `course_id`)
- `faculty_subject_assignments` (PK: `assignment_id`, FK: `faculty_id`, FK: `subject_id`, UK: `faculty_id, subject_id, academic_year`)
- `enrollments` (PK: `enrollment_id`, FK: `student_id`, FK: `course_id`, UK: `student_id, semester_id, academic_year`)
- `attendance` (PK: `attendance_id`, FK: `student_id`, FK: `subject_id`, UK: `student_id, subject_id, attendance_date`)
- `assessments` (PK: `assessment_id`, FK: `subject_id`, FK: `semester_id`)
- `marks` (PK: `mark_id`, FK: `assessment_id`, FK: `student_id`, UK: `assessment_id, student_id`)
- `fee_records` (PK: `fee_record_id`, FK: `student_id`, FK: `semester_id`)
- `fee_payments` (PK: `payment_id`, FK: `fee_record_id`, UK: `receipt_number`)
- `student_feedback` (PK: `feedback_id`, FK: `student_id`, FK: `faculty_id`, FK: `subject_id`)
- `users` (PK: `user_id`, UK: `username`, UK: `email`)

Database Views:
- `v_student_academic_summary`
- `v_student_attendance_summary`
- `v_fee_summary`
- `v_student_performance`
- `v_faculty_workload`

Detailed normalization and functional dependency proofs are located in [`database/NORMALIZATION.md`](database/NORMALIZATION.md).

---

## 4. Local Setup & Running with MySQL 8

### Prerequisites
- Node.js (v18 or higher) and npm
- MySQL 8.0 Server (or MySQL Workbench / Docker MySQL)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your MySQL credentials in `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=campuscore_db
DB_USER=root
DB_PASSWORD=your_password
PORT=3000
```

### Step 3: Initialize MySQL Database
Run the DDL schema and seed data scripts in MySQL:
```bash
mysql -u root -p < database/campuscore_schema.sql
mysql -u root -p campuscore_db < database/campuscore_seed.sql
```

### Step 4: Start CampusCore
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

*(Note: When running without a local MySQL server, CampusCore automatically starts its In-Process Relational SQL Engine, ensuring all features and queries run immediately!)*

---

## 5. Verification Checklist & Testing Report
| Requirement | Status | Verification Method |
|---|---|---|
| Database setup from SQL scripts | PASSED | Executed schema DDL and populated all 15 tables with seed records |
| Live backend connectivity | PASSED | `/api/health` and `/api/admin/db-status` test connections and return metadata |
| Student CRUD & Persistence | PASSED | Inserted, updated, retrieved, and verified student tuples |
| Unique constraint enforcement | PASSED | Duplicate registration numbers and emails rejected with 409 Conflict |
| Attendance calculation | PASSED | Computed `(attended / total) * 100` and flagged students < 75% |
| Mark validation against max score | PASSED | Scores outside `[0, max_marks]` range rejected by server |
| Transaction control (TCL) | PASSED | Live COMMIT, ROLLBACK, SAVEPOINT simulation in DBMS Lab |
| Role-based access demonstration | PASSED | Persona role switcher (Admin, Faculty, Student) with conditional privileges |
| Exportable SQL & Documentation | PASSED | 7 complete SQL/MD scripts included in `database/` folder |
| Production build completion | PASSED | Verified via TypeScript compilation and Vite build |
