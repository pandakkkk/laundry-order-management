import React from 'react';
import './OrderQRCode.css';

const OrderQRCode = ({ order, size = 'medium' }) => {
  if (!order) return null;

  // Get base URL for the QR code link
  // In production, use the actual domain; in development, use localhost
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  };

  // Generate URL that points to the public order view page
  const orderViewUrl = `${getBaseUrl()}/order/${order._id}`;

  // Generate QR code with the URL
  const qrSize = size === 'small' ? '150x150' : '200x200';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}&data=${encodeURIComponent(orderViewUrl)}`;

  const sizeClass = `qr-code-container size-${size}`;

  return (
    <div className={sizeClass}>
      <div className="qr-section">
        <img 
          src={qrCodeUrl} 
          alt={`QR Code for ${order.ticketNumber}`}
          className="qr-image"
        />
        <span className="qr-label">Scan for Full Order Info</span>
      </div>

      <div className="ticket-info">
        <span className="ticket-number">{order.ticketNumber}</span>
        <span className="order-status">{order.status}</span>
      </div>
    </div>
  );
};

export default OrderQRCode;


