import Navbar from '../components/Navbar'
import { FaUser } from 'react-icons/fa'

const teamMembers = [
  {
    name: "Lakshmi Prasanna",
    role: "Frontend Developer",
    bio: "Responsible for UI/UX design and implementation"
  },
  {
    name: "Sowjanya Thota",
    role: "Backend Developer",
    bio: "Handles server-side logic and database management"
  },
  {
    name: "G.L.N Saradhi",
    role: "Project Manager",
    bio: "Oversees project timelines and coordination"
  },
  {
    name: "Monika",
    role: "Quality Assurance",
    bio: "Ensures system reliability and bug-free experience"
  }
]

export default function About() {
  return (
    <div>
      <Navbar />
      <div className="container py-5">
        <h1 className="text-center mb-5">Our Team</h1>
        <div className="row">
          {teamMembers.map((member, index) => (
            <div className="col-md-3 mb-4" key={index}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="d-flex justify-content-center align-items-center bg-light rounded-circle mx-auto mt-4" 
                     style={{
                       width: '120px', 
                       height: '120px',
                       border: '1px solid #dee2e6'
                     }}>
                  <FaUser size={48} className="text-secondary" />
                </div>
                <div className="card-body text-center">
                  <h5 className="card-title fw-bold">{member.name}</h5>
                  <h6 className="card-subtitle mb-3 text-muted">{member.role}</h6>
                  <p className="card-text text-secondary">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}