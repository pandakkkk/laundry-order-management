import React, { memo } from 'react';
import './StatsCards.css';

const StatsCards = memo(({ stats, onFilterChange, currentFilter }) => {
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

  const handleCardClick = (card) => {
    if (card.filter) {
      // If clicking the same card, clear the filter
      if (currentFilter === card.filter) {
        onFilterChange('');
      } else {
        onFilterChange(card.filter);
      }
    } else if (card.title === 'Total Orders') {
      // Clicking Total Orders clears all filters
      onFilterChange('');
    }
  };

  return (
    <div className="stats-cards">
      {cards.map((card, index) => {
        // Only show as active if:
        // 1. Card has a filter AND it matches currentFilter
        // 2. OR card is "Total Orders" AND currentFilter is empty
        const isActive = card.filter 
          ? currentFilter === card.filter 
          : (card.title === 'Total Orders' && currentFilter === '');
        
        const isClickable = card.filter || card.title === 'Total Orders';
        
        return (
          <div 
            key={index} 
            className={`stat-card ${card.color} ${isClickable ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
            onClick={() => isClickable ? handleCardClick(card) : null}
            title={card.filter ? `Click to filter by ${card.title}` : card.title === 'Total Orders' ? 'Click to show all orders' : ''}
          >
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-title">{card.title}</div>
            </div>
            {isActive && isClickable && <div className="active-indicator">●</div>}
          </div>
        );
      })}
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

export default StatsCards;

