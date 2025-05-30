import React, { useContext, useState, useEffect } from 'react';
import { EventContext } from '../../../context/EventContext';
import { AuthContext } from '../../../context/AuthContext';
import 'boxicons/css/boxicons.min.css';
import './adminDashboard.css';

// Helper function to render icons with fallback
const Icon = ({ iconClass }) => {
  const [iconsLoaded, setIconsLoaded] = useState(true);
  
  useEffect(() => {
    // Check if Boxicons is loaded
    const testIcon = document.createElement('i');
    testIcon.className = 'bx bx-menu';
    document.body.appendChild(testIcon);
    
    const computedStyle = window.getComputedStyle(testIcon);
    const isLoaded = computedStyle.fontFamily.includes('boxicons') || 
                    computedStyle.fontFamily.includes('BoxIcons');
    
    document.body.removeChild(testIcon);
    setIconsLoaded(isLoaded);
  }, []);
  
  if (iconsLoaded) {
    return <i className={`bx ${iconClass}`}></i>;
  } else {
    // Map to Font Awesome icons as fallback
    const iconMap = {
      'bx-refresh': 'fa-solid fa-arrows-rotate',
      'bx-filter': 'fa-solid fa-filter'
    };
    return <i className={iconMap[iconClass] || 'fa-solid fa-circle'}></i>;
  }
};

function AdminDashboard({ isCollapsed }) {
  const { loading, error } = useContext(EventContext);
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0
  });

  // State for total events count (approved + finished)
  const [totalEvents, setTotalEvents] = useState(0);

  // Fetch approved events, stats, and total events count when component mounts
  useEffect(() => {
    const fetchApprovedEvents = async () => {
      try {
        const response = await fetch("http://localhost/CampusReservationSystem/src/api/approved_events.php");
        const data = await response.json();
        if (data.success) {
          // Set events directly from the API response
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Error fetching approved events:", error);
      }
    };
    
    const fetchTotalEvents = async () => {
      try {
        const response = await fetch("http://localhost/CampusReservationSystem/src/api/all_events_stats.php");
        const data = await response.json();
        if (data.success) {
          setTotalEvents(data.total_events);
        }
      } catch (error) {
        console.error("Error fetching total events:", error);
      }
    };
    
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost/CampusReservationSystem/src/api/stats.php");
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchApprovedEvents();
    fetchTotalEvents();
    fetchStats();
  }, []);

  // All events are already approved from the API
  const filteredEvents = events;

  // Format date to be more readable
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  };

  // Helper function to get field value with fallbacks
  const getFieldValue = (event, fieldNames) => {
    for (const fieldName of fieldNames) {
      if (event[fieldName] !== undefined) {
        return event[fieldName];
      }
    }
    return 'N/A';
  };

  // No filter change handler needed anymore

  return (
    <div className={`admin-dashboard-container`}>
      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="admin-dashboard-page-title">ADMIN DASHBOARD</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="card yellow">
            <h2>{totalEvents}</h2>
            <p>EVENTS</p>
          </div>
          <div className="card blue">
            <h2>{stats.pending}</h2>
            <p>PENDING</p>
          </div>
          <div className="card red">
            <h2>{stats.declined}</h2>
            <p>DECLINED</p>
          </div>
          <div className="card green">
            <h2>{stats.approved}</h2>
            <p>APPROVED</p>
          </div>
        </div>

        {/* All Reservations */}
        <div className="upcoming-events">
          <div className="events-header">
            <h2>UPCOMING EVENTS</h2>
            <div className="filter-controls">
              <button 
                className="refresh-button" 
                onClick={() => {
                  // Refresh approved events and stats
                  const fetchApprovedEvents = async () => {
                    try {
                      const response = await fetch("http://localhost/CampusReservationSystem/src/api/approved_events.php");
                      const data = await response.json();
                      if (data.success) {
                        setEvents(data.events || []);
                      }
                    } catch (error) {
                      console.error("Error fetching approved events:", error);
                    }
                  };
                  
                  const fetchStats = async () => {
                    try {
                      const response = await fetch("http://localhost/CampusReservationSystem/src/api/stats.php");
                      const data = await response.json();
                      if (data.success) {
                        setStats(data.stats);
                      }
                    } catch (error) {
                      console.error("Error fetching stats:", error);
                    }
                  };
                  
                  fetchApprovedEvents();
                  fetchStats();
                }}
                disabled={loading}
              >
                {loading ? 'Loading...' : (
                  <>
                    <Icon iconClass="bx-refresh" /> Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <p className="loading-message">Loading events...</p>
          ) : filteredEvents.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>EVENT</th>
                    <th>DATE</th>
                    <th>TIME</th>
                    <th>LOCATION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => (
                    <tr key={getFieldValue(event, ['id', 'reservation_id'])}>
                      <td>{getFieldValue(event, ['name', 'title', 'activity', 'reservation_name', 'event_name', 'description'])}</td>
                      <td>{formatDate(getFieldValue(event, ['date', 'date_from', 'reservation_date', 'event_date']))}</td>
                      <td>{getFieldValue(event, ['time', 'time_start', 'reservation_time', 'event_time'])}</td>
                      <td>{getFieldValue(event, ['place', 'location', 'venue', 'resource_name'])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-events">No approved events found.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;