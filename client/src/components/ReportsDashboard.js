import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';
import './ReportsDashboard.css';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6B7280'];

const ReportsDashboard = () => {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [peakHours, setPeakHours] = useState({ hourly: [] });
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [dashboard, revenue, status, customers, services, staff, peaks] = await Promise.all([
        api.getReportDashboard(period),
        api.getRevenueTrends(period === 'today' ? 'last7days' : period),
        api.getOrdersByStatus(period),
        api.getTopCustomers(period, 10),
        api.getPopularServices(period),
        api.getStaffPerformance(period),
        api.getPeakHours(period)
      ]);

      if (dashboard.success) setDashboardData(dashboard.data);
      if (revenue.success) setRevenueTrends(revenue.data);
      if (status.success) setOrdersByStatus(status.data);
      if (customers.success) setTopCustomers(customers.data);
      if (services.success) setPopularServices(services.data);
      if (staff.success) setStaffPerformance(staff.data);
      if (peaks.success) setPeakHours(peaks.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle export
  const handleExport = async (type) => {
    try {
      setExporting(true);
      const blob = await api.exportReport(type, period, 'csv');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${period}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return '₹' + value.toLocaleString('en-IN');
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-dashboard">
      {/* Header */}
      <div className="reports-header">
        <div className="header-left">
          <h1>📊 Reports & Analytics</h1>
          <p>Business insights and performance metrics</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <button className={period === 'today' ? 'active' : ''} onClick={() => setPeriod('today')}>Today</button>
            <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>This Week</button>
            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>This Month</button>
            <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>This Year</button>
          </div>
          <div className="export-dropdown">
            <button className="btn-export" disabled={exporting}>
              {exporting ? '⏳' : '📥'} Export
            </button>
            <div className="export-menu">
              <button onClick={() => handleExport('orders')}>📦 Orders Report</button>
              <button onClick={() => handleExport('revenue')}>💰 Revenue Report</button>
              <button onClick={() => handleExport('customers')}>👥 Customers Report</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          📈 Overview
        </button>
        <button className={activeTab === 'revenue' ? 'active' : ''} onClick={() => setActiveTab('revenue')}>
          💰 Revenue
        </button>
        <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => setActiveTab('customers')}>
          👥 Customers
        </button>
        <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => setActiveTab('staff')}>
          👷 Staff
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Stats Cards */}
          {dashboardData && (
            <div className="stats-grid">
              <div className="stat-card orders">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <span className="stat-value">{dashboardData.orders.total}</span>
                  <span className="stat-label">Total Orders</span>
                  <span className={`stat-growth ${dashboardData.orders.growth >= 0 ? 'positive' : 'negative'}`}>
                    {dashboardData.orders.growth >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.orders.growth)}%
                  </span>
                </div>
              </div>
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <span className="stat-value">{formatCurrency(dashboardData.revenue.total)}</span>
                  <span className="stat-label">Total Revenue</span>
                  <span className={`stat-growth ${dashboardData.revenue.growth >= 0 ? 'positive' : 'negative'}`}>
                    {dashboardData.revenue.growth >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.revenue.growth)}%
                  </span>
                </div>
              </div>
              <div className="stat-card avg">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <span className="stat-value">{formatCurrency(dashboardData.revenue.avgOrderValue)}</span>
                  <span className="stat-label">Avg Order Value</span>
                </div>
              </div>
              <div className="stat-card customers">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <span className="stat-value">{dashboardData.customers.new}</span>
                  <span className="stat-label">New Customers</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="charts-row">
            {/* Revenue Trend Chart */}
            <div className="chart-card">
              <h3>📈 Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue" 
                    stroke="#4F46E5" 
                    strokeWidth={3}
                    dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Status Pie Chart */}
            <div className="chart-card">
              <h3>📊 Orders by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Services */}
          <div className="chart-card full-width">
            <h3>🌟 Popular Services</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularServices.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours */}
          <div className="chart-card full-width">
            <h3>⏰ Peak Hours</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHours.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                <YAxis />
                <Tooltip labelFormatter={(h) => `${h}:00 - ${h + 1}:00`} />
                <Bar dataKey="count" name="Orders" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="tab-content">
          <div className="chart-card full-width">
            <h3>💰 Daily Revenue</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" name="Orders" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="tab-content">
          <div className="table-card">
            <h3>🏆 Top Customers</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map(customer => (
                  <tr key={customer.phone}>
                    <td>
                      <span className={`rank-badge rank-${customer.rank}`}>
                        {customer.rank <= 3 ? ['🥇', '🥈', '🥉'][customer.rank - 1] : `#${customer.rank}`}
                      </span>
                    </td>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.orders}</td>
                    <td className="amount">{formatCurrency(customer.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="tab-content">
          <div className="table-card">
            <h3>👷 Staff Performance</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Staff Name</th>
                  <th>Orders Handled</th>
                  <th>Total Revenue</th>
                  <th>Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map(staff => (
                  <tr key={staff.name}>
                    <td>
                      <span className={`rank-badge rank-${staff.rank}`}>
                        {staff.rank <= 3 ? ['🥇', '🥈', '🥉'][staff.rank - 1] : `#${staff.rank}`}
                      </span>
                    </td>
                    <td>{staff.name}</td>
                    <td>{staff.ordersHandled}</td>
                    <td className="amount">{formatCurrency(staff.totalRevenue)}</td>
                    <td>{formatCurrency(staff.avgOrderValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;

