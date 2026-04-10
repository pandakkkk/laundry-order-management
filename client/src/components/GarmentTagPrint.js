import React, { useState, useRef } from 'react';
import GarmentTag, { generateTagNumber } from './GarmentTag';
import './GarmentTag.css';

const GarmentTagPrint = ({ order, onClose }) => {
  const tagSize = 'thermal'; // Fixed to thermal 2x2 inch for thermal label printer
  const totalClothes = order?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
  const [quantity, setQuantity] = useState(totalClothes);
  const [showCustomerName, setShowCustomerName] = useState(true);
  const printRef = useRef(null);

  if (!order) return null;

  const tagNumber = generateTagNumber(order.ticketNumber);

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups to print tags');
        return;
      }

      // QR size - larger for better scanning
      const qrSize = '200x200';

      // Generate URL for QR code that links to order details page
      const orderViewUrl = `${window.location.origin}/order/${order._id}`;

      const totalPcs = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

      // Generate tags HTML with sequential numbering
      const tagsHtml = Array(quantity).fill(0).map((_, idx) => `
        <div class="garment-tag size-${tagSize}" style="page-break-inside: avoid;">
          <div class="tag-top">
            <div class="tag-qr">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}&data=${encodeURIComponent(orderViewUrl)}" alt="QR" crossorigin="anonymous" />
            </div>
            <div class="tag-info">
              <div class="tag-number">${tagNumber}</div>
              <div class="tag-seq">${idx + 1}/${quantity}</div>
              ${showCustomerName ? `<div class="tag-customer">${(order.customerName?.split(' ')[0]?.slice(0, 10) || 'Customer').toUpperCase()}</div>` : ''}
              <div class="tag-date">${new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</div>
              <div class="tag-items">${totalPcs} pcs</div>
            </div>
          </div>
          <div class="tag-ticket">${order.ticketNumber}</div>
        </div>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Garment Tags - ${order.ticketNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }

            body {
              font-family: Arial, sans-serif;
              padding: 0;
              display: flex;
              flex-wrap: wrap;
              gap: 1mm;
              justify-content: flex-start;
            }

            .loading-message {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 18px;
              color: #666;
              text-align: center;
            }

            .garment-tag {
              position: relative;
              background: #ffffff;
              border: 1.5px solid #000;
              border-radius: 4px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1mm;
              box-sizing: border-box;
              page-break-inside: avoid;
              width: 2in;
              height: 2in;
              padding: 2mm;
            }

            .tag-top {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              gap: 3mm;
              width: 100%;
            }

            .tag-qr img {
              width: 28mm;
              height: 28mm;
              border: none;
            }

            .tag-info {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5mm;
            }

            .tag-number {
              font-size: 11pt;
              font-weight: 800;
              color: #000;
              letter-spacing: 0.5px;
              font-family: 'Courier New', monospace;
            }

            .tag-seq {
              font-size: 11pt;
              font-weight: 800;
              color: #000;
              font-family: 'Courier New', monospace;
            }

            .tag-customer {
              font-size: 8pt;
              font-weight: 600;
              color: #333;
              text-transform: uppercase;
              max-width: 30mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .tag-date { font-size: 7pt; color: #666; }

            .tag-items {
              font-size: 7pt;
              color: #666;
              background: #f0f0f0;
              padding: 0.5mm 2mm;
              border-radius: 1.5mm;
            }

            .tag-ticket {
              font-size: 7pt;
              color: #666;
              font-family: 'Courier New', monospace;
              letter-spacing: 0.3px;
            }

            @media print {
              .loading-message { display: none !important; }
              body { padding: 0; margin: 0; }
              @page {
                size: 2in 2in;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="loading-message" id="loadingMsg">Loading tags...</div>
          <div id="tagsContainer" style="display: none;">
            ${tagsHtml}
          </div>
          <script>
            (function() {
              var container = document.getElementById('tagsContainer');
              var loadingMsg = document.getElementById('loadingMsg');
              var images = container.getElementsByTagName('img');
              var loadedCount = 0;
              var totalImages = images.length;

              function checkAllLoaded() {
                loadedCount++;
                if (loadedCount >= totalImages) {
                  // All images loaded, show content and print
                  loadingMsg.style.display = 'none';
                  container.style.display = 'flex';
                  container.style.flexWrap = 'wrap';
                  container.style.gap = '1mm';

                  // Small delay to ensure rendering is complete
                  setTimeout(function() {
                    window.print();
                  }, 100);
                }
              }

              if (totalImages === 0) {
                // No images, just print
                loadingMsg.style.display = 'none';
                container.style.display = 'flex';
                setTimeout(function() { window.print(); }, 100);
              } else {
                // Wait for all images to load
                for (var i = 0; i < images.length; i++) {
                  if (images[i].complete) {
                    checkAllLoaded();
                  } else {
                    images[i].onload = checkAllLoaded;
                    images[i].onerror = checkAllLoaded; // Count errors too to avoid hanging
                  }
                }

                // Fallback: if images don't load in 5 seconds, print anyway
                setTimeout(function() {
                  if (container.style.display === 'none') {
                    loadingMsg.textContent = 'Printing...';
                    loadingMsg.style.display = 'none';
                    container.style.display = 'flex';
                    container.style.flexWrap = 'wrap';
                    container.style.gap = '1mm';
                    window.print();
                  }
                }, 5000);
              }
            })();
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Close modal after print window is set up
      onClose?.();
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
                tagIndex={1}
                totalTags={quantity}
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
              Tag Number: <strong>{tagNumber}</strong> &middot; Total pieces: <strong>{totalClothes}</strong>
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
            🖨️ Each tag will be numbered sequentially (1/{quantity}, 2/{quantity}, ...). Optimized for 2×2 inch thermal label printers.
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
