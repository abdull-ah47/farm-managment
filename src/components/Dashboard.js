import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalMilk: 0,
    totalSale: 0,
    totalCashReceived: 0,
    totalCreditDue: 0
  });

  const fetchDashboardData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      
      const user = JSON.parse(userData);
      const token = user.token;

      console.log('Fetching dashboard data for date:', selectedDate);
      
      const response = await axios.get(
        `http://localhost:5000/api/milk?startDate=${selectedDate}&endDate=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const filteredData = response.data.filter(entry => 
        format(new Date(entry.date), 'yyyy-MM-dd') === selectedDate
      );

      // Calculate totals
      const calculatedTotals = filteredData.reduce((acc, curr) => ({
        totalMilk: acc.totalMilk + Number(curr.liters || 0),
        totalSale: acc.totalSale + (Number(curr.liters || 0) * Number(curr.rate || 0)),
        totalCashReceived: acc.totalCashReceived + Number(curr.cash_received || 0),
        totalCreditDue: acc.totalCreditDue + Number(curr.credit_due || 0)
      }), {
        totalMilk: 0,
        totalSale: 0,
        totalCashReceived: 0,
        totalCreditDue: 0
      });

      setData(filteredData);
      setTotals(calculatedTotals);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Process data for the chart - group by morning/evening
  const processChartData = () => {
    const groupedData = data.reduce((acc, item) => {
      const timeOfDay = item.milkType === 'morning' ? 'Morning' : 'Evening';
      if (!acc[timeOfDay]) {
        acc[timeOfDay] = {
          liters: 0,
          cash: 0,
          credit: 0
        };
      }
      
      acc[timeOfDay].liters += Number(item.liters || 0);
      acc[timeOfDay].cash += Number(item.cash_received || 0);
      acc[timeOfDay].credit += Number(item.credit_due || 0);
      
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <h2>Dashboard Overview</h2>
      
      <div className="date-selector">
        <label htmlFor="dashboardDate">Select Date: </label>
        <input
          type="date"
          id="dashboardDate"
          value={selectedDate}
          onChange={handleDateChange}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="card total-milk">
            <h3>Total Milk</h3>
            <p>{totals.totalMilk.toFixed(2)} L</p>
          </div>
          
          <div className="card total-sale">
            <h3>Total Sale</h3>
            <p>Rs. {totals.totalSale.toFixed(2)}</p>
          </div>
          
          <div className="card cash-received">
            <h3>Cash Received</h3>
            <p>Rs. {totals.totalCashReceived.toFixed(2)}</p>
          </div>
          
          <div className="card credit-due">
            <h3>Credit Due</h3>
            <p>Rs. {totals.totalCreditDue.toFixed(2)}</p>
          </div>
        </div>

        <div className="chart-container">
          <Line data={processChartData()} options={chartOptions} />
        </div>

        {data.length === 0 && (
          <div className="no-data">No data available for selected date</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;