import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DriverManagement.css';

const DriveManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    nic: '',
    driving_licence_number: '',
    experience_years: '',
    mobile_number: ''
  });

  const API_BASE_URL = 'http://localhost:5000/users';

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/getAllDrivers`);
      setDrivers(response.data.drivers);
      setError('');
    } catch (err) {
      setError('Failed to fetch drivers');
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/add-driver`, formData);
      
      if (response.status === 201) {
        alert('Driver added successfully!');
        setFormData({
          name: '',
          email: '',
          password: '',
          nic: '',
          driving_licence_number: '',
          experience_years: '',
          mobile_number: ''
        });
        setShowAddModal(false);
        fetchDrivers();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add driver';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      nic: '',
      driving_licence_number: '',
      experience_years: '',
      mobile_number: ''
    });
  };

  if (loading && drivers.length === 0) {
    return <div className="loading">Loading drivers...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Driver Management</h2>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Total Drivers:</span>
            <span className="stat-value">{drivers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Drivers:</span>
            <span className="stat-value">
              {drivers.filter(d => d.status === 'ACTIVE').length}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="panel-actions">
        <button 
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Driver
        </button>
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Driver</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>NIC:</label>
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Driving Licence Number:</label>
                    <input
                      type="text"
                      name="driving_licence_number"
                      value={formData.driving_licence_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Experience (Years):</label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number:</label>
                    <input
                      type="tel"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Driver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3>Drivers List</h3>
          <span className="table-count">({drivers.length} drivers)</span>
        </div>
        
        {drivers.length === 0 ? (
          <div className="empty-state">
            <p>No drivers found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>NIC</th>
                  <th>Mobile</th>
                  <th>Licence No</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>{driver.name}</td>
                    <td>{driver.email}</td>
                    <td>{driver.nic}</td>
                    <td>{driver.mobile_number}</td>
                    <td>{driver.driving_licence_number}</td>
                    <td>{driver.experience_years} years</td>
                    <td>
                      <span className={`status-badge ${driver.status.toLowerCase()}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-danger">Delete</button>
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

export default DriveManagement;