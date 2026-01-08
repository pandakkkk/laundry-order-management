import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import './OrderQRCode.css';

const OrderQRCode = ({ order, showBarcode = true, showQR = true, size = 'medium' }) => {
  const barcodeRef = useRef(null);

  // Generate barcode
  useEffect(() => {
    if (barcodeRef.current && order?.ticketNumber && showBarcode) {
      try {
        JsBarcode(barcodeRef.current, order.ticketNumber, {
          format: 'CODE128',
          width: size === 'small' ? 1.5 : 2,
          height: size === 'small' ? 40 : 60,
          displayValue: true,
          fontSize: size === 'small' ? 10 : 12,
          margin: 5,
          background: '#ffffff',
          lineColor: '#1f2937'
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [order?.ticketNumber, showBarcode, size]);

  if (!order) return null;

  // Generate QR code data URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size === 'small' ? '100x100' : '150x150'}&data=${encodeURIComponent(
    JSON.stringify({
      ticketNumber: order.ticketNumber,
      orderId: order._id,
      status: order.status
    })
  )}`;

  const sizeClass = `qr-code-container size-${size}`;

  return (
    <div className={sizeClass}>
      {showQR && (
        <div className="qr-section">
          <img 
            src={qrCodeUrl} 
            alt={`QR Code for ${order.ticketNumber}`}
            className="qr-image"
          />
          <span className="qr-label">Scan for Order Details</span>
        </div>
      )}

      {showBarcode && (
        <div className="barcode-section">
          <svg ref={barcodeRef}></svg>
        </div>
      )}

      <div className="ticket-info">
        <span className="ticket-number">{order.ticketNumber}</span>
        <span className="order-status">{order.status}</span>
      </div>
    </div>
  );
};

export default OrderQRCode;

