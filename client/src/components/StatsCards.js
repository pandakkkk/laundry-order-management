import React, { memo } from 'react';
import './StatsCards.css';

const StatsCards = memo(({ stats, onFilterChange }) => {
  const cards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: '📋',
      color: 'blue',
      filter: ''
    },
    {
      title: 'Received',
      value: stats.receivedOrders,
      icon: '📥',
      color: 'purple',
      filter: 'Received'
    },
    {
      title: 'In Process',
      value: stats.inProcessOrders,
      icon: '🔄',
      color: 'orange',
      filter: '',
      tooltip: 'Sorting + Spotting + Washing + Dry Cleaning + Drying + Ironing + Quality Check + Packing'
    },
    {
      title: 'Washing',
      value: stats.washingOrders,
      icon: '🧼',
      color: 'blue',
      filter: 'Washing'
    },
    {
      title: 'Dry Cleaning',
      value: stats.dryCleaningOrders,
      icon: '🧴',
      color: 'cyan',
      filter: 'Dry Cleaning'
    },
    {
      title: 'Ironing',
      value: stats.ironingOrders,
      icon: '👔',
      color: 'pink',
      filter: 'Ironing'
    },
    {
      title: 'Ready for Pickup',
      value: stats.readyForPickupOrders,
      icon: '✅',
      color: 'green',
      filter: 'Ready for Pickup'
    },
    {
      title: 'Out for Delivery',
      value: stats.outForDeliveryOrders,
      icon: '🚚',
      color: 'yellow',
      filter: 'Out for Delivery'
    },
    {
      title: 'Delivered',
      value: stats.deliveredOrders,
      icon: '✨',
      color: 'teal',
      filter: 'Delivered'
    },
    {
      title: 'Return',
      value: stats.returnOrders,
      icon: '↩️',
      color: 'amber',
      filter: 'Return'
    },
    {
      title: 'Refund',
      value: stats.refundOrders,
      icon: '💸',
      color: 'red',
      filter: 'Refund'
    },
    {
      title: 'Today\'s Orders',
      value: stats.todayOrders,
      icon: '📅',
      color: 'indigo',
      filter: ''
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: '💰',
      color: 'emerald',
      filter: ''
    }
  ];

  return (
    <div className="stats-cards">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`stat-card ${card.color} ${card.filter ? 'clickable' : ''}`}
          onClick={() => card.filter && onFilterChange(card.filter)}
        >
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-content">
            <div className="stat-value">{card.value}</div>
            <div className="stat-title">{card.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

export default StatsCards;

