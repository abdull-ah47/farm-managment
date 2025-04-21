import React, { useState, useEffect } from 'react';
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
import '../styles/DashboardOverview.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardOverview = () => {
  const [monthlyData, setMonthlyData] = useState({
    cashReceived: 0,
    creditDue: 0,
    totalMilkSold: 0
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch monthly data from API
    const fetchMonthlyData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/milk/monthly-data');
        const data = await response.json();
        
        // Ensure data has all required fields with default values
        const processedData = {
          cashReceived: data.cashReceived || 0,
          creditDue: data.creditDue || 0,
          totalMilkSold: data.totalMilkSold || 0,
          dates: data.dates || []
        };
        
        setMonthlyData(processedData);
        
        // Prepare chart data
        const chartData = {
          labels: processedData.dates,
          datasets: [
            {
              label: 'Cash Received',
              data: data.cashReceived || [],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            },
            {
              label: 'Credit Due',
              data: data.creditDue || [],
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1
            },
            {
              label: 'Total Milk Sold',
              data: data.totalMilkSold || [],
              borderColor: 'rgb(54, 162, 235)',
              tension: 0.1
            }
          ]
        };
        setChartData(chartData);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const formatNumber = (num) => {
    return (num || 0).toLocaleString();
  };

  return (
    <div className="dashboard-overview">
      <div className="stats-container">
        <div className="stat-card">
          <h3>Cash Received</h3>
          <p className="amount">₹{formatNumber(monthlyData.cashReceived)}</p>
        </div>
        <div className="stat-card">
          <h3>Credit Due</h3>
          <p className="amount">₹{formatNumber(monthlyData.creditDue)}</p>
        </div>
        <div className="stat-card">
          <h3>Total Milk Sold</h3>
          <p className="amount">{formatNumber(monthlyData.totalMilkSold)} L</p>
        </div>
      </div>

      <div className="chart-container">
        <h2>Monthly Overview</h2>
        <div className="chart">
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Monthly Statistics'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 