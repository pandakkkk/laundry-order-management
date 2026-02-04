import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for order notifications across dashboards
 * @param {Object} config - Configuration object
 * @param {Function} config.fetchOrders - Function to fetch orders (should return array of orders)
 * @param {Function} config.getRelevantOrders - Function to filter relevant orders for notification
 * @param {string} config.dashboardName - Name of the dashboard (for notification messages)
 * @param {number} config.pollInterval - Polling interval in ms (default: 15000)
 * @param {string} config.notificationIcon - Emoji icon for notifications (default: '📦')
 */
const useOrderNotifications = ({
  fetchOrders,
  getRelevantOrders,
  dashboardName = 'Dashboard',
  pollInterval = 15000,
  notificationIcon = '📦'
}) => {
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [bellShaking, setBellShaking] = useState(false);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  // Refs
  const previousOrderIdsRef = useRef(new Set());
  const isFirstFetchRef = useRef(true);

  // ========================================
  // NOTIFICATION SOUND & VIBRATION
  // ========================================
  const playNotificationSound = useCallback(() => {
    try {
      // Vibrate on mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }

      // Create a pleasant notification sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      // Pleasant three-tone chime
      playTone(880, now, 0.15);
      playTone(1108.73, now + 0.15, 0.3);
      playTone(1318.51, now + 0.3, 0.4);
    } catch (error) {
      console.log('Audio notification not available:', error);
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, []);

  // ========================================
  // BROWSER PUSH NOTIFICATION
  // ========================================
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }
    return 'denied';
  }, []);

  const sendBrowserNotification = useCallback((title, body) => {
    if (notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          tag: `${dashboardName}-notification`,
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
      } catch (error) {
        console.log('Browser notification error:', error);
      }
    }
  }, [notificationPermission, dashboardName]);

  // Request permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        setTimeout(() => requestNotificationPermission(), 2000);
      }
    }
  }, [requestNotificationPermission]);

  // ========================================
  // CHECK FOR NEW ORDERS
  // ========================================
  const checkForNewOrders = useCallback((allOrders) => {
    const relevantOrders = getRelevantOrders ? getRelevantOrders(allOrders) : allOrders;
    const currentOrderIds = new Set(relevantOrders.map(o => o._id));
    const previousOrderIds = previousOrderIdsRef.current;

    // Find new orders
    const newOrders = relevantOrders.filter(order => !previousOrderIds.has(order._id));

    // Only notify if this isn't the first fetch and we have new orders
    if (newOrders.length > 0 && !isFirstFetchRef.current) {
      console.log(`🔔 [${dashboardName}] New orders detected:`, newOrders.length);

      // Play sound
      playNotificationSound();

      // Shake the bell
      setBellShaking(true);
      setTimeout(() => setBellShaking(false), 1000);

      // Set pulse animation
      setHasNewOrders(true);
      setTimeout(() => setHasNewOrders(false), 5000);

      // Create notifications
      const newNotifications = newOrders.map(order => ({
        id: order._id,
        ticketNumber: order.ticketNumber,
        customerName: order.customerName,
        status: order.status,
        address: order.address,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        read: false
      }));

      setNotifications(prev => [...newNotifications, ...prev].slice(0, 15));
      setUnreadCount(prev => prev + newOrders.length);
      setLatestNotification(newNotifications[0]);
      setShowToast(true);

      // Send browser notification
      if (newOrders.length === 1) {
        sendBrowserNotification(
          `${notificationIcon} New Order - ${dashboardName}`,
          `${newOrders[0].ticketNumber} - ${newOrders[0].customerName}`
        );
      } else {
        sendBrowserNotification(
          `${notificationIcon} ${newOrders.length} New Orders - ${dashboardName}`,
          `You have ${newOrders.length} new orders to process`
        );
      }

      // Auto-hide toast
      setTimeout(() => setShowToast(false), 5000);
    }

    // Update refs
    previousOrderIdsRef.current = currentOrderIds;
    isFirstFetchRef.current = false;
  }, [dashboardName, getRelevantOrders, notificationIcon, playNotificationSound, sendBrowserNotification]);

  // ========================================
  // POLLING
  // ========================================
  useEffect(() => {
    if (!fetchOrders) return;

    const poll = async () => {
      try {
        const orders = await fetchOrders();
        if (orders) {
          checkForNewOrders(orders);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial fetch
    poll();

    // Set up polling interval
    const interval = setInterval(() => {
      if (!document.hidden) {
        console.log(`🔄 [${dashboardName}] Auto-polling...`);
        poll();
      }
    }, pollInterval);

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(`👁️ [${dashboardName}] Page visible - checking for new orders...`);
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrders, checkForNewOrders, pollInterval, dashboardName]);

  // ========================================
  // NOTIFICATION ACTIONS
  // ========================================
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowPanel(false);
  };

  const dismissToast = () => {
    setShowToast(false);
  };

  const togglePanel = () => {
    setShowPanel(prev => !prev);
  };

  return {
    // State
    notifications,
    showToast,
    latestNotification,
    unreadCount,
    showPanel,
    bellShaking,
    hasNewOrders,
    notificationPermission,

    // Actions
    markAsRead,
    clearAll,
    dismissToast,
    togglePanel,
    setShowPanel,
    requestNotificationPermission,
    
    // For manual trigger
    checkForNewOrders
  };
};

export default useOrderNotifications;
