import React, { useState, useRef } from 'react';
import GarmentTag, { generateTagNumber } from './GarmentTag';
import './GarmentTag.css';

const GarmentTagPrint = ({ order, onClose }) => {
  const tagSize = 'thermal'; // Fixed to thermal 2x2 inch for thermal label printer
  const [quantity, setQuantity] = useState(order?.items?.length || 1);
  const [showCustomerName, setShowCustomerName] = useState(true);
  const printRef = useRef(null);

  if (!order) return null;

  const tagNumber = generateTagNumber(order.ticketNumber);

  const handlePrint = () => {
    // Close modal first to prevent page freeze
    onClose?.();
    
    try {
      const printWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (!printWindow) {
        alert('Please allow pop-ups to print tags');
        return;
      }

      // QR size based on tag size
      const qrSize = tagSize === 'thermal' ? '120x120' : tagSize === 'small' ? '60x60' : '80x80';
      
      // Generate URL for QR code that links to order details page
      const orderViewUrl = `${window.location.origin}/order/${order._id}`;
      
      // Generate tags HTML
      const tagsHtml = Array(quantity).fill(0).map((_, idx) => `
        <div class="garment-tag size-${tagSize}" style="page-break-inside: avoid;">
          ${tagSize !== 'thermal' ? '<div class="tag-hole"></div>' : ''}
          <div class="tag-top">
            <div class="tag-qr">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}&data=${encodeURIComponent(orderViewUrl)}" alt="QR" />
            </div>
            <div class="tag-info">
              <div class="tag-number">${tagNumber}</div>
              ${showCustomerName ? `<div class="tag-customer">${(order.customerName?.split(' ')[0]?.slice(0, 10) || 'Customer').toUpperCase()}</div>` : ''}
              <div class="tag-date">${new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</div>
              <div class="tag-items">${order.items?.length || 0} items</div>
            </div>
          </div>
          <div class="tag-ticket">${order.ticketNumber}</div>
        </div>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Garment Tags - ${order.ticketNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: Arial, sans-serif;
              padding: 10mm;
              display: flex;
              flex-wrap: wrap;
              gap: 5mm;
              justify-content: flex-start;
            }
            
            .garment-tag {
              position: relative;
              background: #ffffff;
              border: 2px solid #000000;
              border-radius: 4px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            
            .garment-tag.size-thermal { width: 2in; height: 2in; padding: 3mm; }
            .garment-tag.size-standard { width: 60mm; height: 30mm; padding: 2mm; }
            .garment-tag.size-small { width: 40mm; height: 25mm; padding: 1.5mm; }
            .garment-tag.size-large { width: 80mm; height: 40mm; padding: 3mm; }
            
            .tag-hole {
              position: absolute;
              top: 3mm;
              left: 50%;
              transform: translateX(-50%);
              width: 4mm;
              height: 4mm;
              border: 1px dashed #999;
              border-radius: 50%;
            }
            
            .size-small .tag-hole { width: 3mm; height: 3mm; top: 2mm; }
            .size-thermal .tag-hole { display: none; }
            
            .tag-top {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              gap: 2mm;
              margin-top: 5mm;
              width: 100%;
            }
            
            .size-small .tag-top { margin-top: 4mm; gap: 1.5mm; }
            .size-thermal .tag-top { flex-direction: column; margin-top: 2mm; gap: 1mm; }
            
            .tag-qr img {
              width: 12mm;
              height: 12mm;
              border: 1px solid #ddd;
            }
            
            .size-small .tag-qr img { width: 10mm; height: 10mm; }
            .size-large .tag-qr img { width: 16mm; height: 16mm; }
            .size-thermal .tag-qr img { width: 20mm; height: 20mm; border: none; }
            
            .tag-info {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 0.3mm;
            }
            .size-thermal .tag-info { align-items: center; text-align: center; gap: 0.5mm; }
            
            .tag-number {
              font-size: 10pt;
              font-weight: 800;
              color: #000;
              letter-spacing: 0.5px;
              font-family: 'Courier New', monospace;
            }
            
            .size-small .tag-number { font-size: 8pt; }
            .size-large .tag-number { font-size: 12pt; }
            .size-thermal .tag-number { font-size: 14pt; letter-spacing: 1px; }
            
            .tag-customer {
              font-size: 7pt;
              font-weight: 600;
              color: #333;
              text-transform: uppercase;
              max-width: 25mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            .size-small .tag-customer { font-size: 6pt; max-width: 18mm; }
            .size-thermal .tag-customer { font-size: 10pt; max-width: 45mm; }
            
            .tag-date { font-size: 6pt; color: #666; }
            .size-small .tag-date { font-size: 5pt; }
            .size-thermal .tag-date { font-size: 8pt; }
            
            .tag-items {
              font-size: 6pt;
              color: #666;
              background: #f0f0f0;
              padding: 0.3mm 1mm;
              border-radius: 1mm;
            }
            
            .size-small .tag-items { font-size: 5pt; }
            .size-thermal .tag-items { font-size: 9pt; padding: 1mm 3mm; border-radius: 2mm; }
            
            .tag-ticket {
              font-size: 5pt;
              color: #666;
              font-family: 'Courier New', monospace;
              letter-spacing: 0.3px;
            }
            
            .size-small .tag-ticket { font-size: 4pt; }
            .size-large .tag-ticket { font-size: 6pt; }
            .size-thermal .tag-ticket { font-size: 8pt; margin-top: 1mm; }
            
            @media print {
              body { padding: 0; margin: 0; }
              @page { 
                size: ${tagSize === 'thermal' ? '2in 2in' : 'A4'}; 
                margin: ${tagSize === 'thermal' ? '0' : '5mm'}; 
              }
            }
          </style>
        </head>
        <body>
          ${tagsHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      // Modal already closed at the start
    } catch (error) {
      console.error('Print error:', error);
      alert('Error opening print dialog. Please try again.');
    }
  };

  return (
    <div className="tag-preview-modal" onClick={onClose}>
      <div className="tag-preview-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tag-preview-header">
          <h3>🏷️ Print Garment Tags</h3>
          <button className="tag-preview-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="tag-preview-body">
          {/* Tag Size Info */}
          <div className="tag-size-info">
            <span className="tag-size-badge">🖨️ Thermal Label: 2×2 inch</span>
          </div>

          {/* Preview */}
          <div className="tag-preview-display" ref={printRef}>
            <div className="garment-tag-preview">
              <GarmentTag 
                order={order} 
                size={tagSize}
                showCustomerName={showCustomerName}
              />
            </div>
          </div>

          {/* Tag Number Display */}
          <div style={{ 
            textAlign: 'center', 
            padding: '8px 16px', 
            background: '#f0fdf4', 
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#166534' }}>
              Tag Number: <strong>{tagNumber}</strong>
            </span>
          </div>

          {/* Options */}
          <div className="tag-options">
            <label className="tag-option-item">
              <input 
                type="checkbox" 
                checked={showCustomerName}
                onChange={(e) => setShowCustomerName(e.target.checked)}
              />
              Show customer name on tag
            </label>
          </div>

          {/* Quantity */}
          <div className="tag-quantity-group">
            <label>Number of tags to print:</label>
            <input 
              type="number" 
              min="1" 
              max="50"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            />
          </div>

          {/* Helper Text */}
          <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>
            🖨️ Optimized for 2×2 inch thermal label printers. Tags will print as adhesive stickers.
          </p>
        </div>

        {/* Footer */}
        <div className="tag-preview-footer">
          <button className="btn-cancel-tag" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-print-tag" onClick={handlePrint}>
            🖨️ Print {quantity} Tag{quantity > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GarmentTagPrint;

