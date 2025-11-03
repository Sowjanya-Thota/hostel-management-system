import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import hostelImage from '../assets/hostel-image.jpeg';
import { FaUserGraduate, FaClipboardList, FaBell, FaShieldAlt } from 'react-icons/fa';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add animation effect when component mounts
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <FaUserGraduate size={30} />,
      title: "Student Management",
      description: "Efficiently manage student records, room allocations, and attendance tracking."
    },
    {
      icon: <FaClipboardList size={30} />,
      title: "Complaint System",
      description: "Streamlined process for students to register and track maintenance requests."
    },
    {
      icon: <FaBell size={30} />,
      title: "Notifications",
      description: "Real-time alerts and announcements for important hostel updates."
    },
    {
      icon: <FaShieldAlt size={30} />,
      title: "Security",
      description: "Enhanced security features with role-based access control."
    }
  ];

  return (
    <div className="home-page bg-dark text-light">
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mt-5 pt-5">
        <div className="row align-items-center">
          <div className={`col-md-6 ${isVisible ? 'fade-in-left' : 'opacity-0'}`} style={{ transition: 'all 0.8s ease-out' }}>
            <h1 className="display-4 fw-bold text-primary mb-2">Welcome to</h1>
            <h1 className="display-4 fw-bold mb-4">Hostel Management System</h1>
            <p className="lead mb-5 text-secondary">
              A comprehensive solution for managing hostel operations efficiently and effectively.
              Streamline your administrative tasks and enhance student experience.
            </p>
            <div className="d-grid gap-3 d-sm-flex">
              <Link to="/login" className="btn btn-primary btn-lg px-5 py-3 rounded-pill">
                Login
              </Link>
              <Link to="/register" className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill">
                Register
              </Link>
            </div>
          </div>
          
          <div className={`col-md-6 ${isVisible ? 'fade-in-right' : 'opacity-0'}`} style={{ transition: 'all 0.8s ease-out' }}>
            <div className="position-relative">
              <div className="position-absolute bg-primary rounded-circle" style={{ width: '300px', height: '300px', top: '-30px', right: '-30px', opacity: '0.2', zIndex: '0' }}></div>
              <img 
                src={hostelImage} 
                alt="Hostel" 
                className="img-fluid rounded-3 shadow-lg position-relative"
                style={{ maxHeight: '600px', width: '100%', objectFit: 'cover', zIndex: '1' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container mt-5 pt-5">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold">Key Features</h2>
          <p className="lead text-secondary">Discover what makes our system the perfect solution for your hostel</p>
        </div>
        
        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 bg-dark-secondary shadow-sm hover-card">
                <div className="card-body text-center p-4">
                  <div className="icon-box bg-primary bg-opacity-10 rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <span className="text-primary">{feature.icon}</span>
                  </div>
                  <h5 className="card-title mb-3">{feature.title}</h5>
                  <p className="card-text text-secondary">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container my-5 py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card border-0 bg-primary text-white shadow-lg rounded-3">
              <div className="card-body p-5">
                <div className="row align-items-center">
                  <div className="col-lg-8">
                    <h3 className="fw-bold mb-3">Ready to get started?</h3>
                    <p className="mb-lg-0">
                      Join our platform today and experience the benefits of a modern hostel management system.
                    </p>
                  </div>
                  <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
                    <Link to="/register" className="btn btn-light btn-lg px-4 py-2">
                      Sign Up Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-dark-secondary py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-0 text-secondary">© 2025 Hostel Management System. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0 text-secondary">
                {/* <Link to="/about" className="text-secondary text-decoration-none me-3">About</Link> */}
                {/* <Link to="/contact" className="text-secondary text-decoration-none me-3">Contact</Link>
                <Link to="/privacy" className="text-secondary text-decoration-none">Privacy Policy</Link> */}
              </p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* CSS for animations */}
      <style jsx="true">{`
        .fade-in-left {
          animation: fadeInLeft 1s ease-out;
        }
        
        .fade-in-right {
          animation: fadeInRight 1s ease-out;
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 10px 20px rgba(0, 123, 255, 0.1) !important;
        }
        
        .bg-dark-secondary {
          background-color: #212529;
        }
      `}</style>
    </div>
  );
}