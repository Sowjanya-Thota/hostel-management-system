import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../services/authService.jsx'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      // Log the exact data being sent
      const loginData = {
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      console.log("Submitting login form with:", JSON.stringify(loginData));
      
      // Call the login method from useAuth
      const response = await login(loginData);
      
      console.log("Login successful:", response);
      
      // Redirect based on user.role from the response, not formData
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard')
      } else if (response.user.role === 'warden') {
        navigate('/warden/dashboard')
      } else {
        navigate('/student/dashboard')
      }

    } catch (error) {
      console.error("Login component error:", error);
      // Display a more specific error message if available
      if (error.message) {
        setError(error.message);
      } else if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Login failed. Please check your credentials or try again later.');
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body">
                <h2 className="text-center mb-4">Hostel Login</h2>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">Login As</label>
                    <select
                      className="form-select"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="student">Student</option>
                      <option value="warden">Warden</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
                <div className="mt-3 text-center">
                  <p>Don't have an account? <Link to="/register">Register</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}