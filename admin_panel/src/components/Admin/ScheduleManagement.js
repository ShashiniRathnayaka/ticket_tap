import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './DriverManagement.css';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    route_id: '',
    bus_id: '',
    driver_id: '',
    departure_time: '',
    arrival_time: '',
    day_of_week: 'Daily'
  });

  const { user, logout } = useAuth();

  // Function to get auth headers with token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Function to handle token expiration
  const handleTokenExpiration = (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      alert('Your session has expired. Please login again.');
      logout();
      return true;
    }
    return false;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      const [schedulesRes, routesRes, busesRes, driversRes] = await Promise.all([
        axios.get('http://localhost:5000/schedules/getAllSchedules', getAuthHeaders()),
        axios.get('http://localhost:5000/routes/getAllRoutes', getAuthHeaders()),
        axios.get('http://localhost:5000/buses/getAllBuses', getAuthHeaders()),
        axios.get('http://localhost:5000/users/getAllDrivers', getAuthHeaders())
      ]);
      
      setSchedules(schedulesRes.data.schedules || []);
      setRoutes(routesRes.data.routes || []);
      setBuses(busesRes.data.buses || []);
      setDrivers(driversRes.data.drivers || []);
      setError('');
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      await axios.post('http://localhost:5000/schedules/add-schedule', formData, getAuthHeaders());
      alert('Schedule added successfully!');
      setShowAddModal(false);
      setFormData({
        route_id: '',
        bus_id: '',
        driver_id: '',
        departure_time: '',
        arrival_time: '',
        day_of_week: 'Daily'
      });
      fetchData();
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to add schedule';
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      await axios.put(
        `http://localhost:5000/schedules/updateSchedule/${selectedSchedule.id}`,
        formData,
        getAuthHeaders()
      );
      alert('Schedule updated successfully!');
      setShowEditModal(false);
      setSelectedSchedule(null);
      setFormData({
        route_id: '',
        bus_id: '',
        driver_id: '',
        departure_time: '',
        arrival_time: '',
        day_of_week: 'Daily'
      });
      fetchData();
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to update schedule';
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      route_id: schedule.route_id,
      bus_id: schedule.bus_id,
      driver_id: schedule.driver_id,
      departure_time: schedule.departure_time,
      arrival_time: schedule.arrival_time,
      day_of_week: schedule.day_of_week
    });
    setShowEditModal(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      await axios.delete(`http://localhost:5000/schedules/deleteSchedule/${scheduleId}`, getAuthHeaders());
      alert('Schedule deleted successfully!');
      fetchData();
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to delete schedule';
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedSchedule(null);
    setFormData({
      route_id: '',
      bus_id: '',
      driver_id: '',
      departure_time: '',
      arrival_time: '',
      day_of_week: 'Daily'
    });
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  if (loading && schedules.length === 0) {
    return <div className="loading">Loading schedules...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Schedule Management</h2>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Total Schedules:</span>
            <span className="stat-value">{schedules.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Available Routes:</span>
            <span className="stat-value">{routes.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Available Buses:</span>
            <span className="stat-value">{buses.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Available Drivers:</span>
            <span className="stat-value">{drivers.length}</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="panel-actions">
        <button 
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          + Add New Schedule
        </button>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Schedule</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleAddSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Route:</label>
                    <select
                      name="route_id"
                      value={formData.route_id}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Route</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.id}>
                          {route.route_name} ({route.start_location} - {route.end_location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Bus:</label>
                    <select
                      name="bus_id"
                      value={formData.bus_id}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Bus</option>
                      {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>
                          {bus.bus_number} - {bus.plate_number} ({bus.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Driver:</label>
                    <select
                      name="driver_id"
                      value={formData.driver_id}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.license_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Departure Time:</label>
                    <input
                      type="time"
                      name="departure_time"
                      value={formData.departure_time}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Arrival Time:</label>
                    <input
                      type="time"
                      name="arrival_time"
                      value={formData.arrival_time}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Day of Week:</label>
                    <select
                      name="day_of_week"
                      value={formData.day_of_week}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="Weekdays">Weekdays (Mon-Fri)</option>
                      <option value="Weekends">Weekends (Sat-Sun)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && selectedSchedule && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Schedule</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleEditSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Route:</label>
                    <select
                      name="route_id"
                      value={formData.route_id}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Route</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.id}>
                          {route.route_name} ({route.start_location} - {route.end_location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Bus:</label>
                    <select
                      name="bus_id"
                      value={formData.bus_id}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Bus</option>
                      {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>
                          {bus.bus_number} - {bus.plate_number} ({bus.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Driver:</label>
                    <select
                      name="driver_id"
                      value={formData.driver_id}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.license_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Departure Time:</label>
                    <input
                      type="time"
                      name="departure_time"
                      value={formData.departure_time}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Arrival Time:</label>
                    <input
                      type="time"
                      name="arrival_time"
                      value={formData.arrival_time}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Day of Week:</label>
                    <select
                      name="day_of_week"
                      value={formData.day_of_week}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="Weekdays">Weekdays (Mon-Fri)</option>
                      <option value="Weekends">Weekends (Sat-Sun)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3>Schedules List</h3>
          <span className="table-count">({schedules.length} schedules)</span>
        </div>
        
        {schedules.length === 0 ? (
          <div className="empty-state">
            <p>No schedules found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Bus</th>
                  <th>Driver</th>
                  <th>Departure Time</th>
                  <th>Arrival Time</th>
                  <th>Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>
                      {schedule.route_name || 'N/A'}
                      {schedule.start_location && schedule.end_location && 
                        ` (${schedule.start_location} - ${schedule.end_location})`}
                    </td>
                    <td>
                      {schedule.bus_number || 'N/A'}
                      {schedule.plate_number && ` - ${schedule.plate_number}`}
                    </td>
                    <td>{schedule.driver_name || 'N/A'}</td>
                    <td>{schedule.departure_time || 'N/A'}</td>
                    <td>{schedule.arrival_time || 'N/A'}</td>
                    <td>{schedule.day_of_week || 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => openEditModal(schedule)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement;