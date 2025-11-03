import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { 
  FaCalendarAlt, 
  FaChartBar, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSpinner,
  FaCalendarPlus,
  FaFileDownload
} from 'react-icons/fa';
import { getStudentAttendance } from '../../services/api';
import { format } from 'date-fns';

export default function StudentAttendance() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'Medical'
  });
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
    streak: 0
  });

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        console.log(`Fetching attendance for month: ${month}, year: ${year}`);
        const response = await getStudentAttendance(month, year);
        console.log('Attendance data received:', response.data);
        setAttendanceData(response.data);
        calculateStats(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        if (err.response) {
          console.error("Error response:", err.response.data);
          setError(`Failed to load attendance data: ${err.response.data.message || 'Server error'}`);
        } else if (err.request) {
          setError("Network error. Please check your connection.");
        } else {
          setError("Failed to load attendance data. Please try again.");
        }
        // Set empty data when error occurs
        setAttendanceData([]);
        calculateStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [month, year]);

  // Calculate attendance statistics
  const calculateStats = (data) => {
    const present = data.filter(record => record.status === 'Present').length;
    const absent = data.filter(record => record.status === 'Absent').length;
    const late = data.filter(record => record.status === 'Late').length;
    const total = present + absent + late;
    
    // Calculate current streak
    let streak = 0;
    const sortedData = [...data].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    for (const record of sortedData) {
      if (record.status === 'Present') {
        streak++;
      } else {
        break;
      }
    }

    setStats({
      present,
      absent,
      late,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      streak
    });
  };

  // Handle month change
  const handleMonthChange = (e) => {
    setMonth(parseInt(e.target.value));
  };

  // Handle year change
  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  // Handle leave form input changes
  const handleLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm({
      ...leaveForm,
      [name]: value
    });
  };

  // Submit leave request
  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    // This would connect to an API endpoint to submit the leave request
    alert('Leave request submitted successfully!');
    setShowLeaveModal(false);
    setLeaveForm({
      startDate: '',
      endDate: '',
      reason: '',
      type: 'Medical'
    });
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'Present': return 'bg-success';
      case 'Absent': return 'bg-danger';
      case 'Late': return 'bg-warning';
      case 'Weekend': return 'bg-info';
      case 'Holiday': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  // Export attendance data as CSV
  const exportAttendance = () => {
    const csvContent = [
      "Date,Status,Time In,Time Out",
      ...attendanceData.map(record => {
        const date = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '';
        return `${date},${record.status || ''},${record.timeIn || ''},${record.timeOut || ''}`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${year}_${month}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="student" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4">
              <FaCalendarAlt className="me-2" />
              My Attendance
            </h2>
            
            {loading ? (
              <div className="text-center py-5">
                <FaSpinner className="fa-spin me-2" />
                <span>Loading attendance data...</span>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="d-flex gap-2">
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
                  </div>
                  <div className="col-md-6 text-end">
                    <button
                      className="btn btn-outline-primary me-2"
                      onClick={() => setShowLeaveModal(true)}
                    >
                      <FaCalendarPlus className="me-1" /> Request Leave
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={exportAttendance}
                    >
                      <FaFileDownload className="me-1" /> Export
                    </button>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="text-center p-3 border rounded">
                          <h6 className="text-success mb-1">Present Days</h6>
                          <h3>{stats.present}</h3>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center p-3 border rounded">
                          <h6 className="text-danger mb-1">Absent Days</h6>
                          <h3>{stats.absent}</h3>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center p-3 border rounded">
                          <h6 className="text-warning mb-1">Late Days</h6>
                          <h3>{stats.late}</h3>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center p-3 border rounded">
                          <h6 className="text-primary mb-1">Attendance</h6>
                          <h3>{stats.percentage}%</h3>
                          {stats.percentage < 75 && (
                            <small className="text-danger">
                              <FaExclamationTriangle className="me-1" />
                              Below required 75%
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="card-header ">
                    <h5 className="mb-0">
                      <FaChartBar className="me-2" />
                      Attendance Records
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="list-view">
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Day</th>
                              <th>Status</th>
                              <th>Time In</th>
                              <th>Time Out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.length > 0 ? (
                              attendanceData.map((record, index) => (
                                <tr key={index}>
                                  <td>
                                    {record.date ? format(new Date(record.date), 'dd MMM yyyy') : '-'}
                                  </td>
                                  <td>
                                    {record.date ? format(new Date(record.date), 'EEEE') : '-'}
                                  </td>
                                  <td>
                                    <span className={`badge ${getStatusColorClass(record.status)}`}>
                                      {record.status}
                                    </span>
                                  </td>
                                  <td>{record.timeIn || '-'}</td>
                                  <td>{record.timeOut || '-'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center py-3">
                                  No attendance records found for this month
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Leave</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLeaveModal(false)}
                ></button>
              </div>
              <form onSubmit={handleLeaveSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="leaveType" className="form-label">Leave Type</label>
                    <select
                      id="leaveType"
                      name="type"
                      className="form-select"
                      value={leaveForm.type}
                      onChange={handleLeaveInputChange}
                      required
                    >
                      <option value="Medical">Medical Leave</option>
                      <option value="Personal">Personal Leave</option>
                      <option value="Family">Family Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="startDate" className="form-label">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      className="form-control"
                      value={leaveForm.startDate}
                      onChange={handleLeaveInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="endDate" className="form-label">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      className="form-control"
                      value={leaveForm.endDate}
                      onChange={handleLeaveInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reason" className="form-label">Reason</label>
                    <textarea
                      id="reason"
                      name="reason"
                      className="form-control"
                      rows="3"
                      value={leaveForm.reason}
                      onChange={handleLeaveInputChange}
                      required
                    ></textarea>
                  </div>
                  <div className="form-text text-muted">
                    <FaExclamationTriangle className="me-1" />
                    Leave requests must be submitted at least 2 days in advance.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowLeaveModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showLeaveModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}
