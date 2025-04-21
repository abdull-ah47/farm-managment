import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [dailyData, setDailyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Use the selected date for both start and end date to get single day's data
      const formattedDate = selectedDate.split('T')[0];
      
      const response = await fetch(
        `http://localhost:5000/api/milk?startDate=${formattedDate}&endDate=${formattedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch daily data');
      }

      const data = await response.json();
      // Filter data to ensure only selected date's data is included
      const filteredData = Array.isArray(data) 
        ? data.filter(item => {
            const itemDate = new Date(item.date).toISOString().split('T')[0];
            return itemDate === formattedDate;
          })
        : [];
      setDailyData(filteredData);
    } catch (error) {
      console.error('Error fetching daily data:', error);
      setError('Failed to load daily data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for the summary cards
  const calculateTotals = () => {
    const totals = dailyData.reduce((acc, item) => ({
      liters: acc.liters + (Number(item.liters) || 0),
      cashReceived: acc.cashReceived + (Number(item.cashReceived) || 0),
      creditDue: acc.creditDue + (Number(item.creditDue) || 0),
      totalSale: acc.totalSale + ((Number(item.liters) || 0) * (Number(item.rate) || 0))
    }), { liters: 0, cashReceived: 0, creditDue: 0, totalSale: 0 });
    return totals;
  };

  // Process data for the chart - group by morning/evening
  const processChartData = () => {
    const groupedData = dailyData.reduce((acc, item) => {
      const timeOfDay = item.milkType === 'morning' ? 'Morning' : 'Evening';
      if (!acc[timeOfDay]) {
        acc[timeOfDay] = {
          liters: 0,
          cash: 0,
          credit: 0
        };
      }
      
      acc[timeOfDay].liters += Number(item.liters || 0);
      acc[timeOfDay].cash += Number(item.cashReceived || 0);
      acc[timeOfDay].credit += Number(item.creditDue || 0);
      
      return acc;
    }, {});

    return {
      labels: ['Morning', 'Evening'],
      datasets: [
        {
          label: 'Milk Sold (Liters)',
          data: ['Morning', 'Evening'].map(time => groupedData[time]?.liters || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Cash Received (Rs)',
          data: ['Morning', 'Evening'].map(time => groupedData[time]?.cash || 0),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Credit Due (Rs)',
          data: ['Morning', 'Evening'].map(time => groupedData[time]?.credit || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Sales Overview'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toFixed(2);
          }
        }
      }
    }
  };

  const totals = calculateTotals();

  return (
    <div className="dashboard-container">
      <h2>Dashboard Overview</h2>
      
      <div className="date-selector">
        <label>Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading">Loading dashboard data...</div>
        ) : dailyData.length > 0 ? (
          <>
            <div className="dashboard-cards">
              <div className="card">
                <h3>Total Milk Sold</h3>
                <p>{totals.liters.toFixed(2)} L</p>
              </div>
              <div className="card">
                <h3>Total Sale</h3>
                <p>Rs. {totals.totalSale.toFixed(2)}</p>
              </div>
              <div className="card">
                <h3>Cash Received</h3>
                <p>Rs. {totals.cashReceived.toFixed(2)}</p>
              </div>
              <div className="card">
                <h3>Credit Due</h3>
                <p>Rs. {totals.creditDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="chart-container">
              <Line data={processChartData()} options={chartOptions} />
            </div>
          </>
        ) : (
          <div className="no-data">No data available for selected date</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;