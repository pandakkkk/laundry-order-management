const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Order = require('../models/Order');
const businessConfig = require('../config/business');

// Paper size configurations
const PAPER_SIZES = {
  'A4': {
    size: 'A4',
    width: 595,
    margin: 50,
    fontSize: {
      title: 24,
      heading: 18,
      subheading: 12,
      normal: 10,
      small: 9,
      tiny: 8
    },
    qrSize: 100,
    lineWidth: 500
  },
  '80mm': {
    size: [226, 'auto'], // 80mm = 226 points, auto height for thermal
    width: 226,
    margin: 10,
    fontSize: {
      title: 14,
      heading: 12,
      subheading: 10,
      normal: 8,
      small: 7,
      tiny: 6
    },
    qrSize: 60,
    lineWidth: 206
  },
  '58mm': {
    size: [164, 'auto'], // 58mm = 164 points, auto height for thermal
    width: 164,
    margin: 5,
    fontSize: {
      title: 11,
      heading: 10,
      subheading: 8,
      normal: 7,
      small: 6,
      tiny: 5
    },
    qrSize: 50,
    lineWidth: 154
  }
};

// Generate PDF Receipt
exports.generateReceipt = async (req, res) => {
  try {
    const orderId = req.params.id;
    const paperSize = req.query.paperSize || 'A4'; // Default to A4
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get paper configuration
    const config = PAPER_SIZES[paperSize] || PAPER_SIZES['A4'];
    const isThermal = paperSize === '58mm' || paperSize === '80mm';

    // Create PDF document
    const doc = new PDFDocument({
      size: isThermal ? [config.width, 1000] : config.size, // Use tall page for thermal, will be trimmed
      margin: config.margin,
      bufferPages: isThermal // Enable buffering for thermal to calculate height
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Receipt-${order.ticketNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate QR Code
    const qrCodeData = JSON.stringify({
      ticketNumber: order.ticketNumber,
      orderId: order._id.toString(),
      customerId: order.customerId,
      status: order.status
    });

    let qrCodeImage;
    try {
      qrCodeImage = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: config.qrSize * 2
      });
    } catch (qrError) {
      console.error('QR Code generation error:', qrError);
    }

    if (isThermal) {
      // Generate thermal receipt format
      generateThermalReceipt(doc, order, config, qrCodeImage);
    } else {
      // Generate A4 receipt format
      generateA4Receipt(doc, order, config, qrCodeImage);
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt',
      message: error.message
    });
  }
};

// Generate thermal receipt (58mm/80mm)
function generateThermalReceipt(doc, order, config, qrCodeImage) {
  const margin = config.margin;
  const contentWidth = config.width - (margin * 2);
  const centerX = config.width / 2;
  const fs = config.fontSize;

  // Header - Business Name
  doc.fontSize(fs.title)
     .font('Helvetica-Bold')
     .text(businessConfig.name, margin, margin, { 
       width: contentWidth, 
       align: 'center' 
     });
  
  doc.moveDown(0.3);
  doc.fontSize(fs.small)
     .font('Helvetica')
     .text(businessConfig.address, { width: contentWidth, align: 'center' });
  
  if (businessConfig.phone) {
    doc.text(`Tel: ${businessConfig.phone}`, { width: contentWidth, align: 'center' });
  }

  // Dashed line separator
  doc.moveDown(0.5);
  drawDashedLine(doc, margin, doc.y, config.lineWidth);

  // Receipt Title
  doc.moveDown(0.5);
  doc.fontSize(fs.heading)
     .font('Helvetica-Bold')
     .text('RECEIPT', { width: contentWidth, align: 'center' });

  // Dashed line separator
  doc.moveDown(0.5);
  drawDashedLine(doc, margin, doc.y, config.lineWidth);

  // Order Info - Single column for thermal
  doc.moveDown(0.5);
  doc.fontSize(fs.normal).font('Helvetica-Bold');
  
  // Ticket Number (prominent)
  doc.fontSize(fs.subheading)
     .text(`Ticket: ${order.ticketNumber}`, { width: contentWidth, align: 'center' });
  
  doc.moveDown(0.3);
  doc.fontSize(fs.normal).font('Helvetica');
  
  doc.text(`Date: ${formatDateShort(order.orderDate)}`, margin);
  doc.text(`Expected: ${formatDateShort(order.expectedDelivery)}`, margin);
  doc.moveDown(0.3);
  doc.text(`Customer: ${order.customerName}`, margin);
  doc.text(`Phone: ${order.phoneNumber}`, margin);
  if (order.customerId) {
    doc.text(`ID: ${order.customerId}`, margin);
  }

  // Dashed line separator
  doc.moveDown(0.5);
  drawDashedLine(doc, margin, doc.y, config.lineWidth);

  // Items Header
  doc.moveDown(0.5);
  doc.fontSize(fs.normal).font('Helvetica-Bold');
  doc.text('ITEMS', margin, doc.y, { width: contentWidth, align: 'center' });
  doc.moveDown(0.3);
  
  // Items list
  doc.fontSize(fs.small).font('Helvetica');
  order.items.forEach((item) => {
    const itemAmount = item.quantity * item.price;
    const itemLine = `${item.quantity}x ${truncateText(item.description, config.width > 200 ? 25 : 18)}`;
    const priceText = `₹${itemAmount.toFixed(0)}`;
    
    const itemY = doc.y;
    doc.text(itemLine, margin, itemY, { width: contentWidth - 40 });
    doc.text(priceText, margin, itemY, { width: contentWidth, align: 'right' });
    doc.moveDown(0.2);
  });

  // Total line separator
  doc.moveDown(0.3);
  drawDashedLine(doc, margin, doc.y, config.lineWidth);

  // Total
  doc.moveDown(0.5);
  doc.fontSize(fs.heading).font('Helvetica-Bold');
  const totalY = doc.y;
  doc.text('TOTAL:', margin, totalY);
  doc.text(`₹${order.totalAmount.toFixed(2)}`, margin, totalY, { width: contentWidth, align: 'right' });

  // Payment Info
  doc.moveDown(0.5);
  doc.fontSize(fs.small).font('Helvetica');
  doc.text(`Payment: ${order.paymentMethod} (${order.paymentStatus})`, margin);

  // Dashed line separator
  doc.moveDown(0.5);
  drawDashedLine(doc, margin, doc.y, config.lineWidth);

  // QR Code (centered)
  if (qrCodeImage) {
    doc.moveDown(0.5);
    const qrX = (config.width - config.qrSize) / 2;
    doc.image(qrCodeImage, qrX, doc.y, { width: config.qrSize, height: config.qrSize });
    doc.moveDown(0.3);
    doc.y += config.qrSize;
    doc.fontSize(fs.tiny)
       .text('Scan to track order', { width: contentWidth, align: 'center' });
  }

  // Footer
  doc.moveDown(0.5);
  drawDashedLine(doc, margin, doc.y, config.lineWidth);
  doc.moveDown(0.5);
  doc.fontSize(fs.tiny)
     .text(businessConfig.footer || 'Thank you for your business!', { width: contentWidth, align: 'center' });
  
  doc.moveDown(1);
}

// Generate A4 receipt (original format)
function generateA4Receipt(doc, order, config, qrCodeImage) {
  const margin = config.margin;
  const fs = config.fontSize;

  // Header Section
  doc.fontSize(fs.title)
     .font('Helvetica-Bold')
     .text(businessConfig.name, { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(fs.normal)
     .font('Helvetica')
     .text(businessConfig.address, { align: 'center' });
  
  if (businessConfig.city) {
    doc.text(`${businessConfig.city}, ${businessConfig.state} ${businessConfig.pincode}`, { align: 'center' });
  }
  
  if (businessConfig.phone) {
    doc.text(`Phone: ${businessConfig.phone}`, { align: 'center' });
  }
  
  if (businessConfig.email) {
    doc.text(`Email: ${businessConfig.email}`, { align: 'center' });
  }

  if (businessConfig.gstin) {
    doc.text(`GSTIN: ${businessConfig.gstin}`, { align: 'center' });
  }

  // Divider
  doc.moveDown(1);
  doc.moveTo(margin, doc.y)
     .lineTo(margin + config.lineWidth, doc.y)
     .stroke();

  // Receipt Title
  doc.moveDown(1);
  doc.fontSize(fs.heading)
     .font('Helvetica-Bold')
     .text('RECEIPT', { align: 'center' });

  doc.moveDown(1);

  // Order Information Section
  const leftColumn = margin;
  const rightColumn = 300;
  let currentY = doc.y;

  // Left Column
  doc.fontSize(fs.normal)
     .font('Helvetica-Bold')
     .text('Ticket Number:', leftColumn, currentY);
  doc.font('Helvetica')
     .text(order.ticketNumber, leftColumn + 100, currentY);

  currentY += 20;
  doc.font('Helvetica-Bold')
     .text('Order Number:', leftColumn, currentY);
  doc.font('Helvetica')
     .text(order.orderNumber, leftColumn + 100, currentY);

  currentY += 20;
  doc.font('Helvetica-Bold')
     .text('Order Date:', leftColumn, currentY);
  doc.font('Helvetica')
     .text(formatDate(order.orderDate), leftColumn + 100, currentY);

  currentY += 20;
  doc.font('Helvetica-Bold')
     .text('Expected Delivery:', leftColumn, currentY);
  doc.font('Helvetica')
     .text(formatDate(order.expectedDelivery), leftColumn + 100, currentY);

  // Right Column
  currentY = doc.y - 60;
  doc.font('Helvetica-Bold')
     .text('Customer Name:', rightColumn, currentY);
  doc.font('Helvetica')
     .text(order.customerName, rightColumn + 100, currentY);

  currentY += 20;
  doc.font('Helvetica-Bold')
     .text('Customer ID:', rightColumn, currentY);
  doc.font('Helvetica')
     .text(order.customerId, rightColumn + 100, currentY);

  currentY += 20;
  doc.font('Helvetica-Bold')
     .text('Phone:', rightColumn, currentY);
  doc.font('Helvetica')
     .text(order.phoneNumber, rightColumn + 100, currentY);

  currentY += 20;
  doc.font('Helvetica-Bold')
     .text('Served By:', rightColumn, currentY);
  doc.font('Helvetica')
     .text(order.servedBy, rightColumn + 100, currentY);

  // Items Section
  doc.moveDown(2);
  doc.moveTo(margin, doc.y)
     .lineTo(margin + config.lineWidth, doc.y)
     .stroke();

  doc.moveDown(1);
  doc.fontSize(fs.subheading)
     .font('Helvetica-Bold')
     .text('Items:', margin, doc.y);

  doc.moveDown(0.5);

  // Table Header
  const tableTop = doc.y;
  doc.fontSize(fs.normal)
     .font('Helvetica-Bold')
     .text('Description', margin, tableTop)
     .text('Qty', 350, tableTop)
     .text('Price', 400, tableTop)
     .text('Amount', 500, tableTop);

  doc.moveTo(margin, tableTop + 15)
     .lineTo(margin + config.lineWidth, tableTop + 15)
     .stroke();

  // Items
  let itemsY = tableTop + 25;
  order.items.forEach((item, index) => {
    const itemAmount = item.quantity * item.price;
    
    doc.font('Helvetica')
       .fontSize(fs.small)
       .text(item.description, margin, itemsY, { width: 280 })
       .text(item.quantity.toString(), 350, itemsY)
       .text(`₹${item.price.toFixed(2)}`, 400, itemsY)
       .text(`₹${itemAmount.toFixed(2)}`, 500, itemsY);

    itemsY += 20;

    // Add line break if too many items
    if (itemsY > 700) {
      doc.addPage();
      itemsY = margin;
    }
  });

  // Total Section
  doc.moveDown(1);
  const totalY = doc.y;
  doc.moveTo(margin, totalY)
     .lineTo(margin + config.lineWidth, totalY)
     .stroke();

  doc.moveDown(1);
  doc.fontSize(fs.subheading)
     .font('Helvetica-Bold')
     .text('Total Amount:', 350, doc.y)
     .text(`₹${order.totalAmount.toFixed(2)}`, 500, doc.y);

  // Payment Information
  doc.moveDown(1.5);
  doc.fontSize(fs.normal)
     .font('Helvetica-Bold')
     .text('Payment Information:', margin, doc.y);

  doc.moveDown(0.5);
  doc.font('Helvetica')
     .text(`Payment Method: ${order.paymentMethod}`, margin, doc.y)
     .text(`Payment Status: ${order.paymentStatus}`, margin, doc.y + 15);

  // Notes
  if (order.notes) {
    doc.moveDown(1);
    doc.font('Helvetica-Bold')
       .text('Notes:', margin, doc.y);
    doc.font('Helvetica')
       .fontSize(fs.small)
       .text(order.notes, margin, doc.y + 15, { width: config.lineWidth });
  }

  // Location
  if (order.location) {
    doc.moveDown(1);
    doc.font('Helvetica-Bold')
       .text('Location:', margin, doc.y);
    doc.font('Helvetica')
       .fontSize(fs.small)
       .text(order.location, margin, doc.y + 15, { width: config.lineWidth });
  }

  // QR Code
  if (qrCodeImage) {
    doc.moveDown(1);
    doc.image(qrCodeImage, 400, doc.y - 50, { width: config.qrSize, height: config.qrSize });
    doc.fontSize(fs.tiny)
       .font('Helvetica')
       .text('Scan to track order', 400, doc.y + 55, { width: config.qrSize, align: 'center' });
  }

  // Footer
  doc.moveDown(2);
  doc.moveTo(margin, doc.y)
     .lineTo(margin + config.lineWidth, doc.y)
     .stroke();

  doc.moveDown(1);
  doc.fontSize(fs.tiny)
     .font('Helvetica')
     .text(businessConfig.terms, margin, doc.y, { width: config.lineWidth, align: 'center' });

  doc.moveDown(1);
  doc.fontSize(fs.normal)
     .font('Helvetica-Bold')
     .text(businessConfig.footer, { align: 'center' });
}

// Helper function to draw dashed line for thermal receipts
function drawDashedLine(doc, x, y, width) {
  const dashLength = 3;
  const gapLength = 2;
  let currentX = x;
  
  while (currentX < x + width) {
    doc.moveTo(currentX, y)
       .lineTo(Math.min(currentX + dashLength, x + width), y)
       .stroke();
    currentX += dashLength + gapLength;
  }
}

// Helper function to truncate text for thermal receipts
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '..';
}

// Helper function for short date format (thermal)
function formatDateShort(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to format date
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

