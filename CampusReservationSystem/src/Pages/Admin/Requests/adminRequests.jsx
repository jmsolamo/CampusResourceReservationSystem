import React, { useState, useEffect, useContext } from 'react';
import { EventContext } from '../../../context/EventContext';
import './adminRequests.css';

function AdminRequests() {
  const { events, loading, error, updateEventStatus, refreshData } = useContext(EventContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState(null);

  // Helper function to get ID from request object
  const getRequestId = (request) => {
    // Check for various possible ID field names
    return request.id || request.event_id || request.reservation_id || request.ID || request.Id;
  };

  // Filter for pending requests only
  useEffect(() => {
    console.log("Events from context:", events);
    const pendingRequests = events.filter(event => event.status === 'pending');
    console.log("Pending requests:", pendingRequests);
    setFilteredRequests(pendingRequests);
  }, [events]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      const pendingRequests = events.filter(event => event.status === 'pending');
      setFilteredRequests(pendingRequests);
      return;
    }
    
    const filtered = events.filter(event => {
      const title = event.name || event.title || event.activity || event.description || '';
      const requestedBy = event.organizer || event.requestor_name || event.requestedBy || '';
      const department = event.department || '';
      
      return (event.status === 'pending') && (
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    
    setFilteredRequests(filtered);
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchTerm('');
    const pendingRequests = events.filter(event => event.status === 'pending');
    setFilteredRequests(pendingRequests);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Handle approve request
  const handleApprove = async (id) => {
    if (!id) {
      alert("Cannot approve request: Missing ID");
      return;
    }
    
    console.log("Approving request with ID:", id);
    setProcessingId(id);
    
    try {
      // Call the API to update status
      const response = await fetch('http://localhost/CampusReservationSystem/src/api/update_event_status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, status: 'approved' }),
      });
      
      const text = await response.text();
      console.log("Raw response:", text);
      
      try {
        const result = JSON.parse(text);
        if (result.success) {
          // Update UI
          setFilteredRequests(prev => prev.filter(request => getRequestId(request) !== id));
          // Refresh data
          refreshData();
        } else {
          alert(`Failed to approve request: ${result.message}`);
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        alert("Error: Invalid response from server");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert(`Error approving request: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Open reject modal
  const openRejectModal = (id) => {
    setCurrentRequestId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Handle decline request
  const handleDecline = async () => {
    if (!currentRequestId) {
      alert("Cannot decline request: Missing ID");
      return;
    }
    
    if (!rejectReason.trim()) {
      alert("Please provide a reason for declining this request");
      return;
    }
    
    console.log("Declining request with ID:", currentRequestId);
    setProcessingId(currentRequestId);
    
    try {
      // Call the API to update status
      const response = await fetch('http://localhost/CampusReservationSystem/src/api/update_event_status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: currentRequestId, 
          status: 'declined',
          reason: rejectReason
        }),
      });
      
      const text = await response.text();
      console.log("Raw response:", text);
      
      try {
        const result = JSON.parse(text);
        if (result.success) {
          // Update UI
          setFilteredRequests(prev => prev.filter(request => getRequestId(request) !== currentRequestId));
          // Refresh data
          refreshData();
          // Close modal
          setShowRejectModal(false);
        } else {
          alert(`Failed to decline request: ${result.message}`);
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        alert("Error: Invalid response from server");
      }
    } catch (error) {
      console.error("Error declining request:", error);
      alert(`Error declining request: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-requests-container">
      <h2 className="admin-request-page-title">RESERVATION REQUESTS</h2>
      
      <div className="admin-requests-controls">
        <div className="admin-request-search-container">
          <form onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="admin-requests-search-button"> <i className="bx bx-search"></i></button>
          </form>
        </div>
        
        <div className="refresh-container">
          <button 
            className="refresh-button"
            onClick={refreshData}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : filteredRequests.length === 0 ? (
        <div className="no-requests">No pending requests found.</div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => {
                // Find the ID field, checking different possible names
                const requestId = getRequestId(request);
                console.log("Request data:", request);
                console.log("Using ID:", requestId);
                
                return (
                  <tr key={requestId || `request-${Math.random()}`} className="status-pending">
                    <td>{request.name || request.title || request.activity || 'Untitled Event'}</td>
                    <td>{formatDate(request.date || request.date_from || request.formatted_date)}</td>
                    <td>{request.time || request.formatted_time_range || `${request.time_start} - ${request.time_end}` || 'Time TBD'}</td>
                    <td>{request.place || request.venue || request.location || 'Location TBD'}</td>
                    <td>{request.organizer || request.requestor_name || request.requestedBy || 'Unknown'}</td>
                    <td>
                      <span className="status-badge pending">
                        PENDING
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="approve-btn"
                          onClick={() => {
                            console.log("Approve button clicked for ID:", requestId);
                            handleApprove(requestId);
                          }}
                          disabled={processingId === requestId}
                        >
                          {processingId === requestId ? 'Processing...' : 'Approve'}
                        </button>
                        <button 
                          className="decline-btn"
                          onClick={() => {
                            console.log("Decline button clicked for ID:", requestId);
                            openRejectModal(requestId);
                          }}
                          disabled={processingId === requestId}
                        >
                          {processingId === requestId ? 'Processing...' : 'Decline'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="admin-requests-modal-content">
            <h3>Decline Request</h3>
            <p>Please provide a reason for declining this request:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for declining..."
              rows={4}
              className="reject-reason-textarea"
            />
            <div className="modal-buttons">
              <button 
                className="modal-submit" 
                onClick={handleDecline}
                disabled={!rejectReason.trim() || processingId === currentRequestId}
              >
                {processingId === currentRequestId ? 'Processing...' : 'Submit'}
              </button>
              <button 
                className="modal-cancel" 
                onClick={() => setShowRejectModal(false)}
                disabled={processingId === currentRequestId}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRequests;