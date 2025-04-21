import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/GenerateReport.css';

const GenerateReport = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('All Customers');
  const [milkType, setMilkType] = useState('All Types');
  const [customers, setCustomers] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/login');
      return;
    }

    const fetchCustomers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/customers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setError('Failed to load customers');
      }
    };

    fetchCustomers();
  }, [user, navigate, logout]);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/login');
        return;
      }

      let url = `http://localhost:5000/api/milk?startDate=${startDate}&endDate=${endDate}`;
      if (customerName !== 'All Customers') {
        url += `&customerName=${customerName}`;
      }
      if (milkType !== 'All Types') {
        url += `&milkType=${milkType.toLowerCase()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      console.log('Report data:', data);
      setReportData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    return reportData.reduce((totals, item) => {
      return {
        liters: totals.liters + (Number(item.liters) || 0),
        cashReceived: totals.cashReceived + (Number(item.cashReceived) || 0),
        creditDue: totals.creditDue + (Number(item.creditDue) || 0),
        totalAmount: totals.totalAmount + ((Number(item.liters) || 0) * (Number(item.rate) || 0))
      };
    }, { liters: 0, cashReceived: 0, creditDue: 0, totalAmount: 0 });
  };

  const handleDownloadPDF = () => {
    if (reportData.length === 0) {
      setError('No data to generate PDF');
      return;
    }

    try {
    const doc = new jsPDF();
      const totals = calculateTotals();
    
      // Add title
    doc.setFontSize(18);
      doc.text('Milk Collection Report', 14, 20);

      // Add report details
      doc.setFontSize(12);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);
      doc.text(`Customer: ${customerName}`, 14, 37);
      doc.text(`Milk Type: ${milkType}`, 14, 44);

      // Add table
      const tableColumn = ['Date', 'Customer', 'Type', 'Liters', 'Rate', 'Amount', 'Cash Received', 'Credit Due'];
      const tableRows = reportData.map(item => [
        new Date(item.date).toLocaleDateString(),
      item.customerName,
      item.milkType === 'morning' ? 'Morning' : 'Evening',
        Number(item.liters).toFixed(2),
        `Rs ${Number(item.rate).toFixed(2)}`,
        `Rs ${(Number(item.liters) * Number(item.rate)).toFixed(2)}`,
        `Rs ${Number(item.cashReceived).toFixed(2)}`,
        `Rs ${Number(item.creditDue).toFixed(2)}`
      ]);

      // Add summary row
      tableRows.push([
        'Total',
      '',
      '',
        totals.liters.toFixed(2),
        '',
        `Rs ${totals.totalAmount.toFixed(2)}`,
        `Rs ${totals.cashReceived.toFixed(2)}`,
        `Rs ${totals.creditDue.toFixed(2)}`
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        footStyles: { fillColor: [169, 169, 169], textColor: 255, fontStyle: 'bold' }
      });

      doc.save('milk-collection-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };

  return (
    <div className="generate-report-container">
      <h2>Generate Report</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="report-filters">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Customer</label>
          <select value={customerName} onChange={(e) => setCustomerName(e.target.value)}>
            <option value="All Customers">All Customers</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer.name}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Milk Type</label>
          <select value={milkType} onChange={(e) => setMilkType(e.target.value)}>
            <option value="All Types">All Types</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>
        </div>
      </div>

      <div className="report-actions">
        <button 
          className="generate-button" 
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
        
        <button 
          className="download-button" 
          onClick={handleDownloadPDF}
          disabled={reportData.length === 0}
        >
          Download PDF
        </button>
      </div>

      {reportData.length > 0 && (
        <div className="report-content">
          <h3>Report Summary</h3>
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Liters</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Cash Received</th>
                  <th>Credit Due</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={index}>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.customerName}</td>
                    <td>{item.milkType === 'morning' ? 'Morning' : 'Evening'}</td>
                    <td>{Number(item.liters).toFixed(2)}</td>
                    <td>Rs {Number(item.rate).toFixed(2)}</td>
                    <td>Rs {(Number(item.liters) * Number(item.rate)).toFixed(2)}</td>
                    <td>Rs {Number(item.cashReceived).toFixed(2)}</td>
                    <td>Rs {Number(item.creditDue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">Total</td>
                  <td>{calculateTotals().liters.toFixed(2)}</td>
                  <td></td>
                  <td>Rs {calculateTotals().totalAmount.toFixed(2)}</td>
                  <td>Rs {calculateTotals().cashReceived.toFixed(2)}</td>
                  <td>Rs {calculateTotals().creditDue.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateReport;