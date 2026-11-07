import {
  Student,
  Department,
  Course,
  Semester,
  Subject,
  FacultyMember,
  Enrollment,
  AttendanceRecord,
  Assessment,
  MarkRecord,
  FeeRecord,
  FeePayment,
  StudentFeedback,
  DatabaseStatus
} from '../../server/db/types.ts';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Diagnostics
  getDbStatus: () => fetchJson<DatabaseStatus>('/api/admin/db-status'),
  reseedDatabase: () => fetchJson<{ success: boolean; message: string; data: DatabaseStatus }>('/api/admin/reseed', { method: 'POST' }),
  getSqlScript: (scriptName: string) => fetchJson<{ scriptName: string; content: string }>(`/api/admin/sql-script/${scriptName}`),
  getUsers: () => fetchJson<any[]>('/api/admin/users'),

  // Overview
  getOverviewStats: () => fetchJson<any>('/api/overview/stats'),

  // Students
  getStudents: (params?: { search?: string; semester?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.semester) q.append('semester', String(params.semester));
    if (params?.status) q.append('status', params.status);
    return fetchJson<Student[]>(`/api/students?${q.toString()}`);
  },
  getStudentById: (id: number) => fetchJson<any>(`/api/students/${id}`),
  createStudent: (student: Partial<Student>) => fetchJson<any>('/api/students', { method: 'POST', body: JSON.stringify(student) }),
  updateStudent: (id: number, student: Partial<Student>) => fetchJson<any>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(student) }),
  deleteStudent: (id: number) => fetchJson<any>(`/api/students/${id}`, { method: 'DELETE' }),

  // Academic
  getDepartments: () => fetchJson<Department[]>('/api/departments'),
  createDepartment: (dept: Partial<Department>) => fetchJson<any>('/api/departments', { method: 'POST', body: JSON.stringify(dept) }),
  getCourses: () => fetchJson<Course[]>('/api/courses'),
  createCourse: (course: Partial<Course>) => fetchJson<any>('/api/courses', { method: 'POST', body: JSON.stringify(course) }),
  getSemesters: (course_id?: number) => fetchJson<Semester[]>(`/api/semesters${course_id ? `?course_id=${course_id}` : ''}`),
  createSemester: (sem: Partial<Semester>) => fetchJson<any>('/api/semesters', { method: 'POST', body: JSON.stringify(sem) }),
  getSubjects: (params?: { course_id?: number; semester_number?: number }) => {
    const q = new URLSearchParams();
    if (params?.course_id) q.append('course_id', String(params.course_id));
    if (params?.semester_number) q.append('semester_number', String(params.semester_number));
    return fetchJson<Subject[]>(`/api/subjects?${q.toString()}`);
  },
  createSubject: (subject: Partial<Subject>) => fetchJson<any>('/api/subjects', { method: 'POST', body: JSON.stringify(subject) }),

  // Enrollments
  getEnrollments: (params?: { course_id?: number; semester_id?: number; academic_year?: string }) => {
    const q = new URLSearchParams();
    if (params?.course_id) q.append('course_id', String(params.course_id));
    if (params?.semester_id) q.append('semester_id', String(params.semester_id));
    if (params?.academic_year) q.append('academic_year', params.academic_year);
    return fetchJson<Enrollment[]>(`/api/enrollments?${q.toString()}`);
  },
  createEnrollment: (data: Partial<Enrollment>) => fetchJson<any>('/api/enrollments', { method: 'POST', body: JSON.stringify(data) }),

  // Faculty
  getFaculty: (params?: { department_id?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.department_id) q.append('department_id', String(params.department_id));
    if (params?.status) q.append('status', params.status);
    return fetchJson<FacultyMember[]>(`/api/faculty?${q.toString()}`);
  },
  createFaculty: (data: Partial<FacultyMember>) => fetchJson<any>('/api/faculty', { method: 'POST', body: JSON.stringify(data) }),
  assignFacultySubject: (data: { faculty_id: number; subject_id: number; academic_year: string; semester_id: number }) =>
    fetchJson<any>('/api/faculty/assign', { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  getAttendance: (params?: { subject_id?: number; date?: string; student_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.subject_id) q.append('subject_id', String(params.subject_id));
    if (params?.date) q.append('date', params.date);
    if (params?.student_id) q.append('student_id', String(params.student_id));
    return fetchJson<AttendanceRecord[]>(`/api/attendance?${q.toString()}`);
  },
  getAttendanceSummary: (params?: { subject_id?: number; threshold?: number }) => {
    const q = new URLSearchParams();
    if (params?.subject_id) q.append('subject_id', String(params.subject_id));
    if (params?.threshold) q.append('threshold', String(params.threshold));
    return fetchJson<any[]>(`/api/attendance/summary?${q.toString()}`);
  },
  recordAttendance: (data: Partial<AttendanceRecord>) =>
    fetchJson<any>('/api/attendance', { method: 'POST', body: JSON.stringify(data) }),
  recordBatchAttendance: (data: { subject_id: number; attendance_date: string; records: { student_id: number; status: string; remarks?: string }[]; recorded_by_faculty_id?: number }) =>
    fetchJson<any>('/api/attendance/batch', { method: 'POST', body: JSON.stringify(data) }),

  // Marks & Results
  getAssessments: (params?: { subject_id?: number; semester_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.subject_id) q.append('subject_id', String(params.subject_id));
    if (params?.semester_id) q.append('semester_id', String(params.semester_id));
    return fetchJson<Assessment[]>(`/api/assessments?${q.toString()}`);
  },
  createAssessment: (data: Partial<Assessment>) =>
    fetchJson<any>('/api/assessments', { method: 'POST', body: JSON.stringify(data) }),
  getMarks: (params?: { assessment_id?: number; student_id?: number; subject_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.assessment_id) q.append('assessment_id', String(params.assessment_id));
    if (params?.student_id) q.append('student_id', String(params.student_id));
    if (params?.subject_id) q.append('subject_id', String(params.subject_id));
    return fetchJson<MarkRecord[]>(`/api/marks?${q.toString()}`);
  },
  recordMark: (data: Partial<MarkRecord>) =>
    fetchJson<any>('/api/marks', { method: 'POST', body: JSON.stringify(data) }),
  getPerformanceSummary: () => fetchJson<any[]>('/api/marks/performance'),

  // Fees & Payments
  getFeeRecords: (params?: { student_id?: number; semester_id?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.student_id) q.append('student_id', String(params.student_id));
    if (params?.semester_id) q.append('semester_id', String(params.semester_id));
    if (params?.status) q.append('status', params.status);
    return fetchJson<FeeRecord[]>(`/api/fees/records?${q.toString()}`);
  },
  createFeeRecord: (data: Partial<FeeRecord>) =>
    fetchJson<any>('/api/fees/records', { method: 'POST', body: JSON.stringify(data) }),
  getFeePayments: (fee_record_id?: number) =>
    fetchJson<FeePayment[]>(`/api/fees/payments${fee_record_id ? `?fee_record_id=${fee_record_id}` : ''}`),
  recordPayment: (data: Partial<FeePayment>) =>
    fetchJson<any>('/api/fees/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Feedback
  getFeedback: (params?: { category?: string; status?: string; faculty_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    if (params?.faculty_id) q.append('faculty_id', String(params.faculty_id));
    return fetchJson<StudentFeedback[]>('/api/feedback?' + q.toString());
  },
  submitFeedback: (data: Partial<StudentFeedback>) =>
    fetchJson<any>('/api/feedback', { method: 'POST', body: JSON.stringify(data) }),
  reviewFeedback: (id: number) =>
    fetchJson<any>(`/api/feedback/${id}/review`, { method: 'PUT' }),

  // Reports
  getReportData: (reportType: string) => fetchJson<{ title: string; generatedAt: string; rowCount: number; rows: any[] }>(`/api/reports/${reportType}`),

  // DBMS Lab
  getLabExamples: () => fetchJson<any[]>('/api/lab/examples'),
  executeLabQuery: (sql: string) => fetchJson<any>('/api/lab/execute', { method: 'POST', body: JSON.stringify({ sql }) }),
  simulateTransaction: (action: 'commit' | 'rollback' | 'savepoint') =>
    fetchJson<any>('/api/lab/simulate-transaction', { method: 'POST', body: JSON.stringify({ action }) })
};
