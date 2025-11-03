import { Routes, Route, Navigate } from "react-router-dom";
// import { useState, useEffect } from "react";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Student routes
import StudentDashboard from "./pages/student/Dashboard";
import StudentMess from "./pages/student/Mess";
import StudentAttendance from "./pages/student/Attendance";
import StudentComplaints from "./pages/student/Complaints";
import StudentSuggestions from "./pages/student/Suggestions";
import StudentInvoices from "./pages/student/Invoices";

// Admin routes
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminWardens from "./pages/admin/Wardens";
import AdminComplaints from "./pages/admin/Complaints";

// Warden routes
import WardenDashboard from "./pages/warden/Dashboard";
import WardenComplaints from "./pages/warden/Complaints";
import WardenSuggestions from "./pages/warden/Suggestions";
import WardenAttendance from "./pages/warden/Attendance";

// Import AuthProvider from authService
import { AuthProvider } from "./services/authService.jsx";

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/mess" element={<StudentMess />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/complaints" element={<StudentComplaints />} />
          <Route path="/student/suggestions" element={<StudentSuggestions />} />
          <Route path="/student/invoices" element={<StudentInvoices />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/wardens" element={<AdminWardens />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />

          {/* Warden routes */}
          <Route path="/warden/dashboard" element={<WardenDashboard />} />
          <Route path="/warden/complaints" element={<WardenComplaints />} />
          <Route path="/warden/suggestions" element={<WardenSuggestions />} />
          <Route path="/warden/attendance" element={<WardenAttendance />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
