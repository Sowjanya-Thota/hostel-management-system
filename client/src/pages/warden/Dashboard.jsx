import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/sidebar.jsx';
import Navbar from '../../components/Navbar';
import { 
  FaUserGraduate, 
  FaExclamationCircle, 
  FaLightbulb, 
  FaSpinner 
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../services/authService.jsx';

export default function WardenDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    pendingComplaints: 0,
    pendingSuggestions: 0,
    hostelBlock: '',
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Use the warden dashboard stats endpoint from dashboard.js
      const response = await api.get('/dashboard/warden/stats');
      
      // Initialize pendingSuggestions with a default value
      let pendingSuggestions = 0;
      
      // Try to get suggestions count, but don't fail if endpoint has an error
      try {
        const suggestionsResponse = await api.get('/suggestions/count');
        pendingSuggestions = suggestionsResponse.data?.count || 0;
      } catch (suggestionsErr) {
        console.warn('Error fetching suggestions count:', suggestionsErr);
        // Continue with default value
      }
      
      setDashboardData({
        totalStudents: response.data.stats.totalStudents || 0,
        pendingComplaints: response.data.stats.pendingComplaints || 0,
        hostelBlock: response.data.stats.hostelBlock || 'Unknown',
        pendingSuggestions: pendingSuggestions,
        recentActivities: response.data.recentActivities || []
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="warden" />
      <div className="main-content flex-grow-1">
        <Navbar />
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4 text-secondary">
              <FaUserGraduate className="me-2" />Warden Dashboard
              {currentUser && <span className="fs-6 ms-2">({currentUser.name})</span>}
            </h2>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <div className="row mb-3">
              <div className="col-12">
                <div className="card bg-dark border-primary text-light mb-4">
                  <div className="card-body">
                    <h5 className="card-title text-primary">Hostel Block: {dashboardData.hostelBlock}</h5>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm bg-dark text-light">
                  <div className="card-body text-center py-4">
                    <FaUserGraduate size={30} className="text-primary" />
                    <h5 className="card-title text-muted">Total Students</h5>
                    <p className="display-4 text-primary">{dashboardData.totalStudents}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm bg-dark text-light">
                  <div className="card-body text-center py-4">
                    <FaExclamationCircle size={30} className="text-danger" />
                    <h5 className="card-title text-muted">Pending Complaints</h5>
                    <p className="display-4 text-danger">{dashboardData.pendingComplaints}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm bg-dark text-light">
                  <div className="card-body text-center py-4">
                    <FaLightbulb size={30} className="text-warning" />
                    <h5 className="card-title text-muted">Pending Suggestions</h5>
                    <p className="display-4 text-warning">{dashboardData.pendingSuggestions}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activities Section */}
            <div className="row">
              <div className="col-12">
                <div className="card bg-dark border-primary text-light">
                  <div className="card-header bg-dark border-primary">
                    <h5 className="mb-0 text-primary">Recent Activities</h5>
                  </div>
                  <div className="card-body">
                    {dashboardData.recentActivities.length > 0 ? (
                      <ul className="list-group list-group-flush bg-dark">
                        {dashboardData.recentActivities.map((activity, index) => (
                          <li key={activity.id || index} className="list-group-item bg-dark text-light border-primary">
                            <div className="d-flex justify-content-between">
                              <div>
                                <span className="text-primary">{activity.user}</span>: {activity.action}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-muted">No recent activities</p>
                    )}
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