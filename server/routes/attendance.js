const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Warden = require('../models/Warden'); 
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get all attendance records
// Access: Admin, Warden
router.get('/', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const { date, hostelBlock } = req.query;
    
    let query = {};
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (hostelBlock) {
      // Find students in the specified hostel block
      const students = await Student.find({ hostelBlock });
      const studentIds = students.map(student => student._id);
      
      query.student = { $in: studentIds };
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'student',
        select: 'rollNumber roomNumber',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .populate('markedBy', 'name')
      .sort({ date: -1 });
    
    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance records for a specific student
// Access: Admin, Warden, Student (own records)
router.get('/records/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    
    // Check if user is authorized to view this student's attendance
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    let query = { student: studentId };
    
    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 });
    
    // Format records for frontend
    const formattedRecords = attendanceRecords.map(record => ({
      id: record._id,
      date: record.date,
      status: record.status,
      timeIn: record.timeIn,
      timeOut: record.timeOut,
      remarks: record.remarks
    }));
    
    res.json(formattedRecords);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get student's own attendance
// Access: Student
router.get('/my-attendance', auth, roleAuth('student'), async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    let query = { student: student._id };
    
    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 });
    
    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance for students
// Access: Warden
router.post('/mark', auth, roleAuth('warden'), async (req, res) => {
  try {
    const { studentId, date, status, timeIn, timeOut, remarks } = req.body;
    
    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if attendance already marked for this date
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: new Date(date)
    });
    
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.timeIn = timeIn;
      existingAttendance.timeOut = timeOut;
      existingAttendance.remarks = remarks;
      existingAttendance.markedBy = req.user.id;
      
      await existingAttendance.save();
      res.json(existingAttendance);
    } else {
      // Create new attendance record
      const attendance = new Attendance({
        student: studentId,
        date: new Date(date),
        status,
        timeIn,
        timeOut,
        remarks,
        markedBy: req.user.id
      });
      
      await attendance.save();
      res.status(201).json(attendance);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk mark attendance
// Access: Warden
router.post('/bulk-mark', auth, roleAuth('warden'), async (req, res) => {
  try {
    const { records, date } = req.body;
    
    const attendanceDate = new Date(date);
    const bulkOperations = [];
    
    for (const record of records) {
      const { studentId, status, timeIn, timeOut, remarks } = record;
      
      // Check if attendance already exists for this student on this date
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        date: {
          $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
          $lte: new Date(attendanceDate.setHours(23, 59, 59, 999))
        }
      });
      
      if (existingAttendance) {
        // Update existing record
        existingAttendance.status = status;
        existingAttendance.timeIn = timeIn;
        existingAttendance.timeOut = timeOut;
        existingAttendance.remarks = remarks;
        existingAttendance.markedBy = req.user.id;
        
        await existingAttendance.save();
        bulkOperations.push(existingAttendance);
      } else {
        // Create new record
        const attendance = new Attendance({
          student: studentId,
          date: attendanceDate,
          status,
          timeIn,
          timeOut,
          remarks,
          markedBy: req.user.id
        });
        
        await attendance.save();
        bulkOperations.push(attendance);
      }
    }
    
    res.status(201).json({ message: 'Attendance marked successfully', count: bulkOperations.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance statistics
// Access: Admin, Warden
router.get('/stats', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Default to current month/year if not provided
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    let studentQuery = {};
    
    // If warden, only show stats for their hostel block
    if (req.user.role === 'warden') {
      const warden = await Warden.findOne({ user: req.user.id });
      if (warden) {
        studentQuery.hostelBlock = warden.hostelBlock;
      }
    }
    
    // Get all students in the query
    const students = await Student.find(studentQuery);
    const studentIds = students.map(student => student._id);
    
    // Get all attendance records for these students in the date range
    const attendanceRecords = await Attendance.find({
      student: { $in: studentIds },
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate statistics
    let totalPresent = 0;
    let totalRecords = 0;
    let lowAttendanceCount = 0;
    let perfectAttendanceCount = 0;
    
    // Group records by student
    const studentAttendance = {};
    
    attendanceRecords.forEach(record => {
      const studentId = record.student.toString();
      
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          present: 0,
          total: 0
        };
      }
      
      studentAttendance[studentId].total++;
      
      if (record.status === 'Present' || record.status === 'Late') {
        studentAttendance[studentId].present++;
        totalPresent++;
      }
      
      totalRecords++;
    });
    
    // Calculate per-student statistics
    Object.values(studentAttendance).forEach(stats => {
      const percentage = (stats.present / stats.total) * 100;
      
      if (percentage < 75) {
        lowAttendanceCount++;
      }
      
      if (percentage === 100) {
        perfectAttendanceCount++;
      }
    });
    
    const averageAttendance = totalRecords > 0 
      ? Math.round((totalPresent / totalRecords) * 100) 
      : 0;
    
    res.json({
      averageAttendance,
      lowAttendanceCount,
      perfectAttendanceCount,
      totalStudents: students.length
    });
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;