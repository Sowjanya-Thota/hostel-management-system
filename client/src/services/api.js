import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      // You could also redirect to login page or clear token here
    } else if (error.response && 
               error.response.status === 400 && 
               error.response.data.actualRole) {
      // Handle role mismatch errors
      console.error('Role mismatch error:', error.response.data);
      // You could redirect to the correct login page or show a message
      // localStorage.setItem('suggestedRole', error.response.data.actualRole);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getCurrentUser = () => api.get('/auth/me');

// Student endpoints
export const getStudentDashboard = () => api.get('/dashboard/student/stats');
export const getStudentAttendance = (month, year) => api.get(`/attendance/my-attendance?month=${month}&year=${year}`);
export const getStudentComplaints = () => api.get('/complaints/my-complaints');
export const createStudentComplaint = (complaintData) => api.post('/complaints', complaintData);
export const deleteStudentComplaint = (id) => api.delete(`/complaints/${id}`);
export const getStudentInvoices = () => api.get('/invoices/my-invoices');
export const payInvoice = (id, paymentData) => api.post(`/invoices/${id}/pay`, paymentData);
export const downloadInvoice = (id) => api.get(`/invoices/${id}/download`, { 
  responseType: 'blob',
  headers: {
    'Accept': 'application/pdf'
  }
});
export const getInvoicePaymentHistory = (id) => api.get(`/invoices/${id}/payment-history`);
export const getMessMenu = () => api.get('/mess/menu');
export const submitMessFeedback = (feedbackData) => api.post('/mess/feedback', feedbackData);
export const getStudentSuggestions = () => api.get('/suggestions/my-suggestions');
export const deleteSuggestion = (id) => api.delete(`/suggestions/${id}`);
export const createSuggestion = (suggestionData) => api.post('/suggestions', suggestionData);
export const upvoteSuggestion = (id) => api.post(`/suggestions/${id}/upvote`);

// Admin endpoints
export const getAdminStats = () => api.get('/dashboard/admin/stats');
export const getWardens = () => api.get('/wardens');
export const getWarden = (id) => api.get(`/wardens/${id}`);
export const createWarden = (wardenData) => api.post('/wardens', wardenData);
export const updateWarden = (id, wardenData) => api.put(`/wardens/${id}`, wardenData);
export const deleteWarden = (id) => api.delete(`/wardens/${id}`);
export const getStudents = () => api.get('/students');
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (studentData) => api.post('/students', studentData);
export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const getAdminComplaints = () => api.get('/complaints/admin');
export const updateComplaintStatus = (id, statusData) => api.put(`/complaints/${id}/status`, statusData);
export const deleteComplaint = (id) => api.delete(`/complaints/admin/${id}`);
// Update the getComplaints function to use the correct endpoint
export const getComplaints = (filters) => {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters.status && filters.status !== 'All') queryParams.append('status', filters.status);
  if (filters.category && filters.category !== 'All') queryParams.append('category', filters.category);
  
  // Use the correct endpoint
  return api.get(`/complaints?${queryParams.toString()}`);
};
export const assignComplaint = (id, wardenId) => api.post(`/complaints/${id}/assign`, { wardenId });
export const respondToSuggestion = (id, response) => api.post(`/suggestions/${id}/respond`, { response });
export const getAdminSuggestions = () => api.get('/suggestions/admin');

// Warden endpoints
export const getWardenDashboardStats = () => api.get('/dashboard/warden');
export const getWardenComplaints = (filters) => api.get('/complaints/warden', { params: filters });
export const respondToComplaint = (id, response) => api.post(`/complaints/${id}/respond`, { response });
export const getWardenSuggestions = (filters) => api.get('/suggestions/warden', { params: filters });
export const updateSuggestionStatus = (id, statusData) => api.put(`/suggestions/${id}/status`, statusData);
export const getWardenAttendance = (date) => api.get('/attendance/warden', { params: { date } });
export const markAttendance = (attendanceData) => api.post('/attendance', attendanceData);
export const updateAttendance = (id, attendanceData) => api.put(`/attendance/${id}`, attendanceData);

// Adding missing endpoints used in Complaints.jsx
export const deleteComplaintWarden = (id) => api.delete(`/complaints/${id}`);
export const updateComplaintStatusWarden = (id, status) => api.put(`/complaints/${id}/status`, { status });
export const resolveComplaint = (id, resolution, resolvedBy) => api.put(`/complaints/${id}/resolve`, { resolution, resolvedBy });

// Adding endpoints for Warden Dashboard
export const getWardenDashboardData = () => api.get('/dashboard/warden/stats');
export const getWardenNotices = () => api.get('/notices/warden');
export const getWardenActivities = () => api.get('/activities/warden');
export const createWardenNotice = (noticeData) => api.post('/notices/warden', noticeData);
export const registerWardenComplaint = (complaintData) => api.post('/complaints/warden/register', complaintData);
export const issueWarning = (warningData) => api.post('/warnings', warningData);
export const scheduleInspection = (inspectionData) => api.post('/inspections', inspectionData);

export const getNotices = () => api.get('/notices');
export const createNotice = (noticeData) => api.post('/notices', noticeData);
export const updateNotice = (id, noticeData) => api.put(`/notices/${id}`, noticeData);
export const deleteNotice = (id) => api.delete(`/notices/${id}`);

// Mess endpoints
export const updateMessMenu = (menuData) => api.put('/mess/menu', menuData);
export const getMessFeedback = () => api.get('/mess/feedback');


// Enhanced Invoice endpoints
export const getInvoices = (params = {}) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (invoiceData) => api.post('/invoices', invoiceData);
export const updateInvoice = (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
export const generateBulkInvoices = (invoiceData) => api.post('/invoices/bulk', invoiceData);
export const sendInvoiceReminder = (id) => api.post(`/invoices/${id}/reminder`);
export const getInvoiceStatistics = () => api.get('/invoices/statistics');
export const exportInvoices = (params = {}) => api.get('/invoices/export', {
  params,
  responseType: 'blob'
});

// Attendance endpoints
export const getStudentsList = () => api.get('/students/list');
export const getAttendanceRecords = (studentId, month, year) => api.get(`/attendance/records/${studentId}`, { params: { month, year } });
export const getAttendanceStats = (month, year) => api.get('/attendance/stats', { params: { month, year } });
export const updateAttendanceRecord = (studentId, recordId, recordData) => api.put(`/attendance/records/${studentId}/${recordId}`, recordData);
export const exportAttendanceData = (studentId, month, year) => api.get('/attendance/export', { 
  params: { studentId, month, year },
  responseType: 'blob' // Important for file downloads
});
export const getBulkAttendance = (date) => api.get('/attendance/bulk', { params: { date } });
export const markBulkAttendance = (attendanceData) => api.post('/attendance/bulk', attendanceData);
export const getAttendanceByDateRange = (startDate, endDate, studentId) => api.get('/attendance/range', { 
  params: { startDate, endDate, studentId } 
});
export const getAttendanceByBlock = (block, date) => api.get('/attendance/block', { params: { block, date } });

// Additional complaint endpoints from enhanced route
export const getComplaintById = (id) => api.get(`/complaints/${id}`);
export const assignComplaintToSelf = (id) => api.put(`/complaints/${id}/assign`, {});
export const assignComplaintToUser = (id, assigneeId) => api.put(`/complaints/${id}/assign`, { assigneeId });
export const getComplaintStatistics = () => api.get('/complaints/stats/summary');

// Profile endpoints
export const getUserProfile = () => api.get('/profile');
export const updateUserProfile = (profileData) => api.put('/profile', profileData);
export const changePassword = (passwordData) => api.put('/profile/password', passwordData);
export const uploadProfilePicture = (formData) => api.post('/profile/picture', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export default api;