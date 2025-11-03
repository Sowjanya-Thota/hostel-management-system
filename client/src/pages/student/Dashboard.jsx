import { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar';
import Navbar from '../../components/Navbar';
import { getStudentDashboard } from '../../services/api';
import { FaCalendarCheck, FaFileInvoice, FaExclamationCircle, FaBullhorn, FaCalendarAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      studentName: '',
      rollNumber: '',
      roomNumber: '',
      hostelBlock: '',
      pendingComplaints: 0,
      pendingInvoices: 0
    },
    recentActivities: [],
    attendance: { percentage: 0 },
    pendingFees: { amount: 0 },
    activeComplaints: { count: 0 },
    notices: [],
    events: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getStudentDashboard();
        console.log('Dashboard API response:', response.data);
        
        // Map the API response to the expected dashboard data structure
        const apiData = response.data;
        const mappedData = {
          stats: apiData.stats || {},
          recentActivities: apiData.recentActivities || [],
          attendance: { 
            percentage: 85 // Placeholder - should come from attendance API
          },
          pendingFees: { 
            amount: apiData.stats?.pendingInvoices ? 15000 : 0 // Placeholder
          },
          activeComplaints: { 
            count: apiData.stats?.pendingComplaints || 0 
          },
          notices: apiData.recentActivities?.slice(0, 3).map(activity => ({
            title: activity.action,
            date: activity.time
          })) || [],
          events: []
        };
        
        setDashboardData(mappedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Add more detailed error logging
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
          setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
        } else if (err.request) {
          // The request was made but no response was received
          console.error('Error request:', err.request);
          setError('No response received from server. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', err.message);
          setError(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container d-flex">
        <Sidebar role="student" />
        <div className="main-content flex-grow-1">
          <Navbar />
          <div className="dashboard-content">
            <div className="container-fluid py-4 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="student" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4">Student Dashboard</h2>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {/* Student Info Card */}
            {dashboardData.stats && (
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Welcome, {dashboardData.stats.studentName || 'Student'}</h5>
                  <div className="row mt-3">
                    <div className="col-md-3">
                      <p className="text-muted mb-1">Roll Number</p>
                      <p className="fw-bold">{dashboardData.stats.rollNumber || 'N/A'}</p>
                    </div>
                    <div className="col-md-3">
                      <p className="text-muted mb-1">Room Number</p>
                      <p className="fw-bold">{dashboardData.stats.roomNumber || 'N/A'}</p>
                    </div>
                    <div className="col-md-3">
                      <p className="text-muted mb-1">Hostel Block</p>
                      <p className="fw-bold">{dashboardData.stats.hostelBlock || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Stats Cards Row */}
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <Link to="/student/attendance" className="text-decoration-none">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center py-4">
                      <h5 className="card-title text-muted">
                        <FaCalendarCheck className="me-2" />Attendance
                      </h5>
                      <p className="display-4 text-primary">{dashboardData.attendance?.percentage || 0}%</p>
                    </div>
                  </div>
                </Link>
              </div>
              
              <div className="col-md-4">
                <Link to="/student/invoices" className="text-decoration-none">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center py-4">
                      <h5 className="card-title text-muted">
                        <FaFileInvoice className="me-2" />Pending Fees
                      </h5>
                      <p className="display-4 text-danger">₹{(dashboardData.pendingFees?.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              </div>
              
              <div className="col-md-4">
                <Link to="/student/complaints" className="text-decoration-none">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center py-4">
                      <h5 className="card-title text-muted">
                        <FaExclamationCircle className="me-2" />Active Complaints
                      </h5>
                      <p className="display-4 text-warning">{dashboardData.activeComplaints?.count || dashboardData.stats?.pendingComplaints || 0}</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Notices and Events Row */}
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-dark text-white border-bottom">
                    <h5 className="mb-0"><FaBullhorn className="me-2" />Recent Activities</h5>
                  </div>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                      {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
                        dashboardData.recentActivities.map((activity, index) => (
                          <li key={index} className="list-group-item border-0 py-3">
                            {activity.action}
                            {activity.time && <small className="text-muted d-block">{new Date(activity.time).toLocaleDateString()}</small>}
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item border-0 py-3 text-center">No recent activities</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-dark text-white border-bottom">
                    <h5 className="mb-0"><FaCalendarAlt className="me-2" />Notices & Announcements</h5>
                  </div>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                      {dashboardData.notices && dashboardData.notices.length > 0 ? (
                        dashboardData.notices.map((notice, index) => (
                          <li key={index} className="list-group-item border-0 py-3">
                            {notice.title}
                            {notice.date && <small className="text-muted d-block">{new Date(notice.date).toLocaleDateString()}</small>}
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item border-0 py-3 text-center">No recent notices</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}