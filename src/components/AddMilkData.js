import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AddMilkData.css';

const AddMilkData = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    milkType: 'morning',
    liters: '',
    rate: '',
    cashReceived: '',
    creditDue: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cashReceived' || name === 'creditDue') {
      const totalAmount = parseFloat(formData.liters) * parseFloat(formData.rate);
      const enteredValue = parseFloat(value) || 0;
      
      if (name === 'cashReceived') {
        // When cash is entered, update credit
        const remainingAmount = Math.max(0, totalAmount - enteredValue);
        setFormData(prev => ({
          ...prev,
          cashReceived: value,
          creditDue: remainingAmount.toString()
        }));
      } else {
        // When credit is entered, update cash
        const remainingAmount = Math.max(0, totalAmount - enteredValue);
        setFormData(prev => ({
          ...prev,
          creditDue: value,
          cashReceived: remainingAmount.toString()
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Validate total amount matches sum of cash and credit
      const totalAmount = parseFloat(formData.liters) * parseFloat(formData.rate);
      const cashReceived = parseFloat(formData.cashReceived) || 0;
      const creditDue = parseFloat(formData.creditDue) || 0;
      
      if (Math.abs((cashReceived + creditDue) - totalAmount) > 0.01) {
        throw new Error('Total amount must equal sum of cash received and credit due');
      }

      // If it's a new customer, create it first
      if (isNewCustomer) {
        const customerResponse = await fetch('http://localhost:5000/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.customerName,
            userId: user._id
          })
        });

        if (!customerResponse.ok) {
          throw new Error('Failed to create customer');
        }
      }

      // Add milk data
      const response = await fetch('http://localhost:5000/api/milk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          milkType: formData.milkType,
          liters: parseFloat(formData.liters),
          rate: parseFloat(formData.rate),
          cashReceived: parseFloat(formData.cashReceived) || 0,
          creditDue: parseFloat(formData.creditDue) || 0,
          userId: user._id,
          date: formData.date
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add milk data');
      }

      // Reset form
      setFormData({
        customerName: '',
        milkType: 'morning',
        liters: '',
        rate: '',
        cashReceived: '',
        creditDue: '',
        date: new Date().toISOString().split('T')[0]
      });
      setIsNewCustomer(false);
      setError('');
      await fetchCustomers();
      alert('Milk data added successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading customers...</div>;
  }

  return (
    <div className="add-milk-container">
      <h2>Add Milk Data</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="milk-form">
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Customer</label>
          <div className="customer-type">
            <label>
              <input
                type="radio"
                checked={!isNewCustomer}
                onChange={() => setIsNewCustomer(false)}
              />
              Select Existing Customer
            </label>
            <label>
              <input
                type="radio"
                checked={isNewCustomer}
                onChange={() => setIsNewCustomer(true)}
              />
              New Customer
            </label>
          </div>
          
          {!isNewCustomer ? (
            <select
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              required
            />
          )}
        </div>

        <div className="form-group">
          <label>Milk Type</label>
          <select
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
          <label>Liters</label>
          <input
            type="number"
            name="liters"
            value={formData.liters}
            onChange={handleInputChange}
            step="0.1"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Rate per Liter</label>
          <input
            type="number"
            name="rate"
            value={formData.rate}
            onChange={handleInputChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Cash Received</label>
          <input
            type="number"
            name="cashReceived"
            value={formData.cashReceived}
            onChange={handleInputChange}
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Credit Due</label>
          <input
            type="number"
            name="creditDue"
            value={formData.creditDue}
            onChange={handleInputChange}
            min="0"
          />
        </div>

        <button type="submit" className="submit-button">
          Add Milk Data
        </button>
      </form>
    </div>
  );
};

export default AddMilkData;