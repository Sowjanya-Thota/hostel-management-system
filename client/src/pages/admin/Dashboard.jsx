import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaUserShield,
  FaClipboardList,
  FaLightbulb,
  FaExclamationTriangle
} from 'react-icons/fa';
import Sidebar from '../../components/sidebar';
import Navbar from '../../components/Navbar';
import { getAdminStats } from '../../services/api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    pendingRequests: 0,
    suggestionsCount: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getAdminStats();
        console.log('Dashboard data:', response.data);
        
        // Check if response data has the expected structure
        if (response.data && typeof response.data === 'object') {
          // Use fallback values if properties are missing
          setStats({
            totalStudents: response.data.stats?.totalStudents || 0,
            totalStaff: response.data.stats?.totalStaff || 0,
            pendingRequests: response.data.stats?.pendingRequests || 0,
            suggestionsCount: response.data.stats?.suggestionsCount || 0
          });
          
          // Handle case where recentActivities might be missing
          setRecentActivities(Array.isArray(response.data.recentActivities) 
            ? response.data.recentActivities 
            : []);
        } else {
          // If response data is not in expected format, use default values
          console.warn('Dashboard data is not in expected format:', response.data);
          // Keep the default values from useState
        }
        
        setError(null);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar role="admin" />
        <div className="main-content flex-grow-1">
          <Navbar />
          <div className="container-fluid py-4">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex">
        <Sidebar role="admin" />
        <div className="main-content flex-grow-1">
          <Navbar />
          <div className="container-fluid py-4">
            <div className="alert alert-danger" role="alert">
              <FaExclamationTriangle className="me-2" />
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar role="admin" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Admin Dashboard</h2>
          </div>
          
          {/* Stats Cards */}
          <div className="row">
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Total Students</h6>
                      <h3 className="mb-0">{stats.totalStudents}</h3>
                    </div>
                    <div className="bg-light p-3 rounded">
                      <FaUsers className="text-primary" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Total Staff</h6>
                      <h3 className="mb-0">{stats.totalStaff}</h3>
                    </div>
                    <div className="bg-light p-3 rounded">
                      <FaUserShield className="text-success" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Pending Requests</h6>
                      <h3 className="mb-0">{stats.pendingRequests}</h3>
                    </div>
                    <div className="bg-light p-3 rounded">
                      <FaClipboardList className="text-warning" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <Link to="/admin/suggestions" className="text-decoration-none">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Suggestions</h6>
                        <h3 className="mb-0">{stats.suggestionsCount}</h3>
                      </div>
                      <div className="bg-light p-3 rounded">
                        <FaLightbulb className="text-info" size={24} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Recent Activities */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Recent Activities</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Activity</th>
                          <th>User</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivities.length > 0 ? (
                          recentActivities.map((activity, index) => (
                            <tr key={activity.id || index}>
                              <td>{activity.action}</td>
                              <td>{activity.user || 'System'}</td>
                              <td>{new Date(activity.time).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">No recent activities</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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