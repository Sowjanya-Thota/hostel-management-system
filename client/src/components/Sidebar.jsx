import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../services/authService.jsx'
import { 
  FaTachometerAlt, 
  FaUtensils,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaLightbulb,
  FaFileInvoiceDollar,
  FaUsers,
  FaUserShield,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa'

export default function Sidebar({ role }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileView, setMobileView] = useState(false)
  
  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }
  
  const studentLinks = [
    { path: "/student/dashboard", name: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/student/mess", name: "Mess", icon: <FaUtensils /> },
    { path: "/student/attendance", name: "Attendance", icon: <FaCalendarCheck /> },
    { path: "/student/complaints", name: "Complaints", icon: <FaExclamationTriangle /> },
    { path: "/student/suggestions", name: "Suggestions", icon: <FaLightbulb /> },
    { path: "/student/invoices", name: "Invoices", icon: <FaFileInvoiceDollar /> },
  ]

  const wardenLinks = [
    { path: "/warden/dashboard", name: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/warden/complaints", name: "Complaints", icon: <FaExclamationTriangle /> },
    { path: "/warden/suggestions", name: "Suggestions", icon: <FaLightbulb /> },
    { path: "/warden/attendance", name: "Attendance", icon: <FaCalendarCheck /> },
  ]

  const adminLinks = [
    { path: "/admin/dashboard", name: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/admin/students", name: "Students", icon: <FaUsers /> },
    { path: "/admin/wardens", name: "Wardens", icon: <FaUserShield /> },
    { path: "/admin/complaints", name: "Complaints", icon: <FaExclamationTriangle /> },
  ]

  const links = role === 'student' ? studentLinks : 
                role === 'warden' ? wardenLinks : adminLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Create a style for the sidebar wrapper
  const sidebarWrapperStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: collapsed ? (mobileView ? '0' : '80px') : '250px',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    overflowY: 'auto'
  }

  // Create a style for the main sidebar content
  const sidebarStyle = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  }

  return (
    <>
      {/* This is a placeholder div that takes up space in the document flow */}
      <div style={{
        width: collapsed ? (mobileView ? '0' : '80px') : '250px',
        height: '100vh',
        flexShrink: 0,
        transition: 'all 0.3s ease'
      }}></div>
      
      {/* This is the actual fixed sidebar */}
      <div 
        className={`sidebar bg-dark text-light p-3 ${collapsed ? 'collapsed' : ''}`} 
        style={sidebarWrapperStyle}
      >
        <div style={sidebarStyle}>
          {/* Toggle Button for Mobile */}
          {mobileView && (
            <button 
              className="sidebar-toggle btn btn-dark" 
              onClick={toggleSidebar}
              style={{
                position: 'fixed',
                left: collapsed ? '10px' : '210px',
                top: '10px',
                zIndex: 1001
              }}
            >
              {collapsed ? <FaBars /> : <FaTimes />}
            </button>
          )}
          
          <div className="mb-4 mt-2 text-center">
            <h4 className={collapsed && !mobileView ? 'd-none' : ''}>
              {role.charAt(0).toUpperCase() + role.slice(1)} Panel
            </h4>
            {collapsed && !mobileView && (
              <div className="text-center">
                {role === 'student' ? 'S' : role === 'warden' ? 'W' : 'A'}
              </div>
            )}
          </div>
          
          <hr />
          
          <ul className="nav nav-pills flex-column mb-auto">
            {links.map((link, index) => (
              <li className="nav-item" key={index}>
                <Link 
                  to={link.path} 
                  className={`nav-link d-flex align-items-center ${location.pathname === link.path ? 'active' : ''}`}
                  title={collapsed && !mobileView ? link.name : ''}
                >
                  <span className={collapsed && !mobileView ? 'mx-auto' : 'me-3'}>
                    {link.icon}
                  </span>
                  {(!collapsed || mobileView) && link.name}
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Logout Button */}
          <div className="mt-auto pt-3 border-top">
            <button 
              onClick={handleLogout}
              className="nav-link d-flex align-items-center w-100 text-start p-2"
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer'
              }}
            >
              <span className={collapsed && !mobileView ? 'mx-auto' : 'me-3'}>
                <FaSignOutAlt />
              </span>
              {(!collapsed || mobileView) && 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}