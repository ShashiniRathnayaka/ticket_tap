import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    route_name: '',
    start_location: '',
    end_location: '',
    distance: '',
    estimated_time: ''
  });

  const { user, logout } = useAuth();

  const getAuthHeaders = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/routes/getAllRoutes', getAuthHeaders());
      setRoutes(response.data.routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/routes/add-route', formData, getAuthHeaders());
      alert('Route added successfully!');
      setShowAddModal(false);
      fetchRoutes();
    } catch (error) {
      alert('Error adding route');
    }
  };

  return (
    <div>
      <h2>Route Management</h2>
      <button onClick={() => setShowAddModal(true)}>+ Add Route</button>

      {showAddModal && (
        <div className="modal">
          <h3>Add New Route</h3>
          <form onSubmit={handleSubmit}>
            <input type="text" name="route_name" placeholder="Route Name" required />
            <input type="text" name="start_location" placeholder="Start Location" required />
            <input type="text" name="end_location" placeholder="End Location" required />
            <input type="number" name="distance" placeholder="Distance (km)" step="0.1" />
            <input type="text" name="estimated_time" placeholder="Estimated Time (HH:MM)" />
            <button type="submit">Add Route</button>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Route Name</th>
            <th>From - To</th>
            <th>Distance</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(route => (
            <tr key={route.id}>
              <td>{route.route_name}</td>
              <td>{route.start_location} - {route.end_location}</td>
              <td>{route.distance} km</td>
              <td>{route.estimated_time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RouteManagement;