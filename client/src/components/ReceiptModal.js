import React, { useState, useEffect } from 'react';
import './ReceiptModal.css';
import api from '../services/api';

const ReceiptModal = ({ order, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paperSize, setPaperSize] = useState('A4'); // A4, 80mm, 58mm

  useEffect(() => {
    let currentUrl = null;
    
    const loadReceipt = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the PDF receipt with selected paper size
        const pdfBlob = await api.generateReceipt(order._id, paperSize);
        const url = URL.createObjectURL(pdfBlob);
        currentUrl = url;
        setPdfUrl(url);
      } catch (err) {
        console.error('Error loading receipt:', err);
        setError('Failed to load receipt. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (order?._id) {
      loadReceipt();
    }

    // Cleanup URL on unmount
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [order?._id, paperSize]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Receipt-${order.ticketNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <div className="receipt-header-info">
            <h2>🧾 Order Receipt</h2>
            <p className="ticket-number">Ticket: {order?.ticketNumber}</p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="receipt-modal-body">
          {loading && (
            <div className="receipt-loading">
              <div className="loading-spinner"></div>
              <p>Generating receipt...</p>
            </div>
          )}

          {error && (
            <div className="receipt-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <div className="receipt-preview">
              <iframe
                src={pdfUrl}
                title="Receipt Preview"
                className="pdf-iframe"
              />
            </div>
          )}
        </div>

        <div className="receipt-modal-footer">
          <div className="order-summary">
            <div className="summary-item">
              <span className="label">Customer:</span>
              <span className="value">{order?.customerName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total:</span>
              <span className="value total">₹{order?.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="receipt-actions">
            <div className="paper-size-control">
              <label htmlFor="receipt-paper-size">Paper Size:</label>
              <select
                id="receipt-paper-size"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="paper-size-dropdown"
              >
                <option value="A4">A4 (Standard)</option>
                <option value="80mm">80mm (Thermal)</option>
                <option value="58mm">58mm (Thermal)</option>
              </select>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={handlePrint}
              disabled={loading || error}
            >
              🖨️ Print
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleDownload}
              disabled={loading || error}
            >
              📥 Download PDF
            </button>
            <button className="btn btn-success" onClick={onClose}>
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;

