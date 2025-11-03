import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar';
import { 
  FaUsers, 
  FaEdit, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff, 
  FaSearch,
  FaUserAlt,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaIdCard,
  FaBuilding
} from 'react-icons/fa';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../services/api';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState({
    id: null,
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    roomNumber: '',
    hostelBlock: '',
    contactNumber: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getStudents();
      setStudents(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load students. Please try again later.');
      console.error('Students fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.room && student.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle input changes for form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentStudent({ ...currentStudent, [name]: value });
  };

  // Open modal for adding new student
  const openAddModal = () => {
    setCurrentStudent({
      id: null,
      name: '',
      email: '',
      password: '',
      rollNumber: '',
      roomNumber: '',
      hostelBlock: '',
      contactNumber: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  // Open modal for editing student
  const openEditModal = (student) => {
    setCurrentStudent({
      id: student.id,
      name: student.name,
      email: student.email,
      password: '',
      rollNumber: student.rollNumber || '',
      roomNumber: student.room ? student.room.split('-')[1] : '',
      hostelBlock: student.hostelBlock || (student.room ? student.room.split('-')[0] : ''),
      contactNumber: student.phone || '',
      status: student.status
    });
    setIsModalOpen(true);
  };

  // Save student (both add and edit)
  const saveStudent = async () => {
    try {
      if (!currentStudent.name || !currentStudent.email || !currentStudent.rollNumber || 
          !currentStudent.roomNumber || !currentStudent.hostelBlock) {
        alert('Please fill in all required fields');
        return;
      }

      // For new students, password is required
      if (!currentStudent.id && !currentStudent.password) {
        alert('Password is required for new students');
        return;
      }

      setLoading(true);
      
      const studentData = {
        name: currentStudent.name,
        email: currentStudent.email,
        rollNumber: currentStudent.rollNumber,
        roomNumber: currentStudent.roomNumber,
        hostelBlock: currentStudent.hostelBlock,
        contactNumber: currentStudent.contactNumber,
        status: currentStudent.status
      };

      // Add password only for new students
      if (!currentStudent.id) {
        studentData.password = currentStudent.password;
      }

      let response;
      if (currentStudent.id) {
        // Update existing student
        response = await updateStudent(currentStudent.id, studentData);
        
        // Update students array
        setStudents(students.map(student =>
          student.id === currentStudent.id ? response.data : student
        ));
      } else {
        // Add new student
        response = await createStudent(studentData);
        setStudents([...students, response.data]);
      }

      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      setError(`Failed to ${currentStudent.id ? 'update' : 'create'} student. ${err.response?.data?.message || 'Please try again.'}`);
      console.error('Student save error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async (id) => {
    try {
      setLoading(true);
      await deleteStudent(id);
      setStudents(students.filter(student => student.id !== id));
      setConfirmDelete(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete student. Please try again later.');
      console.error('Student delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle student status
  const toggleStatus = async (student) => {
    try {
      setLoading(true);
      const updatedStatus = student.status === 'Active' ? 'Inactive' : 'Active';
      
await updateStudent(student.id, { status: updatedStatus });
      
      setStudents(students.map(s =>
        s.id === student.id ? { ...s, status: updatedStatus } : s
      ));
      
      setError(null);
    } catch (err) {
      setError('Failed to update student status. Please try again later.');
      console.error('Student status update error:', err);
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
            <h2><FaUsers className="me-2" /> Student Management</h2>
            <button className="btn btn-primary" onClick={openAddModal}>
              Add New Student
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
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {loading && students.length === 0 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading students...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll Number</th>
                        <th>Email</th>
                        <th>Room</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-light rounded-circle p-2 me-2">
                                  <FaUserAlt />
                                </div>
                                {student.name}
                              </div>
                            </td>
                            <td>{student.rollNumber}</td>
                            <td>{student.email}</td>
                            <td>{student.room || `${student.hostelBlock}-${student.roomNumber}`}</td>
                            <td>{student.phone || student.contactNumber}</td>
                            <td>
                              <span className={`badge ${student.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                {student.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => openEditModal(student)}
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setConfirmDelete(student.id)}
                                >
                                  <FaTrash />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => toggleStatus(student)}
                                >
                                  {student.status === 'Active' ? <FaToggleOn /> : <FaToggleOff />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">
                            {searchTerm ? 'No students match your search' : 'No students found'}
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
      
      {/* Add/Edit Student Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentStudent.id ? 'Edit Student' : 'Add New Student'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><FaUserAlt /></span>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={currentStudent.name}
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
                          value={currentStudent.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {!currentStudent.id && (
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Password <span className="text-danger">*</span></label>
                        <div className="input-group">
                          <span className="input-group-text"><FaUserAlt /></span>
                          <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={currentStudent.password}
                            onChange={handleInputChange}
                            required={!currentStudent.id}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Roll Number <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><FaIdCard /></span>
                        <input
                          type="text"
                          className="form-control"
                          name="rollNumber"
                          value={currentStudent.rollNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text"><FaPhone /></span>
                        <input
                          type="text"
                          className="form-control"
                          name="contactNumber"
                          value={currentStudent.contactNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Hostel Block <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><FaBuilding /></span>
                        <select
                          className="form-select"
                          name="hostelBlock"
                          value={currentStudent.hostelBlock}
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
                    <div className="col-md-4">
                      <label className="form-label">Room Number <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><FaHome /></span>
                        <input
                          type="text"
                          className="form-control"
                          name="roomNumber"
                          value={currentStudent.roomNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          {currentStudent.status === 'Active' ? <FaCheck /> : <FaTimes />}
                        </span>
                        <select
                          className="form-select"
                          name="status"
                          value={currentStudent.status}
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
                  onClick={saveStudent}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Student'
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
                <p>Are you sure you want to delete this student? This action cannot be undone.</p>
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
                  onClick={() => handleDeleteStudent(confirmDelete)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Student'
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