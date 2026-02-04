import React from 'react';
import './NotificationStyles.css';

/**
 * Reusable Notification Bell Component
 * Used across all dashboards for order notifications
 */
const NotificationBell = ({
  notifications = [],
  showToast,
  latestNotification,
  unreadCount,
  showPanel,
  bellShaking,
  notificationPermission,
  onTogglePanel,
  onDismissToast,
  onMarkAsRead,
  onClearAll,
  onRequestPermission,
  dashboardIcon = '📦',
  toastTitle = 'New Order!'
}) => {
  return (
    <>
      {/* Notification Toast */}
      {showToast && latestNotification && (
        <div className="notification-toast" onClick={onDismissToast}>
          <div className="toast-icon">{dashboardIcon}</div>
          <div className="toast-content">
            <div className="toast-title">{toastTitle}</div>
            <div className="toast-body">
              {latestNotification.ticketNumber} - {latestNotification.customerName}
            </div>
          </div>
          <button className="toast-close" onClick={(e) => {
            e.stopPropagation();
            onDismissToast();
          }}>✕</button>
        </div>
      )}

      {/* Notification Bell Button */}
      <button
        className={`btn-notification ${bellShaking ? 'shaking' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={onTogglePanel}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="notification-panel-overlay" onClick={onTogglePanel}>
          <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notification-panel-header">
              <h3>🔔 Notifications</h3>
              {notifications.length > 0 && (
                <button className="btn-clear-all" onClick={onClearAll}>
                  Clear All
                </button>
              )}
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <span className="empty-bell">🔕</span>
                  <p>No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="notification-icon">{dashboardIcon}</div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.ticketNumber}
                      </div>
                      <div className="notification-body">
                        {notification.customerName}
                      </div>
                      {notification.status && (
                        <div className="notification-status">
                          Status: {notification.status}
                        </div>
                      )}
                      {notification.address && (
                        <div className="notification-address">
                          📍 {notification.address?.slice(0, 40)}...
                        </div>
                      )}
                      <div className="notification-time">{notification.time}</div>
                    </div>
                    {!notification.read && <div className="unread-dot"></div>}
                  </div>
                ))
              )}
            </div>
            {notificationPermission !== 'granted' && (
              <div className="notification-permission-banner">
                <span>🔔 Enable notifications to stay updated!</span>
                <button onClick={onRequestPermission}>Enable</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
