import React, { memo } from 'react';
import './StatsCards.css';

const StatsCards = memo(({ stats, onFilterChange, currentFilter }) => {
  const cards = [
    // Row 1: Overview
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: '📋',
      color: 'blue',
      filter: ''
    },
    {
      title: 'Booking Confirmed',
      value: stats.receivedOrders,
      icon: '✅',
      color: 'purple',
      filter: 'Booking Confirmed'
    },
    {
      title: 'In Workshop',
      value: stats.receivedInWorkshopOrders || 0,
      icon: '🏭',
      color: 'indigo',
      filter: 'Received in Workshop'
    },
    {
      title: 'In Process',
      value: stats.inProcessOrders,
      icon: '🔄',
      color: 'orange',
      filter: 'IN_PROCESS',
      tooltip: 'All processing stages combined',
      isMultiStatus: true
    },
    // Row 2: Processing Stages
    {
      title: 'Sorting',
      value: stats.sortingOrders || 0,
      icon: '📦',
      color: 'slate',
      filter: 'Sorting'
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
      title: 'Quality Check',
      value: stats.qualityCheckOrders || 0,
      icon: '✔️',
      color: 'lime',
      filter: 'Quality Check'
    },
    {
      title: 'Packing',
      value: stats.packingOrders || 0,
      icon: '📦',
      color: 'amber',
      filter: 'Packing'
    },
    // Row 3: Pickup & Delivery
    {
      title: 'Ready for Pickup',
      value: stats.readyForPickupOrders,
      icon: '📦',
      color: 'green',
      filter: 'Ready for Pickup'
    },
    {
      title: 'Ready for Delivery',
      value: stats.readyForDeliveryOrders || 0,
      icon: '🎁',
      color: 'teal',
      filter: 'Ready for Delivery'
    },
    {
      title: 'Out for Delivery',
      value: stats.outForDeliveryOrders,
      icon: '🚚',
      color: 'yellow',
      filter: 'Out for Delivery'
    },
    // Row 4: Completed & Others
    {
      title: 'Delivered',
      value: stats.deliveredOrders,
      icon: '✨',
      color: 'emerald',
      filter: 'Delivered'
    },
    {
      title: 'Return',
      value: stats.returnOrders,
      icon: '↩️',
      color: 'orange',
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
      title: 'Cancelled',
      value: stats.cancelledOrders || 0,
      icon: '❌',
      color: 'gray',
      filter: 'Cancelled'
    },
    // Row 5: Summary
    {
      title: 'Today\'s Orders',
      value: stats.todayOrders,
      icon: '📅',
      color: 'indigo',
      filter: 'TODAY',
      isSpecial: true
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
        // Determine if this card is active
        let isActive = false;
        if (card.title === 'Total Orders') {
          // Total Orders is active when no filter
          isActive = currentFilter === '';
        } else if (card.filter) {
          // All other cards with filters
          isActive = currentFilter === card.filter;
        }
        
        // All cards with filters are clickable, plus Total Orders (which has empty filter but special title)
        const isClickable = card.filter || card.title === 'Total Orders';
        
        // Tooltip text
        let tooltipText = '';
        if (card.filter && card.filter !== 'IN_PROCESS' && card.filter !== 'TODAY') {
          tooltipText = `Click to filter by ${card.title}`;
        } else if (card.title === 'Total Orders') {
          tooltipText = 'Click to show all orders';
        } else if (card.filter === 'IN_PROCESS') {
          tooltipText = 'Click to show all in-process orders (Sorting, Spotting, Washing, Dry Cleaning, Drying, Ironing, Quality Check, Packing)';
        } else if (card.filter === 'TODAY') {
          tooltipText = 'Click to show today\'s orders';
        }
        
        return (
          <div 
            key={index} 
            className={`stat-card ${card.color} ${isClickable ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
            onClick={() => isClickable ? handleCardClick(card) : null}
            title={tooltipText}
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

