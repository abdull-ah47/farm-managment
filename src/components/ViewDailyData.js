import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import '../styles/ViewDailyData.css';

const ViewDailyData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
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

      console.log('Fetching data for date:', date);
      
      const response = await axios.get(`http://localhost:5000/api/milk?startDate=${date}&endDate=${date}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Filter and ensure unique entries
      const filteredData = response.data.filter(entry => 
        format(new Date(entry.date), 'yyyy-MM-dd') === date
      );

      console.log('Filtered data:', filteredData);

      // Calculate totals
      const calculatedTotals = filteredData.reduce((acc, curr) => ({
        liters: acc.liters + Number(curr.liters || 0),
        cashReceived: acc.cashReceived + Number(curr.cash_received || 0),
        creditDue: acc.creditDue + Number(curr.credit_due || 0),
        totalSale: acc.totalSale + (Number(curr.liters || 0) * Number(curr.rate || 0))
      }), { liters: 0, cashReceived: 0, creditDue: 0, totalSale: 0 });

      setData(filteredData);
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

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setEditFormData({
      ...entry,
      date: format(new Date(entry.date), 'yyyy-MM-dd')
    });
  };

  const handleUpdate = async () => {
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const token = user.token;

      const updateData = {
        customerName: editFormData.customerName.trim(),
        milkType: editFormData.milkType,
        liters: Number(editFormData.liters),
        rate: Number(editFormData.rate),
        cashReceived: Number(editFormData.cashReceived || 0),
        creditDue: Number(editFormData.creditDue || 0),
        date: editFormData.date
      };

      await axios.put(
        `http://localhost:5000/api/milk/${editingId}`,
        updateData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setEditingId(null);
      setEditFormData(null);
      fetchData(selectedDate);
    } catch (err) {
      console.error('Error updating entry:', err);
      alert(err.response?.data?.error || 'Failed to update entry');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Calculate total amount
      const totalAmount = Number(newData.liters || 0) * Number(newData.rate || 0);
      
      // Auto-calculate credit or cash based on which field was changed
      if (name === 'cashReceived') {
        newData.creditDue = (totalAmount - Number(value || 0)).toFixed(2);
      } else if (name === 'creditDue') {
        newData.cashReceived = (totalAmount - Number(value || 0)).toFixed(2);
      } else if (name === 'liters' || name === 'rate') {
        // When liters or rate changes, adjust credit due keeping cash received constant
        newData.creditDue = (totalAmount - Number(newData.cashReceived || 0)).toFixed(2);
      }
      
      return newData;
    });
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

      fetchData(selectedDate);
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry');
    }
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
              <tr key={entry.id}>
                {editingId === entry.id ? (
                  <>
                    <td>{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                    <td>
                      <input
                        type="text"
                        name="customerName"
                        value={editFormData.customerName}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <select
                        name="milkType"
                        value={editFormData.milkType}
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
                        value={editFormData.liters}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rate"
                        value={editFormData.rate}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="cashReceived"
                        value={editFormData.cashReceived}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="creditDue"
                        value={editFormData.creditDue}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <button className="save-btn" onClick={handleUpdate}>Save</button>
                      <button className="cancel-btn" onClick={() => {
                        setEditingId(null);
                        setEditFormData(null);
                      }}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                    <td>{entry.customerName}</td>
                    <td>{entry.milkType}</td>
                    <td>{Number(entry.liters).toFixed(2)}</td>
                    <td>{Number(entry.rate).toFixed(2)}</td>
                    <td>{Number(entry.cash_received || 0).toFixed(2)}</td>
                    <td>{Number(entry.credit_due || 0).toFixed(2)}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(entry)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(entry.id)}>Delete</button>
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