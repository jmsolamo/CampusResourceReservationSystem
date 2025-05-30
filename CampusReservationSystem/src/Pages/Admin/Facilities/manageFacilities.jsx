import React, { useState, useEffect } from 'react';
import './manageFacilities.css';

function ManageFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: '',
    type: 'classroom',
    location: '',
    capacity: '',
    description: '',
    requires_approval: true
  });

  // Fetch facilities on component mount
  useEffect(() => {
    fetchFacilities();
  }, []);

  // Fetch facilities from API
  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost/CampusReservationSystem/src/api/facilities.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFacilities(data.facilities || []);
      } else {
        throw new Error(data.message || 'Failed to fetch facilities');
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setError('Failed to load facilities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for new facility form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewFacility({
      ...newFacility,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission for adding new facility
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost/CampusReservationSystem/src/api/add_facility.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFacility),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form and close modal
        setNewFacility({
          name: '',
          type: 'classroom',
          location: '',
          capacity: '',
          description: '',
          requires_approval: true
        });
        setShowAddModal(false);
        
        // Refresh facilities list
        fetchFacilities();
        
        alert('Facility added successfully!');
      } else {
        alert(`Failed to add facility: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding facility:', error);
      alert(`Error adding facility: ${error.message}`);
    }
  };

  // Handle delete facility
  const handleDelete = async (facilityId) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) {
      return;
    }
    
    try {
      const response = await fetch('http://localhost/CampusReservationSystem/src/api/delete_facility.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facilityId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove facility from state
        setFacilities(facilities.filter(facility => facility.resource_id !== facilityId));
        alert('Facility deleted successfully!');
      } else {
        alert(`Failed to delete facility: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting facility:', error);
      alert(`Error deleting facility: ${error.message}`);
    }
  };

  return (
    <div className="manage-facilities-container">
      <h1 className="page-title">MANAGE FACILITIES</h1>
      
      <div className="controls">
        <button 
          className="add-facility-button"
          onClick={() => setShowAddModal(true)}
        >
          Add New Facility
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading facilities...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : facilities.length === 0 ? (
        <div className="no-facilities">No facilities found.</div>
      ) : (
        <div className="facilities-table-container">
          <table className="facilities-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Campus</th>
                <th>Capacity</th>
                <th>Description</th>
                <th>Requires Approval</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map(facility => (
                <tr key={facility.resource_id}>
                  <td>{facility.resource_id}</td>
                  <td>{facility.name}</td>
                  <td>{facility.type}</td>
                  <td>{facility.location || 'N/A'}</td>
                  <td>{facility.capacity || 'N/A'}</td>
                  <td>{facility.description || 'N/A'}</td>
                  <td>{facility.requires_approval ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(facility.resource_id)}
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
      
      {/* Add Facility Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Facility</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Facility Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={newFacility.name} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Campus</label>
                <select 
                  name="location" 
                  value={newFacility.location} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Select Campus</option>
                  <option value="Main Campus">Main Campus</option>
                  <option value="East Campus">East Campus</option>
                  <option value="West Campus">West Campus</option>
                  <option value="North Campus">North Campus</option>
                  <option value="South Campus">South Campus</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input 
                  type="number" 
                  name="capacity" 
                  value={newFacility.capacity} 
                  onChange={handleInputChange} 
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={newFacility.description || ''} 
                  onChange={handleInputChange} 
                  rows="3"
                ></textarea>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="requires_approval" 
                    checked={newFacility.requires_approval} 
                    onChange={handleInputChange} 
                  />
                  Requires Approval
                </label>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-btn">Add Facility</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageFacilities;