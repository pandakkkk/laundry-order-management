import React, { forwardRef } from 'react';
import './GarmentTag.css';

// Generate unique tag number from ticket number
export const generateTagNumber = (ticketNumber) => {
  // Extract date and sequence from ticket number (e.g., TKT-20250109-001)
  const parts = ticketNumber?.split('-') || [];
  if (parts.length >= 3) {
    const date = parts[1]; // 20250109
    const seq = parts[2];   // 001
    // Create shorter tag: GT-0109-001 (month-day-sequence)
    return `GT-${date.slice(4)}-${seq}`;
  }
  return `GT-${Date.now().toString(36).toUpperCase()}`;
};

const GarmentTag = forwardRef(({ order, size = 'thermal', showCustomerName = true }, ref) => {
  const tagNumber = generateTagNumber(order?.ticketNumber);

  if (!order) return null;

  // Get base URL for the QR code link
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  };

  // Generate URL that points to the public order view page
  const orderViewUrl = `${getBaseUrl()}/order/${order._id}`;
  const qrData = orderViewUrl;

  // QR size based on tag size - thermal gets larger QR for easier scanning
  const qrSize = size === 'thermal' ? '120x120' : size === 'small' ? '60x60' : '80x80';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}&data=${encodeURIComponent(qrData)}`;

  const formatDate = (date) => {
    try {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
      return '--/--';
    }
  };

  return (
    <div className={`garment-tag size-${size}`} ref={ref}>
      {/* Top Section: QR Code + Info */}
      <div className="tag-top">
        <div className="tag-qr">
          <img src={qrCodeUrl} alt="QR" />
        </div>
        <div className="tag-info">
          <div className="tag-number">{tagNumber}</div>
          {showCustomerName && (
            <div className="tag-customer">
              {order.customerName?.split(' ')[0]?.slice(0, 10) || 'Customer'}
            </div>
          )}
          <div className="tag-date">{formatDate(order.orderDate)}</div>
          <div className="tag-items">{order.items?.length || 0} items</div>
        </div>
      </div>

      {/* Ticket Number */}
      <div className="tag-ticket">{order.ticketNumber}</div>

      {/* Hole punch indicator */}
      <div className="tag-hole"></div>
    </div>
  );
});

GarmentTag.displayName = 'GarmentTag';

export default GarmentTag;

