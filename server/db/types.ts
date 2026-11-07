export interface DatabaseStatus {
  activeEngine: 'MySQL' | 'Embedded SQL (sql.js)';
  mysqlConfigured: boolean;
  mysqlConnected: boolean;
  mysqlHost: string;
  mysqlPort: number;
  mysqlDatabase: string;
  mysqlError?: string;
  tablesCount: number;
  totalRecordsCount: number;
  lastChecked: string;
}

export interface QueryResult<T = any> {
  rows: T[];
  affectedRows?: number;
  insertId?: number;
}

export interface Student {
  student_id: number;
  reg_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  address: string;
  city: string;
  state: string;
  admission_date: string;
  current_semester_id: number | null;
  status: 'Active' | 'Graduated' | 'Suspended' | 'Withdrawn';
  course_name?: string;
  semester_number?: number;
  created_at?: string;
}

export interface Department {
  department_id: number;
  code: string;
  name: string;
  established_year: number;
  building: string;
  head_of_dept: string | null;
}

export interface Course {
  course_id: number;
  code: string;
  name: string;
  department_id: number;
  department_name?: string;
  duration_years: number;
  total_semesters: number;
  degree_level: string;
}

export interface Semester {
  semester_id: number;
  course_id: number;
  course_name?: string;
  semester_number: number;
  academic_year: string;
  term: 'Odd' | 'Even';
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Subject {
  subject_id: number;
  code: string;
  name: string;
  credits: number;
  course_id: number;
  course_name?: string;
  semester_number: number;
  subject_type: 'Theory' | 'Lab' | 'Project' | 'Elective';
  max_internal_marks: number;
  max_exam_marks: number;
}

export interface FacultyMember {
  faculty_id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: number;
  department_name?: string;
  designation: string;
  qualification: string;
  joining_date: string;
  status: 'Active' | 'On Leave' | 'Resigned';
  assigned_subjects?: string[];
}

export interface Enrollment {
  enrollment_id: number;
  student_id: number;
  student_name?: string;
  reg_number?: string;
  course_id: number;
  course_name?: string;
  semester_id: number;
  semester_number?: number;
  academic_year: string;
  enrollment_date: string;
  status: 'Active' | 'Completed' | 'Dropped';
}

export interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  student_name?: string;
  reg_number?: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
  recorded_by_faculty_id?: number;
  faculty_name?: string;
}

export interface Assessment {
  assessment_id: number;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  semester_id: number;
  name: string;
  assessment_type: 'Internal' | 'Semester_Exam';
  max_marks: number;
  weightage_percent: number;
  conduct_date: string;
}

export interface MarkRecord {
  mark_id: number;
  assessment_id: number;
  assessment_name?: string;
  assessment_type?: 'Internal' | 'Semester_Exam';
  subject_name?: string;
  subject_code?: string;
  max_marks?: number;
  student_id: number;
  student_name?: string;
  reg_number?: string;
  marks_obtained: number;
  is_absent: boolean;
  remarks?: string;
}

export interface FeeRecord {
  fee_record_id: number;
  student_id: number;
  student_name?: string;
  reg_number?: string;
  semester_id: number;
  semester_number?: number;
  fee_type: 'Tuition' | 'Examination' | 'Library' | 'Laboratory' | 'Hostel' | 'Special';
  amount_due: number;
  due_date: string;
  total_paid?: number;
  pending_balance?: number;
  status?: 'Paid' | 'Partially_Paid' | 'Pending';
}

export interface FeePayment {
  payment_id: number;
  fee_record_id: number;
  receipt_number: string;
  amount_paid: number;
  payment_date: string;
  payment_mode: 'Cash' | 'Demand Draft' | 'Bank Transfer' | 'UPI Reference';
  transaction_ref?: string;
  notes?: string;
  student_name?: string;
  reg_number?: string;
  fee_type?: string;
}

export interface StudentFeedback {
  feedback_id: number;
  student_id: number;
  student_name?: string;
  reg_number?: string;
  faculty_id?: number | null;
  faculty_name?: string;
  subject_id?: number | null;
  subject_name?: string;
  rating: number;
  category: 'Course Delivery' | 'Lab Facilities' | 'Examination Evaluation' | 'General Campus';
  comments: string;
  submitted_at: string;
  status: 'Reviewed' | 'Pending';
}
