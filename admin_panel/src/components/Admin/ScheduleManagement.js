import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    route_id: '',
    bus_id: '',
    driver_id: '',
    departure_time: '',
    arrival_time: '',
    day_of_week: 'Daily'
  });

  const getAuthHeaders = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    try {
      const [schedulesRes, routesRes, busesRes, driversRes] = await Promise.all([
        axios.get('http://localhost:5000/schedules/getAllSchedules', getAuthHeaders()),
        axios.get('http://localhost:5000/routes/getAllRoutes', getAuthHeaders()),
        axios.get('http://localhost:5000/buses/getAllBuses', getAuthHeaders()),
        axios.get('http://localhost:5000/users/getAllDrivers', getAuthHeaders())
      ]);
      
      setSchedules(schedulesRes.data.schedules);
      setRoutes(routesRes.data.routes);
      setBuses(busesRes.data.buses);
      setDrivers(driversRes.data.drivers);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/schedules/add-schedule', formData, getAuthHeaders());
      alert('Schedule added successfully!');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      alert('Error adding schedule');
    }
  };

  return (
    <div>
      <h2>Schedule Management</h2>
      <button onClick={() => setShowAddModal(true)}>+ Add Schedule</button>

      {showAddModal && (
        <div className="modal">
          <h3>Add New Schedule</h3>
          <form onSubmit={handleSubmit}>
            <select name="route_id" required>
              <option value="">Select Route</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>{route.route_name}</option>
              ))}
            </select>
            
            <select name="bus_id" required>
              <option value="">Select Bus</option>
              {buses.map(bus => (
                <option key={bus.id} value={bus.id}>{bus.bus_number} - {bus.plate_number}</option>
              ))}
            </select>

            <select name="driver_id" required>
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>

            <input type="time" name="departure_time" required />
            <input type="time" name="arrival_time" required />
            
            <select name="day_of_week">
              <option value="Daily">Daily</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
            </select>

            <button type="submit">Add Schedule</button>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Bus</th>
            <th>Driver</th>
            <th>Departure</th>
            <th>Arrival</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(schedule => (
            <tr key={schedule.id}>
              <td>{schedule.route_name}</td>
              <td>{schedule.bus_number}</td>
              <td>{schedule.driver_name}</td>
              <td>{schedule.departure_time}</td>
              <td>{schedule.arrival_time}</td>
              <td>{schedule.day_of_week}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleManagement;