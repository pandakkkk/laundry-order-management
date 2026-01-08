import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Stop scanning helper
  const stopScanningRef = useRef(null);
  
  stopScanningRef.current = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Stop error:', err);
      }
    }
    setIsScanning(false);
  };

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera on mobile
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch(err => {
        console.error('Camera access error:', err);
        setError('Camera access denied. Please allow camera permissions.');
      });

    return () => {
      if (stopScanningRef.current) {
        stopScanningRef.current();
      }
    };
  }, []);

  // Handle scan result
  const handleScanResult = useCallback((result) => {
    // Stop scanning first
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
    
    try {
      // Try to parse as JSON (QR code from our receipts)
      const data = JSON.parse(result);
      if (data.ticketNumber || data.orderId) {
        onScan({
          type: 'qr',
          ticketNumber: data.ticketNumber,
          orderId: data.orderId,
          raw: result
        });
      } else {
        // Unknown QR format
        onScan({
          type: 'unknown',
          raw: result
        });
      }
    } catch (e) {
      // Not JSON, might be a ticket number directly
      onScan({
        type: 'barcode',
        ticketNumber: result,
        raw: result
      });
    }
  }, [onScan]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    try {
      setError(null);
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      await html5QrCodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1
        },
        (decodedText) => {
          // Successfully scanned
          handleScanResult(decodedText);
        },
        (errorMessage) => {
          // Scan error (continuous, so we don't show these)
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      setError('Failed to start camera. Please try again.');
    }
  }, [selectedCamera, handleScanResult]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Stop error:', err);
      }
    }
    setIsScanning(false);
  }, []);

  // Handle manual input
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan({
        type: 'manual',
        ticketNumber: manualInput.trim(),
        raw: manualInput.trim()
      });
    }
  };

  // Toggle scanning
  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scanner-header">
          <h2>📷 Scan Order QR/Barcode</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="scanner-body">
          {/* Camera Selection */}
          {cameras.length > 1 && (
            <div className="camera-select">
              <label>Camera:</label>
              <select 
                value={selectedCamera || ''} 
                onChange={(e) => {
                  stopScanning();
                  setSelectedCamera(e.target.value);
                }}
              >
                {cameras.map(cam => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner View */}
          <div className="scanner-view">
            <div id="qr-reader" ref={scannerRef}></div>
            
            {!isScanning && (
              <div className="scanner-placeholder">
                <span className="scanner-icon">📷</span>
                <p>Click "Start Scanning" to activate camera</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="scanner-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Scan Button */}
          <button 
            className={`btn-scan ${isScanning ? 'scanning' : ''}`}
            onClick={toggleScanning}
          >
            {isScanning ? '⏹️ Stop Scanning' : '▶️ Start Scanning'}
          </button>

          {/* Divider */}
          <div className="scanner-divider">
            <span>OR</span>
          </div>

          {/* Manual Input */}
          <form className="manual-input" onSubmit={handleManualSubmit}>
            <input
              type="text"
              placeholder="Enter Ticket Number (e.g., TKT-20250108-001)"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <button type="submit" className="btn-lookup">
              🔍 Lookup
            </button>
          </form>

          {/* Instructions */}
          <div className="scanner-instructions">
            <h4>📌 How to use:</h4>
            <ul>
              <li>Point camera at QR code on receipt</li>
              <li>Hold steady until detected</li>
              <li>Or enter ticket number manually</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

