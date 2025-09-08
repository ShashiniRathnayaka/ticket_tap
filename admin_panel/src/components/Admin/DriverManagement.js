import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DriverManagement.css';
import { useAuth } from '../../context/AuthContext';

const DriverManagement = () => {
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

  const { user, logout } = useAuth();
  const API_BASE_URL = 'http://localhost:5000/users';

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

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/getAllDrivers`, getAuthHeaders());
      setDrivers(response.data.drivers);
      setError('');
    } catch (err) {
      if (!handleTokenExpiration(err)) {
        setError('Failed to fetch drivers');
        console.error('Error fetching drivers:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDrivers();
    }
  }, [user]);

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
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/add-driver`, 
        formData, 
        getAuthHeaders()
      );
      
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
      if (!handleTokenExpiration(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to add driver';
        setError(errorMessage);
        alert(`Error: ${errorMessage}`);
      }
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

  // const handleDeleteDriver = async (driverId) => {
  //   if (!window.confirm('Are you sure you want to delete this driver?')) {
  //     return;
  //   }

  //   try {
  //     const token = localStorage.getItem('token');
      
  //     if (!token) {
  //       alert('Please login again.');
  //       logout();
  //       return;
  //     }

  //     await axios.delete(`${API_BASE_URL}/deleteDriver/${driverId}`, getAuthHeaders());
  //     alert('Driver deleted successfully!');
  //     fetchDrivers();
  //   } catch (err) {
  //     if (!handleTokenExpiration(err)) {
  //       const errorMessage = err.response?.data?.message || 'Failed to delete driver';
  //       alert(`Error: ${errorMessage}`);
  //     }
  //   }
  // };

  // Show loading if no user data
  if (!user) {
    return <div className="loading">Loading...</div>;
  }

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
          <div className="stat-item">
            <span className="stat-label">Logged in as:</span>
            <span className="stat-value">{user.name} ({user.role})</span>
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
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
                      {/* <div className="action-buttons">
                        <button 
                          className="btn-danger"
                          onClick={() => handleDeleteDriver(driver.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div> */}
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

export default DriverManagement;