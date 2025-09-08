import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DriverManagement.css';
import { useAuth } from '../../context/AuthContext';

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [formData, setFormData] = useState({
    bus_number: '',
    plate_number: '',
    capacity: '',
    bus_type: '',
    status: 'ACTIVE'
  });

  const { user, logout } = useAuth();
  const API_BASE_URL = 'http://localhost:5000/buses';

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

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/getAllBuses`, getAuthHeaders());
      setBuses(response.data.buses);
      setError('');
    } catch (err) {
      if (!handleTokenExpiration(err)) {
        setError('Failed to fetch buses');
        console.error('Error fetching buses:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBuses();
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

      const response = await axios.post(
        `${API_BASE_URL}/add-bus`, 
        formData, 
        getAuthHeaders()
      );
      
      if (response.status === 201) {
        alert('Bus added successfully!');
        setFormData({
          bus_number: '',
          plate_number: '',
          capacity: '',
          bus_type: '',
          status: 'ACTIVE'
        });
        setShowAddModal(false);
        fetchBuses();
      }
    } catch (err) {
      if (!handleTokenExpiration(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to add bus';
        setError(errorMessage);
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

      const response = await axios.put(
        `${API_BASE_URL}/updateBus/${selectedBus.id}`, 
        formData, 
        getAuthHeaders()
      );
      
      if (response.status === 200) {
        alert('Bus updated successfully!');
        setShowEditModal(false);
        setSelectedBus(null);
        setFormData({
          bus_number: '',
          plate_number: '',
          capacity: '',
          bus_type: '',
          status: 'ACTIVE'
        });
        fetchBuses();
      }
    } catch (err) {
      if (!handleTokenExpiration(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to update bus';
        setError(errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (bus) => {
    setSelectedBus(bus);
    setFormData({
      bus_number: bus.bus_number,
      plate_number: bus.plate_number,
      capacity: bus.capacity,
      bus_type: bus.bus_type,
      status: bus.status
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedBus(null);
    setFormData({
      bus_number: '',
      plate_number: '',
      capacity: '',
      bus_type: '',
      status: 'ACTIVE'
    });
  };

  const handleDeleteBus = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      await axios.delete(`${API_BASE_URL}/deleteBus/${busId}`, getAuthHeaders());
      alert('Bus deleted successfully!');
      fetchBuses();
    } catch (err) {
      if (!handleTokenExpiration(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to delete bus';
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  // Show loading if no user data
  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  if (loading && buses.length === 0) {
    return <div className="loading">Loading buses...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Bus Management</h2>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Total Buses:</span>
            <span className="stat-value">{buses.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Buses:</span>
            <span className="stat-value">
              {buses.filter(b => b.status === 'ACTIVE').length}
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
          + Add New Bus
        </button>
      </div>

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Bus</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleAddSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bus Number:</label>
                    <input
                      type="text"
                      name="bus_number"
                      value={formData.bus_number}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder="B001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Plate Number:</label>
                    <input
                      type="text"
                      name="plate_number"
                      value={formData.plate_number}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder="ABC123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity:</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      min="1"
                      disabled={loading}
                      placeholder="40"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bus Type:</label>
                    <select
                      name="bus_type"
                      value={formData.bus_type}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Type</option>
                      <option value="AC">AC</option>
                      <option value="Non-AC">Non-AC</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Semi-Luxury">Semi-Luxury</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status:</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="INACTIVE">Inactive</option>
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
                    {loading ? 'Adding...' : 'Add Bus'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {showEditModal && selectedBus && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Bus</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleEditSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bus Number:</label>
                    <input
                      type="text"
                      name="bus_number"
                      value={formData.bus_number}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Plate Number:</label>
                    <input
                      type="text"
                      name="plate_number"
                      value={formData.plate_number}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity:</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      min="1"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bus Type:</label>
                    <select
                      name="bus_type"
                      value={formData.bus_type}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Type</option>
                      <option value="AC">AC</option>
                      <option value="Non-AC">Non-AC</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Semi-Luxury">Semi-Luxury</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status:</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="INACTIVE">Inactive</option>
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
                    {loading ? 'Updating...' : 'Update Bus'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3>Buses List</h3>
          <span className="table-count">({buses.length} buses)</span>
        </div>
        
        {buses.length === 0 ? (
          <div className="empty-state">
            <p>No buses found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Plate Number</th>
                  <th>Capacity</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Driver</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => (
                  <tr key={bus.id}>
                    <td>{bus.bus_number}</td>
                    <td>{bus.plate_number}</td>
                    <td>{bus.capacity} seats</td>
                    <td>{bus.bus_type}</td>
                    <td>
                      <span className={`status-badge ${bus.status.toLowerCase()}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td>{bus.driver_name || 'No driver'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => openEditModal(bus)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => handleDeleteBus(bus.id)}
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

export default BusManagement;