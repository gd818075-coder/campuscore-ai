export const SEED_DATA = {
  departments: [
    [1, 'DCA', 'Department of Computer Applications', 2005, 'Alan Turing Hall', 'Dr. Ramesh Ramanujan'],
    [2, 'DIT', 'Department of Information Technology', 2008, 'Grace Hopper Tower', 'Dr. Sunita Deshmukh'],
    [3, 'DCS', 'Department of Computer Science', 2002, 'Ada Lovelace Block', 'Prof. Arvind Kulkarni'],
    [4, 'DMGT', 'Department of Management Studies', 2012, 'Chanakya Academic Complex', 'Dr. Meenakshi Sundaram']
  ],
  courses: [
    [1, 'BCA', 'Bachelor of Computer Applications', 1, 3, 6, 'Undergraduate'],
    [2, 'MCA', 'Master of Computer Applications', 1, 2, 4, 'Postgraduate'],
    [3, 'BSC-IT', 'Bachelor of Science in Information Technology', 2, 3, 6, 'Undergraduate'],
    [4, 'BTECH-CS', 'Bachelor of Technology in Computer Science', 3, 4, 8, 'Undergraduate']
  ],
  semesters: [
    [1, 1, 1, '2023-2024', 'Odd', '2023-08-01', '2023-12-15', 0],
    [2, 1, 2, '2023-2024', 'Even', '2024-01-10', '2024-05-30', 0],
    [3, 1, 3, '2024-2025', 'Odd', '2024-08-01', '2024-12-20', 1],
    [4, 1, 4, '2024-2025', 'Even', '2025-01-08', '2025-05-25', 0],
    [5, 2, 1, '2024-2025', 'Odd', '2024-08-15', '2024-12-24', 1],
    [6, 3, 3, '2024-2025', 'Odd', '2024-08-01', '2024-12-20', 1]
  ],
  faculty: [
    [1, 'FAC-101', 'Anand', 'Verma', 'anand.verma@campuscore.edu', '9876543210', 1, 'Associate Professor', 'Ph.D in Database Systems', '2015-06-15', 'Active'],
    [2, 'FAC-102', 'Priya', 'Nair', 'priya.nair@campuscore.edu', '9876543211', 1, 'Assistant Professor', 'M.Tech in Software Engineering', '2018-07-01', 'Active'],
    [3, 'FAC-103', 'Rajesh', 'Sharma', 'rajesh.sharma@campuscore.edu', '9876543212', 1, 'Professor', 'Ph.D in Operating Systems', '2012-08-20', 'Active'],
    [4, 'FAC-104', 'Kavita', 'Iyer', 'kavita.iyer@campuscore.edu', '9876543213', 2, 'Associate Professor', 'M.E. in Computer Networks', '2016-11-10', 'Active'],
    [5, 'FAC-105', 'Vikram', 'Singh', 'vikram.singh@campuscore.edu', '9876543214', 3, 'Assistant Professor', 'M.S. in Data Science', '2020-01-15', 'Active']
  ],
  subjects: [
    [1, 'BCA301', 'Database Management Systems', 4, 1, 3, 'Theory', 30.0, 70.0],
    [2, 'BCA302', 'DBMS & SQL Laboratory', 2, 1, 3, 'Lab', 20.0, 30.0],
    [3, 'BCA303', 'Object-Oriented Programming with Java', 4, 1, 3, 'Theory', 30.0, 70.0],
    [4, 'BCA304', 'Computer Networks', 4, 1, 3, 'Theory', 30.0, 70.0],
    [5, 'BCA305', 'Discrete Mathematics', 4, 1, 3, 'Theory', 30.0, 70.0],
    [6, 'BCA101', 'Programming in C', 4, 1, 1, 'Theory', 30.0, 70.0],
    [7, 'MCA101', 'Advanced Database Technologies', 4, 2, 1, 'Theory', 30.0, 70.0]
  ],
  faculty_subject_assignments: [
    [1, 1, 1, '2024-2025', 3, '2024-07-25'],
    [2, 1, 2, '2024-2025', 3, '2024-07-25'],
    [3, 2, 3, '2024-2025', 3, '2024-07-25'],
    [4, 4, 4, '2024-2025', 3, '2024-07-25'],
    [5, 5, 5, '2024-2025', 3, '2024-07-25']
  ],
  students: [
    [1, 'BCA2023001', 'Aarav', 'Patel', 'aarav.patel@student.campuscore.edu', '9123456780', '2004-04-12', 'Male', 'B+', '42 Rosewood Avenue', 'Bengaluru', 'Karnataka', '2023-07-15', 3, 'Active'],
    [2, 'BCA2023002', 'Diya', 'Menon', 'diya.menon@student.campuscore.edu', '9123456781', '2005-01-22', 'Female', 'O+', '18 Palm Meadows', 'Bengaluru', 'Karnataka', '2023-07-15', 3, 'Active'],
    [3, 'BCA2023003', 'Rohan', 'Gupta', 'rohan.gupta@student.campuscore.edu', '9123456782', '2004-09-05', 'Male', 'A+', '88 Brigade Link Road', 'Mysuru', 'Karnataka', '2023-07-16', 3, 'Active'],
    [4, 'BCA2023004', 'Ananya', 'Reddy', 'ananya.reddy@student.campuscore.edu', '9123456783', '2004-11-30', 'Female', 'AB+', '104 Banjara Hills', 'Hyderabad', 'Telangana', '2023-07-16', 3, 'Active'],
    [5, 'BCA2023005', 'Siddharth', 'Sen', 'siddharth.sen@student.campuscore.edu', '9123456784', '2003-08-19', 'Male', 'O-', '15 Salt Lake Sector 2', 'Kolkata', 'West Bengal', '2023-07-17', 3, 'Active'],
    [6, 'BCA2023006', 'Meera', 'Nambiar', 'meera.nambiar@student.campuscore.edu', '9123456785', '2004-03-14', 'Female', 'B-', '27 Marine Drive', 'Kochi', 'Kerala', '2023-07-18', 3, 'Active'],
    [7, 'BCA2023007', 'Kunal', 'Joshi', 'kunal.joshi@student.campuscore.edu', '9123456786', '2004-06-25', 'Male', 'A-', '73 Shivaji Park', 'Pune', 'Maharashtra', '2023-07-18', 3, 'Active'],
    [8, 'BCA2023008', 'Sneha', 'Chatterjee', 'sneha.c@student.campuscore.edu', '9123456787', '2004-12-08', 'Female', 'O+', '5 Park Circus', 'Kolkata', 'West Bengal', '2023-07-19', 3, 'Active']
  ],
  enrollments: [
    [1, 1, 1, 3, '2024-2025', '2024-07-28', 'Active'],
    [2, 2, 1, 3, '2024-2025', '2024-07-28', 'Active'],
    [3, 3, 1, 3, '2024-2025', '2024-07-28', 'Active'],
    [4, 4, 1, 3, '2024-2025', '2024-07-28', 'Active'],
    [5, 5, 1, 3, '2024-2025', '2024-07-28', 'Active'],
    [6, 6, 1, 3, '2024-2025', '2024-07-28', 'Active'],
    [7, 7, 1, 3, '2024-2025', '2024-07-28', 'Active'],
    [8, 8, 1, 3, '2024-2025', '2024-07-28', 'Active']
  ],
  attendance: [
    [1, 1, 1, '2024-08-05', 'Present', 'Attended lecture', 1],
    [2, 2, 1, '2024-08-05', 'Present', 'Attended lecture', 1],
    [3, 3, 1, '2024-08-05', 'Absent', 'Medical leave', 1],
    [4, 4, 1, '2024-08-05', 'Present', 'Attended lecture', 1],
    [5, 5, 1, '2024-08-05', 'Absent', 'Uninformed absence', 1],
    [6, 6, 1, '2024-08-05', 'Present', 'Attended lecture', 1],
    [7, 7, 1, '2024-08-05', 'Present', 'Attended lecture', 1],
    [8, 8, 1, '2024-08-05', 'Present', 'Attended lecture', 1],

    [9, 1, 1, '2024-08-07', 'Present', 'Active in lab queries', 1],
    [10, 2, 1, '2024-08-07', 'Present', 'Active in lab queries', 1],
    [11, 3, 1, '2024-08-07', 'Present', 'Present', 1],
    [12, 4, 1, '2024-08-07', 'Present', 'Present', 1],
    [13, 5, 1, '2024-08-07', 'Absent', 'Low attendance warning', 1],
    [14, 6, 1, '2024-08-07', 'Present', 'Present', 1],
    [15, 7, 1, '2024-08-07', 'Present', 'Present', 1],
    [16, 8, 1, '2024-08-07', 'Present', 'Present', 1],

    [17, 1, 1, '2024-08-12', 'Present', 'Submitted ER assignment', 1],
    [18, 2, 1, '2024-08-12', 'Present', 'Submitted ER assignment', 1],
    [19, 3, 1, '2024-08-12', 'Present', 'Submitted ER assignment', 1],
    [20, 4, 1, '2024-08-12', 'Present', 'Submitted ER assignment', 1],
    [21, 5, 1, '2024-08-12', 'Absent', 'Counseling required', 1],
    [22, 6, 1, '2024-08-12', 'Present', 'Submitted ER assignment', 1],
    [23, 7, 1, '2024-08-12', 'Absent', 'Sports tournament', 1],
    [24, 8, 1, '2024-08-12', 'Present', 'Submitted ER assignment', 1],

    [25, 1, 3, '2024-08-06', 'Present', 'Object modeling discussion', 2],
    [26, 2, 3, '2024-08-06', 'Present', 'Present', 2],
    [27, 3, 3, '2024-08-06', 'Present', 'Present', 2],
    [28, 4, 3, '2024-08-06', 'Present', 'Present', 2],
    [29, 5, 3, '2024-08-06', 'Present', 'Present', 2],
    [30, 6, 3, '2024-08-06', 'Present', 'Present', 2],
    [31, 7, 3, '2024-08-06', 'Present', 'Present', 2],
    [32, 8, 3, '2024-08-06', 'Present', 'Present', 2]
  ],
  assessments: [
    [1, 1, 3, 'Continuous Internal Assessment 1 (CIA-1)', 'Internal', 30.0, 30.0, '2024-09-15'],
    [2, 1, 3, 'Semester End Examination (SEE)', 'Semester_Exam', 70.0, 70.0, '2024-11-20'],
    [3, 3, 3, 'Continuous Internal Assessment 1 (CIA-1)', 'Internal', 30.0, 30.0, '2024-09-18'],
    [4, 3, 3, 'Semester End Examination (SEE)', 'Semester_Exam', 70.0, 70.0, '2024-11-25']
  ],
  marks: [
    [1, 1, 1, 28.5, 0, 'Excellent relational modeling concepts'],
    [2, 1, 2, 29.0, 0, 'Outstanding SQL syntax and schema design'],
    [3, 1, 3, 24.0, 0, 'Good understanding of 2NF and 3NF'],
    [4, 1, 4, 27.0, 0, 'Very good query formulation'],
    [5, 1, 5, 14.5, 0, 'Needs improvement in joins and normalization'],
    [6, 1, 6, 26.0, 0, 'Consistent and neat execution'],
    [7, 1, 7, 21.0, 0, 'Needs revision of DCL/TCL concepts'],
    [8, 1, 8, 28.0, 0, 'High quality ER diagram solution'],

    [9, 2, 1, 64.0, 0, 'Distinction marks'],
    [10, 2, 2, 67.5, 0, 'Class topper performance'],
    [11, 2, 3, 54.0, 0, 'First class'],
    [12, 2, 4, 62.0, 0, 'Distinction'],
    [13, 2, 5, 38.0, 0, 'Borderline pass, remedial requested'],
    [14, 2, 6, 59.5, 0, 'Strong performance'],
    [15, 2, 7, 48.0, 0, 'Second class'],
    [16, 2, 8, 65.0, 0, 'Distinction']
  ],
  fee_records: [
    [1, 1, 3, 'Tuition', 45000.0, '2024-08-30'],
    [2, 1, 3, 'Examination', 2500.0, '2024-10-15'],
    [3, 2, 3, 'Tuition', 45000.0, '2024-08-30'],
    [4, 2, 3, 'Examination', 2500.0, '2024-10-15'],
    [5, 3, 3, 'Tuition', 45000.0, '2024-08-30'],
    [6, 4, 3, 'Tuition', 45000.0, '2024-08-30'],
    [7, 5, 3, 'Tuition', 45000.0, '2024-08-30'],
    [8, 6, 3, 'Tuition', 45000.0, '2024-08-30'],
    [9, 7, 3, 'Tuition', 45000.0, '2024-08-30'],
    [10, 8, 3, 'Tuition', 45000.0, '2024-08-30']
  ],
  fee_payments: [
    [1, 1, 'RCP-2024-001', 45000.0, '2024-08-10', 'Bank Transfer', 'NEFT-SBIN20240810-0981', 'Full tuition clearance'],
    [2, 2, 'RCP-2024-002', 2500.0, '2024-10-02', 'UPI Reference', 'UPI-982348712903', 'Exam fee paid on time'],
    [3, 3, 'RCP-2024-003', 45000.0, '2024-08-12', 'Bank Transfer', 'HDFC-TXN-49021890', 'Tuition paid in full'],
    [4, 4, 'RCP-2024-004', 2500.0, '2024-10-05', 'UPI Reference', 'UPI-849102847120', 'Exam fee cleared'],
    [5, 5, 'RCP-2024-005', 25000.0, '2024-08-25', 'Demand Draft', 'DD-CANARA-771920', 'Installment 1 of 2'],
    [6, 6, 'RCP-2024-006', 45000.0, '2024-08-15', 'Bank Transfer', 'ICICI-88210398', 'Tuition cleared'],
    [7, 8, 'RCP-2024-007', 45000.0, '2024-08-28', 'UPI Reference', 'UPI-771920381920', 'Tuition cleared']
  ],
  student_feedback: [
    [1, 1, 1, 1, 5, 'Course Delivery', 'Dr. Anand Verma explains normalization and transactions with clear live examples.', 'Reviewed'],
    [2, 2, 1, 2, 5, 'Lab Facilities', 'The MySQL lab server is fast and schema exercises were very insightful.', 'Reviewed'],
    [3, 3, 2, 3, 4, 'Course Delivery', 'Java OOP concepts well articulated; more multithreading practice requested.', 'Reviewed'],
    [4, 5, 1, 1, 3, 'Course Delivery', 'Need additional revision sessions on BCNF and nested subqueries.', 'Pending'],
    [5, 4, null, null, 4, 'General Campus', 'Library has updated DBMS textbooks and quiet study zones.', 'Reviewed']
  ],
  users: [
    [1, 'admin', 'pbkdf2$10000$adminhash$demo', 'System Administrator', 'admin@campuscore.edu', 'Administrator', null, 1],
    [2, 'fac_anand', 'pbkdf2$10000$facultyhash$demo', 'Dr. Anand Verma', 'anand.verma@campuscore.edu', 'Faculty', 1, 1],
    [3, 'stu_aarav', 'pbkdf2$10000$studenthash$demo', 'Aarav Patel', 'aarav.patel@student.campuscore.edu', 'Student', 1, 1]
  ]
};
