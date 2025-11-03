import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FaExclamationCircle, FaPlus, FaSearch, FaTrash, FaSpinner, FaEye } from 'react-icons/fa';
import { getStudentComplaints, createStudentComplaint, deleteStudentComplaint } from '../../services/api';

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({ title: '', category: 'Housekeeping', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await getStudentComplaints();
      setComplaints(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load complaints. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await createStudentComplaint(newComplaint);
      setComplaints([response.data, ...complaints]);
      setNewComplaint({ title: '', category: 'Housekeeping', description: '' });
      setShowNewModal(false);
      setError(null);
    } catch (error) {
      console.error('Error creating complaint:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create complaint. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (id) => {
    try {
      setIsSubmitting(true);
      // Check if token exists before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        return;
      }
      
      console.log('Attempting to delete complaint with ID:', id);
      await deleteStudentComplaint(id);
      
      setComplaints(complaints.filter(complaint => complaint._id !== id));
      setShowViewModal(false);
      setShowDeleteConfirm(false);
      setError(null);
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(`Failed to delete complaint: ${error.response.data.message || error.response.statusText}`);
      } else {
        setError('Failed to delete complaint. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-secondary';
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-warning';
      case 'in progress': return 'bg-info';
      case 'resolved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="student" />
      <div className="main-content flex-grow-1">
        <Navbar />
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4 text-secondary">
              <FaExclamationCircle className="me-2" />My Complaints
            </h2>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-dark"><FaSearch /></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search complaints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                  <FaPlus className="me-2" /> New Complaint
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-5">
                <FaSpinner className="fa-spin me-2" />
                <p>Loading complaints...</p>
              </div>
            ) : (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComplaints.length > 0 ? (
                          filteredComplaints.map((complaint) => (
                            <tr key={complaint._id}>
                              <td>{complaint.title}</td>
                              <td>{complaint.category}</td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(complaint.status)}`}>
                                  {complaint.status || 'Pending'}
                                </span>
                              </td>
                              <td>{formatDate(complaint.createdAt)}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => {
                                    setSelectedComplaint(complaint);
                                    setShowViewModal(true);
                                  }}
                                >
                                  <FaEye /> View
                                </button>
                                {(!complaint.status || complaint.status === 'Pending') && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => {
                                      setSelectedComplaint(complaint);
                                      setShowDeleteConfirm(true);
                                    }}
                                  >
                                    <FaTrash /> Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              {searchTerm ? 'No complaints match your search' : 'No complaints found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showNewModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Complaint</h5>
                <button type="button" className="btn-close" onClick={() => setShowNewModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newComplaint.title}
                      onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newComplaint.category}
                      onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                      required
                    >
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Internet">Internet</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Security">Security</option>
                      <option value="Mess">Mess</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={newComplaint.description}
                      onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="fa-spin me-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Complaint'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showViewModal && selectedComplaint && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complaint Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h5>{selectedComplaint.title}</h5>
                  <span className={`badge ${getStatusBadgeClass(selectedComplaint.status)} me-2`}>
                    {selectedComplaint.status || 'Pending'}
                  </span>
                  <small className="text-muted">
                    Submitted on {formatDate(selectedComplaint.createdAt)}
                  </small>
                </div>
                <div className="mb-3">
                  <label className="fw-bold">Category:</label>
                  <p>{selectedComplaint.category}</p>
                </div>
                <div className="mb-3">
                  <label className="fw-bold">Description:</label>
                  <p className="border rounded p-3 ">{selectedComplaint.description}</p>
                </div>
                {selectedComplaint.response && (
                  <div className="mb-3">
                    <label className="fw-bold">Response:</label>
                    <p className="border rounded p-3 bg-light">{selectedComplaint.response}</p>
                    {selectedComplaint.respondedAt && (
                      <small className="text-muted">
                        Responded on {formatDate(selectedComplaint.respondedAt)}
                      </small>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
                {(!selectedComplaint.status || selectedComplaint.status === 'Pending') && (
                  <button type="button" className="btn btn-danger" onClick={() => {
                    setShowViewModal(false);
                    setShowDeleteConfirm(true);
                  }}>
                    <FaTrash className="me-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && selectedComplaint && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this complaint?</p>
                <p className="fw-bold">{selectedComplaint.title}</p>
                <p className="text-danger">
                  <FaExclamationCircle className="me-2" />
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleDeleteComplaint(selectedComplaint._id)} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Complaint'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {(showNewModal || showViewModal || showDeleteConfirm) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}
export default Complaints;
