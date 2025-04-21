import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import '../styles/ViewDailyData.css';

const ViewDailyData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingEntry, setEditingEntry] = useState(null);
  const [totals, setTotals] = useState({
    liters: 0,
    cashReceived: 0,
    creditDue: 0,
    totalSale: 0
  });

  const fetchData = async (date) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      const user = JSON.parse(userData);
      const token = user.token;

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`http://localhost:5000/api/milk/daily-data?date=${date}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Filter data for selected date
      const filteredData = response.data.filter(entry => 
        format(new Date(entry.date), 'yyyy-MM-dd') === date
      );

      setData(filteredData);
      
      // Calculate totals for filtered data
      const calculatedTotals = filteredData.reduce((acc, curr) => {
        return {
          liters: acc.liters + parseFloat(curr.liters || 0),
          cashReceived: acc.cashReceived + parseFloat(curr.cashReceived || 0),
          creditDue: acc.creditDue + parseFloat(curr.creditDue || 0),
          totalSale: acc.totalSale + (parseFloat(curr.liters || 0) * parseFloat(curr.rate || 0))
        };
      }, { liters: 0, cashReceived: 0, creditDue: 0, totalSale: 0 });
      
      setTotals(calculatedTotals);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error fetching data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const token = user.token;

      await axios.delete(`http://localhost:5000/api/milk/${entryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Refresh data after deletion
      fetchData(selectedDate);
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry({
      ...entry,
      date: format(new Date(entry.date), 'yyyy-MM-dd')
    });
  };

  const handleUpdate = async () => {
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const token = user.token;

      // Validate the data before sending
      const updateData = {
        customerName: editingEntry.customerName.trim(),
        milkType: editingEntry.milkType,
        liters: Number(editingEntry.liters),
        rate: Number(editingEntry.rate),
        cashReceived: Number(editingEntry.cashReceived),
        creditDue: Number(editingEntry.creditDue)
      };

      // Validate numbers
      if (isNaN(updateData.liters) || updateData.liters <= 0) {
        throw new Error('Liters must be a positive number');
      }
      if (isNaN(updateData.rate) || updateData.rate <= 0) {
        throw new Error('Rate must be a positive number');
      }
      if (isNaN(updateData.cashReceived) || updateData.cashReceived < 0) {
        throw new Error('Cash received must be a non-negative number');
      }
      if (isNaN(updateData.creditDue) || updateData.creditDue < 0) {
        throw new Error('Credit due must be a non-negative number');
      }

      // Validate customer name
      if (!updateData.customerName) {
        throw new Error('Customer name is required');
      }

      // Validate milk type
      if (!['morning', 'evening'].includes(updateData.milkType)) {
        throw new Error('Invalid milk type');
      }

      console.log('Sending update data:', updateData);
      const response = await axios.put(
        `http://localhost:5000/api/milk/${editingEntry._id}`,
        updateData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Update response:', response.data);
      setEditingEntry(null);
      fetchData(selectedDate);
    } catch (err) {
      console.error('Error updating entry:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update entry';
      alert(errorMessage);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="daily-data-container">
      <h2>Daily Milk Collection Data</h2>
      
      <div className="date-selector">
        <label htmlFor="date">Select Date: </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={handleDateChange}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      <div className="totals-summary">
        <div className="total-item">
          <span>Total Liters:</span>
          <span>{totals.liters.toFixed(2)} L</span>
        </div>
        <div className="total-item">
          <span>Total Sale:</span>
          <span>Rs. {totals.totalSale.toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span>Total Cash Received:</span>
          <span>Rs. {totals.cashReceived.toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span>Total Credit Due:</span>
          <span>Rs. {totals.creditDue.toFixed(2)}</span>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Milk Type</th>
              <th>Liters</th>
              <th>Rate (Rs.)</th>
              <th>Cash Received</th>
              <th>Credit Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry._id}>
                {editingEntry && editingEntry._id === entry._id ? (
                  <>
                    <td>{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                    <td>
                      <input
                        type="text"
                        name="customerName"
                        value={editingEntry.customerName}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <select
                        name="milkType"
                        value={editingEntry.milkType}
                        onChange={handleEditChange}
                      >
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        name="liters"
                        value={editingEntry.liters}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rate"
                        value={editingEntry.rate}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="cashReceived"
                        value={editingEntry.cashReceived}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="creditDue"
                        value={editingEntry.creditDue}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <button onClick={handleUpdate}>Save</button>
                      <button onClick={() => setEditingEntry(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                    <td>{entry.customerName}</td>
                    <td>{entry.milkType}</td>
                    <td>{parseFloat(entry.liters).toFixed(2)}</td>
                    <td>{parseFloat(entry.rate).toFixed(2)}</td>
                    <td>{parseFloat(entry.cashReceived).toFixed(2)}</td>
                    <td>{parseFloat(entry.creditDue).toFixed(2)}</td>
                    <td>
                      <button onClick={() => handleEdit(entry)}>Edit</button>
                      <button onClick={() => handleDelete(entry._id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewDailyData;