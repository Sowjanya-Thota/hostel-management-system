import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar';
import { FaLightbulb, FaPlus, FaSpinner, FaSearch, FaEye, FaTrash } from 'react-icons/fa';
import { getStudentSuggestions, createSuggestion, deleteSuggestion } from '../../services/api';

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [newSuggestion, setNewSuggestion] = useState({        
    title: '',
    description: '',
    category: 'Facilities'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // Track which suggestion is being deleted
  const [deleteError, setDeleteError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetchSuggestions();
    } else {
      setError('You must be logged in to view suggestions');
      setLoading(false);
    }
  }, [retryCount]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      console.log('Fetching suggestions...');
      const response = await getStudentSuggestions();
      console.log('Suggestions response:', response.data);
      setSuggestions(response.data);
      setError(null);
      setDeleteError(null);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      if (err.response) {
        console.log('Error response:', err.response.status, err.response.data);
        // Handle specific status codes
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(`Failed to load suggestions: ${err.response.data.message || 'Server error'}`);
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load suggestions. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await createSuggestion(newSuggestion);
      console.log('Suggestion created:', response.data);
      setSuggestions([response.data, ...suggestions]);
      setNewSuggestion({
        title: '',
        description: '',
        category: 'Facilities'
      });
      setShowNewModal(false);
      setError(null);
    } catch (err) {
      console.error('Error creating suggestion:', err);
      if (err.response) {
        setError(`Failed to submit suggestion: ${err.response.data.message || 'Server error'}`);
      } else {
        setError('Failed to submit suggestion. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowViewModal(true);
  };

  const handleDeleteSuggestion = async (suggestionId) => {
    try {
      setDeletingId(suggestionId);
      setDeleteError(null);
      
      console.log(`Deleting suggestion with ID: ${suggestionId}`);
      await deleteSuggestion(suggestionId);
      
      // Remove from state after successful deletion
      setSuggestions(suggestions.filter(suggestion => suggestion._id !== suggestionId));
      setDeletingId(null);
      
      // Close view modal if the deleted suggestion was being viewed
      if (selectedSuggestion && selectedSuggestion._id === suggestionId) {
        setShowViewModal(false);
      }
    } catch (err) {
      console.error('Error deleting suggestion:', err);
      setDeleteError(
        err.response?.data?.message || 
        'Failed to delete suggestion. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'under review': return 'bg-info';
      case 'approved': return 'bg-success';
      case 'implemented': return 'bg-primary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="student" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4">
              <FaLightbulb className="me-2" />
              Suggestions
            </h2>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
                <button 
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </div>
            )}

            {deleteError && (
              <div className="alert alert-warning" role="alert">
                {deleteError}
                <button 
                  className="btn btn-sm btn-outline-secondary ms-3"
                  onClick={() => setDeleteError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}
            
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-dark">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search suggestions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowNewModal(true)}
                >
                  <FaPlus className="me-2" />
                  New Suggestion
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <FaSpinner className="fa-spin me-2" />
                <p>Loading suggestions...</p>
              </div>
            ) : (
              <div className="row">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((suggestion) => (
                    <div className="col-md-6 mb-4" key={suggestion._id}>
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-light text-dark">
                              {suggestion.category}
                            </span>
                            <span className={`badge ${getStatusBadgeClass(suggestion.status)}`}>
                              {suggestion.status || 'Pending'}
                            </span>
                          </div>
                          <h5 className="card-title">{suggestion.title}</h5>
                          <p className="card-text text-muted">
                            {suggestion.description}
                          </p>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleViewSuggestion(suggestion)}
                              >
                                <FaEye className="me-1" /> View
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger ms-2"
                                onClick={() => handleDeleteSuggestion(suggestion._id)}
                                disabled={deletingId === suggestion._id}
                              >
                                {deletingId === suggestion._id ? (
                                  <><FaSpinner className="fa-spin me-1" /> Deleting...</>
                                ) : (
                                  <><FaTrash className="me-1" /> Delete</>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {suggestion.adminResponse && (
                            <div className="mt-3 p-3 bg-light rounded">
                              <p className="mb-1"><strong>Admin Response:</strong></p>
                              <p className="mb-0">{suggestion.adminResponse}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5">
                    <p className="text-muted">
                      {searchTerm ? 'No suggestions match your search' : 'No suggestions found'}
                    </p>
                    <button 
                      className="btn btn-primary mt-3"
                      onClick={() => setShowNewModal(true)}
                    >
                      <FaPlus className="me-2" />
                      Add Your First Suggestion
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* New Suggestion Modal */}
      {showNewModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Suggestion</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNewModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSuggestion.title}
                      onChange={(e) => setNewSuggestion({...newSuggestion, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newSuggestion.category}
                      onChange={(e) => setNewSuggestion({...newSuggestion, category: e.target.value})}
                      required
                    >
                      <option value="Facilities">Facilities</option>
                      <option value="Mess">Mess</option>
                      <option value="Security">Security</option>
                      <option value="Cleanliness">Cleanliness</option>
                      <option value="Activities">Activities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={newSuggestion.description}
                      onChange={(e) => setNewSuggestion({...newSuggestion, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowNewModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="fa-spin me-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Suggestion'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* View Suggestion Modal */}
      {showViewModal && selectedSuggestion && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Suggestion Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <h5>{selectedSuggestion.title}</h5>
                <div className="d-flex justify-content-between mb-3">
                  <span className="badge bg-secondary">{selectedSuggestion.category}</span>
                  <span className={`badge ${getStatusBadgeClass(selectedSuggestion.status)}`}>
                    {selectedSuggestion.status || 'Pending'}
                  </span>
                </div>
                <p className="text-muted small">
                  Submitted on: {new Date(selectedSuggestion.createdAt).toLocaleString()}
                </p>
                <div className="card mb-3">
                  <div className="card-body">
                    <p className="mb-0">{selectedSuggestion.description}</p>
                  </div>
                </div>
                
                {selectedSuggestion.adminResponse && (
                  <div>
                    <h6 className="text-primary">Admin Response:</h6>
                    <div className="card bg-light">
                      <div className="card-body">
                        <p className="mb-0">{selectedSuggestion.adminResponse}</p>
                        {selectedSuggestion.respondedAt && (
                          <small className="text-muted">
                            Responded on: {new Date(selectedSuggestion.respondedAt).toLocaleString()}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => {
                    handleDeleteSuggestion(selectedSuggestion._id);
                  }}
                  disabled={deletingId === selectedSuggestion._id}
                >
                  {deletingId === selectedSuggestion._id ? (
                    <><FaSpinner className="fa-spin me-1" /> Deleting...</>
                  ) : (
                    <><FaTrash className="me-1" /> Delete Suggestion</>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Backdrop */}
      {(showNewModal || showViewModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
}