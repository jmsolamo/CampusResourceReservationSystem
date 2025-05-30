import React, { useState, useEffect } from 'react';
import './adminTransactions.css';

function AdminTransactions({ isCollapsed }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost/CampusReservationSystem/src/api/transactions.php");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  };

  // Filter transactions based on status
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(transaction => transaction.display_status === filter);

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'status-badge approved';
      case 'rejected': return 'status-badge rejected';
      case 'pending': return 'status-badge pending';
      case 'finished': return 'status-badge finished';
      default: return 'status-badge';
    }
  };

  return (
    <div className={`transactions-container ${isCollapsed ? 'collapsed' : ''}`}>
      <main className="main-content">
        <div className="transactions-header">
          <h1 className="page-title">TRANSACTIONS</h1>
          <div className="filter-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="all">All Transactions</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="finished">Finished</option>
            </select>
            <button 
              className="refresh-button" 
              onClick={fetchTransactions}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <p className="loading-message">Loading transactions...</p>
        ) : filteredTransactions.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>EVENT NAME</th>
                  <th>REQUESTER</th>
                  <th>RESOURCE</th>
                  <th>START TIME</th>
                  <th>END TIME</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.reservation_id}>
                    <td>{transaction.reservation_id}</td>
                    <td>{transaction.event_name}</td>
                    <td>{`${transaction.firstname} ${transaction.lastname}`}</td>
                    <td>{transaction.resource_name}</td>
                    <td>{formatDate(transaction.start_time)}</td>
                    <td>{formatDate(transaction.end_time)}</td>
                    <td>
                      <span className={getStatusBadgeClass(transaction.display_status)}>
                        {transaction.display_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-transactions">No transactions found.</p>
        )}
      </main>
    </div>
  );
}

export default AdminTransactions;