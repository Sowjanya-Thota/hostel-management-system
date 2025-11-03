import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FaUtensils, FaCommentAlt, FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import { getMessMenu, submitMessFeedback } from '../../services/api';

export default function Mess() {
  const [activeTab, setActiveTab] = useState('menu');
  const [feedback, setFeedback] = useState('');
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    fetchMessMenu();
  }, []);

  const fetchMessMenu = async () => {
    try {
      setLoading(true);
      const response = await getMessMenu();
      setWeeklyMenu(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching mess menu:', err);
      setError('Failed to load mess menu. Please try again later.');
      // Set fallback menu if API fails
      setWeeklyMenu([
        { day: 'Monday', breakfast: 'Poha, Tea', lunch: 'Rice, Dal, Sabzi, Salad', dinner: 'Roti, Paneer Masala, Curd' },
        { day: 'Tuesday', breakfast: 'Sandwich, Milk, Fruits', lunch: 'Khichdi, Kadhi, Papad', dinner: 'Paratha, Butter, Pickle, Yogurt' },
        { day: 'Wednesday', breakfast: 'Idli, Sambar, Chutney', lunch: 'Jeera Rice, Rajma, Raita', dinner: 'Chole Bhature, Salad' },
        { day: 'Thursday', breakfast: 'Cornflakes, Milk, Toast', lunch: 'Fried Rice, Manchurian', dinner: 'Dal Tadka, Rice, Papad' },
        { day: 'Friday', breakfast: 'Paratha, Curd, Pickle', lunch: 'Biryani, Raita', dinner: 'Roti, Mix Veg, Dal' },
        { day: 'Saturday', breakfast: 'Dosa, Chutney, Sambar', lunch: 'Pulao, Chana Masala', dinner: 'Pav Bhaji, Buttermilk' },
        { day: 'Sunday', breakfast: 'Pancakes, Honey, Fruits', lunch: 'Thali (Roti, Rice, 3 Sabzis, Dessert)', dinner: 'Sandwich, Soup' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    
    try {
      setIsSubmitting(true);
      await submitMessFeedback({ feedback });
      setFeedback('');
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
      setError(null);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              <FaUtensils className="me-2" />
              Mess Information
            </h2>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {feedbackSuccess && (
              <div className="alert alert-success" role="alert">
                Your feedback has been submitted successfully!
              </div>
            )}
            
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'menu' ? 'active' : ''}`}
                  onClick={() => setActiveTab('menu')}
                >
                  <FaCalendarAlt className="me-2" />
                  Weekly Menu
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'feedback' ? 'active' : ''}`}
                  onClick={() => setActiveTab('feedback')}
                >
                  <FaCommentAlt className="me-2" />
                  Provide Feedback
                </button>
              </li>
            </ul>
            
            {activeTab === 'menu' && (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-5">
                      <FaSpinner className="fa-spin me-2" />
                      <p>Loading mess menu...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Day</th>
                            <th>Breakfast</th>
                            <th>Lunch</th>
                            <th>Dinner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyMenu.map((day, index) => (
                            <tr key={index}>
                              <td className="fw-bold">{day.day}</td>
                              <td>{day.breakfast}</td>
                              <td>{day.lunch}</td>
                              <td>{day.dinner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h5 className="mb-3">Mess Timings</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="card border-primary">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">Breakfast</h6>
                          </div>
                          <div className="card-body">
                            <p className="mb-0 text-center fw-bold">7:30 AM - 9:30 AM</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-success">
                          <div className="card-header bg-success text-white">
                            <h6 className="mb-0">Lunch</h6>
                          </div>
                          <div className="card-body">
                            <p className="mb-0 text-center fw-bold">12:30 PM - 2:30 PM</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-info">
                          <div className="card-header bg-info text-white">
                            <h6 className="mb-0">Dinner</h6>
                          </div>
                          <div className="card-body">
                            <p className="mb-0 text-center fw-bold">7:30 PM - 9:30 PM</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'feedback' && (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-4">Provide Feedback on Mess Food</h5>
                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="mb-3">
                      <label htmlFor="feedback" className="form-label">Your Feedback</label>
                      <textarea
                        id="feedback"
                        className="form-control"
                        rows="5"
                        placeholder="Share your thoughts, suggestions, or concerns about the mess food..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting || !feedback.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="fa-spin me-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}