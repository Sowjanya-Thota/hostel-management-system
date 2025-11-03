import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/sidebar";
import {
  FaClipboardList,
  FaFilter,
  FaEye,
  FaTrash,
  FaSearch,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaUserCog,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  getComplaints,
  updateComplaintStatus,
  deleteComplaint,
} from "../../services/api";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "All",
    category: "All",
  });
  const [currentComplaint, setCurrentComplaint] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
  });

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await getComplaints(filters);
      console.log("Fetched complaints:", response.data);
      setComplaints(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load complaints. Please try again later.");
      console.error("Complaints fetch error:", err);
      // Set empty array to avoid undefined errors
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints based on search term
  const filteredComplaints = complaints.filter(
    (complaint) =>
      complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.student?.name &&
        complaint.student.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Open view modal
  const openViewModal = (complaint) => {
    setCurrentComplaint(complaint);
    setIsViewModalOpen(true);
  };

  // Open status update modal
  const openStatusModal = (complaint) => {
    setCurrentComplaint(complaint);
    setStatusUpdate({
      status: complaint.status || "Pending",
    });
    setIsStatusModalOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      await updateComplaintStatus(currentComplaint._id, statusUpdate);

      // Update complaints list
      setComplaints(
        complaints.map((c) =>
          c._id === currentComplaint._id
            ? {
                ...c,
                status: statusUpdate.status,
              }
            : c
        )
      );

      setIsStatusModalOpen(false);
      setError(null);
    } catch (err) {
      setError("Failed to update complaint status. Please try again later.");
      console.error("Status update error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete complaint
  const handleDeleteComplaint = async (id) => {
    try {
      setLoading(true);
      await deleteComplaint(id);

      // Update complaints list
      setComplaints(complaints.filter((c) => c._id !== id));

      setConfirmDelete(null);
      setError(null);
    } catch (err) {
      setError("Failed to delete complaint. Please try again later.");
      console.error("Delete complaint error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-warning";
      case "In Progress":
        return "bg-info";
      case "Resolved":
        return "bg-success";
      case "Rejected":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar role="admin" />

      <div className="main-content flex-grow-1">
        <Navbar />

        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <FaClipboardList className="me-2" /> Complaints Management
            </h2>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <FaExclamationTriangle className="me-2" />
              {error}
            </div>
          )}

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header ">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Filters</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() =>
                    setFilters({
                      status: "All",
                      category: "All",
                    })
                  }
                >
                  Reset Filters
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="All">All Categories</option>
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
                <div className="col-md-4 mb-3">
                  <label className="form-label">Search</label>
                  <div className="input-group">
                    <span className="input-group-text ">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {loading && complaints.length === 0 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading complaints...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
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
                      {filteredComplaints.length > 0 ? (
                        filteredComplaints.map((complaint) => (
                          <tr key={complaint._id}>
                            <td>{complaint.title}</td>
                            <td>{complaint.student?.name || "Unknown"}</td>
                            <td>{complaint.category}</td>
                            <td>
                              <span
                                className={`badge ${getStatusBadgeClass(complaint.status)}`}
                              >
                                {complaint.status || "Pending"}
                              </span>
                            </td>
                            <td>
                              {new Date(
                                complaint.createdAt
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => openViewModal(complaint)}
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => openStatusModal(complaint)}
                                  title="Update Status"
                                >
                                  <FaCheckCircle />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    setConfirmDelete(complaint._id)
                                  }
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            {searchTerm ||
                            filters.status !== "All" ||
                            filters.category !== "All"
                              ? "No complaints match your search or filters"
                              : "No complaints found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Complaint Modal */}
      {isViewModalOpen && currentComplaint && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complaint Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-8">
                    <h4>{currentComplaint.title}</h4>
                    <p className="text-muted">
                      <FaCalendarAlt className="me-2" />
                      Submitted on{" "}
                      {new Date(currentComplaint.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-md-4 text-end">
                    <span
                      className={`badge ${getStatusBadgeClass(currentComplaint.status)} fs-6 mb-2`}
                    >
                      {currentComplaint.status || "Pending"}
                    </span>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 ">
                      <div className="card-body">
                        <h6 className="card-title">Student Information</h6>
                        <p className="mb-1">
                          <strong>Name:</strong>{" "}
                          {currentComplaint.student?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 ">
                      <div className="card-body">
                        <h6 className="card-title">Complaint Information</h6>
                        <p className="mb-1">
                          <strong>Category:</strong> {currentComplaint.category}
                        </p>
                        {currentComplaint.respondedAt && (
                          <p className="mb-1">
                            <strong>Responded Date:</strong>{" "}
                            {new Date(
                              currentComplaint.respondedAt
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6>Description</h6>
                  <div className="p-3  rounded">
                    {currentComplaint.description}
                  </div>
                </div>

                {currentComplaint.response && (
                  <div className="mb-4">
                    <h6>Response</h6>
                    <div className="p-3  rounded">
                      {currentComplaint.response}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && currentComplaint && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Complaint Status</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsStatusModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={statusUpdate.status}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmDelete(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this complaint?</p>
                <p className="text-danger">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteComplaint(confirmDelete)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(isViewModalOpen || isStatusModalOpen || confirmDelete) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
}
