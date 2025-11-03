import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar';
import { 
  FaLightbulb, 
  FaThumbsUp, 
  FaComment, 
  FaCheck, 
  FaTimes,
  FaSearch,
  FaFilter,
  FaUserAlt,
  FaExclamation,
  FaCalendarAlt,
  FaSpinner
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../services/authService';

export default function WardenSuggestions() {
  // State management
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All'
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
    implementationDate: ''
  });
  const [newComment, setNewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { currentUser } = useAuth();

  // Wrap fetchSuggestions in useCallback
  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      // Use the direct API call instead of the imported function
      const response = await api.get('/suggestions', {
        params: {
          status: filters.status !== 'All' ? filters.status : undefined,
          priority: filters.priority !== 'All' ? filters.priority : undefined
        }
      });
      
      // Format the suggestions data
      const formattedSuggestions = response.data.map(suggestion => ({
        _id: suggestion._id || '',
        title: suggestion.title || 'Untitled Suggestion',
        description: suggestion.description || '',
        category: suggestion.category || 'General',
        status: suggestion.status || 'Pending',
        priority: suggestion.priority || 'Medium',
        createdAt: suggestion.createdAt || new Date().toISOString(),
        student: suggestion.student ? {
          name: suggestion.student.name || 'Unknown Student',
          id: suggestion.student._id || ''
        } : { name: 'Unknown Student', id: '' },
        comments: suggestion.comments || [],
        upvotes: suggestion.upvotes || 0,
        wardenNotes: suggestion.wardenNotes || '',
        implementationDate: suggestion.implementationDate || ''
      }));
      
      setSuggestions(formattedSuggestions);
      setError(null);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority]);

  // Now use the memoized fetchSuggestions in useEffect
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesSearch = 
      (suggestion.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (suggestion.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Handle opening the details modal
  const handleViewDetails = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetailsModal(true);
  };

  // Handle opening the status update modal
  const handleOpenStatusModal = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setStatusUpdate({
      status: suggestion.status,
      notes: suggestion.wardenNotes || '',
      implementationDate: suggestion.implementationDate || ''
    });
    setShowStatusModal(true);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedSuggestion || !statusUpdate.status) return;
    
    setIsProcessing(true);
    
    try {
      await api.put(`/suggestions/${selectedSuggestion._id}/status`, {
        status: statusUpdate.status,
        wardenNotes: statusUpdate.notes,
        implementationDate: statusUpdate.implementationDate
      });
      
      // Update the local state
      const updatedSuggestions = suggestions.map(suggestion => 
        suggestion._id === selectedSuggestion._id ? {
          ...suggestion,
          status: statusUpdate.status,
          wardenNotes: statusUpdate.notes,
          implementationDate: statusUpdate.implementationDate
        } : suggestion
      );
      
      setSuggestions(updatedSuggestions);
      setShowStatusModal(false);
      setStatusUpdate({ status: '', notes: '', implementationDate: '' });
    } catch (err) {
      console.error('Error updating suggestion status:', err);
      alert('Failed to update suggestion status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add comment/response to a suggestion
  const addComment = async () => {
    if (!newComment.trim() || !selectedSuggestion) return;
    
    setIsProcessing(true);
    
    try {
      await api.post(`/suggestions/${selectedSuggestion._id}/comments`, {
        text: newComment
      });
      
      // Update the local state
      const updatedSuggestions = suggestions.map(suggestion => 
        suggestion._id === selectedSuggestion._id ? {
          ...suggestion,
          comments: [...(suggestion.comments || []), {
            text: newComment,
            user: currentUser._id,
            userName: currentUser.name,
            createdAt: new Date().toISOString()
          }]
        } : suggestion
      );
      
      setSuggestions(updatedSuggestions);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date for display
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

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="warden" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4 text-primary">
              <FaLightbulb className="me-2" /> Student Suggestions Management
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
                    <FaSearch className="text-primary" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-dark border-primary text-light"
                    placeholder="Search suggestions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <div className="dropdown">
                    <button className="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      <FaFilter className="me-1" /> Status: {filters.status}
                    </button>
                    <ul className="dropdown-menu bg-dark border-primary">
                      {['All', 'Pending', 'Under Review', 'Approved', 'Implemented', 'Rejected'].map(option => (
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
            
            {/* Suggestions Table */}
            <div className="card bg-dark border-primary mb-4">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Upvotes</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <FaSpinner className="fa-spin me-2" />
                            Loading suggestions...
                          </td>
                        </tr>
                      ) : filteredSuggestions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            No suggestions found.
                          </td>
                        </tr>
                      ) : (
                        filteredSuggestions.map(suggestion => (
                          <tr key={suggestion._id}>
                            <td>{suggestion.title}</td>
                            <td>{suggestion.student?.name || 'Unknown'}</td>
                            <td>
                              <span className={`badge ${
                                suggestion.status === 'Approved' || suggestion.status === 'Implemented' ? 'bg-success' :
                                suggestion.status === 'Under Review' ? 'bg-warning' :
                                suggestion.status === 'Rejected' ? 'bg-danger' :
                                'bg-info'
                              }`}>
                                {suggestion.status}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-primary">
                                <FaThumbsUp className="me-1" />
                                {suggestion.upvotes}
                              </span>
                            </td>
                            <td>{formatDate(suggestion.createdAt)}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => handleViewDetails(suggestion)}
                              >
                                View
                              </button>
                              <button 
                                className="btn btn-sm btn-warning"
                                onClick={() => handleOpenStatusModal(suggestion)}
                              >
                                Update
                              </button>
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
      
      {/* View Details Modal */}
      {showDetailsModal && selectedSuggestion && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-dark border-primary text-light">
              <div className="modal-header border-primary">
                <h5 className="modal-title">{selectedSuggestion.title}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Student:</strong> {selectedSuggestion.student?.name || 'Unknown'}</p>
                    <p><strong>Status:</strong> <span className={`badge ${
                      selectedSuggestion.status === 'Approved' || selectedSuggestion.status === 'Implemented' ? 'bg-success' :
                      selectedSuggestion.status === 'Under Review' ? 'bg-warning' :
                      selectedSuggestion.status === 'Rejected' ? 'bg-danger' :
                      'bg-info'
                    }`}>{selectedSuggestion.status}</span></p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Category:</strong> {selectedSuggestion.category || 'General'}</p>
                    <p><strong>Date Submitted:</strong> {formatDate(selectedSuggestion.createdAt)}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <h6>Description:</h6>
                  <p className="p-3 bg-secondary bg-opacity-25 rounded">{selectedSuggestion.description || 'No description provided.'}</p>
                </div>
                {selectedSuggestion.wardenNotes && (
                  <div className="mb-3">
                    <h6>Warden Notes:</h6>
                    <p className="p-3 bg-primary bg-opacity-25 rounded">{selectedSuggestion.wardenNotes}</p>
                  </div>
                )}
                {selectedSuggestion.implementationDate && (
                  <div className="mb-3">
                    <h6>Implementation Date:</h6>
                    <p>{formatDate(selectedSuggestion.implementationDate)}</p>
                  </div>
                )}
                <div className="mb-3">
                  <h6>Comments:</h6>
                  {selectedSuggestion.comments && selectedSuggestion.comments.length > 0 ? (
                    <div className="comments-section">
                      {selectedSuggestion.comments.map((comment, index) => (
                        <div key={index} className="comment p-2 mb-2 bg-secondary bg-opacity-25 rounded">
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold">{comment.userName || 'Unknown User'}</span>
                            <small>{formatDate(comment.createdAt)}</small>
                          </div>
                          <p className="mb-0 mt-1">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No comments yet.</p>
                  )}
                  <div className="mt-3">
                    <div className="input-group">
                      <textarea
                        className="form-control bg-dark text-light border-primary"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      ></textarea>
                      <button 
                        className="btn btn-primary"
                        disabled={!newComment.trim() || isProcessing}
                        onClick={addComment}
                      >
                        {isProcessing ? <FaSpinner className="fa-spin" /> : <FaComment />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-primary">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenStatusModal(selectedSuggestion);
                  }}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Update Status Modal */}
      {showStatusModal && selectedSuggestion && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content bg-dark border-primary text-light">
              <div className="modal-header border-primary">
                <h5 className="modal-title">Update Suggestion Status</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowStatusModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="statusSelect" className="form-label">Status</label>
                  <select
                    id="statusSelect"
                    className="form-select bg-dark text-light border-primary"
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Implemented">Implemented</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="wardenNotes" className="form-label">Notes</label>
                  <textarea
                    id="wardenNotes"
                    className="form-control bg-dark text-light border-primary"
                    rows="3"
                    placeholder="Add notes about this suggestion..."
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                  ></textarea>
                </div>
                {(statusUpdate.status === 'Approved' || statusUpdate.status === 'Implemented') && (
                  <div className="mb-3">
                    <label htmlFor="implementationDate" className="form-label">Implementation Date</label>
                    <input
                      type="date"
                      id="implementationDate"
                      className="form-control bg-dark text-light border-primary"
                      value={statusUpdate.implementationDate ? new Date(statusUpdate.implementationDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setStatusUpdate({...statusUpdate, implementationDate: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer border-primary">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  disabled={!statusUpdate.status || isProcessing}
                  onClick={handleStatusUpdate}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="fa-spin me-1" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-1" />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Backdrop */}
      {(showDetailsModal || showStatusModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
}