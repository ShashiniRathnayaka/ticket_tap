import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './DriverManagement.css';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [formData, setFormData] = useState({
    route_name: '',
    start_location: '',
    end_location: '',
    distance: '',
    estimated_time: '',
    status: 'ACTIVE'
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

  // Function to format estimated time (handle both string and object formats)
  const formatEstimatedTime = (time) => {
    if (!time) return 'N/A';
    
    // If it's already a string, return it
    if (typeof time === 'string') return time;
    
    // If it's an object with hours and minutes
    if (typeof time === 'object' && time !== null) {
      if (time.hours !== undefined && time.minutes !== undefined) {
        return `${time.hours}:${time.minutes.toString().padStart(2, '0')}`;
      }
    }
    
    // Fallback: stringify for debugging
    return JSON.stringify(time);
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      const response = await axios.get('http://localhost:5000/routes/getAllRoutes', getAuthHeaders());
      setRoutes(response.data.routes);
      setError('');
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        setError('Failed to fetch routes');
        console.error('Error fetching routes:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRoutes();
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

      await axios.post('http://localhost:5000/routes/add-route', formData, getAuthHeaders());
      alert('Route added successfully!');
      setShowAddModal(false);
      setFormData({
        route_name: '',
        start_location: '',
        end_location: '',
        distance: '',
        estimated_time: '',
        status: 'ACTIVE'
      });
      fetchRoutes();
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to add route';
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
        `http://localhost:5000/routes/updateRoute/${selectedRoute.id}`,
        formData,
        getAuthHeaders()
      );
      alert('Route updated successfully!');
      setShowEditModal(false);
      setSelectedRoute(null);
      setFormData({
        route_name: '',
        start_location: '',
        end_location: '',
        distance: '',
        estimated_time: '',
        status: 'ACTIVE'
      });
      fetchRoutes();
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to update route';
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (route) => {
    setSelectedRoute(route);
    setFormData({
      route_name: route.route_name,
      start_location: route.start_location,
      end_location: route.end_location,
      distance: route.distance,
      estimated_time: formatEstimatedTime(route.estimated_time), // Format for editing
      status: route.status
    });
    setShowEditModal(true);
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again.');
        logout();
        return;
      }

      await axios.delete(`http://localhost:5000/routes/deleteRoute/${routeId}`, getAuthHeaders());
      alert('Route deleted successfully!');
      fetchRoutes();
    } catch (error) {
      if (!handleTokenExpiration(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to delete route';
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRoute(null);
    setFormData({
      route_name: '',
      start_location: '',
      end_location: '',
      distance: '',
      estimated_time: '',
      status: 'ACTIVE'
    });
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  if (loading && routes.length === 0) {
    return <div className="loading">Loading routes...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Route Management</h2>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Total Routes:</span>
            <span className="stat-value">{routes.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Routes:</span>
            <span className="stat-value">
              {routes.filter(r => r.status === 'ACTIVE').length}
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
          + Add New Route
        </button>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Route</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleAddSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Route Name:</label>
                    <input
                      type="text"
                      name="route_name"
                      value={formData.route_name}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder="Route A"
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Location:</label>
                    <input
                      type="text"
                      name="start_location"
                      value={formData.start_location}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder="City A"
                    />
                  </div>
                  <div className="form-group">
                    <label>End Location:</label>
                    <input
                      type="text"
                      name="end_location"
                      value={formData.end_location}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder="City B"
                    />
                  </div>
                  <div className="form-group">
                    <label>Distance (km):</label>
                    <input
                      type="number"
                      name="distance"
                      value={formData.distance}
                      onChange={handleInputChange}
                      step="0.1"
                      disabled={loading}
                      placeholder="100.5"
                    />
                  </div>
                  <div className="form-group">
                    <label>Estimated Time (HH:MM):</label>
                    <input
                      type="text"
                      name="estimated_time"
                      value={formData.estimated_time}
                      onChange={handleInputChange}
                      disabled={loading}
                      placeholder="02:30"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      title="Please enter time in HH:MM format"
                    />
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
                    {loading ? 'Adding...' : 'Add Route'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && selectedRoute && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Route</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleEditSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Route Name:</label>
                    <input
                      type="text"
                      name="route_name"
                      value={formData.route_name}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Location:</label>
                    <input
                      type="text"
                      name="start_location"
                      value={formData.start_location}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Location:</label>
                    <input
                      type="text"
                      name="end_location"
                      value={formData.end_location}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Distance (km):</label>
                    <input
                      type="number"
                      name="distance"
                      value={formData.distance}
                      onChange={handleInputChange}
                      step="0.1"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Estimated Time (HH:MM):</label>
                    <input
                      type="text"
                      name="estimated_time"
                      value={formData.estimated_time}
                      onChange={handleInputChange}
                      disabled={loading}
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      title="Please enter time in HH:MM format"
                    />
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
                    {loading ? 'Updating...' : 'Update Route'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3>Routes List</h3>
          <span className="table-count">({routes.length} routes)</span>
        </div>
        
        {routes.length === 0 ? (
          <div className="empty-state">
            <p>No routes found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Route Name</th>
                  <th>From - To</th>
                  <th>Distance</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td>{route.route_name}</td>
                    <td>{route.start_location} - {route.end_location}</td>
                    <td>{route.distance} km</td>
                    <td>{formatEstimatedTime(route.estimated_time)}</td> {/* Fixed here */}
                    <td>
                      <span className={`status-badge ${route.status.toLowerCase()}`}>
                        {route.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => openEditModal(route)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => handleDeleteRoute(route.id)}
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

export default RouteManagement;