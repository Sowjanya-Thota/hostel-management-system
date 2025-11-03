const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get all invoices
// Access: Admin
router.get('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate({
        path: 'student',
        select: 'rollNumber roomNumber',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student's invoices
// Access: Admin, Student (own invoices)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
    
    const invoices = await Invoice.find({ student: studentId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student's own invoices
// Access: Student
router.get('/my-invoices', auth, roleAuth('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    
    const invoices = await Invoice.find({ student: student._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create invoice
// Access: Admin
router.post('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { studentId, amount, dueDate, items } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;
    
    const invoice = new Invoice({
      student: studentId,
      invoiceNumber,
      amount,
      dueDate: new Date(dueDate),
      items
    });
    
    await invoice.save();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update invoice status
// Access: Admin
router.put('/:id/status', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { status, paymentDate, paymentMethod } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    invoice.status = status;
    
    if (status === 'Paid') {
      invoice.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      invoice.paymentMethod = paymentMethod;
    }
    
    await invoice.save();
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process invoice payment
// Access: Student
router.post('/:id/pay', auth, roleAuth('student'), async (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student || invoice.student.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to pay this invoice' });
    }
    
    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already paid' });
    }
    
    invoice.status = 'Paid';
    invoice.paymentDate = new Date();
    invoice.paymentMethod = 'Online';
    
    await invoice.save();
    
    res.json({ success: true, message: 'Payment successful', data: invoice });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
});

module.exports = router;