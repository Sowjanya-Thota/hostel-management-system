import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/sidebar";
import { 
  FaCalendarCheck, 
  FaChartBar, 
  FaSearch, 
  FaUserAlt,
  FaFilter,
  FaFileExport,
  FaSpinner
} from "react-icons/fa";
import { 
  getStudentsList, 
  getAttendanceRecords, 
  getAttendanceStats, 
  exportAttendanceData
} from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-toastify";

export default function WardenAttendance() {
  const [activeTab, setActiveTab] = useState("students");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterBlock, setFilterBlock] = useState("All");
  const [isExporting, setIsExporting] = useState(false);
  
  // Loading and error states
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    averageAttendance: 0,
    lowAttendanceCount: 0,
    perfectAttendanceCount: 0
  });

  // Fetch students data on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch attendance overview stats when tab changes to overview
  useEffect(() => {
    if (activeTab === "overview") {
      fetchAttendanceStats();
    }
  }, [activeTab, month, year]);

  // Fetch students list
  const fetchStudents = async () => {
    setStudentsLoading(true);
    setError(null);
    try {
      const response = await getStudentsList();
      if (response && response.data) {
        setStudents(response.data);
      } else {
        setStudents([]);
        setError("No student data received from server");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      const errorMessage = err.response?.data?.message || "Failed to load students data. Please try again.";
      setError(errorMessage);
      toast.error("Failed to load students data");
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch attendance statistics for overview
  const fetchAttendanceStats = async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const response = await getAttendanceStats(month, year);
      setOverviewStats(response.data);
    } catch (err) {
      console.error("Error fetching attendance stats:", err);
      setError("Failed to load attendance statistics. Please try again.");
      toast.error("Failed to load attendance statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch attendance records for a specific student
  const fetchStudentAttendance = async (studentId) => {
    setAttendanceLoading(true);
    setError(null);
    try {
      const response = await getAttendanceRecords(studentId, month, year);
      
      // Update the attendance records for this student
      setAttendanceRecords(prevRecords => {
        const existingIndex = prevRecords.findIndex(r => r.studentId === studentId);
        if (existingIndex >= 0) {
          const updated = [...prevRecords];
          updated[existingIndex] = {
            studentId,
            records: response.data
          };
          return updated;
        } else {
          return [...prevRecords, {
            studentId,
            records: response.data
          }];
        }
      });
    } catch (err) {
      console.error("Error fetching student attendance:", err);
      setError(`Failed to load attendance data for student ID ${studentId}. Please try again.`);
      toast.error("Failed to load student attendance data");
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Calculate attendance statistics
  const calculateStats = (studentId) => {
    const studentRecords = attendanceRecords.find(r => r.studentId === studentId)?.records || [];
    const presentDays = studentRecords.filter(r => r.status === "Present" || r.status === "Late").length;
    const absentDays = studentRecords.filter(r => r.status === "Absent").length;
    const lateDays = studentRecords.filter(r => r.status === "Late").length;
    const percentage = Math.round((presentDays / (studentRecords.length || 1)) * 100) || 0;
    
    return { presentDays, absentDays, lateDays, percentage };
  };

  // Filter students based on search and block filter
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id?.toString().includes(searchTerm);
    const matchesBlock = filterBlock === "All" || student.block === filterBlock;
    
    return matchesSearch && matchesBlock;
  });

  // Handle student selection
  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setShowDetails(true);
    
    // Fetch attendance records for this student if not already loaded
    const existingRecords = attendanceRecords.find(r => r.studentId === student.id);
    if (!existingRecords) {
      await fetchStudentAttendance(student.id);
    }
  };

  // Get attendance records for selected student
  const getStudentRecords = () => {
    if (!selectedStudent) return [];
    return attendanceRecords.find(r => r.studentId === selectedStudent.id)?.records || [];
  };

  // Handle export functionality
  const handleExport = async () => {
    if (!selectedStudent) return;
    
    setIsExporting(true);
    try {
      const response = await exportAttendanceData(selectedStudent.id, month, year);
      
      // Create a download link for the exported file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedStudent.name}_attendance_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Attendance records for ${selectedStudent.name} exported successfully!`);
    } catch (err) {
      console.error("Error exporting attendance:", err);
      toast.error("Failed to export attendance data");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle block filter selection
  const handleBlockFilter = (block) => {
    setFilterBlock(block);
  };

  // Handle month change
  const handleMonthChange = (e) => {
    setMonth(parseInt(e.target.value));
    
    // If a student is selected, refresh their attendance data
    if (selectedStudent) {
      fetchStudentAttendance(selectedStudent.id);
    }
  };

  // Handle year change
  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
    
    // If a student is selected, refresh their attendance data
    if (selectedStudent) {
      fetchStudentAttendance(selectedStudent.id);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="warden" />

      <div className="main-content flex-grow-1">
        <Navbar />

        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4">
              <FaCalendarCheck className="me-2" />
              Attendance Management
            </h2>

            {error && (
              <div className="alert alert-danger mb-4">
                {error}
              </div>
            )}

            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "students" ? "active bg-primary text-white" : "text-secondary"}`}
                  onClick={() => setActiveTab("students")}
                >
                  Student Attendance
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "overview" ? "active bg-primary text-white" : "text-secondary"}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <FaChartBar className="me-1" /> Overview
                </button>
              </li>
            </ul>

            {activeTab === "students" && (
              <>
                <div className="row mb-3">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaSearch />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search students by name, ID or room..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={month}
                      onChange={handleMonthChange}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={year}
                      onChange={handleYearChange}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <option key={i} value={new Date().getFullYear() - 2 + i}>
                          {new Date().getFullYear() - 2 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <div className="dropdown">
                      <button 
                        className="btn btn-outline-secondary dropdown-toggle w-100" 
                        type="button"
                        data-bs-toggle="dropdown"
                        id="blockFilterDropdown"
                        aria-expanded="false"
                      >
                        <FaFilter className="me-1" /> {filterBlock === "All" ? "Filter by Block" : `Block ${filterBlock}`}
                      </button>
                      <ul className="dropdown-menu" aria-labelledby="blockFilterDropdown">
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleBlockFilter("All")}
                          >
                            All Blocks
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleBlockFilter("A")}
                          >
                            Block A
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleBlockFilter("B")}
                          >
                            Block B
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleBlockFilter("C")}
                          >
                            Block C
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow">
                  <div className="card-body p-0">
                    {studentsLoading ? (
                      <div className="text-center py-5">
                        <FaSpinner className="fa-spin me-2" />
                        <span>Loading students data...</span>
                      </div>
                    ) : students.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No students found</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead className="table-dark">
                            <tr>
                              <th>Student ID</th>
                              <th>Name</th>
                              <th>Room</th>
                              <th>Block</th>
                              <th>Present Days</th>
                              <th>Attendance %</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.length > 0 ? (
                              filteredStudents.map(student => {
                                const stats = calculateStats(student.id);
                                return (
                                  <tr key={student.id}>
                                    <td>{student.id}</td>
                                    <td>
                                      <FaUserAlt className="me-1" />
                                      {student.name}
                                    </td>
                                    <td>{student.room}</td>
                                    <td>{student.block}</td>
                                    <td>{stats.presentDays}</td>
                                    <td>
                                      <span className={`badge ${
                                        stats.percentage >= 90 ? 'bg-success' :
                                        stats.percentage >= 75 ? 'bg-warning' :
                                        'bg-danger'
                                      }`}>
                                        {stats.percentage}%
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleStudentSelect(student)}
                                      >
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="7" className="text-center py-3">
                                  No students match your search criteria
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "overview" && (
              <div className="row">
                {statsLoading ? (
                  <div className="col-12 text-center py-5">
                    <FaSpinner className="fa-spin me-2" />
                    <span>Loading attendance statistics...</span>
                  </div>
                ) : (
                  <>
                    <div className="col-md-4 mb-4">
                      <div className="card text-white bg-success h-100">
                        <div className="card-body text-center">
                          <h5 className="card-title">Average Attendance</h5>
                          <p className="display-4">{overviewStats.averageAttendance}%</p>
                          <p className="mb-0">Across all students</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4 mb-4">
                      <div className="card text-white bg-danger h-100">
                        <div className="card-body text-center">
                          <h5 className="card-title">Low Attendance</h5>
                          <p className="display-4">{overviewStats.lowAttendanceCount}</p>
                          <p className="mb-0">Students below 75%</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4 mb-4">
                      <div className="card text-white bg-primary h-100">
                        <div className="card-body text-center">
                          <h5 className="card-title">Perfect Attendance</h5>
                          <p className="display-4">{overviewStats.perfectAttendanceCount}</p>
                          <p className="mb-0">Students with 100%</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Attendance Details Modal */}
      {showDetails && selectedStudent && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  <FaUserAlt className="me-2" />
                  {selectedStudent.name}'s Attendance Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowDetails(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {attendanceLoading ? (
                  <div className="text-center py-5">
                    <FaSpinner className="fa-spin me-2" />
                    <span>Loading attendance data...</span>
                  </div>
                ) : (
                  <>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <p><strong>Student ID:</strong> {selectedStudent.id}</p>
                        <p><strong>Room:</strong> {selectedStudent.room}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Block:</strong> {selectedStudent.block}</p>
                        <p><strong>Month:</strong> {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}</p>
                      </div>
                    </div>

                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-body">
                        <div className="row text-center">
                          <div className="col">
                            <h6>Present Days</h6>
                            <p className="display-6 text-success">{calculateStats(selectedStudent.id).presentDays}</p>
                          </div>
                          <div className="col">
                            <h6>Absent Days</h6>
                            <p className="display-6 text-danger">{calculateStats(selectedStudent.id).absentDays}</p>
                          </div>
                          <div className="col">
                            <h6>Late Days</h6>
                            <p className="display-6 text-warning">{calculateStats(selectedStudent.id).lateDays}</p>
                          </div>
                          <div className="col">
                            <h6>Attendance %</h6>
                            <p className="display-6 text-primary">{calculateStats(selectedStudent.id).percentage}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card border-0 shadow">
                      <div className="card-header bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">Daily Records</h5>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleExport}
                            disabled={isExporting}
                          >
                            {isExporting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Exporting...
                              </>
                            ) : (
                              <>
                                <FaFileExport className="me-1" /> Export
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          {getStudentRecords().length > 0 ? (
                            <table className="table table-hover mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Time In</th>
                                  <th>Time Out</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getStudentRecords().map((record) => (
                                  <tr
                                    key={record.id}
                                    className={
                                      record.status === "Absent"
                                        ? "table-danger"
                                        : record.status === "Late"
                                          ? "table-warning"
                                          : ""
                                    }
                                  >
                                    <td>{formatDate(record.date)}</td>
                                    <td>
                                      <span className={`badge ${
                                        record.status === "Present" ? "bg-success" :
                                        record.status === "Absent" ? "bg-danger" :
                                        "bg-warning"
                                      }`}>
                                        {record.status}
                                      </span>
                                    </td>
                                    <td>{record.timeIn || "-"}</td>
                                    <td>{record.timeOut || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-muted">No attendance records found for this month</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showDetails && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
}