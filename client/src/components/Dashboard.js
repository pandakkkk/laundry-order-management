import React, { memo } from 'react';
import './Dashboard.css';
import StatsCards from './StatsCards';
import OrderTable from './OrderTable';

const Dashboard = memo(({ 
  orders, 
  stats, 
  loading, 
  filterStatus, 
  searchQuery,
  isSearching,
  searchField,
  onFilterChange, 
  onSearchInputChange,
  onSearchClick,
  onFieldChange, 
  onOrderSelect,
  onStatusUpdate,
  onRefresh 
}) => {
  return (
    <div className="dashboard">
      {stats && <StatsCards stats={stats} onFilterChange={onFilterChange} />}
      
      <div className="dashboard-controls">
        <div className="filter-controls">
          <select 
            value={filterStatus} 
            onChange={(e) => onFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="Received">📥 Received</option>
            <option value="Sorting">📦 Sorting</option>
            <option value="Spotting">🔍 Spotting</option>
            <option value="Washing">🧼 Washing</option>
            <option value="Dry Cleaning">🧴 Dry Cleaning</option>
            <option value="Drying">💨 Drying</option>
            <option value="Ironing">👔 Ironing</option>
            <option value="Quality Check">✔️ Quality Check</option>
            <option value="Packing">📦 Packing</option>
            <option value="Ready for Pickup">✅ Ready for Pickup</option>
            <option value="Out for Delivery">🚚 Out for Delivery</option>
            <option value="Delivered">✨ Delivered</option>
            <option value="Return">↩️ Return</option>
            <option value="Refund">💸 Refund</option>
            <option value="Cancelled">❌ Cancelled</option>
          </select>
          
          <button onClick={onRefresh} className="btn btn-secondary btn-sm">
            🔄 Refresh
          </button>
        </div>
      </div>

      <OrderTable 
        orders={orders} 
        loading={loading}
        searchQuery={searchQuery}
        isSearching={isSearching}
        searchField={searchField}
        onSearchInputChange={onSearchInputChange}
        onSearchClick={onSearchClick}
        onFieldChange={onFieldChange}
        onOrderSelect={onOrderSelect}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

