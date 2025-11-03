import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar';
import { 
  FaExclamationCircle, 
  FaSearch, 
  FaFilter,
  FaCheck,
  FaSpinner
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../services/authService.jsx';

export default function WardenComplaints() {
  // State management
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All',
    priority: 'All'
  });
  const { currentUser } = useAuth();

  // Fetch complaints from the server
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // Use the warden-specific endpoint that exists in your backend
      const response = await api.get('/complaints/warden');
      
      // Handle potential data structure issues
      const data = response.data || [];
      
      // The data is already formatted in the backend, but let's ensure consistency
      const formattedComplaints = data.map(complaint => ({
        _id: complaint._id || complaint.id || '',
        title: complaint.title || 'Untitled Complaint',
        description: complaint.description || '',
        category: complaint.category || 'Other',
        status: complaint.status || 'Pending',
        priority: complaint.priority || 'Medium',
        createdAt: complaint.createdAt || new Date().toISOString(),
        student: complaint.student ? {
          name: complaint.student.name || 'Unknown',
          room: complaint.student.room || complaint.student.rollNumber || 'N/A'
        } : { name: 'Unknown', room: 'N/A' }
      }));
      
      setComplaints(formattedComplaints);
      setError(null);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to load complaints. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints based on search term and filters
  const filteredComplaints = complaints.filter(complaint => {
    // Add null checks to prevent errors
    const matchesSearch = 
      (complaint.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'All' || complaint.status === filters.status;
    const matchesCategory = filters.category === 'All' || complaint.category === filters.category;
    const matchesPriority = filters.priority === 'All' || complaint.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Handle resolving a complaint
  const handleResolveComplaint = async () => {
    if (!selectedComplaint || !resolutionNotes.trim()) return;
    
    setIsProcessing(true);
    try {
      // Add error handling for missing IDs
      const complaintId = selectedComplaint._id || selectedComplaint.id;
      if (!complaintId) {
        throw new Error('Complaint ID is missing');
      }
      
      await api.put(`/complaints/${complaintId}/resolve`, {
        resolution: resolutionNotes,
        resolvedBy: currentUser?._id || 'unknown'
      });
      
      // Update local state
      setComplaints(complaints.map(complaint => 
        (complaint._id === complaintId || complaint.id === complaintId) ? { 
          ...complaint, 
          status: 'Resolved',
          resolution: resolutionNotes,
          resolvedAt: new Date().toISOString()
        } : complaint
      ));
      
      setResolutionNotes('');
      setShowResolveModal(false);
      setShowViewModal(false);
    } catch (err) {
      console.error('Error resolving complaint:', err);
      alert('Failed to resolve complaint. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update complaint status
  const handleStatusUpdate = async (id, newStatus) => {
    if (!id) {
      console.error('Cannot update status: Complaint ID is missing');
      return;
    }
    
    try {
      await api.put(`/complaints/${id}/status`, { status: newStatus });
      
      setComplaints(complaints.map(complaint => 
        (complaint._id === id || complaint.id === id) ? { ...complaint, status: newStatus } : complaint
      ));
    } catch (err) {
      console.error('Error updating complaint status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Format date for display with error handling
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  // Status options for filter
  const statusOptions = ['All', 'Pending', 'In Progress', 'Resolved'];
  // Removed unused constants CATEGORY_OPTIONS and PRIORITY_OPTIONS

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="warden" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4 text-secondary">
              <FaExclamationCircle className="me-2" />Complaints Management
            </h2>
            
            {/* Error Display */}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {/* Search and Filters */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-dark border-primary">
                    <FaSearch className="text-secondary" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-dark border-primary text-secondary"
                    placeholder="Search complaints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <div className="dropdown">
                    <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      <FaFilter className="me-1" /> Status: {filters.status}
                    </button>
                    <ul className="dropdown-menu bg-dark border-primary">
                      {statusOptions.map(option => (
                        <li key={option}>
                          <button 
                            className="dropdown-item text-light"
                            onClick={() => setFilters({...filters, status: option})}
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Complaints Table */}
            <div className="card bg-dark border-primary mb-4">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Student</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <FaSpinner className="fa-spin me-2" />
                            Loading complaints...
                          </td>
                        </tr>
                      ) : filteredComplaints.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            No complaints found.
                          </td>
                        </tr>
                      ) : (
                        filteredComplaints.map(complaint => (
                          <tr key={complaint._id || complaint.id || Math.random().toString()}>
                            <td>{complaint.title}</td>
                            <td>{complaint.student?.name || 'Unknown'}</td>
                            <td>{complaint.category}</td>
                            <td>
                              <span className={`badge ${
                                complaint.status === 'Resolved' ? 'bg-success' :
                                complaint.status === 'In Progress' ? 'bg-warning' :
                                'bg-danger'
                              }`}>
                                {complaint.status}
                              </span>
                            </td>
                            <td>{formatDate(complaint.createdAt)}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setShowViewModal(true);
                                }}
                              >
                                View
                              </button>
                              {complaint.status !== 'Resolved' && (
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    setSelectedComplaint(complaint);
                                    setShowResolveModal(true);
                                  }}
                                >
                                  Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* View Complaint Modal */}
      {showViewModal && selectedComplaint && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-dark border-primary text-light">
              <div className="modal-header border-primary">
                <h5 className="modal-title">{selectedComplaint.title}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Student:</strong> {selectedComplaint.student?.name || 'Unknown'}</p>
                    <p><strong>Room:</strong> {selectedComplaint.student?.room || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Category:</strong> {selectedComplaint.category || 'N/A'}</p>
                    <p><strong>Date Submitted:</strong> {formatDate(selectedComplaint.createdAt)}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <h6>Description:</h6>
                  <p className="p-3 bg-secondary bg-opacity-25 rounded">{selectedComplaint.description || 'No description provided.'}</p>
                </div>
                <div className="mb-3">
                  <h6>Status:</h6>
                  <div className="d-flex gap-2 mb-3">
                    <button 
                      className={`btn ${selectedComplaint.status === 'Pending' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleStatusUpdate(selectedComplaint._id || selectedComplaint.id, 'Pending')}
                    >
                      Pending
                    </button>
                    <button 
                      className={`btn ${selectedComplaint.status === 'In Progress' ? 'btn-warning' : 'btn-outline-warning'}`}
                      onClick={() => handleStatusUpdate(selectedComplaint._id || selectedComplaint.id, 'In Progress')}
                    >
                      In Progress
                    </button>
                    <button 
                      className={`btn ${selectedComplaint.status === 'Resolved' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => {
                        if (selectedComplaint.status !== 'Resolved') {
                          setShowResolveModal(true);
                        }
                      }}
                    >
                      Resolved
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-primary">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                {selectedComplaint.status !== 'Resolved' && (
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => {
                      setShowResolveModal(true);
                    }}
                  >
                    <FaCheck className="me-1" />
                    Resolve Complaint
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Resolve Complaint Modal */}
      {showResolveModal && selectedComplaint && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content bg-dark border-primary text-light">
              <div className="modal-header border-primary">
                <h5 className="modal-title">Resolve Complaint</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowResolveModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="resolutionNotes" className="form-label">Resolution Notes</label>
                  <textarea
                    id="resolutionNotes"
                    className="form-control bg-dark text-light border-primary"
                    rows="4"
                    placeholder="Describe how the complaint was resolved..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-primary">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  disabled={!resolutionNotes.trim() || isProcessing}
                  onClick={handleResolveComplaint}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="fa-spin me-1" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-1" />
                      Mark as Resolved
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Backdrop */}
      {(showViewModal || showResolveModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
}