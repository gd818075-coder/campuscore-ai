import { Router } from 'express';
import { getOverviewStats } from '../controllers/overviewController.ts';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.ts';
import {
  getDepartments,
  createDepartment,
  getCourses,
  createCourse,
  getSemesters,
  createSemester,
  getSubjects,
  createSubject
} from '../controllers/academicController.ts';
import { getEnrollments, createEnrollment } from '../controllers/enrollmentController.ts';
import { getFaculty, createFaculty, assignSubjectToFaculty } from '../controllers/facultyController.ts';
import {
  getAttendanceRecords,
  getAttendanceSummary,
  recordSingleAttendance,
  recordBatchAttendance
} from '../controllers/attendanceController.ts';
import {
  getAssessments,
  createAssessment,
  getMarks,
  recordMark,
  getPerformanceSummary
} from '../controllers/marksController.ts';
import {
  getFeeRecords,
  createFeeRecord,
  getFeePayments,
  recordPayment
} from '../controllers/feesController.ts';
import {
  getFeedback,
  submitFeedback,
  reviewFeedback
} from '../controllers/feedbackController.ts';
import { getReportData } from '../controllers/reportsController.ts';
import {
  getLabExamples,
  executeLabQuery,
  simulateTransaction
} from '../controllers/labController.ts';
import {
  getHealthStatus,
  getDbStatus,
  resetDatabase,
  getSqlScriptContent,
  getUsers
} from '../controllers/adminController.ts';

const router = Router();

// Health & DB Diagnostics
router.get('/health', getHealthStatus);
router.get('/admin/db-status', getDbStatus);
router.post('/admin/reseed', resetDatabase);
router.get('/admin/sql-script/:scriptName', getSqlScriptContent);
router.get('/admin/users', getUsers);

// Overview Dashboard
router.get('/overview/stats', getOverviewStats);

// Students
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Academic Structure
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);

router.get('/courses', getCourses);
router.post('/courses', createCourse);

router.get('/semesters', getSemesters);
router.post('/semesters', createSemester);

router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);

// Enrollments
router.get('/enrollments', getEnrollments);
router.post('/enrollments', createEnrollment);

// Faculty
router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.post('/faculty/assign', assignSubjectToFaculty);

// Attendance
router.get('/attendance', getAttendanceRecords);
router.get('/attendance/summary', getAttendanceSummary);
router.post('/attendance', recordSingleAttendance);
router.post('/attendance/batch', recordBatchAttendance);

// Marks & Results
router.get('/assessments', getAssessments);
router.post('/assessments', createAssessment);
router.get('/marks', getMarks);
router.post('/marks', recordMark);
router.get('/marks/performance', getPerformanceSummary);

// Fees & Payments
router.get('/fees/records', getFeeRecords);
router.post('/fees/records', createFeeRecord);
router.get('/fees/payments', getFeePayments);
router.post('/fees/payments', recordPayment);

// Feedback
router.get('/feedback', getFeedback);
router.post('/feedback', submitFeedback);
router.put('/feedback/:id/review', reviewFeedback);

// Reports
router.get('/reports/:reportType', getReportData);

// DBMS Lab
router.get('/lab/examples', getLabExamples);
router.post('/lab/execute', executeLabQuery);
router.post('/lab/simulate-transaction', simulateTransaction);

export default router;
