import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { 
  FaUserShield, 
  FaEdit, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff, 
  FaSearch,
  FaUserAlt,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaLock
} from 'react-icons/fa';
import { getWardens, createWarden, updateWarden, deleteWarden } from '../../services/api';

export default function AdminWardens() {
  const [wardens, setWardens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWarden, setCurrentWarden] = useState({
    id: null,
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    hostelBlock: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchWardens();
  }, []);

  const fetchWardens = async () => {
    try {
      setLoading(true);
      const response = await getWardens();
      setWardens(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load wardens. Please try again later.');
      console.error('Wardens fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter wardens based on search term
  const filteredWardens = wardens.filter(warden =>
    warden.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warden.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (warden.hostel && warden.hostel.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (warden.hostelBlock && warden.hostelBlock.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle input changes for form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentWarden({ ...currentWarden, [name]: value });
  };

  // Open modal for adding new warden
  const openAddModal = () => {
    setCurrentWarden({
      id: null,
      name: '',
      email: '',
      password: '',
      contactNumber: '',
      hostelBlock: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  // Open modal for editing warden
  const openEditModal = (warden) => {
    setCurrentWarden({
      id: warden.id,
      name: warden.name,
      email: warden.email,
      password: '',
      contactNumber: warden.phone || warden.contactNumber || '',
      hostelBlock: warden.hostel || warden.hostelBlock || '',
      status: warden.status || 'Active'
    });
    setIsModalOpen(true);
  };

  // Save warden (both add and edit)
  const saveWarden = async () => {
    try {
      if (!currentWarden.name || !currentWarden.email || !currentWarden.hostelBlock) {
        alert('Please fill in all required fields');
        return;
      }

      // For new wardens, password is required
      if (!currentWarden.id && !currentWarden.password) {
        alert('Password is required for new wardens');
        return;
      }

      setLoading(true);
      
      const wardenData = {
        name: currentWarden.name,
        email: currentWarden.email,
        contactNumber: currentWarden.contactNumber,
        hostelBlock: currentWarden.hostelBlock,
        status: currentWarden.status
      };

      // Add password only for new wardens
      if (!currentWarden.id) {
        wardenData.password = currentWarden.password;
      } else if (currentWarden.password) {
        // If editing and password is provided, include it
        wardenData.password = currentWarden.password;
      }

      let response;
      if (currentWarden.id) {
        // Update existing warden
        response = await updateWarden(currentWarden.id, wardenData);
        
        // Update wardens array
        setWardens(wardens.map(warden =>
          warden.id === currentWarden.id ? response.data : warden
        ));
      } else {
        // Add new warden
        response = await createWarden(wardenData);
        setWardens([...wardens, response.data]);
      }

      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      setError(`Failed to ${currentWarden.id ? 'update' : 'create'} warden. ${err.response?.data?.message || 'Please try again.'}`);
      console.error('Warden save error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete warden
  const handleDeleteWarden = async (id) => {
    try {
      setLoading(true);
      await deleteWarden(id);
      setWardens(wardens.filter(warden => warden.id !== id));
      setConfirmDelete(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete warden. Please try again later.');
      console.error('Warden delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle warden status
  const toggleStatus = async (warden) => {
    try {
      setLoading(true);
      const updatedStatus = warden.status === 'Active' ? 'Inactive' : 'Active';
      
      const response = await updateWarden(warden.id, { status: updatedStatus });
      
      // Use response data to ensure we have the latest state from server
      setWardens(wardens.map(w =>
        w.id === warden.id ? response.data : w
      ));
      
      setError(null);
    } catch (err) {
      setError('Failed to update warden status. Please try again later.');
      console.error('Warden status update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar role="admin" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><FaUserShield className="me-2" /> Warden Management</h2>
            <button className="btn btn-primary" onClick={openAddModal}>
              Add New Warden
            </button>
          </div>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              <FaExclamationTriangle className="me-2" />
              {error}
            </div>
          )}
          
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="input-group w-50">
                  <span className="input-group-text bg-white">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search wardens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {loading && wardens.length === 0 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading wardens...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Hostel Block</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWardens.length > 0 ? (
                        filteredWardens.map((warden) => (
                          <tr key={warden.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-light rounded-circle p-2 me-2">
                                  <FaUserShield />
                                </div>
                                {warden.name}
                              </div>
                            </td>
                            <td>{warden.email}</td>
                            <td>{warden.phone || warden.contactNumber || '-'}</td>
                            <td>
                              {warden.hostel || warden.hostelBlock 
                                ? `Block ${warden.hostel || warden.hostelBlock}` 
                                : '-'}
                            </td>
                            <td>
                              <span className={`badge ${warden.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                {warden.status || 'Active'}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => openEditModal(warden)}
                                  title="Edit Warden"
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setConfirmDelete(warden.id)}
                                  title="Delete Warden"
                                >
                                  <FaTrash />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => toggleStatus(warden)}
                                  title={warden.status === 'Active' ? 'Deactivate' : 'Activate'}
                                >
                                  {warden.status === 'Active' ? <FaToggleOn /> : <FaToggleOff />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            {searchTerm ? 'No wardens match your search' : 'No wardens found'}
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
      
      {/* Add/Edit Warden Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentWarden.id ? 'Edit Warden' : 'Add New Warden'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => { e.preventDefault(); saveWarden(); }}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><FaUserAlt /></span>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={currentWarden.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><FaEnvelope /></span>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={currentWarden.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Password {!currentWarden.id && <span className="text-danger">*</span>}
                      </label>
                      <div className="input-group">
                        <span className="input-group-text"><FaLock /></span>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={currentWarden.password}
                          onChange={handleInputChange}
                          required={!currentWarden.id}
                          placeholder={currentWarden.id ? "Leave blank to keep current password" : ""}
                        />
                      </div>
                      {currentWarden.id && (
                        <small className="text-muted">Leave blank to keep current password</small>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text"><FaPhone /></span>
                        <input
                          type="text"
                          className="form-control"
                          name="contactNumber"
                          value={currentWarden.contactNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Hostel Block <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><FaBuilding /></span>
                        <select
                          className="form-select"
                          name="hostelBlock"
                          value={currentWarden.hostelBlock}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Block</option>
                          <option value="A">Block A</option>
                          <option value="B">Block B</option>
                          <option value="C">Block C</option>
                          <option value="D">Block D</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          {currentWarden.status === 'Active' ? <FaCheck /> : <FaTimes />}
                        </span>
                        <select
                          className="form-select"
                          name="status"
                          value={currentWarden.status}
                          onChange={handleInputChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={saveWarden}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Warden'
                  )}
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
                <p>Are you sure you want to delete this warden? This action cannot be undone.</p>
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
                  onClick={() => handleDeleteWarden(confirmDelete)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Warden'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Backdrop */}
      {(isModalOpen || confirmDelete) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
}