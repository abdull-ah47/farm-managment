import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import '../styles/AddMilkData.css';

const AddMilkData = () => {
  const [formData, setFormData] = useState({
    customerId: '', // Change to store customer ID
    milkType: 'morning',
    liters: '',
    rate: '',
    cashReceived: '0',
    creditDue: '0',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false); // toggle state

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      const user = JSON.parse(userData);
      const token = user.token;

      const response = await axios.get('http://localhost:5000/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCustomers(response.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      const totalAmount = Number(newData.liters || 0) * Number(newData.rate || 0);

      if (name === 'cashReceived') {
        newData.creditDue = (totalAmount - Number(value || 0)).toFixed(2);
      } else if (name === 'creditDue') {
        newData.cashReceived = (totalAmount - Number(value || 0)).toFixed(2);
      } else if (name === 'liters' || name === 'rate') {
        newData.creditDue = (totalAmount - Number(newData.cashReceived || 0)).toFixed(2);
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      const user = JSON.parse(userData);
      const token = user.token;

      const submitData = {
        ...formData,
        liters: Number(formData.liters),
        rate: Number(formData.rate),
        cashReceived: Number(formData.cashReceived || 0),
        creditDue: Number(formData.creditDue || 0)
      };

      if (isNewCustomer) {
        // If adding a new customer, first create the customer
        const newCustomerResponse = await axios.post('http://localhost:5000/api/customers', {
          name: formData.customerName // Send the new customer name to the backend
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const newCustomerId = newCustomerResponse.data.id; // Get the new customer ID
        submitData.customerId = newCustomerId; // Set customerId in submit data
      }

      console.log("Submitting data:", submitData);

      // Send milk data to backend
      await axios.post('http://localhost:5000/api/milk', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Milk data added successfully');
      setFormData({
        customerId: '',
        milkType: 'morning',
        liters: '',
        rate: '',
        cashReceived: '0',
        creditDue: '0',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (err) {
      console.error('Error adding milk data:', err);
      setError(err.response?.data?.message || 'Failed to add milk data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-milk-container">
      <h2>Add Milk Data</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            required
          />
        </div>

        <div className="form-group">
          <label>Customer:</label>
          <div className="toggle-buttons">
            <button
              type="button"
              className={!isNewCustomer ? 'active' : ''}
              onClick={() => {
                setIsNewCustomer(false);
                setFormData({ ...formData, customerId: '', customerName: '' });
              }}
            >
              Select Existing
            </button>
            <button
              type="button"
              className={isNewCustomer ? 'active' : ''}
              onClick={() => {
                setIsNewCustomer(true);
                setFormData({ ...formData, customerId: '', customerName: '' });
              }}
            >
              Add New
            </button>
          </div>

          {!isNewCustomer ? (
            <select
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.Name}>
                {customer.name}
              </option>
            ))}
          </select>
          ) : (
            <input
              type="text"
              name="customerName"
              placeholder="Enter new customer name"
              value={formData.customerName}
              onChange={handleInputChange}
              required
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="milkType">Milk Type:</label>
          <select
            id="milkType"
            name="milkType"
            value={formData.milkType}
            onChange={handleInputChange}
            required
          >
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="liters">Liters:</label>
          <input
            type="number"
            id="liters"
            name="liters"
            value={formData.liters}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="rate">Rate (Rs.):</label>
          <input
            type="number"
            id="rate"
            name="rate"
            value={formData.rate}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cashReceived">Cash Received (Rs.):</label>
          <input
            type="number"
            id="cashReceived"
            name="cashReceived"
            value={formData.cashReceived}
            onChange={handleInputChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="creditDue">Credit Due (Rs.):</label>
          <input
            type="number"
            id="creditDue"
            name="creditDue"
            value={formData.creditDue}
            onChange={handleInputChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="total-amount">
          <strong>Total Amount: Rs. {(Number(formData.liters || 0) * Number(formData.rate || 0)).toFixed(2)}</strong>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Milk Data'}
        </button>
      </form>
    </div>
  );
};

export default AddMilkData;
